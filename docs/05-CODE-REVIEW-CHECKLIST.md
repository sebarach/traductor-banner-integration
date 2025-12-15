# Code Review Checklist

## Propósito

Este checklist garantiza que todos los Pull Requests mantengan los estándares del proyecto antes de ser mergeados. Es la última línea de defensa para mantener consistencia entre múltiples desarrolladores.

---

## Checklist General

### Imports y Estructura de Archivos

- [ ] **Usa `@/` imports** en vez de rutas relativas `../../`
  ```tsx
  // ✅ Correcto
  import { Button } from '@/components/ui/button'
  import { useAuth } from '@/context/AuthContext'

  // ❌ Incorrecto
  import { Button } from '../../../components/ui/button'
  ```

- [ ] **Archivos en la carpeta correcta** según la arquitectura de 3 capas
  - `src/components/ui/` → Solo componentes shadcn auto-generados
  - `src/components/shared/` → Componentes reutilizables del proyecto
  - `src/components/layouts/` → Layouts (Navbar, Sidebar)
  - `src/pages/` → Páginas de la aplicación

- [ ] **Nomenclatura consistente**
  - Componentes: PascalCase (`UserAvatar.tsx`)
  - Hooks: camelCase con prefijo `use` (`useAcademicPeriods.ts`)
  - Utilities: camelCase (`apiClient.ts`)
  - Types: PascalCase (`AcademicPeriod.ts`)

---

## Componentes UI

### shadcn/ui Components

- [ ] **Usa componentes shadcn existentes** antes de crear custom
  ```tsx
  // ✅ Correcto
  import { Button } from '@/components/ui/button'

  // ❌ Incorrecto
  <button className="px-4 py-2 bg-blue-600...">
  ```

- [ ] **No modifica archivos en `src/components/ui/`**
  - Estos archivos son auto-generados por shadcn
  - Si necesitas variantes custom, crea wrapper en `shared/`

- [ ] **Usa el helper `cn()` para combinar clases**
  ```tsx
  // ✅ Correcto
  import { cn } from '@/lib/utils'

  <div className={cn(
    'base-classes',
    isActive && 'active-classes',
    className
  )}>

  // ❌ Incorrecto
  <div className={`base-classes ${isActive ? 'active-classes' : ''} ${className}`}>
  ```

### Shared Components

- [ ] **Props están tipadas con interface**
  ```tsx
  // ✅ Correcto
  interface UserAvatarProps {
    name: string
    email: string
    photoUrl?: string
    size?: 'sm' | 'md' | 'lg'
  }

  export function UserAvatar({ name, email, photoUrl, size = 'md' }: UserAvatarProps) {}

  // ❌ Incorrecto
  export function UserAvatar(props) {}
  ```

- [ ] **Exports son named, no default** (excepto páginas)
  ```tsx
  // ✅ Correcto (shared components)
  export function LoadingSpinner() {}

  // ✅ Correcto (páginas)
  export default function Home() {}
  ```

---

## TypeScript

### Types & Interfaces

- [ ] **No usa `any`** sin justificación clara
  ```tsx
  // ✅ Correcto
  const data = await apiClient.get<AcademicPeriod[]>('/banner/academic-period')

  // ❌ Incorrecto
  const data: any = await apiClient.get('/banner/academic-period')
  ```

- [ ] **Props opcionales tienen valores default**
  ```tsx
  // ✅ Correcto
  function LoadingSpinner({ size = 'md' }: LoadingSpinnerProps) {}

  // ❌ Incorrecto
  function LoadingSpinner({ size }: LoadingSpinnerProps) {
    const actualSize = size || 'md' // Lógica innecesaria
  }
  ```

- [ ] **Usa utility types** cuando sea apropiado
  ```tsx
  // ✅ Correcto
  type UserAvatarVariant = Pick<User, 'name' | 'email' | 'photoUrl'>
  type OptionalUser = Partial<User>

  // ❌ Incorrecto (duplicar definiciones)
  interface UserAvatarProps {
    name: string
    email: string
    photoUrl: string
  }
  ```

### Funciones & Hooks

