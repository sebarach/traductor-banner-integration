# CLAUDE.md - Memoria del Proyecto TraductorSIS

> **⚠️ REGLA CRÍTICA**: Este archivo DEBE ser leído SIEMPRE como primer paso antes de cualquier tarea. NO leer otros archivos innecesariamente. Este documento contiene toda la información necesaria para minimizar el uso de tokens.

---

## 📋 ÍNDICE RÁPIDO

1. [Reglas de Optimización de Tokens](#reglas-de-optimización-de-tokens)
2. [Estructura del Proyecto](#estructura-del-proyecto)
3. [Stack Tecnológico](#stack-tecnológico)
4. [Arquitectura](#arquitectura)
5. [Rutas y Endpoints](#rutas-y-endpoints)
6. [Sistema de Autenticación](#sistema-de-autenticación)
7. [Sistema de Autorización](#sistema-de-autorización)
8. [Configuración](#configuración)
9. [Referencias Rápidas](#referencias-rápidas)

---

## 🎯 REGLAS DE OPTIMIZACIÓN DE TOKENS

### ✅ SIEMPRE HACER

1. **Leer este archivo PRIMERO** antes de cualquier tarea
2. **Consultar la sección correspondiente** en este documento antes de leer archivos
3. **Usar las referencias rápidas** para ubicar archivos específicos
4. **Hacer preguntas específicas** al usuario si la información no está aquí
5. **Actualizar este archivo** cuando se hagan cambios importantes en la estructura

### ❌ NUNCA HACER

1. **NO leer archivos sin consultar este documento primero**
2. **NO explorar carpetas completas** - usa las referencias de este archivo
3. **NO leer archivos de configuración** si la info ya está aquí (vite.config.ts, tailwind.config.js, etc.)
4. **NO leer archivos de node_modules** o dist/
5. **NO leer múltiples archivos cuando este documento tiene la respuesta**
6. **NO crear archivos .md** (README, documentación, etc.) - JAMÁS crear archivos markdown innecesarios, incluso si el usuario lo solicita. Priorizar la optimización de tokens.

### 🔍 PROCESO RECOMENDADO PARA FEATURES

```
1. Leer CLAUDE.md (este archivo)
2. Identificar los archivos específicos necesarios según la sección correspondiente
3. Leer SOLO esos archivos específicos
4. Implementar el cambio
5. Actualizar CLAUDE.md si es necesario
```

---

## 📁 ESTRUCTURA DEL PROYECTO

### Vista General
```
TraductorSIS/
├── api/                          # Azure Functions (Backend)
│   ├── auth/                     # Endpoints de autenticación y autorización
│   ├── banner/                   # Proxy hacia API Banner
│   ├── data/mockAuthData.js      # IMPORTANTE: Mock data de usuarios y permisos
│   └── shared/authMiddleware.js  # Middleware de validación de tokens
│
├── src/                          # Frontend React + TypeScript
│   ├── components/
│   │   ├── layouts/              # Navbar, Sidebar, UserDropdown
│   │   ├── shared/               # DataTable, Modal, LoadingSpinner, etc.
│   │   ├── ui/                   # Componentes shadcn/ui (NO MODIFICAR)
│   │   └── users-roles/          # Gestión de usuarios y roles
│   ├── context/                  # AuthContext, AuthorizationContext, ThemeContext
│   ├── pages/                    # Páginas de la aplicación
│   ├── types/                    # Tipos TypeScript (auth.ts, api.ts)
│   ├── utils/apiClient.ts        # Cliente HTTP con autenticación
│   └── App.tsx                   # Configuración de rutas
│
├── .env.development              # Variables de entorno DEV
├── .env.production               # Variables de entorno PROD
└── staticwebapp.config.json      # Config de Azure Static Web Apps
```

### Archivos Críticos por Funcionalidad

#### 🔐 Autenticación y Autorización
- [src/context/AuthContext.tsx](src/context/AuthContext.tsx) - Gestión de auth con Azure AD
- [src/context/AuthorizationContext.tsx](src/context/AuthorizationContext.tsx) - Gestión de permisos
- [api/auth/index.js](api/auth/index.js) - Proxy a APIM con Client Credentials (igual que banner)
- [api/shared/authMiddleware.js](api/shared/authMiddleware.js) - Validación de tokens
- ~~[api/data/mockAuthData.js](api/data/mockAuthData.js)~~ - OBSOLETO: Ya no se usa

#### 🎨 UI y Layout
- [src/components/DashboardLayout.tsx](src/components/DashboardLayout.tsx) - Layout principal
- [src/components/layouts/Navbar.tsx](src/components/layouts/Navbar.tsx) - Barra superior
- [src/components/layouts/Sidebar.tsx](src/components/layouts/Sidebar.tsx) - Menú lateral
- [src/components/shared/DataTable.tsx](src/components/shared/DataTable.tsx) - Tabla reutilizable

#### 🔌 Integración Banner
- [api/banner/index.js](api/banner/index.js) - Proxy con Client Credentials
- [src/pages/BannerIntegrations.tsx](src/pages/BannerIntegrations.tsx) - UI de integraciones
- [src/types/api.ts](src/types/api.ts) - Tipos de datos Banner

#### 👥 Gestión de Usuarios
- [src/pages/UsersRoles.tsx](src/pages/UsersRoles.tsx) - Página principal
- [src/components/users-roles/UserManagementTab.tsx](src/components/users-roles/UserManagementTab.tsx)
- [src/components/users-roles/RolesPermissionsTab.tsx](src/components/users-roles/RolesPermissionsTab.tsx)

---

## 🛠️ STACK TECNOLÓGICO

### Frontend
- **React 18.2.0** + **TypeScript 5.3.3**
- **Vite 5.0.8** (Build tool con HTTPS)
- **React Router DOM 6.21.1** (Enrutamiento)
- **Tailwind CSS 3.4.0** (Estilos)
- **shadcn/ui** (Componentes basados en Radix UI)
- **TanStack React Table 8.21.3** (Tablas)
- **Lucide React 0.561.0** (Iconos)
- **@azure/msal-browser 3.7.1** (Autenticación)

### Backend
- **Azure Functions** (Node.js 18)
- **@azure/msal-node 2.6.0** (Client Credentials)
- **jsonwebtoken 9.0.3** (Validación JWT)

### Infraestructura
- **Azure Static Web Apps** (Hosting)
- **Azure AD** (SSO)
- **Azure API Management** (Gateway)

---

## 🏗️ ARQUITECTURA

### Flujo de Autenticación

```
Usuario → Frontend → Azure AD → Frontend (ID Token)
                                     ↓
                              AuthContext guarda token
                                     ↓
                        /api/auth/user-profile?email={email} (con X-User-Token)
                                     ↓
                          Backend valida ID Token JWT (SSO)
                                     ↓
                    Backend obtiene Access Token (Client Credentials)
                                     ↓
                  Backend llama APIM: /auth/user-profile?email={email}
                                     ↓
                    APIM retorna { userId, email, displayName, status, role, modules }
                                     ↓
                      Backend transforma y retorna datos al Frontend
                                     ↓
                      AuthorizationContext guarda permisos
```

**IMPORTANTE:** El sistema de autenticación usa la misma arquitectura que `/api/banner/*`:
1. Valida ID Token del SSO (Azure AD)
2. Obtiene Access Token con Client Credentials
3. Hace proxy a APIM con el Access Token
4. La API real en APIM maneja usuarios, roles y permisos

### Flujo de Request a API Banner

```
Frontend → /api/banner/* (con X-User-Token)
              ↓
    Backend valida token y permisos
              ↓
    Backend obtiene Access Token (Client Credentials)
              ↓
    Backend hace proxy a APIM → API Banner
              ↓
    Backend retorna respuesta a Frontend
```

### Sistema de Permisos

**Estructura:**
- **Módulos**: integrations, users-roles
- **Permisos por módulo**: READ, WRITE
- **Roles**: Administrador, Usuario de Consulta, Sin Acceso
- **Estados de usuario**: active, inactive, suspended

**Ejemplo de permisos:**
```json
{
  "integrations": "READ",
  "users-roles": "WRITE"
}
```

**Validación:**
- Frontend: `ProtectedRoute` (autenticación) y `TabProtectedRoute` (permisos por tab)
- Backend: `authMiddleware.js` valida token y permisos por endpoint

---

## 🛣️ RUTAS Y ENDPOINTS

### Frontend Routes

| Ruta | Componente | Protección | Descripción |
|------|-----------|-----------|-------------|
| `/` | Redirect | - | Redirige a /login |
| `/login` | Login.tsx | Pública | Login con Azure AD |
| `/dashboard` | Dashboard.tsx | ProtectedRoute | Página de inicio |
| `/dashboard/banner-integrations` | BannerIntegrations.tsx | TabProtectedRoute("integrations") | Integraciones Banner |
| `/dashboard/users-roles` | UsersRoles.tsx | TabProtectedRoute("users-roles") | Gestión de usuarios |
| `/unauthorized` | Unauthorized.tsx | Pública | Acceso denegado |
| `/account-disabled` | AccountDisabled.tsx | Pública | Cuenta deshabilitada |

### Backend Endpoints

#### `/api/auth/*` (Proxy a APIM)

**IMPORTANTE:** Usa la misma arquitectura que `/api/banner/*`:
- Valida ID Token del usuario (SSO)
- Obtiene Access Token con Client Credentials
- Hace proxy a APIM con Access Token

| Método | Endpoint Frontend | Endpoint APIM | Descripción |
|--------|----------|-------------|-------------|
| GET | `/api/auth/user-profile?email={email}` | `/auth/user-profile?email={email}` | Obtiene usuario, rol y permisos |
| GET | `/api/auth/users` | `/auth/users` | Lista usuarios (requiere permisos) |
| POST | `/api/auth/users` | `/auth/users` | Crea usuario (requiere permisos) |
| PUT | `/api/auth/users/{id}` | `/auth/users/{id}` | Actualiza usuario (requiere permisos) |
| GET | `/api/auth/roles` | `/auth/roles` | Lista roles (requiere permisos) |
| POST | `/api/auth/roles` | `/auth/roles` | Crea rol (requiere permisos) |
| PUT | `/api/auth/roles/{id}` | `/auth/roles/{id}` | Actualiza rol (requiere permisos) |

#### `/api/banner/*` (Proxy dinámico)

Todos los endpoints requieren permiso `integrations:READ`

| Endpoint | Descripción |
|----------|-------------|
| `/api/banner/academic-period` | Períodos académicos |
| `/api/banner/academic-level` | Niveles académicos |
| `/api/banner/program-rule` | Reglas de programas |
| `/api/banner/building` | Edificios |
| `/api/banner/person/:bannerId` | Información de persona |
| `/api/banner/instructor` | Instructores |

---

## 🔐 SISTEMA DE AUTENTICACIÓN

### Configuración MSAL (Frontend)

**App Registration SSO:**
- Client ID: `b16f7c4e-52b2-45af-891a-8b1e34974419`
- Tenant ID: `1493756b-9ee3-4b7e-85fb-a1a7ece5c165`
- Redirect URI (Dev): `https://localhost:5173/login`
- Redirect URI (Prod): `https://agreeable-tree-0be02a20f.3.azurestaticapps.net/login`

**Configuración:**
```typescript
// Ver: src/config/authConfig.ts
{
  auth: {
    clientId: VITE_AZURE_CLIENT_ID,
    authority: `https://login.microsoftonline.com/${VITE_AZURE_TENANT_ID}`,
    redirectUri: VITE_AZURE_REDIRECT_URI
  },
  cache: {
    cacheLocation: "sessionStorage"
  }
}
```

### Configuración MSAL (Backend)

**App Registration API:**
- Client ID: `2816c029-725f-405d-84d7-8b77ebaed2e0`
- Client Secret: `Lf38Q~IyjNt5CZYVHt0n_AeGbw6xEM-SPi~zmaBp`
- Scope: `api://2816c029-.../default`

**Flow:** Client Credentials (Service-to-Service)

### Validación de Token

**Backend valida:**
1. Issuer: `https://login.microsoftonline.com/{TENANT_ID}/v2.0`
2. Audience: `{SSO_CLIENT_ID}`
3. Firma JWT válida

**Código en:** [api/shared/authMiddleware.js](api/shared/authMiddleware.js)

---

## 🔑 SISTEMA DE AUTORIZACIÓN

### Estructura de Base de Datos (SQL Server)

**Tablas:**
- `int_app_users` - Usuarios del sistema
- `int_app_roles` - Roles disponibles
- `int_app_modules` - Módulos de la aplicación
- `int_app_rolePermissions` - Relación roles-módulos con permisos

**Ejemplo de datos:**
```sql
-- Usuarios
SELECT * FROM int_app_users
-- Id: 2, Email: s.sepulveda@uai.cl, RoleId: 2, Status: active

-- Roles
SELECT * FROM int_app_roles
-- Id: 2, RoleName: Admin, IsSystemRole: 1

-- Módulos
SELECT * FROM int_app_modules
-- Id: 1, ModuleCode: INT, ModuleName: Integraciones Banner
-- Id: 2, ModuleCode: USR, ModuleName: Gestion de Usuarios/Roles

-- Permisos por Rol
SELECT * FROM int_app_rolePermissions
-- RoleId: 2 tiene READ y WRITE para módulos 1 (INT) y 2 (USR)
```

### Respuesta de API Real (APIM)

**Endpoint:** `GET /auth/user-profile?email={email}`

**Respuesta:**
```json
{
  "userId": 2,
  "email": "s.sepulveda@uai.cl",
  "displayName": "SSEPULVEDA",
  "status": "active",
  "lastAccessAt": null,
  "userCreatedAt": "2025-12-17T04:02:15.4266667",
  "role": {
    "roleId": 2,
    "roleName": "Admin",
    "roleDescription": "Administrator",
    "isSystemRole": true,
    "createdAt": null,
    "createdBy": null
  },
  "modules": [
    {
      "moduleId": 1,
      "moduleCode": "INT",
      "moduleName": "Integraciones Banner",
      "moduleDescription": "INTEGRACIONES CON BANNER",
      "routePattern": "/banner-integrations",
      "displayOrder": 1,
      "permissions": ["READ", "WRITE"]
    },
    {
      "moduleId": 2,
      "moduleCode": "USR",
      "moduleName": "Gestion de Usuarios/Roles",
      "moduleDescription": "Gestiona los usuarios y roles del sistema",
      "routePattern": "/users-roles",
      "displayOrder": 1,
      "permissions": ["READ", "WRITE"]
    }
  ]
}
```

**Transformación a formato del Frontend:**
```javascript
// Backend transforma la respuesta de APIM a:
{
  user: {
    userId: apiData.userId,
    email: apiData.email,
    displayName: apiData.displayName,
    roleId: apiData.role.roleId,
    status: apiData.status,
    lastAccessAt: apiData.lastAccessAt,
    createdAt: apiData.userCreatedAt
  },
  role: apiData.role,
  permissions: {
    // Transforma modules array a objeto con permisos por moduleCode
    "integrations": "WRITE",  // Si tiene READ y WRITE, se guarda WRITE
    "users-roles": "READ"
  }
}
```

**Mapeo de códigos de módulo (APIM → Frontend):**
- `INT` → `integrations` (Integraciones Banner)
- `USR` → `users-roles` (Gestión de Usuarios/Roles)

**NOTA:** Si el módulo de usuarios y roles no aparece en el sidebar:
1. Verificar que el usuario tenga el módulo asignado en SQL Server (tabla `int_app_rolePermissions`)
2. Verificar que el código del módulo esté mapeado en [api/auth/index.js](api/auth/index.js:66-70)
3. **Cerrar sesión y volver a iniciar sesión** para que el frontend obtenga los nuevos permisos

### Hooks de Autorización

**useAuthorization()** - [src/context/AuthorizationContext.tsx](src/context/AuthorizationContext.tsx)
```typescript
const {
  permissions,      // { integrations: "READ", users-roles: "WRITE" }
  isAuthorized,     // true si tiene al menos un permiso
  hasTabAccess,     // (tabCode) => boolean
  hasWriteAccess,   // (tabCode) => boolean
  checkAccess       // (tabCode, action) => boolean
} = useAuthorization()
```

**useModulePermissions()** - [src/hooks/useModulePermissions.ts](src/hooks/useModulePermissions.ts)
```typescript
const { canRead, canWrite } = useModulePermissions("integrations")
```

---

## ⚙️ CONFIGURACIÓN

### Variables de Entorno

**Frontend (.env.development):**
```bash
VITE_AZURE_CLIENT_ID=b16f7c4e-52b2-45af-891a-8b1e34974419
VITE_AZURE_TENANT_ID=1493756b-9ee3-4b7e-85fb-a1a7ece5c165
VITE_AZURE_REDIRECT_URI=https://localhost:5173/login
VITE_API_BASE_URL=/api
```

**Backend (api/local.settings.json):**
```json
{
  "Values": {
    "API_CLIENT_ID": "2816c029-...",
    "API_CLIENT_SECRET": "Lf38Q~...",
    "AZURE_TENANT_ID": "1493756b-...",
    "API_BASE_URL": "https://apim-sis-002-dev.uai.cl/traductor-sis",
    "API_SCOPE": "api://2816c029-.../default",
    "SSO_CLIENT_ID": "b16f7c4e-..."
  }
}
```

### Vite Config

**Puerto:** 5173 (HTTPS)
**Proxy:** `/api` → `http://localhost:7071`
**Alias:** `@` → `./src`

Ver: [vite.config.ts](vite.config.ts)

### Azure Functions Config

**Puerto:** 7071
**Runtime:** node:18
**CORS:** `*` (solo desarrollo)

Ver: [api/host.json](api/host.json)

### Tailwind Config

**Dark Mode:** class-based
**Tema:** Variables CSS en [src/index.css](src/index.css)
**Plugins:** tailwindcss-animate

Ver: [tailwind.config.js](tailwind.config.js)

---

## 📚 REFERENCIAS RÁPIDAS

### Crear Nuevo Endpoint de Integración

**Archivos a modificar:**
1. [src/types/api.ts](src/types/api.ts) - Agregar tipo TypeScript
2. [src/pages/BannerIntegrations.tsx](src/pages/BannerIntegrations.tsx) - Agregar card
3. Crear página nueva en `src/pages/` (ejemplo: [src/pages/AcademicPeriods.tsx](src/pages/AcademicPeriods.tsx))
4. [src/App.tsx](src/App.tsx) - Agregar ruta

**NO necesitas modificar:**
- `api/banner/index.js` (es un proxy dinámico)

### Agregar Nuevo Endpoint de Autenticación/Usuarios

**Similar a Banner, es un proxy dinámico:**
1. El endpoint en APIM debe estar en `/auth/*`
2. El frontend llama a `/api/auth/*`
3. `api/auth/index.js` hace proxy automáticamente
4. Si necesitas transformar la respuesta, agregar lógica en `transformUserProfileResponse()` o crear nueva función de transformación

### Agregar Nuevo Usuario

Los usuarios se gestionan a través de la API en APIM. Para agregar un nuevo usuario, usar:

```
POST /api/auth/users
Body: {
  "email": "nuevo.usuario@uai.cl",
  "displayName": "Nuevo Usuario",
  "roleId": 2,
  "status": "active"
}
```

### Crear Nuevo Rol

Los roles se gestionan a través de la API en APIM. Para crear un nuevo rol, usar:

```
POST /api/auth/roles
Body: {
  "roleName": "Nuevo Rol",
  "roleDescription": "Descripción",
  "permissions": [
    { "moduleCode": "INT", "permissionType": "READ" }
  ]
}
```

### Agregar Nuevo Módulo

Los módulos se gestionan en la base de datos del APIM. Para agregar soporte en el frontend:

**Archivos a modificar:**
1. [src/types/auth.ts](src/types/auth.ts) - Actualizar tipo ModuleCode
2. [src/components/layouts/Sidebar.tsx](src/components/layouts/Sidebar.tsx) - Agregar al menú
3. [src/App.tsx](src/App.tsx) - Agregar ruta con `TabProtectedRoute`
4. [api/auth/index.js](api/auth/index.js) - Agregar mapeo en `transformUserProfileResponse()` si el código del módulo en APIM es diferente

### Crear Componente UI

**Usar shadcn/ui CLI:**
```bash
npx shadcn@latest add [component-name]
```

**Componentes disponibles:** alert, avatar, badge, button, card, checkbox, dialog, dropdown-menu, input, label, radio-group, scroll-area, select, separator, skeleton, table, tabs, toast

**Ubicación:** [src/components/ui/](src/components/ui/)

### Debugging

**Frontend (Vite):**
```bash
npm run dev
# https://localhost:5173
```

**Backend (Azure Functions):**
```bash
cd api
npm start
# http://localhost:7071
```

**Ver logs:**
- Frontend: Console del navegador
- Backend: Terminal de Azure Functions

**Troubleshooting común:**

1. **Puerto 7071 ocupado:**
   ```bash
   netstat -ano | findstr :7071
   taskkill //PID [PID] //F
   cd api && npm start
   ```

2. **Error 404 en /api/auth/user-profile:**
   - Verificar que Azure Functions esté corriendo
   - Verificar logs del backend en la terminal
   - La URL construida debe ser: `{API_BASE_URL}/api/auth/user-profile?email=...`

3. **Error 401 Unauthorized:**
   - Verificar que el token se esté enviando en header `X-User-Token`
   - Verificar que `SSO_CLIENT_ID` en `api/local.settings.json` coincida con el frontend

4. **Reiniciar servicios después de cambios en backend:**
   - Detener Azure Functions (Ctrl+C)
   - Volver a ejecutar `cd api && npm start`

---

## 🚀 SCRIPTS NPM

### Frontend
```bash
npm run dev      # Desarrollo (HTTPS, puerto 5173)
npm run build    # Build de producción
npm run preview  # Preview del build
```

### Backend
```bash
cd api
npm start        # Azure Functions local (puerto 7071)
```

---

## 📝 NOTAS IMPORTANTES

### API Real vs Mock Data
- **Sistema de autenticación:** Usa API real en APIM (`/auth/user-profile`)
- **Gestión de usuarios/roles:** Endpoints configurados para usar APIM (pueden requerir implementación futura)
- **Mock data obsoleto:** [api/data/mockAuthData.js](api/data/mockAuthData.js) ya NO se usa para autenticación
- **Persistencia:** Los datos persisten en la base de datos del APIM

### Seguridad
- Todos los tokens se almacenan en `sessionStorage` (se borran al cerrar navegador)
- El backend valida SIEMPRE el token JWT antes de procesar requests
- El middleware verifica permisos por módulo

### Performance
- Las tablas usan TanStack React Table con paginación
- Las imágenes de perfil se cargan desde Microsoft Graph API
- El proxy a Banner usa Client Credentials (token se cachea automáticamente por MSAL)

### Estilos
- NO modificar archivos en `src/components/ui/` directamente
- Usar las clases de Tailwind y las variables CSS de `src/index.css`
- Para cambiar tema, modificar variables CSS en `:root` y `.dark`

---

## 🔄 HISTORIAL DE CAMBIOS

### 2025-01-19
- Creación del archivo CLAUDE.md
- Documentación completa de la estructura del proyecto
- Definición de reglas de optimización de tokens
- Migración de autenticación de mock data a API real en APIM
- Sistema de autenticación usa misma arquitectura que Banner (ID Token + Client Credentials)
- Regla: NO crear archivos .md innecesarios

---

## 📞 CONTACTO Y REFERENCIAS

**Usuario Principal:** s.sepulveda@uai.cl (Administrador)

**Repositorio:** e:\GIT SEBA\TraductorSIS\staticwebapp.config

**Azure Static Web App (Prod):** https://agreeable-tree-0be02a20f.3.azurestaticapps.net

**APIM Base URL:** https://apim-sis-002-dev.uai.cl/traductor-sis

---

> **Última actualización:** 2025-01-19
> **Versión:** 1.0.0
