# Sistema de Autorización RBAC - Traductor SIS

## Tabla de Contenidos

1. [Resumen Ejecutivo](#resumen-ejecutivo)
2. [Arquitectura General](#arquitectura-general)
3. [Flujo de Autorización](#flujo-de-autorización)
4. [Backend - Azure Functions](#backend---azure-functions)
5. [Frontend - React + TypeScript](#frontend---react--typescript)
6. [Extratos de Código Clave](#extractos-de-código-clave)
7. [Datos Iniciales](#datos-iniciales)
8. [Migración a SQL Server](#migración-a-sql-server)
9. [Testing y Casos de Uso](#testing-y-casos-de-uso)

---

## Resumen Ejecutivo

Sistema completo de autorización basado en roles (RBAC) para el Traductor Banner Integration, implementando:

- ✅ **Whitelist de usuarios** por email (solo usuarios explícitamente agregados pueden acceder)
- ✅ **Roles con permisos READ/WRITE** por módulo
- ✅ **Validación en backend** (Azure Functions) y frontend (React)
- ✅ **UI administrativa** completa para gestión de usuarios y roles
- ✅ **Datos hardcodeados** listos para migración a SQL Server
- ✅ **Filtrado de módulos** según permisos del usuario
- ✅ **Modo solo lectura** que oculta botones de acción

### Stack Tecnológico

- **Backend**: Azure Functions (Node.js 18) con patrón proxy
- **Frontend**: React + TypeScript + Tailwind CSS + Shadcn/ui
- **Autenticación**: Azure AD SSO (MSAL)
- **Datos**: Hardcoded en `/api/data/mockAuthData.js` (futuro: SQL Server)

---

## Arquitectura General

### Diagrama de Flujo Completo

```
┌─────────────────────────────────────────────────────────────────┐
│                      FLUJO DE AUTORIZACIÓN                       │
└─────────────────────────────────────────────────────────────────┘

1. LOGIN → Azure AD SSO
   ↓
2. AuthContext → obtiene email del usuario
   ↓
3. AuthorizationContext → GET /api/auth/user/:email
   ↓
4. Azure Function → valida token → busca en mockAuthData
   ├─ Si NO existe → 404 → Frontend → /unauthorized
   ├─ Si inactivo → status: inactive → Frontend → /account-disabled
   └─ Si OK → { user, role, permissions: {"academic-periods": "WRITE"} }
   ↓
5. Frontend almacena en context
   ↓
6. ProtectedRoute valida:
   ├─ isAuthenticated
   ├─ isAuthorized
   └─ status === "active"
   ↓
7. Componentes usan hooks:
   ├─ Sidebar: isAdmin() → mostrar gestión
   ├─ BannerIntegrations: hasModuleAccess() → filtrar tabs
   └─ Módulos: canWrite() → mostrar botones
   ↓
8. Usuario intenta modificar (POST/PUT/DELETE)
   ↓
9. ApiClient → X-User-Token header
   ↓
10. Azure Function /banner → authMiddleware valida:
    ├─ Token válido
    ├─ Usuario en whitelist
    ├─ Usuario activo
    ├─ hasModuleAccess()
    └─ canWrite() para POST/PUT/DELETE
    ↓
11. ├─ Si NO → 403 con mensaje descriptivo
    └─ Si OK → proxy a Banner API
```

### Capas de Seguridad

```
┌──────────────────────────────────────────────────────┐
│  CAPA 1: Azure AD SSO (MSAL)                         │
│  - Autenticación organizacional                      │
│  - Token JWT con claims                              │
└──────────────────────────────────────────────────────┘
                    ↓
┌──────────────────────────────────────────────────────┐
│  CAPA 2: Whitelist (Backend)                         │
│  - Solo emails explícitamente agregados              │
│  - Validación en mockAuthData.js                     │
└──────────────────────────────────────────────────────┘
                    ↓
┌──────────────────────────────────────────────────────┐
│  CAPA 3: Estado del Usuario (Backend)                │
│  - status: active | inactive | suspended             │
│  - Usuarios inactivos → /account-disabled            │
└──────────────────────────────────────────────────────┘
                    ↓
┌──────────────────────────────────────────────────────┐
│  CAPA 4: Permisos por Módulo (Backend + Frontend)    │
│  - READ: Solo lectura                                │
│  - WRITE: Lectura + escritura                        │
│  - Validación en cada request                        │
└──────────────────────────────────────────────────────┘
                    ↓
┌──────────────────────────────────────────────────────┐
│  CAPA 5: UI Adaptativa (Frontend)                    │
│  - Filtrado de módulos visibles                      │
│  - Ocultación de botones de acción                   │
│  - Alertas de solo lectura                           │
└──────────────────────────────────────────────────────┘
```

---

## Flujo de Autorización

### 1. Login y Obtención de Permisos

```javascript
// App.tsx - Inicialización
<AuthProvider>
  <AuthorizationProvider>{/* La app completa */}</AuthorizationProvider>
</AuthProvider>;

// AuthorizationContext.tsx - Carga de permisos
useEffect(() => {
  if (isAuthenticated && user?.email) {
    loadPermissions(); // GET /api/auth/user/:email
  }
}, [isAuthenticated, user?.email]);
```

### 2. Validación en Routes

```javascript
// ProtectedRoute.tsx
const {
  isAuthorized,
  isLoading: authzLoading,
  permissions,
} = useAuthorization();

if (!authzLoading && !isAuthorized) {
  if (permissions?.user?.status === "inactive") {
    return <Navigate to="/account-disabled" />;
  }
  return <Navigate to="/unauthorized" />;
}
```

### 3. Filtrado de Módulos

```javascript
// BannerIntegrations.tsx
const { hasModuleAccess } = useAuthorization();

const accessibleModules = useMemo(() => {
  return integrationModules.filter((module) => hasModuleAccess(module.value));
}, [hasModuleAccess]);
```

### 4. Modo Solo Lectura

```javascript
// AcademicPeriods.tsx (y todos los módulos)
const { canWrite, isReadOnly } = useModulePermissions("academic-periods");

{
  isReadOnly && (
    <Alert>
      Modo solo lectura. Solo tienes permisos de lectura en este módulo.
    </Alert>
  );
}

<DataTable
  headerActions={
    canWrite ? <Button onClick={loadData}>Actualizar</Button> : null
  }
/>;
```

### 5. Validación Backend

```javascript
// banner/index.js - Antes de cada request
const authResult = await authorizeRequest(userToken, route, req.method);

if (!authResult.authorized) {
  return {
    status: 403,
    body: {
      error: "Acceso denegado",
      message: authResult.error.message,
    },
  };
}

// Si pasa → proxy a Banner API
```

---

## Backend - Azure Functions

### Estructura de Archivos

```
/api/
├── data/
│   └── mockAuthData.js          [DATOS HARDCODED]
├── shared/
│   └── authMiddleware.js        [MIDDLEWARE DE AUTORIZACIÓN]
├── auth/
│   ├── index.js                 [GESTIÓN USUARIOS/ROLES]
│   └── function.json
└── banner/
    └── index.js                 [PROXY CON VALIDACIÓN]
```

### `/api/data/mockAuthData.js`

**Estructura de Datos:**

```javascript
// 6 Módulos del Sistema
const modules = [
  {
    moduleId: 1,
    moduleCode: "academic-periods",
    moduleName: "Períodos Académicos",
    moduleDescription: "Gestión de períodos académicos",
    iconName: "Calendar",
    routePattern: "/banner/academic-period",
    displayOrder: 1,
    isActive: true,
  },
  // ... 5 módulos más
];

// 4 Roles con diferentes niveles de acceso
const roles = [
  {
    roleId: 1,
    roleName: "Administrador",
    roleDescription: "Acceso total al sistema",
    isSystemRole: true,
  },
  {
    roleId: 2,
    roleName: "Coordinador Académico",
    roleDescription: "Gestión de períodos y niveles académicos",
    isSystemRole: false,
  },
  // ... 2 roles más
];

// 12 Permisos (roles × módulos)
const rolePermissions = [
  // Administrador - WRITE en todos los módulos
  { permissionId: 1, roleId: 1, moduleId: 1, permissionType: "WRITE" },
  { permissionId: 2, roleId: 1, moduleId: 2, permissionType: "WRITE" },
  // ...
  // Coordinador - WRITE en 3 módulos
  { permissionId: 7, roleId: 2, moduleId: 1, permissionType: "WRITE" },
  // Secretaría - READ en 2 módulos
  { permissionId: 10, roleId: 3, moduleId: 4, permissionType: "READ" },
  // ...
];

// 4 Usuarios de ejemplo
const users = [
  {
    userId: 1,
    email: "s.sepulveda@uai.cl",
    displayName: "Sebastian Andres Sepulveda Campos",
    roleId: 1, // Administrador
    status: "active",
    lastAccessAt: "2025-01-15T10:30:00Z",
    createdAt: "2024-01-15T08:00:00Z",
    createdBy: "SYSTEM",
  },
  {
    userId: 2,
    email: "coord.academico@uai.cl",
    displayName: "Coordinador Académico",
    roleId: 2,
    status: "active",
  },
  {
    userId: 3,
    email: "secretaria@uai.cl",
    displayName: "Secretaría Académica",
    roleId: 3,
    status: "active",
  },
  {
    userId: 4,
    email: "docente@uai.cl",
    displayName: "Docente Departamental",
    roleId: 4,
    status: "inactive", // Inactivo - para probar /account-disabled
  },
];
```

**Funciones Helper:**

```javascript
// Obtener permisos completos de un usuario
function getUserPermissions(email) {
  const user = users.find((u) => u.email.toLowerCase() === email.toLowerCase());
  if (!user) return null;

  const role = roles.find((r) => r.roleId === user.roleId);
  if (!role) return null;

  // Construir mapa de permisos: { "academic-periods": "WRITE", ... }
  const permissions = {};
  const userPerms = rolePermissions.filter((rp) => rp.roleId === user.roleId);

  userPerms.forEach((perm) => {
    const module = modules.find((m) => m.moduleId === perm.moduleId);
    if (module && module.isActive) {
      permissions[module.moduleCode] = perm.permissionType;
    }
  });

  return { user, role, permissions };
}

// Validar acceso a un módulo
function hasModuleAccess(email, moduleCode) {
  const userPerms = getUserPermissions(email);
  if (!userPerms) return false;
  return userPerms.permissions.hasOwnProperty(moduleCode);
}

// Validar permisos de escritura
function canWrite(email, moduleCode) {
  const userPerms = getUserPermissions(email);
  if (!userPerms) return false;
  return userPerms.permissions[moduleCode] === "WRITE";
}

// Mapear ruta a código de módulo
function getModuleFromRoute(route) {
  const module = modules.find((m) => route.startsWith(m.routePattern));
  return module ? module.moduleCode : null;
}
```

### `/api/shared/authMiddleware.js`

**Función Principal de Autorización:**

```javascript
const jwt = require("jsonwebtoken");
const {
  getUserPermissions,
  hasModuleAccess,
  canWrite,
  getModuleFromRoute,
} = require("../data/mockAuthData");

async function authorizeRequest(token, route, method) {
  // 1. Validar que el token existe
  if (!token) {
    return {
      authorized: false,
      error: {
        status: 401,
        message: "Token de autenticación no proporcionado",
      },
    };
  }

  // 2. Decodificar JWT (sin verificar firma - Azure SWA ya lo hizo)
  let decoded;
  try {
    decoded = jwt.decode(token);
  } catch (err) {
    return {
      authorized: false,
      error: {
        status: 401,
        message: "Token inválido",
      },
    };
  }

  const email = decoded.preferred_username || decoded.email || decoded.upn;
  if (!email) {
    return {
      authorized: false,
      error: {
        status: 401,
        message: "No se pudo extraer el email del token",
      },
    };
  }

  // 3. Obtener permisos del usuario (whitelist)
  const userPerms = getUserPermissions(email);
  if (!userPerms) {
    return {
      authorized: false,
      user: { email },
      error: {
        status: 403,
        message: `Usuario ${email} no está autorizado para acceder al sistema`,
      },
    };
  }

  // 4. Verificar estado del usuario
  if (userPerms.user.status !== "active") {
    return {
      authorized: false,
      user: userPerms.user,
      error: {
        status: 403,
        message: `Usuario ${email} está ${userPerms.user.status}. Contacta al administrador.`,
      },
    };
  }

  // 5. Mapear ruta a módulo
  const moduleCode = getModuleFromRoute(route);
  if (!moduleCode) {
    return {
      authorized: false,
      user: userPerms.user,
      error: {
        status: 404,
        message: "Ruta no reconocida en el sistema de autorización",
      },
    };
  }

  // 6. Verificar acceso al módulo
  if (!hasModuleAccess(email, moduleCode)) {
    return {
      authorized: false,
      user: userPerms.user,
      error: {
        status: 403,
        message: `No tienes permisos para acceder al módulo ${moduleCode}`,
      },
    };
  }

  // 7. Verificar permisos de escritura para métodos que modifican
  const writeMethods = ["POST", "PUT", "PATCH", "DELETE"];
  if (writeMethods.includes(method.toUpperCase())) {
    if (!canWrite(email, moduleCode)) {
      return {
        authorized: false,
        user: userPerms.user,
        error: {
          status: 403,
          message: `Solo tienes permisos de lectura en el módulo ${moduleCode}`,
        },
      };
    }
  }

  // ✅ Todo OK
  return {
    authorized: true,
    user: userPerms.user,
    role: userPerms.role,
    permissions: userPerms.permissions,
  };
}

module.exports = { authorizeRequest };
```

### `/api/auth/index.js`

**Endpoints Administrativos:**

```javascript
const {
  getUserPermissions,
  users,
  roles,
  modules /* ... */,
} = require("../data/mockAuthData");

module.exports = async function (context, req) {
  const route = req.params.route || "";
  const method = req.method;

  // GET /api/auth/user/:email - Info usuario y permisos (público autenticado)
  if (method === "GET" && route.startsWith("user/")) {
    const email = decodeURIComponent(route.substring(5));
    const userPerms = getUserPermissions(email);

    if (!userPerms) {
      return { status: 404, body: { error: "Usuario no encontrado" } };
    }

    // Formato de respuesta
    const response = {
      user: userPerms.user,
      role: userPerms.role,
      permissions: userPerms.permissions, // { "academic-periods": "WRITE", ... }
    };

    return { status: 200, body: response };
  }

  // Validar que sea admin para el resto de endpoints
  const userToken = req.headers["x-user-token"];
  const decoded = jwt.decode(userToken);
  const email = decoded?.preferred_username || decoded?.email;
  const userPerms = getUserPermissions(email);

  if (!userPerms || userPerms.user.roleId !== 1) {
    return {
      status: 403,
      body: { error: "Solo administradores pueden acceder" },
    };
  }

  // GET /api/auth/users - Listar todos los usuarios
  if (method === "GET" && route === "users") {
    const usersWithRoles = users.map((u) => ({
      ...u,
      role: roles.find((r) => r.roleId === u.roleId),
    }));
    return { status: 200, body: usersWithRoles };
  }

  // POST /api/auth/users - Crear usuario
  if (method === "POST" && route === "users") {
    const { email, displayName, roleId, status } = req.body;

    // Validaciones
    if (!email || !displayName || !roleId) {
      return { status: 400, body: { error: "Campos requeridos" } };
    }

    // Verificar que no existe
    if (users.find((u) => u.email === email)) {
      return { status: 409, body: { error: "Usuario ya existe" } };
    }

    const newUser = {
      userId: users.length + 1,
      email,
      displayName,
      roleId,
      status: status || "active",
      createdAt: new Date().toISOString(),
      createdBy: userPerms.user.email,
    };

    users.push(newUser);
    return { status: 201, body: newUser };
  }

  // PUT /api/auth/users/:email - Actualizar usuario
  if (method === "PUT" && route.startsWith("users/")) {
    const targetEmail = decodeURIComponent(route.substring(6));
    const { roleId, status } = req.body;

    const user = users.find((u) => u.email === targetEmail);
    if (!user) {
      return { status: 404, body: { error: "Usuario no encontrado" } };
    }

    if (roleId) user.roleId = roleId;
    if (status) user.status = status;
    user.updatedAt = new Date().toISOString();
    user.updatedBy = userPerms.user.email;

    return { status: 200, body: user };
  }

  // GET /api/auth/roles - Listar roles con estadísticas
  if (method === "GET" && route === "roles") {
    const rolesWithStats = roles.map((role) => {
      const perms = rolePermissions.filter((rp) => rp.roleId === role.roleId);
      const userCount = users.filter((u) => u.roleId === role.roleId).length;

      return {
        ...role,
        permissionCount: perms.length,
        userCount,
        permissions: perms.map((p) => {
          const mod = modules.find((m) => m.moduleId === p.moduleId);
          return {
            moduleCode: mod.moduleCode,
            moduleName: mod.moduleName,
            permissionType: p.permissionType,
          };
        }),
      };
    });

    return { status: 200, body: rolesWithStats };
  }

  // POST /api/auth/roles - Crear rol
  // PUT /api/auth/roles/:id - Actualizar rol
  // GET /api/auth/modules - Listar módulos
  // ... (implementación similar)

  return { status: 404, body: { error: "Ruta no encontrada" } };
};
```

### `/api/banner/index.js`

**Modificación para Autorización:**

```javascript
const { authorizeRequest } = require("../shared/authMiddleware");

module.exports = async function (context, req) {
  const route = req.params.route || "";
  const userToken = req.headers["x-user-token"];

  // VALIDACIÓN DE AUTORIZACIÓN
  const authResult = await authorizeRequest(
    userToken,
    `/banner/${route}`,
    req.method
  );

  if (!authResult.authorized) {
    context.log.error("Authorization failed:", authResult.error);
    return {
      status: authResult.error.status,
      body: {
        error: "Acceso denegado",
        message: authResult.error.message,
        details: {
          user: authResult.user?.email || "Unknown",
          route: `/banner/${route}`,
          method: req.method,
        },
      },
    };
  }

  context.log.info("Authorization successful:", {
    user: authResult.user.email,
    role: authResult.role.roleName,
    module: route.split("/")[0],
  });

  // ✅ Si pasa la autorización → proxy a Banner API
  // ... código de proxy existente
};
```

---

## Frontend - React + TypeScript

### Estructura de Archivos

```
/src/
├── types/
│   └── auth.ts                      [TIPOS TYPESCRIPT]
├── context/
│   └── AuthorizationContext.tsx     [CONTEXT PROVIDER]
├── hooks/
│   └── useModulePermissions.ts      [CUSTOM HOOK]
├── pages/
│   ├── Unauthorized.tsx             [PÁGINA ERROR 403]
│   ├── AccountDisabled.tsx          [PÁGINA CUENTA INACTIVA]
│   ├── UsersRoles.tsx               [GESTIÓN ADMIN]
│   ├── BannerIntegrations.tsx       [FILTRADO TABS]
│   └── [módulos]/*.tsx              [MODO SOLO LECTURA]
└── components/
    └── users-roles/
        ├── UserManagementTab.tsx
        ├── RolesPermissionsTab.tsx
        ├── UserDialog.tsx
        └── RoleDialog.tsx
```

### `/src/types/auth.ts`

```typescript
export type PermissionType = "READ" | "WRITE";
export type UserStatus = "active" | "inactive" | "suspended";

export interface Module {
  moduleId: number;
  moduleCode: string;
  moduleName: string;
  moduleDescription: string;
  iconName: string;
  routePattern: string;
  displayOrder: number;
  isActive: boolean;
}

export interface Role {
  roleId: number;
  roleName: string;
  roleDescription: string | null;
  isSystemRole: boolean;
  createdAt: string;
  createdBy: string;
}

export interface User {
  userId: number;
  email: string;
  displayName: string;
  roleId: number;
  status: UserStatus;
  lastAccessAt: string | null;
  createdAt: string;
  createdBy: string;
  updatedAt?: string;
  updatedBy?: string;
}

export interface UserWithRole extends User {
  role: Role;
}

export interface RoleWithStats extends Role {
  permissionCount: number;
  userCount: number;
  permissions: {
    moduleCode: string;
    moduleName: string;
    permissionType: PermissionType;
  }[];
}

export interface UserPermissions {
  user: User;
  role: Role;
  permissions: Record<string, PermissionType>; // { "academic-periods": "WRITE" }
}

// Request/Response types
export interface CreateUserRequest {
  email: string;
  displayName: string;
  roleId: number;
  status?: UserStatus;
}

export interface UpdateUserRequest {
  roleId?: number;
  status?: UserStatus;
}

export interface CreateRoleRequest {
  roleName: string;
  roleDescription?: string;
  permissions: {
    moduleCode: string;
    permissionType: PermissionType;
  }[];
}

export interface UpdateRoleRequest {
  roleName?: string;
  roleDescription?: string;
  permissions?: {
    moduleCode: string;
    permissionType: PermissionType;
  }[];
}
```

### `/src/context/AuthorizationContext.tsx`

```typescript
import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { useAuth } from "./AuthContext";
import { useMsal } from "@azure/msal-react";
import { createApiClient } from "@/utils/apiClient";
import type { UserPermissions, PermissionType } from "@/types/auth";

interface AuthorizationContextType {
  permissions: UserPermissions | null;
  isLoading: boolean;
  error: string | null;
  isAuthorized: boolean;
  hasModuleAccess: (moduleCode: string) => boolean;
  canWrite: (moduleCode: string) => boolean;
  canRead: (moduleCode: string) => boolean;
  isAdmin: () => boolean;
  refetch: () => Promise<void>;
}

const AuthorizationContext = createContext<
  AuthorizationContextType | undefined
>(undefined);

export function AuthorizationProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated, user } = useAuth();
  const { instance } = useMsal();
  const [permissions, setPermissions] = useState<UserPermissions | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadPermissions = async () => {
    if (!user?.email) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const apiClient = createApiClient(instance);
      const data = await apiClient.get<UserPermissions>(
        `/auth/user/${user.email}`
      );
      setPermissions(data);
    } catch (err: any) {
      console.error("Error loading permissions:", err);
      setError(err.message || "Error al cargar permisos");
      setPermissions(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated && user?.email) {
      loadPermissions();
    } else {
      setPermissions(null);
      setIsLoading(false);
    }
  }, [isAuthenticated, user?.email]);

  const hasModuleAccess = (moduleCode: string): boolean => {
    if (!permissions) return false;
    return permissions.permissions.hasOwnProperty(moduleCode);
  };

  const canWrite = (moduleCode: string): boolean => {
    if (!permissions) return false;
    return permissions.permissions[moduleCode] === "WRITE";
  };

  const canRead = (moduleCode: string): boolean => {
    if (!permissions) return false;
    const perm = permissions.permissions[moduleCode];
    return perm === "READ" || perm === "WRITE";
  };

  const isAdmin = (): boolean => {
    if (!permissions) return false;
    return permissions.user.roleId === 1;
  };

  const value: AuthorizationContextType = {
    permissions,
    isLoading,
    error,
    isAuthorized: !!permissions && permissions.user.status === "active",
    hasModuleAccess,
    canWrite,
    canRead,
    isAdmin,
    refetch: loadPermissions,
  };

  return (
    <AuthorizationContext.Provider value={value}>
      {children}
    </AuthorizationContext.Provider>
  );
}

export function useAuthorization() {
  const context = useContext(AuthorizationContext);
  if (context === undefined) {
    throw new Error(
      "useAuthorization must be used within AuthorizationProvider"
    );
  }
  return context;
}
```

### `/src/hooks/useModulePermissions.ts`

```typescript
import { useAuthorization } from "@/context/AuthorizationContext";

export function useModulePermissions(moduleCode: string) {
  const { hasModuleAccess, canWrite, canRead } = useAuthorization();

  return {
    hasAccess: hasModuleAccess(moduleCode),
    canWrite: canWrite(moduleCode),
    canRead: canRead(moduleCode),
    isReadOnly: canRead(moduleCode) && !canWrite(moduleCode),
  };
}
```

### `/src/components/ProtectedRoute.tsx`

```typescript
import { Navigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { useAuthorization } from "@/context/AuthorizationContext";
import { LoadingSpinner } from "./shared/LoadingSpinner";

export default function ProtectedRoute({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const {
    isAuthorized,
    isLoading: authzLoading,
    permissions,
  } = useAuthorization();

  // Mostrar loading mientras se verifica autenticación y autorización
  if (authLoading || authzLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner size="xl" text="Verificando permisos..." />
      </div>
    );
  }

  // Si no está autenticado → Login
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Si está autenticado pero no autorizado
  if (!authzLoading && !isAuthorized) {
    // Verificar si es por cuenta inactiva
    if (permissions?.user?.status === "inactive") {
      return <Navigate to="/account-disabled" replace />;
    }
    // Si no está en la whitelist o tiene otro problema
    return <Navigate to="/unauthorized" replace />;
  }

  // ✅ Autenticado y autorizado
  return <>{children}</>;
}
```

---

## Extractos de Código Clave

### 1. Filtrado de Tabs por Permisos

```typescript
// BannerIntegrations.tsx
const { hasModuleAccess } = useAuthorization();

const accessibleModules = useMemo(() => {
  return integrationModules.filter((module) => hasModuleAccess(module.value));
}, [hasModuleAccess]);

// Solo renderizar tabs accesibles
{
  accessibleModules.map((module) => (
    <TabsTrigger key={module.value} value={module.value}>
      {module.title}
    </TabsTrigger>
  ));
}
```

### 2. Modo Solo Lectura en Módulos

```typescript
// AcademicPeriods.tsx (patrón aplicado a los 6 módulos)
const { canWrite, isReadOnly } = useModulePermissions("academic-periods");

return (
  <div className="space-y-6">
    <PageHeader title="Períodos Académicos" />

    {/* Alert de solo lectura */}
    {isReadOnly && (
      <Alert className="border-blue-500/50 bg-blue-50 dark:bg-blue-950/20">
        <Eye className="h-4 w-4 text-blue-600 dark:text-blue-400" />
        <AlertDescription className="text-blue-800 dark:text-blue-300">
          <span className="font-semibold">Modo solo lectura.</span>
          Solo tienes permisos de lectura en este módulo.
        </AlertDescription>
      </Alert>
    )}

    {/* Ocultar botón de actualizar si no tiene WRITE */}
    <DataTable
      columns={columns}
      data={periods}
      headerActions={
        canWrite ? (
          <Button onClick={loadAcademicPeriods}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Actualizar
          </Button>
        ) : null
      }
    />
  </div>
);
```

### 3. Link Admin Condicional en Sidebar

```typescript
// Sidebar.tsx
const { isAdmin } = useAuthorization();

const navItems: NavItem[] = [
  { name: "Inicio", path: "/dashboard", icon: <Home /> },
  {
    name: "Integraciones Banner",
    path: "/dashboard/banner-integrations",
    icon: <Link />,
  },
  ...(isAdmin()
    ? [
        {
          name: "Usuarios y Roles",
          path: "/dashboard/users-roles",
          icon: <Shield />,
        },
      ]
    : []),
];
```

### 4. Gestión de Roles - RoleDialog

```typescript
// RoleDialog.tsx - Crear/Editar rol con permisos
const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();

  const selectedPermissions = Object.entries(permissions)
    .filter(([_, type]) => type !== null)
    .map(([moduleCode, permissionType]) => ({
      moduleCode,
      permissionType: permissionType as PermissionType,
    }));

  if (selectedPermissions.length === 0) {
    toast({
      title: "Error",
      description: "Debes seleccionar al menos un módulo",
    });
    return;
  }

  const apiClient = createApiClient(instance);

  if (role) {
    // Editar
    await apiClient.put(`/auth/roles/${role.roleId}`, {
      roleName: formData.roleName,
      roleDescription: formData.roleDescription,
      permissions: selectedPermissions,
    });
  } else {
    // Crear
    await apiClient.post("/auth/roles", {
      roleName: formData.roleName,
      roleDescription: formData.roleDescription,
      permissions: selectedPermissions,
    });
  }

  await onSuccess();
  onOpenChange(false);
};

// UI de permisos por módulo
{
  modules.map((module) => {
    const hasAccess = permissions[module.moduleCode] !== null;
    const permType = permissions[module.moduleCode];

    return (
      <div key={module.moduleId}>
        <Checkbox
          checked={hasAccess}
          onCheckedChange={(checked) =>
            handleToggleModule(module.moduleCode, checked as boolean)
          }
        />
        <Label>{module.moduleName}</Label>

        {hasAccess && (
          <RadioGroup
            value={permType || "READ"}
            onValueChange={(value) =>
              handlePermissionTypeChange(
                module.moduleCode,
                value as PermissionType
              )
            }>
            <RadioGroupItem value="READ" />
            <Label>Solo Lectura (R)</Label>

            <RadioGroupItem value="WRITE" />
            <Label>Lectura y Escritura (RW)</Label>
          </RadioGroup>
        )}
      </div>
    );
  });
}
```

---

## Datos Iniciales

### Módulos del Sistema (6)

| Código             | Nombre              | Ruta                      | Icono         |
| ------------------ | ------------------- | ------------------------- | ------------- |
| `academic-periods` | Períodos Académicos | `/banner/academic-period` | Calendar      |
| `academic-levels`  | Niveles Académicos  | `/banner/level`           | GraduationCap |
| `program-rules`    | Reglas de Programas | `/banner/program-rule`    | FileText      |
| `buildings`        | Edificios           | `/banner/buildings`       | Building      |
| `persons`          | Personas            | `/banner/person`          | Users         |
| `instructors`      | Instructores        | `/banner/instructor`      | GraduationCap |

### Roles del Sistema (4)

| Role ID | Nombre                | Descripción              | Sistema | Permisos           |
| ------- | --------------------- | ------------------------ | ------- | ------------------ |
| 1       | Administrador         | Acceso total al sistema  | ✅      | WRITE en 6 módulos |
| 2       | Coordinador Académico | Gestión académica        | ❌      | WRITE en 3 módulos |
| 3       | Secretaría            | Consulta administrativa  | ❌      | READ en 2 módulos  |
| 4       | Docente               | Consulta de instructores | ❌      | READ en 1 módulo   |

### Usuarios de Ejemplo (4)

| Email                  | Nombre                | Rol           | Estado      |
| ---------------------- | --------------------- | ------------- | ----------- |
| s.sepulveda@uai.cl     | Sebastian Sepulveda   | Administrador | ✅ active   |
| coord.academico@uai.cl | Coordinador Académico | Coordinador   | ✅ active   |
| secretaria@uai.cl      | Secretaría Académica  | Secretaría    | ✅ active   |
| docente@uai.cl         | Docente Departamental | Docente       | ❌ inactive |

### Matriz de Permisos

```
                        Períodos  Niveles  Reglas  Edificios  Personas  Instructores
Administrador             RW       RW       RW       RW         RW         RW
Coordinador Académico     RW       RW       RW        -          -          -
Secretaría                 -        -        -        R          R          -
Docente                    -        -        -        -          -          R
```

---

## Migración a SQL Server

### Scripts SQL

```sql
-- Tabla Users
CREATE TABLE Users (
    Id INT IDENTITY(1,1) PRIMARY KEY,
    Email NVARCHAR(255) UNIQUE NOT NULL,
    DisplayName NVARCHAR(255) NOT NULL,
    RoleId INT NOT NULL,
    Status NVARCHAR(20) NOT NULL DEFAULT 'active',
    LastAccessAt DATETIME2 NULL,
    CreatedAt DATETIME2 NOT NULL DEFAULT GETDATE(),
    CreatedBy NVARCHAR(255) NOT NULL,
    UpdatedAt DATETIME2 NULL,
    UpdatedBy NVARCHAR(255) NULL,
    CONSTRAINT FK_Users_Roles FOREIGN KEY (RoleId) REFERENCES Roles(RoleId),
    CONSTRAINT CK_Users_Status CHECK (Status IN ('active', 'inactive', 'suspended'))
);

-- Tabla Roles
CREATE TABLE Roles (
    Id INT IDENTITY(1,1) PRIMARY KEY,
    RoleName NVARCHAR(100) UNIQUE NOT NULL,
    RoleDescription NVARCHAR(500) NULL,
    IsSystemRole BIT NOT NULL DEFAULT 0,
    CreatedAt DATETIME2 NOT NULL DEFAULT GETDATE(),
    CreatedBy NVARCHAR(255) NOT NULL,
    UpdatedAt DATETIME2 NULL,
    UpdatedBy NVARCHAR(255) NULL
);

-- Tabla Modules
CREATE TABLE Modules (
    Id INT IDENTITY(1,1) PRIMARY KEY,
    ModuleCode NVARCHAR(100) UNIQUE NOT NULL,
    ModuleName NVARCHAR(255) NOT NULL,
    ModuleDescription NVARCHAR(500) NULL,
    RoutePattern NVARCHAR(255) NOT NULL,
    DisplayOrder INT NOT NULL,
    IsActive BIT NOT NULL DEFAULT 1
);

-- Tabla RolePermissions
CREATE TABLE RolePermissions (
    Id INT IDENTITY(1,1) PRIMARY KEY,
    RoleId INT NOT NULL,
    ModuleId INT NOT NULL,
    PermissionType NVARCHAR(20) NOT NULL,
    CONSTRAINT FK_RolePermissions_Roles FOREIGN KEY (RoleId)
        REFERENCES Roles(RoleId) ON DELETE CASCADE,
    CONSTRAINT FK_RolePermissions_Modules FOREIGN KEY (ModuleId)
        REFERENCES Modules(ModuleId) ON DELETE CASCADE,
    CONSTRAINT CK_RolePermissions_Type CHECK (PermissionType IN ('READ', 'WRITE')),
    CONSTRAINT UQ_RolePermissions_RoleModule UNIQUE (RoleId, ModuleId)
);

-- Índices para performance
CREATE INDEX IX_Users_Email ON Users(Email);
CREATE INDEX IX_Users_RoleId ON Users(RoleId);
CREATE INDEX IX_RolePermissions_RoleId ON RolePermissions(RoleId);
CREATE INDEX IX_Modules_Code ON Modules(ModuleCode);
```

-- Tabla Roles
CREATE TABLE int_app_roles (
Id INT IDENTITY(1,1) PRIMARY KEY,
RoleName NVARCHAR(100) UNIQUE NOT NULL,
RoleDescription NVARCHAR(500) NULL,
IsSystemRole BIT NOT NULL DEFAULT 0,
CreatedAt DATETIME2 NOT NULL DEFAULT GETDATE(),
CreatedBy NVARCHAR(255) NOT NULL,
UpdatedAt DATETIME2 NULL,
UpdatedBy NVARCHAR(255) NULL
);

CREATE TABLE int_app_users (
Id INT IDENTITY(1,1) PRIMARY KEY,
Email NVARCHAR(255) UNIQUE NOT NULL,
DisplayName NVARCHAR(255) NOT NULL,
RoleId INT NOT NULL,
Status NVARCHAR(20) NOT NULL DEFAULT 'active',
LastAccessAt DATETIME2 NULL,
CreatedAt DATETIME2 NOT NULL DEFAULT GETDATE(),
CreatedBy NVARCHAR(255) NOT NULL,
UpdatedAt DATETIME2 NULL,
UpdatedBy NVARCHAR(255) NULL,
CONSTRAINT FK_Users_Roles FOREIGN KEY (Id) REFERENCES int_app_roles(Id),
CONSTRAINT CK_Users_Status CHECK (Status IN ('active', 'inactive', 'suspended'))
);

-- Tabla ModulesS
CREATE TABLE int_app_modules (
Id INT IDENTITY(1,1) PRIMARY KEY,
ModuleCode NVARCHAR(100) UNIQUE NOT NULL,
ModuleName NVARCHAR(255) NOT NULL,
ModuleDescription NVARCHAR(500) NULL,
RoutePattern NVARCHAR(255) NOT NULL,
DisplayOrder INT NOT NULL,
IsActive BIT NOT NULL DEFAULT 1
);

-- Tabla RolePermissions
CREATE TABLE int_app_rolePermissions (
Id INT IDENTITY(1,1) PRIMARY KEY,
RoleId INT NOT NULL,
ModuleId INT NOT NULL,
PermissionType NVARCHAR(20) NOT NULL,
CONSTRAINT FK_RolePermissions_Roles FOREIGN KEY (RoleId)
REFERENCES int_app_roles(Id) ON DELETE CASCADE,
CONSTRAINT FK_RolePermissions_Modules FOREIGN KEY (ModuleId)
REFERENCES int_app_modules(Id) ON DELETE CASCADE,
CONSTRAINT CK_RolePermissions_Type CHECK (PermissionType IN ('READ', 'WRITE')),
CONSTRAINT UQ_RolePermissions_RoleModule UNIQUE (RoleId, ModuleId)
);

-- Índices para performance
CREATE INDEX IX_Users_Email ON int_app_users(Email);
CREATE INDEX IX_Users_RoleId ON int_app_users(RoleId);
CREATE INDEX IX_RolePermissions_RoleId ON int_app_rolePermissions(RoleId);
CREATE INDEX IX_Modules_Code ON int_app_modules(ModuleCode);

-- Eliminar la constraint actual
ALTER TABLE dbo.int_app_rolePermissions
DROP CONSTRAINT UQ_RolePermissions_RoleModule;

-- Crear una nueva constraint que incluya PermissionType
ALTER TABLE dbo.int_app_rolePermissions
ADD CONSTRAINT UQ_RolePermissions_RoleModuleType
UNIQUE (RoleId, ModuleId, PermissionType);

select _ from int_app_users;
select _ from int*app_roles;
select * from int*app_modules;
select * from dbo.int_app_rolePermissions;

insert into int_app_users (Email, DisplayName, RoleId, Status, CreatedAt, CreatedBy)
values ('s.sepulveda@uai.cl', 'SSEPULVEDA', 1, 'active', GETDATE(), 'SQL');

insert into int_app_roles (RoleName, RoleDescription, IsSystemRole, CreatedAt, CreatedBy)
values ('Admin', 'Administrator', 1, GETDATE(), 'SQL');

insert into int_app_modules (ModuleCode, ModuleName, ModuleDescription, RoutePattern, DisplayOrder,IsActive)
values ('USR', 'Gestion de Usuarios/Roles', 'Gestiona los usuarios y roles del sistema', '/users-roles', 1, 1)

insert into dbo.int_app_rolePermissions (RoleId, ModuleId, PermissionType)
values (2, 1, 'READ'), (2, 1, 'WRITE');

### Estrategia de Migración

1. **Crear tablas** en SQL Server
2. **Insertar datos iniciales** de mockAuthData.js
3. **Crear `/api/services/authService.js`** con funciones SQL:

```javascript
const sql = require("mssql");

async function getUserPermissions(email) {
  const result = await sql.query`
    SELECT
      u.*,
      r.*,
      m.ModuleCode,
      m.ModuleName,
      rp.PermissionType
    FROM Users u
    JOIN Roles r ON u.RoleId = r.RoleId
    LEFT JOIN RolePermissions rp ON r.RoleId = rp.RoleId
    LEFT JOIN Modules m ON rp.ModuleId = m.ModuleId
    WHERE u.Email = ${email}
      AND u.Status = 'active'
      AND m.IsActive = 1
  `;

  if (result.recordset.length === 0) return null;

  const user = result.recordset[0];
  const role = { roleId: user.RoleId, roleName: user.RoleName /* ... */ };

  const permissions = {};
  result.recordset.forEach((row) => {
    if (row.ModuleCode) {
      permissions[row.ModuleCode] = row.PermissionType;
    }
  });

  return { user, role, permissions };
}

module.exports = { getUserPermissions /* ... */ };
```

4. **Modificar `/api/auth/index.js`** y `/api/shared/authMiddleware.js`\*\* para importar `authService` en vez de `mockAuthData`
5. **Configurar connection string** en Azure Function App Settings
6. **Testing exhaustivo** con todos los roles

**✅ NO SE REQUIEREN CAMBIOS EN FRONTEND** - La API mantiene el mismo contrato.

---

## Testing y Casos de Uso

### Escenarios de Prueba

#### 1. Usuario Administrador (s.sepulveda@uai.cl)

- ✅ Puede ver todos los 6 módulos
- ✅ Botón "Actualizar" visible en todos los módulos
- ✅ Puede acceder a "Usuarios y Roles" en sidebar
- ✅ Puede crear/editar usuarios y roles
- ✅ Puede hacer POST/PUT/DELETE en todas las rutas

#### 2. Coordinador Académico (coord.academico@uai.cl)

- ✅ Puede ver solo 3 módulos: Períodos, Niveles, Reglas
- ✅ Botón "Actualizar" visible en esos 3 módulos
- ❌ No ve "Usuarios y Roles" en sidebar
- ❌ No puede acceder a Edificios, Personas, Instructores
- ✅ Puede hacer POST/PUT/DELETE en sus 3 módulos

#### 3. Secretaría (secretaria@uai.cl)

- ✅ Puede ver solo 2 módulos: Edificios, Personas
- ❌ Botón "Actualizar" NO visible (solo READ)
- 🔵 Muestra alert "Modo solo lectura"
- ❌ No ve "Usuarios y Roles" en sidebar
- ❌ Si intenta POST/PUT/DELETE → 403 Forbidden

#### 4. Docente (docente@uai.cl)

- ❌ Usuario inactivo → redirige a `/account-disabled`
- 📄 Muestra página con mensaje de cuenta desactivada
- ❌ No puede acceder a ningún módulo

#### 5. Usuario No Registrado (random@uai.cl)

- ❌ Usuario no en whitelist → redirige a `/unauthorized`
- 📄 Muestra página 403 con mensaje de no autorizado
- ❌ No puede acceder a ningún módulo

### Comandos de Testing

```bash
# 1. Verificar que Azure Functions está corriendo
cd api
npm start
# Debe mostrar: localhost:7071

# 2. Probar endpoint de permisos
curl http://localhost:7071/api/auth/user/s.sepulveda@uai.cl

# Respuesta esperada:
{
  "user": {
    "userId": 1,
    "email": "s.sepulveda@uai.cl",
    "displayName": "Sebastian Andres Sepulveda Campos",
    "roleId": 1,
    "status": "active"
  },
  "role": {
    "roleId": 1,
    "roleName": "Administrador",
    "roleDescription": "Acceso total al sistema",
    "isSystemRole": true
  },
  "permissions": {
    "academic-periods": "WRITE",
    "academic-levels": "WRITE",
    "program-rules": "WRITE",
    "buildings": "WRITE",
    "persons": "WRITE",
    "instructors": "WRITE"
  }
}

# 3. Probar endpoint de usuario no autorizado
curl http://localhost:7071/api/auth/user/noexiste@uai.cl
# Respuesta: 404 Not Found

# 4. Iniciar frontend
npm run dev
# Debe abrir en http://localhost:5173

# 5. Login con s.sepulveda@uai.cl
# Verificar que ve todos los módulos y el link de administración
```

### Checklist de Validación

- [ ] Backend corriendo en localhost:7071
- [ ] Frontend corriendo en localhost:5173
- [ ] Login con admin → ve 6 módulos + administración
- [ ] Login con coordinador → ve 3 módulos, botones visibles
- [ ] Login con secretaría → ve 2 módulos, solo lectura, sin botones
- [ ] Intento de acceso con usuario no registrado → /unauthorized
- [ ] Usuario inactivo → /account-disabled
- [ ] Crear nuevo usuario desde panel admin
- [ ] Crear nuevo rol desde panel admin
- [ ] Asignar permisos READ/WRITE por módulo
- [ ] Verificar que cambios se reflejan inmediatamente

---

## Seguridad y Mejores Prácticas

### Principios de Seguridad Implementados

1. **Never Trust Frontend**: Toda validación crítica en backend
2. **Whitelist Pattern**: Solo usuarios explícitos pueden acceder
3. **Defense in Depth**: Múltiples capas de validación
4. **Least Privilege**: Usuarios reciben mínimos permisos necesarios
5. **Token Validation**: JWT validado en cada request
6. **Audit Trail**: Campos CreatedBy/UpdatedBy para trazabilidad

### Edge Cases Manejados

| Escenario             | Comportamiento            |
| --------------------- | ------------------------- |
| Usuario no existe     | 403 → /unauthorized       |
| Usuario inactivo      | 403 → /account-disabled   |
| Sin permisos módulo   | 403 → Mensaje descriptivo |
| READ intenta escribir | 403 → "Solo lectura"      |
| Token expirado        | 401 → Refresh automático  |
| Admin                 | Acceso total + gestión    |
| Rol sistema           | No editable/eliminable    |
| Módulo inactivo       | Oculto en UI y backend    |

### Recomendaciones para Producción

1. **Rate Limiting**: Implementar en Azure APIM
2. **Audit Log**: Tabla AuditLog para cambios críticos
3. **Connection Pooling**: Para SQL Server
4. **Caching**: Redis para permisos (invalidar al cambiar)
5. **Monitoring**: Application Insights para logs
6. **CORS**: Configurar correctamente en Azure SWA
7. **Secrets**: Azure Key Vault para connection strings
8. **Backup**: Backup automático de base de datos

---

## Contacto y Soporte

**Desarrollador**: Sebastian Sepulveda
**Email**: s.sepulveda@uai.cl
**Fecha Implementación**: Enero 2025
**Versión Sistema**: 1.0.0

---

## Apéndice: Comandos Útiles

```bash
# Instalar dependencias backend
cd api
npm install

# Instalar dependencias frontend
npm install

# Agregar componente Shadcn
npx shadcn@latest add [component-name]

# Ejecutar Azure Functions localmente
cd api
npm start

# Ejecutar frontend localmente
npm run dev

# Build para producción
npm run build

# Deploy a Azure Static Web App
npx swa deploy
```

---

**Documento generado automáticamente para el proyecto Traductor SIS - UAI**
