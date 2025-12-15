# React SSO Dashboard - Documentación Completa

Plantilla corporativa moderna para dashboard React con autenticación Azure AD (SSO), construida con shadcn/ui, TanStack Table, y Azure Functions backend.

---

## Inicio Rápido

### Pre-requisitos

- Node.js 18+ y npm 9+
- Git
- Visual Studio Code (recomendado)
- Cuenta de Azure con Azure AD configurado

### Instalación

```bash
# 1. Clonar repositorio
git clone <repo-url>
cd react-poc-sso

# 2. Instalar dependencias del frontend
npm install

# 3. Instalar dependencias del backend
cd api
npm install
cd ..

# 4. Configurar variables de entorno
cp .env.example .env.local
# Editar .env.local con tus valores de Azure AD

# 5. Levantar desarrollo
npm run dev          # Frontend en http://localhost:5173
cd api && npm start  # Backend en http://localhost:7071
```

### Configuración de Azure AD

1. **Azure Portal** → **Azure Active Directory** → **App registrations** → **New registration**
2. Nombre: "React SSO Dashboard"
3. Redirect URI: `http://localhost:5173`
4. **Expose an API** → Add scope: `access_as_user`
5. Copiar `Application (client) ID` y `Directory (tenant) ID` a `.env.local`

---

## Estructura del Proyecto

```
react-poc-sso/
├── api/                          # ⚠️ Azure Functions (Backend)
│   ├── AcademicPeriod/          # Endpoint: GET /api/banner/academic-period
│   ├── host.json
│   └── package.json
│
├── docs/                         # 📚 Documentación
│   ├── README.md                # Este archivo
│   ├── 01-ESTRUCTURA-CARPETAS.md
│   ├── 02-ESTILOS-THEMING.md
│   ├── 03-TYPESCRIPT-BUENAS-PRACTICAS.md
│   ├── 04-PATRONES-COMPONENTES.md
│   ├── 05-CODE-REVIEW-CHECKLIST.md
│   ├── 06-AZURE-AD-AUTENTICACION.md
│   ├── 07-API-INTEGRACION.md
│   └── 08-DESPLIEGUE.md
│
├── src/
│   ├── components/
│   │   ├── ui/                  # Layer 1: shadcn components (auto-generados)
│   │   │   ├── button.tsx
│   │   │   ├── card.tsx
│   │   │   ├── table.tsx
│   │   │   └── ...
│   │   │
│   │   ├── shared/              # Layer 2: Componentes reutilizables
│   │   │   ├── LoadingSpinner.tsx
│   │   │   ├── EmptyState.tsx
│   │   │   ├── UserAvatar.tsx
│   │   │   ├── PageHeader.tsx
│   │   │   ├── StatCard.tsx
│   │   │   └── DataTable.tsx   # TanStack Table + shadcn wrapper
│   │   │
│   │   ├── layouts/             # Layouts
│   │   │   ├── DashboardLayout.tsx
│   │   │   ├── Navbar.tsx
│   │   │   ├── Sidebar.tsx
│   │   │   └── UserDropdown.tsx
│   │   │
│   │   └── guards/              # Route guards
│   │       └── ProtectedRoute.tsx
│   │
│   ├── pages/                   # Layer 3: Páginas
│   │   ├── Login.tsx
│   │   ├── Home.tsx
│   │   ├── AcademicPeriods.tsx
│   │   └── BannerIntegrations.tsx
│   │
│   ├── context/                 # React Contexts
│   │   ├── AuthContext.tsx      # Usuario autenticado
│   │   └── ThemeContext.tsx     # Light/Dark mode
│   │
│   ├── config/                  # Configuraciones
│   │   └── authConfig.ts        # MSAL config
│   │
│   ├── utils/                   # Utilities
│   │   └── apiClient.ts         # HTTP client con tokens
│   │
│   ├── types/                   # TypeScript types
│   │   └── api.ts               # API response types
│   │
│   ├── lib/                     # Librerías
│   │   └── utils.ts             # cn() helper
│   │
│   ├── App.tsx                  # React app root
│   ├── main.tsx                 # Entry point
│   └── index.css                # Global styles + CSS variables
│
├── .env.local                   # Variables de entorno (NO committear)
├── .gitignore
├── package.json
├── tsconfig.json
├── vite.config.ts
└── tailwind.config.js
```

