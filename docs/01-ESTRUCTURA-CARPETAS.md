# Estructura de Carpetas

## Descripción General

Este proyecto sigue una arquitectura de **3 capas** que garantiza la separación de responsabilidades y facilita la escalabilidad del código.

## Árbol de Carpetas

```
react-poc-sso/
├── src/
│   ├── components/
│   │   ├── ui/                    # Layer 1: Componentes shadcn (auto-generados)
│   │   ├── shared/                # Layer 2: Componentes reutilizables del proyecto
│   │   ├── layouts/               # Componentes de estructura (Navbar, Sidebar)
│   │   └── guards/                # Componentes de protección de rutas
│   ├── pages/                     # Layer 3: Páginas de la aplicación
│   ├── context/                   # Contextos de React (Auth, Theme)
│   ├── config/                    # Configuraciones (MSAL, etc.)
│   ├── utils/                     # Utilidades y helpers
│   ├── hooks/                     # Custom hooks
│   ├── types/                     # Definiciones de TypeScript
│   ├── lib/                       # Librerías de terceros configuradas
│   └── index.css                  # Estilos globales + shadcn variables
├── api/                           # Azure Functions (backend)
│   ├── GetAcademicPeriod/
│   └── [otras funciones]/
├── docs/                          # Documentación del proyecto
├── public/                        # Assets estáticos
└── [archivos de configuración]
```

## Layer 1: Componentes UI (shadcn)

**Ruta:** `src/components/ui/`

### Propósito
Componentes primitivos auto-generados por shadcn/ui. Estos componentes NO deben modificarse manualmente.

### Características
- ✅ Auto-generados con `npx shadcn@latest add [component]`
- ✅ Basados en Radix UI
- ✅ Estilizados con Tailwind CSS
- ✅ Totalmente accesibles (ARIA)
- ❌ NO editar manualmente

### Componentes Actuales
```
ui/
├── alert.tsx
├── avatar.tsx
├── badge.tsx
├── button.tsx
├── card.tsx
├── dialog.tsx
├── dropdown-menu.tsx
├── input.tsx
├── label.tsx
├── scroll-area.tsx
├── select.tsx
├── separator.tsx
├── skeleton.tsx
├── table.tsx
├── tabs.tsx
└── toast.tsx
```

### Razón de Uso
- **Consistencia:** Todos los componentes siguen el mismo sistema de diseño
- **Accesibilidad:** Cumple con estándares WCAG
- **Mantenibilidad:** Actualizaciones centralizadas de shadcn
- **Personalización:** Se personalizan mediante CSS variables, no editando el código

### Ejemplo de Uso
```tsx
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'

function MyComponent() {
  return (
    <Card>
      <Button>Click me</Button>
    </Card>
  )
}
```

---

## Layer 2: Componentes Compartidos

**Ruta:** `src/components/shared/`

### Propósito
Componentes reutilizables específicos del proyecto que combinan componentes UI y lógica de negocio.

### Características
- ✅ Reutilizables en múltiples páginas
- ✅ Combinan componentes UI de Layer 1
- ✅ Contienen lógica específica del proyecto
- ✅ Totalmente editables y customizables

### Componentes Actuales

#### 1. LoadingSpinner
**Archivo:** `LoadingSpinner.tsx`

**Propósito:** Spinner de carga consistente en toda la aplicación

**Props:**
- `size?: 'sm' | 'md' | 'lg' | 'xl'` - Tamaño del spinner
- `text?: string` - Texto opcional debajo del spinner
- `className?: string` - Clases adicionales

**Razón de Uso:**
- Reemplaza múltiples implementaciones de spinners manuales
- Mantiene consistencia visual
- Usa iconos lucide-react profesionales

**Ejemplo:**
```tsx
<LoadingSpinner size="xl" text="Cargando períodos académicos..." />
```

---

#### 2. EmptyState
**Archivo:** `EmptyState.tsx`

**Propósito:** Estado vacío estandarizado para secciones sin contenido

**Props:**
- `icon?: ReactNode` - Icono a mostrar
- `title: string` - Título del estado vacío
- `description?: string` - Descripción opcional
- `action?: { label: string; onClick: () => void }` - Acción opcional

**Razón de Uso:**
- Mejora UX en secciones sin datos
- Consistencia en mensajes de "próximamente"
- Evita pantallas en blanco

**Ejemplo:**
```tsx
<EmptyState
  icon={<GraduationCap className="h-16 w-16" />}
  title="Sin estudiantes"
  description="No hay estudiantes registrados en este período"
  action={{ label: "Agregar estudiante", onClick: handleAdd }}
/>
```