- [ ] **useEffect tiene dependencies correctas**
  ```tsx
  // ✅ Correcto
  useEffect(() => {
    loadData(userId)
  }, [userId, loadData])

  // ❌ Incorrecto
  useEffect(() => {
    loadData(userId)
  }, []) // ⚠️ Falta userId
  ```

- [ ] **useCallback en funciones pasadas como props** a componentes memoizados
  ```tsx
  // ✅ Correcto
  const handleClick = useCallback(() => {
    doSomething(id)
  }, [id])

  return <MemoizedChild onClick={handleClick} />
  ```

---

## Estilos & Theming

### CSS Variables

- [ ] **Usa CSS variables** en vez de colores hardcoded
  ```tsx
  // ✅ Correcto
  <div className="bg-primary text-primary-foreground">
  <div className="border-border">

  // ❌ Incorrecto
  <div className="bg-blue-600 text-white">
  <div style={{ borderColor: '#e5e7eb' }}>
  ```

- [ ] **Gradients usan colores del tema**
  ```tsx
  // ✅ Correcto
  className="bg-gradient-to-r from-blue-600 to-indigo-600"

  // ❌ Incorrecto
  className="bg-gradient-to-r from-[#FF5733] to-[#C70039]"
  ```

### Responsive Design

- [ ] **Mobile-first approach**
  ```tsx
  // ✅ Correcto
  <div className="text-sm md:text-base lg:text-lg">

  // ❌ Incorrecto
  <div className="lg:text-lg md:text-base text-sm">
  ```

- [ ] **Grid/Flex responsive**
  ```tsx
  // ✅ Correcto
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3">

  // ✅ Correcto
  <div className="flex flex-col md:flex-row">
  ```

### Dark Mode

- [ ] **Funciona en light y dark mode**
  - Probar toggle de tema
  - Verificar contraste de texto
  - Verificar estados hover/focus

- [ ] **Usa variantes dark:** cuando sea necesario
  ```tsx
  // ✅ Correcto (cuando primary no es suficiente)
  <div className="bg-gray-100 dark:bg-gray-900">
  <p className="text-gray-900 dark:text-gray-100">

  // ✅ Mejor (cuando existe variable)
  <div className="bg-background text-foreground">
  ```

---

## Iconos

### lucide-react

- [ ] **Usa lucide-react** en vez de emoji
  ```tsx
  // ✅ Correcto
  import { Calendar, User, Home } from 'lucide-react'
  <Calendar className="h-5 w-5" />

  // ❌ Incorrecto
  <span>📅</span>
  ```

- [ ] **Tamaños consistentes**
  - Headers: `h-8 w-8`
  - Buttons: `h-4 w-4` o `h-5 w-5`
  - Sidebar: `h-5 w-5`
  - Stats: `h-6 w-6`

- [ ] **Color heredado del texto**
  ```tsx
  // ✅ Correcto (hereda color)
  <Button className="text-blue-600">
    <Calendar className="h-4 w-4" />
  </Button>

  // ❌ Incorrecto (color hardcoded)
  <Calendar className="h-4 w-4 text-blue-600" />
  ```

---

## Performance

### Memoization

- [ ] **React.memo** solo cuando hay problema de performance comprobado
  ```tsx
  // ✅ Correcto (componente renderiza frecuentemente)
  export const ExpensiveChild = memo(function ExpensiveChild({ data }) {
    // ... cálculos pesados ...
  })

  // ❌ Incorrecto (optimización prematura)
  export const SimpleText = memo(function SimpleText({ text }) {
    return <p>{text}</p>
  })
  ```

- [ ] **useMemo** solo para cálculos costosos
  ```tsx
  // ✅ Correcto
  const sortedData = useMemo(
    () => data.sort((a, b) => complexComparison(a, b)),
    [data]
  )

  // ❌ Incorrecto (simple concatenación)
  const fullName = useMemo(
    () => `${firstName} ${lastName}`,
    [firstName, lastName]
  )
  ```

### Loading States