---

## Stack Tecnológico

### Frontend

| Tecnología | Versión | Propósito |
|---|---|---|
| React | 18.3.1 | UI framework |
| TypeScript | 5.6.2 | Type safety |
| Vite | 5.4.2 | Build tool |
| Tailwind CSS | 3.4.0 | Utility-first CSS |
| shadcn/ui | Latest | Component library |
| TanStack Table | 8.20.5 | Data tables |
| React Router | 6.26.1 | Routing |
| MSAL React | 2.0.22 | Azure AD auth |
| lucide-react | Latest | Icons |

### Backend

| Tecnología | Versión | Propósito |
|---|---|---|
| Azure Functions | v4 | Serverless API |
| Node.js | 18+ | Runtime |
| TypeScript | 5+ | Type safety |

### DevOps

| Tecnología | Propósito |
|---|---|
| GitHub Actions | CI/CD |
| Azure Static Web Apps | Hosting |
| Azure Application Insights | Monitoring |

---

## Características Principales

### ✅ Autenticación Azure AD (SSO)

- Login con Microsoft Account
- Token acquisition automático (silencioso)
- Refresh tokens transparente
- Logout completo
- Protected routes

### ✅ UI Corporativa Moderna

- Tema azul/indigo corporativo
- Light/Dark mode
- Componentes shadcn/ui
- Responsive design (mobile + desktop)
- Animaciones suaves
- Accessibility (ARIA, keyboard nav)

### ✅ Data Tables Avanzadas

- TanStack Table + shadcn wrapper
- Búsqueda global en tiempo real
- Ordenamiento multi-columna
- Paginación
- Loading skeletons
- Estados vacíos

### ✅ Arquitectura Escalable

- 3 capas (ui/shared/pages)
- TypeScript estricto
- Custom hooks reutilizables
- Error boundaries
- Code splitting (lazy loading)

### ✅ Developer Experience

- Hot reload (Vite)
- Path aliases (`@/`)
- Type-safe API calls
- Documentación completa
- Code review checklist
- Git workflow estandarizado

---

## Comandos Útiles

### Desarrollo

```bash
# Levantar frontend
npm run dev

# Levantar backend
cd api && npm start

# Type checking
npm run type-check

# Build
npm run build

# Preview build
npm run preview
```

### shadcn/ui

```bash
# Agregar nuevo componente
npx shadcn@latest add <component-name>

# Ejemplos
npx shadcn@latest add button
npx shadcn@latest add dialog
npx shadcn@latest add select
```

### Deployment

```bash
# Deploy manual a Azure (si no usas GitHub Actions)
az staticwebapp deploy \
  --name react-sso-app \
  --resource-group react-sso-rg \
  --app-location "/" \
  --api-location "api" \
  --output-location "dist"
```

---

## Variables de Entorno

### Frontend (`.env.local`)

```bash
# Azure AD
VITE_AZURE_CLIENT_ID=12345678-1234-1234-1234-123456789abc
VITE_AZURE_TENANT_ID=87654321-4321-4321-4321-cba987654321

# Backend API
VITE_API_BASE_URL=http://localhost:7071/api  # Development
# VITE_API_BASE_URL=/api  # Production (same origin)
```

### Backend (`api/local.settings.json`)

```json
{
  "IsEncrypted": false,
  "Values": {
    "AzureWebJobsStorage": "",
    "FUNCTIONS_WORKER_RUNTIME": "node",
    "DATABASE_CONNECTION_STRING": "your-connection-string"
  }
}
```

**⚠️ Importante:** Nunca committear archivos con secrets (`.env.local`, `local.settings.json`)

---

## Documentación Detallada

### Para Desarrolladores