---

#### 3. UserAvatar
**Archivo:** `UserAvatar.tsx`

**Propósito:** Avatar de usuario consistente con fallback de iniciales

**Props:**
- `name: string` - Nombre del usuario
- `email?: string` - Email opcional
- `photoUrl?: string` - URL de la foto
- `size?: 'sm' | 'md' | 'lg'` - Tamaño del avatar
- `showInfo?: boolean` - Mostrar nombre y email al lado
- `className?: string` - Clases adicionales

**Razón de Uso:**
- Consistencia en display de usuarios
- Fallback automático a iniciales
- Integración con Microsoft Graph

**Ejemplo:**
```tsx
<UserAvatar
  name={user.name}
  email={user.email}
  photoUrl={user.photoUrl}
  size="lg"
  showInfo
/>
```

---

#### 4. PageHeader
**Archivo:** `PageHeader.tsx`

**Propósito:** Encabezado estandarizado para páginas

**Props:**
- `title: string` - Título de la página
- `description?: string` - Descripción
- `icon?: ReactNode` - Icono principal
- `actions?: ReactNode` - Botones de acción
- `stats?: StatItem[]` - Estadísticas a mostrar
- `variant?: 'default' | 'gradient'` - Estilo visual
- `className?: string` - Clases adicionales

**Razón de Uso:**
- Headers consistentes en todas las páginas
- Soporte para estadísticas inline
- Variante gradient para páginas principales

**Ejemplo:**
```tsx
<PageHeader
  title="Períodos Académicos"
  description="Sistema de Gestión Académica"
  icon={<Calendar className="h-8 w-8" />}
  variant="gradient"
  stats={[
    { label: 'Total', value: 42, icon: <Calendar /> }
  ]}
/>
```

---

#### 5. StatCard
**Archivo:** `StatCard.tsx`

**Propósito:** Tarjeta de estadística reutilizable

**Props:**
- `title: string` - Título de la métrica
- `value: string | number` - Valor a mostrar
- `description?: string` - Descripción adicional
- `icon?: ReactNode` - Icono
- `trend?: { value: number; label?: string }` - Tendencia con porcentaje
- `variant?: 'default' | 'primary' | 'success' | 'warning' | 'destructive'`
- `className?: string` - Clases adicionales

**Razón de Uso:**
- Métricas visuales consistentes
- Soporte para tendencias
- Variantes de color para estados

**Ejemplo:**
```tsx
<StatCard
  title="Usuarios Activos"
  value="1,234"
  icon={<Users className="h-5 w-5" />}
  variant="success"
  trend={{ value: 12, label: "vs mes anterior" }}
/>
```

---

#### 6. DataTable
**Archivo:** `DataTable.tsx`

**Propósito:** Tabla de datos completa con TanStack Table + shadcn

**Props:**
- `columns: ColumnDef<TData, TValue>[]` - Definición de columnas
- `data: TData[]` - Datos a mostrar
- `searchable?: boolean` - Habilitar búsqueda global
- `searchPlaceholder?: string` - Placeholder del buscador
- `pageSize?: number` - Tamaño de página inicial
- `pageSizeOptions?: number[]` - Opciones de tamaño de página
- `isLoading?: boolean` - Estado de carga
- `emptyMessage?: string` - Mensaje cuando no hay datos
- `className?: string` - Clases adicionales
- `headerActions?: ReactNode` - Acciones en el header (ej: botón refresh)

**Razón de Uso:**
- Wrapper reutilizable de TanStack Table
- Búsqueda, ordenamiento y paginación incluidos
- Estilos shadcn consistentes
- Skeleton loading automático
- Evita duplicar lógica de tablas

**Ejemplo:**
```tsx
<DataTable
  columns={columns}
  data={periods}
  searchPlaceholder="Buscar períodos..."
  pageSize={10}
  headerActions={
    <Button onClick={handleRefresh}>
      <RefreshCw className="h-4 w-4 mr-2" />
      Actualizar
    </Button>
  }
/>
```

---

## Layer 3: Componentes Layouts

**Ruta:** `src/components/layouts/`

### Propósito
Componentes de estructura que forman el esqueleto de la aplicación.

### Componentes Actuales

#### 1. Navbar
**Archivo:** `Navbar.tsx`

**Propósito:** Barra de navegación superior

**Características:**
- Logo institucional
- Toggle de sidebar
- Theme switcher (light/dark)
- Dropdown de usuario

---

#### 2. Sidebar
**Archivo:** `Sidebar.tsx`