- [ ] **Usa Skeleton** durante carga inicial
  ```tsx
  // ✅ Correcto
  if (loading) return <Skeleton className="h-20 w-full" />

  // ❌ Incorrecto
  if (loading) return <div>Loading...</div>
  ```

- [ ] **LoadingSpinner** para acciones del usuario
  ```tsx
  // ✅ Correcto
  {isSubmitting && <LoadingSpinner size="sm" text="Guardando..." />}
  ```

---

## Accesibilidad

### ARIA Labels

- [ ] **Botones sin texto tienen aria-label**
  ```tsx
  // ✅ Correcto
  <Button variant="ghost" size="icon" aria-label="Toggle theme">
    <Sun className="h-5 w-5" />
  </Button>

  // ❌ Incorrecto
  <Button variant="ghost" size="icon">
    <Sun className="h-5 w-5" />
  </Button>
  ```

- [ ] **Imágenes decorativas tienen alt=""**
  ```tsx
  // ✅ Correcto (decorativa)
  <img src={logo} alt="" />

  // ✅ Correcto (informativa)
  <img src={userPhoto} alt={`${userName} profile photo`} />
  ```

### Keyboard Navigation

- [ ] **Elementos interactivos accesibles por teclado**
  - Botones: `<Button>` (nativo)
  - Links: `<a>` o `<Link>`
  - NO: `<div onClick={...}>`

- [ ] **Focus visible** en todos los elementos interactivos
  ```tsx
  // ✅ Correcto (shadcn maneja esto)
  <Button>Click me</Button>

  // ❌ Incorrecto
  <button className="focus:outline-none">Click me</button>
  ```

---

## Error Handling

### User Feedback

- [ ] **Errores muestran mensaje user-friendly**
  ```tsx
  // ✅ Correcto
  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          No se pudo cargar los datos. Por favor intenta nuevamente.
        </AlertDescription>
      </Alert>
    )
  }

  // ❌ Incorrecto
  if (error) {
    return <div>Error: {error.message}</div>
  }
  ```

- [ ] **Loading states para operaciones async**
  ```tsx
  // ✅ Correcto
  const [loading, setLoading] = useState(false)

  const handleSubmit = async () => {
    setLoading(true)
    try {
      await apiClient.post('/data', payload)
    } finally {
      setLoading(false)
    }
  }
  ```

### Console Logs

- [ ] **No hay `console.log`** en código de producción
  ```tsx
  // ❌ Incorrecto
  console.log('User data:', user)

  // ✅ Correcto (development only)
  if (import.meta.env.DEV) {
    console.log('Debug:', data)
  }
  ```

- [ ] **Errores loggeados apropiadamente**
  ```tsx
  // ✅ Correcto
  console.error('Failed to load data:', error)

  // ❌ Incorrecto
  console.log('Error:', error)
  ```

---

## Testing

### Manual Testing

- [ ] **Testeado en light mode** ☀️
- [ ] **Testeado en dark mode** 🌙
- [ ] **Testeado en mobile** (DevTools responsive mode)
- [ ] **Testeado en desktop** (1920px)
- [ ] **Navegación por teclado funciona** (Tab, Enter, Escape)
- [ ] **Screen reader compatible** (opcional pero recomendado)

### Edge Cases

- [ ] **Maneja datos vacíos**
  ```tsx
  // ✅ Correcto
  if (data.length === 0) {
    return <EmptyState title="No hay datos" />
  }
  ```

- [ ] **Maneja loading states**
- [ ] **Maneja error states**
- [ ] **Maneja valores null/undefined**

---

## Git & Commits

### Commits

- [ ] **Commit messages descriptivos**
  ```bash
  # ✅ Correcto
  git commit -m "feat: Add DataTable shared component with search and pagination"
  git commit -m "fix: Resolve dark mode contrast in UserAvatar"

  # ❌ Incorrecto
  git commit -m "updates"
  git commit -m "fix bug"
  ```

- [ ] **Conventional Commits** (opcional pero recomendado)
  - `feat:` - Nueva funcionalidad
  - `fix:` - Bug fix
  - `refactor:` - Refactorización sin cambio de funcionalidad
  - `docs:` - Documentación
  - `style:` - Cambios de estilos/formato
  - `test:` - Tests