1. **[Estructura de Carpetas](./01-ESTRUCTURA-CARPETAS.md)** - Arquitectura de 3 capas, organización de archivos, naming conventions
2. **[Estilos & Theming](./02-ESTILOS-THEMING.md)** - CSS variables, colores corporativos, dark mode, responsive design
3. **[TypeScript Buenas Prácticas](./03-TYPESCRIPT-BUENAS-PRACTICAS.md)** - Props typing, generics, utility types
4. **[Patrones de Componentes](./04-PATRONES-COMPONENTES.md)** - Container/Presentational, Compound Components, Custom Hooks

### Para Code Review

5. **[Code Review Checklist](./05-CODE-REVIEW-CHECKLIST.md)** - Checklist completo para PR reviews, estándares de código

### Para Integración

6. **[Azure AD Autenticación](./06-AZURE-AD-AUTENTICACION.md)** - MSAL setup, tokens, scopes, error handling
7. **[API Integración](./07-API-INTEGRACION.md)** - API client, tipos, error handling, paginación

### Para DevOps

8. **[Despliegue en Azure](./08-DESPLIEGUE.md)** - CI/CD, ambientes, variables de entorno, rollback, monitoreo

---

## Flujos Comunes

### Agregar Nueva Página

1. **Crear página en `src/pages/`**:
   ```tsx
   // src/pages/Students.tsx
   import { PageHeader } from '@/components/shared/PageHeader'
   import { DataTable } from '@/components/shared/DataTable'

   export default function Students() {
     // ... lógica de carga de datos
     return (
       <div className="space-y-6">
         <PageHeader title="Estudiantes" variant="gradient" />
         <DataTable columns={columns} data={students} />
       </div>
     )
   }
   ```

2. **Agregar ruta en `App.tsx`**:
   ```tsx
   <Route
     path="/students"
     element={
       <ProtectedRoute>
         <DashboardLayout>
           <Students />
         </DashboardLayout>
       </ProtectedRoute>
     }
   />
   ```

3. **Agregar link en Sidebar**:
   ```tsx
   // src/components/layouts/Sidebar.tsx
   const menuItems = [
     // ... items existentes
     {
       path: '/students',
       label: 'Estudiantes',
       icon: <Users className="h-5 w-5" />,
     },
   ]
   ```

---

### Agregar Nuevo Componente Shared

1. **Crear componente en `src/components/shared/`**:
   ```tsx
   // src/components/shared/SearchInput.tsx
   import { Input } from '@/components/ui/input'
   import { Search } from 'lucide-react'

   interface SearchInputProps {
     value: string
     onChange: (value: string) => void
     placeholder?: string
   }

   export function SearchInput({ value, onChange, placeholder }: SearchInputProps) {
     return (
       <div className="relative">
         <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
         <Input
           value={value}
           onChange={(e) => onChange(e.target.value)}
           placeholder={placeholder}
           className="pl-10"
         />
       </div>
     )
   }
   ```

2. **Usar en páginas**:
   ```tsx
   import { SearchInput } from '@/components/shared/SearchInput'

   function MyPage() {
     const [search, setSearch] = useState('')
     return <SearchInput value={search} onChange={setSearch} />
   }
   ```

---

### Agregar Nuevo Endpoint Backend

1. **Crear función en `api/`**:
   ```bash
   cd api
   mkdir Students
   touch Students/index.ts Students/function.json
   ```

2. **Implementar endpoint**:
   ```typescript
   // api/Students/index.ts
   import { AzureFunction, Context, HttpRequest } from '@azure/functions'

   const httpTrigger: AzureFunction = async (context, req) => {
     context.log('Students endpoint called')

     // Validar token
     const token = req.headers.authorization?.split(' ')[1]
     if (!token) {
       context.res = { status: 401, body: { message: 'Unauthorized' } }
       return
     }

     // Lógica de negocio
     const students = await getStudentsFromDatabase()

     context.res = {
       status: 200,
       body: students,
     }
   }

   export default httpTrigger
   ```

3. **Configurar route**:
   ```json
   // api/Students/function.json
   {
     "bindings": [
       {
         "authLevel": "function",
         "type": "httpTrigger",
         "direction": "in",
         "name": "req",
         "methods": ["get"],
         "route": "banner/students"
       },
       {
         "type": "http",
         "direction": "out",
         "name": "res"
       }
     ]
   }
   ```