**Propósito:** Barra lateral de navegación

**Características:**
- Navegación principal
- Indicador de página activa
- Colapsa/expande
- Footer con versión

---

#### 3. UserDropdown
**Archivo:** `UserDropdown.tsx`

**Propósito:** Menú desplegable del usuario

**Características:**
- Info del usuario
- Avatar con foto
- Opciones de perfil
- Logout

---

## Pages (Páginas)

**Ruta:** `src/pages/`

### Propósito
Componentes de página que combinan Layer 1, 2 y 3 para crear vistas completas.

### Páginas Actuales
- `Login.tsx` - Página de login con Azure AD
- `Home.tsx` - Dashboard principal
- `BannerIntegrations.tsx` - Hub de integraciones
- `AcademicPeriods.tsx` - Tabla de períodos académicos

### Regla de Oro
Las páginas deben ser **compositoras**, no **constructoras**. Deben ensamblar componentes existentes, no crear componentes nuevos.

**❌ Incorrecto:**
```tsx
function MyPage() {
  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      {/* Mucho JSX y lógica aquí */}
    </div>
  )
}
```

**✅ Correcto:**
```tsx
function MyPage() {
  return (
    <>
      <PageHeader title="Mi Página" />
      <StatCard title="Métrica" value={123} />
      <DataTable columns={columns} data={data} />
    </>
  )
}
```

---

## Context (Contextos)

**Ruta:** `src/context/`

### Propósito
Contextos de React para estado global.

### Contextos Actuales
- `AuthContext.tsx` - Autenticación y usuario
- `ThemeContext.tsx` - Tema (light/dark)

---

## Utils y Helpers

**Ruta:** `src/utils/`

### Propósito
Funciones utilitarias y helpers reutilizables.

### Archivos Actuales
- `apiClient.ts` - Cliente HTTP con autenticación Azure

---

## API (Backend)

**Ruta:** `api/`

### Propósito
Azure Functions que forman el backend.

### ⚠️ IMPORTANTE
Esta carpeta NO debe modificarse sin coordinación con el equipo de backend.

---

## Mejores Prácticas

### 1. Imports
Siempre usar path aliases `@/`:

```tsx
// ✅ Correcto
import { Button } from '@/components/ui/button'
import { DataTable } from '@/components/shared/DataTable'

// ❌ Incorrecto
import { Button } from '../../components/ui/button'
```

### 2. Ubicación de Nuevos Componentes

**¿Dónde crear un nuevo componente?**

| Si el componente... | Ubicación | Razón |
|---|---|---|
| Es auto-generado por shadcn | `components/ui/` | Layer 1 |
| Se reutiliza en 2+ páginas | `components/shared/` | Layer 2 |
| Es específico de 1 página | Dentro del archivo de la página | Colocación |
| Es estructura (nav, header, footer) | `components/layouts/` | Layout |

### 3. Naming Conventions

- **Archivos:** PascalCase (`UserAvatar.tsx`)
- **Componentes:** PascalCase (`function UserAvatar()`)
- **Props interfaces:** ComponentName + Props (`UserAvatarProps`)
- **CSS classes:** Usar `cn()` helper de shadcn

### 4. Evitar Duplicación

Antes de crear un componente nuevo, pregúntate:
1. ¿Ya existe un componente similar en `shared/`?
2. ¿Puedo usar un componente de `ui/` directamente?
3. ¿Puedo extender un componente existente con props?

---

## Resumen Visual

```
┌─────────────────────────────────────────┐
│           PÁGINAS (Layer 3)             │
│  Login, Home, AcademicPeriods, etc.     │
└──────────────┬──────────────────────────┘
               │ Componen usando...
               ↓
┌─────────────────────────────────────────┐
│      COMPONENTES SHARED (Layer 2)       │
│  DataTable, PageHeader, StatCard, etc.  │
└──────────────┬──────────────────────────┘
               │ Utilizan...
               ↓
┌─────────────────────────────────────────┐
│       COMPONENTES UI (Layer 1)          │
│  Button, Card, Badge, Table, etc.       │
│         (shadcn/ui + Radix UI)          │
└─────────────────────────────────────────┘
```

---

## Checklist para Nuevos Desarrolladores

- [ ] Entiendo la arquitectura de 3 capas
- [ ] Sé cuándo usar `components/ui/` vs `components/shared/`
- [ ] Uso path aliases `@/` en todos los imports
- [ ] Leo los componentes existentes antes de crear nuevos
- [ ] Mis páginas son compositoras, no constructoras
- [ ] No modifico archivos en `api/` sin coordinación