### Pull Requests

- [ ] **Título descriptivo** del PR
- [ ] **Descripción** incluye:
  - ¿Qué hace este PR?
  - ¿Por qué es necesario?
  - Screenshots (si aplica)
  - Instrucciones de testing

- [ ] **No rompe** funcionalidad existente
- [ ] **Build exitoso** (npm run build)
- [ ] **No hay errores de TypeScript**

---

## Azure AD & MSAL

### Autenticación

- [ ] **No expone tokens** en console.log
  ```tsx
  // ❌ Incorrecto
  console.log('Access token:', token)

  // ✅ Correcto
  console.log('Token acquired successfully')
  ```

- [ ] **Usa `createApiClient`** para API calls
  ```tsx
  // ✅ Correcto
  const apiClient = createApiClient(instance)
  const data = await apiClient.get('/endpoint')

  // ❌ Incorrecto
  const token = await getToken()
  const response = await fetch('/api/endpoint', {
    headers: { Authorization: `Bearer ${token}` }
  })
  ```

- [ ] **Maneja refresh de tokens** automáticamente (apiClient lo hace)

---

## Azure Functions (Backend)

### Carpeta `api/`

- [ ] **NO modifica** archivos en `api/` sin consultar
  - Esta carpeta es el backend de Azure Functions
  - Cambios pueden romper producción

- [ ] **Si necesita nuevo endpoint**, documentar:
  - HTTP method
  - URL path
  - Request body
  - Response body
  - Error cases

---

## Anti-Patterns a Evitar

### ❌ Prop Drilling

```tsx
// ❌ Mal
<GrandParent user={user}>
  <Parent user={user}>
    <Child user={user} />
  </Parent>
</GrandParent>

// ✅ Mejor (usar Context)
<UserProvider value={user}>
  <GrandParent>
    <Parent>
      <Child />
    </Parent>
  </GrandParent>
</UserProvider>
```

### ❌ Huge Components

```tsx
// ❌ Mal (componente de 500+ líneas)
function Dashboard() {
  // ... 500 líneas de JSX y lógica ...
}

// ✅ Mejor
function Dashboard() {
  return (
    <>
      <DashboardHeader />
      <DashboardStats />
      <DashboardCharts />
    </>
  )
}
```

### ❌ Inline Functions en Render

```tsx
// ❌ Mal (crea nueva función cada render)
<Button onClick={() => handleClick(id)}>

// ✅ Mejor
const handleClick = useCallback(() => {
  doSomething(id)
}, [id])

<Button onClick={handleClick}>
```

### ❌ Mutación Directa de Estado

```tsx
// ❌ Mal
const [items, setItems] = useState([1, 2, 3])
items.push(4)
setItems(items)

// ✅ Bien
setItems([...items, 4])
```

---

## Checklist Rápido (TL;DR)

**Antes de abrir PR:**

- [ ] ✅ Build exitoso (`npm run build`)
- [ ] ✅ No errores TypeScript
- [ ] ✅ Usa `@/` imports
- [ ] ✅ Usa componentes shadcn
- [ ] ✅ Usa CSS variables para colores
- [ ] ✅ Usa lucide-react icons
- [ ] ✅ Props tipadas
- [ ] ✅ Dark mode funciona
- [ ] ✅ Responsive (mobile + desktop)
- [ ] ✅ Loading states
- [ ] ✅ Error states
- [ ] ✅ No console.log
- [ ] ✅ Accesible por teclado
- [ ] ✅ Commit messages descriptivos

---

## Recursos

- [Documentación del Proyecto](./01-ESTRUCTURA-CARPETAS.md)
- [Guía de Estilos](./02-ESTILOS-THEMING.md)
- [TypeScript Buenas Prácticas](./03-TYPESCRIPT-BUENAS-PRACTICAS.md)
- [Patrones de Componentes](./04-PATRONES-COMPONENTES.md)
- [shadcn/ui Docs](https://ui.shadcn.com/)
- [Tailwind CSS Docs](https://tailwindcss.com/)