4. **Agregar tipo en frontend**:
   ```typescript
   // src/types/api.ts
   export interface Student {
     id: string
     firstName: string
     lastName: string
     email: string
   }
   ```

5. **Consumir en página**:
   ```typescript
   const apiClient = createApiClient(instance)
   const students = await apiClient.get<Student[]>('/banner/students')
   ```

---

## Testing

### Manual Testing Checklist

- [ ] Login funciona (Microsoft Account)
- [ ] Logout funciona
- [ ] Protected routes redirigen a login si no autenticado
- [ ] API calls exitosos (con Bearer token)
- [ ] Dark mode toggle funciona
- [ ] Responsive design (mobile: 375px, desktop: 1920px)
- [ ] Navegación por teclado (Tab, Enter, Escape)
- [ ] Estados de loading (spinners, skeletons)
- [ ] Estados de error (alerts con retry button)
- [ ] Estados vacíos (empty states)

### Browsers Soportados

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

---

## Troubleshooting

### Error: "AADSTS50011: No reply address is registered"

**Solución:** Agregar redirect URI en Azure Portal → App Registration → Authentication

---

### Error: "404 Not Found" en rutas después de deploy

**Solución:** Agregar `staticwebapp.config.json` con `navigationFallback`

---

### Error: Variables de entorno undefined

**Solución:** Verificar que tengan prefijo `VITE_` y estén en `.env.local`

---

### Error: "CORS policy" en API calls

**Solución:** Configurar CORS en `api/host.json` o Azure Portal

---

## Contribuir

### Git Workflow

```bash
# 1. Crear feature branch
git checkout -b feature/descripcion-corta

# 2. Hacer cambios
git add .
git commit -m "feat: Add students table with search"

# 3. Push
git push origin feature/descripcion-corta

# 4. Crear Pull Request en GitHub
# → Revisar checklist de Code Review
# → Esperar approval
# → Merge to main
```

### Commit Message Convention

```bash
feat: Add new feature
fix: Fix bug
refactor: Refactor code (no functional change)
docs: Update documentation
style: Format code
test: Add tests
chore: Update dependencies
```

---

## Roadmap

### Próximas Características

- [ ] Integración de Estudiantes (Banner)
- [ ] Integración de Cursos (Banner)
- [ ] Sistema de notificaciones (toast)
- [ ] Exportar a Excel/PDF
- [ ] Filtros avanzados en tablas
- [ ] Dashboards con gráficos (charts)
- [ ] Modo offline (PWA)
- [ ] i18n (multi-idioma)

---

## Soporte

### Contacto

- **Equipo de Desarrollo**: dev-team@university.edu
- **Issues**: [GitHub Issues](https://github.com/your-org/react-sso/issues)
- **Documentación**: [docs/](./docs/)

### Recursos Externos

- [shadcn/ui Docs](https://ui.shadcn.com/)
- [TanStack Table Docs](https://tanstack.com/table/latest)
- [MSAL React Docs](https://github.com/AzureAD/microsoft-authentication-library-for-js/tree/dev/lib/msal-react)
- [Tailwind CSS Docs](https://tailwindcss.com/)
- [Azure Static Web Apps Docs](https://docs.microsoft.com/azure/static-web-apps/)

---

## Licencia

Este proyecto es de uso interno de [Tu Universidad]. Todos los derechos reservados.

---

## Changelog

### v1.0.0 (2024-12-13)

**Inicial Release:**

- ✅ Autenticación Azure AD (SSO)
- ✅ Dashboard corporativo con shadcn/ui
- ✅ Tabla de Períodos Académicos (TanStack)
- ✅ Light/Dark mode
- ✅ Responsive design
- ✅ Azure Functions backend
- ✅ Documentación completa (8 guías)
- ✅ CI/CD con GitHub Actions
- ✅ Deployment en Azure Static Web Apps

---

**Última actualización:** 2024-12-13
**Versión:** 1.0.0
