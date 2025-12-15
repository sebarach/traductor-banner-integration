# Patrones de Componentes

## Principios Fundamentales

### 1. Single Responsibility
Cada componente debe tener una sola responsabilidad.

**❌ Mal:**
```tsx
function UserDashboard() {
  // Maneja auth, fetch data, UI, routing...
  return (
    <div>
      {/* 500 líneas de JSX */}
    </div>
  )
}
```

**✅ Bien:**
```tsx
function UserDashboard() {
  return (
    <>
      <PageHeader title="Dashboard" />
      <UserStats />
      <UserActivity />
      <UserSettings />
    </>
  )
}
```

### 2. Composition over Inheritance
Componer componentes en lugar de heredar.

**✅ Composición:**
```tsx
function Card({ children, header, footer }) {
  return (
    <div className="card">
      {header && <div className="card-header">{header}</div>}
      <div className="card-body">{children}</div>
      {footer && <div className="card-footer">{footer}</div>}
    </div>
  )
}

// Uso
<Card
  header={<h2>Title</h2>}
  footer={<Button>Action</Button>}
>
  Content here
</Card>
```

---

## Patrón: Container/Presentational

### Container (Smart Component)

Maneja lógica y estado:

```tsx
// AcademicPeriods.tsx (Container)
export default function AcademicPeriods() {
  const [periods, setPeriods] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    // Lógica de carga
  }

  return (
    <DataTable
      data={periods}
      isLoading={loading}
      columns={columns}
    />
  )
}
```

### Presentational (Dumb Component)

Solo renderiza UI:

```tsx
// DataTable.tsx (Presentational)
export function DataTable({ data, isLoading, columns }) {
  if (isLoading) return <LoadingSpinner />

  return (
    <Table>
      {/* Render data */}
    </Table>
  )
}
```

**Ventajas:**
- Separación clara de responsabilidades
- Components presentacionales reutilizables
- Fácil de testear

---

## Patrón: Compound Components

Componentes que trabajan juntos:

```tsx
function Card({ children }) {
  return <div className="card">{children}</div>
}

Card.Header = function CardHeader({ children }) {
  return <div className="card-header">{children}</div>
}

Card.Body = function CardBody({ children }) {
  return <div className="card-body">{children}</div>
}

Card.Footer = function CardFooter({ children }) {
  return <div className="card-footer">{children}</div>
}

// Uso
<Card>
  <Card.Header>
    <h2>Title</h2>
  </Card.Header>
  <Card.Body>
    Content
  </Card.Body>
  <Card.Footer>
    <Button>Action</Button>
  </Card.Footer>
</Card>
```

**Ejemplo Real: shadcn Card**

```tsx
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'

<Card>
  <CardHeader>
    <CardTitle>Title</CardTitle>
  </CardHeader>
  <CardContent>
    Content
  </CardContent>
</Card>
```

---

## Patrón: Render Props

Componente que acepta una función como children:

```tsx
interface DataFetcherProps<T> {
  url: string
  children: (data: T, loading: boolean, error: Error | null) => ReactNode
}

function DataFetcher<T>({ url, children }: DataFetcherProps<T>) {
  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    fetch(url)
      .then(res => res.json())
      .then(setData)
      .catch(setError)
      .finally(() => setLoading(false))
  }, [url])

  return children(data, loading, error)
}

// Uso
<DataFetcher url="/api/users">
  {(users, loading, error) => {
    if (loading) return <Loading />
    if (error) return <Error message={error.message} />
    return <UserList users={users} />
  }}
</DataFetcher>
```

---

## Patrón: Custom Hooks

Extraer lógica reutilizable:

```tsx
// hooks/useAcademicPeriods.ts
export function useAcademicPeriods() {
  const { instance } = useMsal()
  const [periods, setPeriods] = useState<AcademicPeriod[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadPeriods = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const apiClient = createApiClient(instance)
      const data = await apiClient.get<AcademicPeriod[]>('/banner/academic-period')
      setPeriods(data)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [instance])

  useEffect(() => {
    loadPeriods()
  }, [loadPeriods])

  return { periods, loading, error, reload: loadPeriods }
}

// Uso en componente
function AcademicPeriods() {
  const { periods, loading, error, reload } = useAcademicPeriods()

  if (loading) return <LoadingSpinner />
  if (error) return <ErrorAlert message={error} onRetry={reload} />

  return <DataTable data={periods} />
}
```

**Ventajas:**
- Lógica reutilizable
- Testing más fácil
- Componentes más limpios

---

## Patrón: Controlled vs Uncontrolled

### Controlled Component

React controla el estado:

```tsx
function SearchInput() {
  const [value, setValue] = useState('')

  return (
    <input
      value={value}
      onChange={(e) => setValue(e.target.value)}
    />
  )
}
```

### Uncontrolled Component

DOM controla el estado:

```tsx
function SearchInput() {
  const inputRef = useRef<HTMLInputElement>(null)

  const handleSubmit = () => {
    console.log(inputRef.current?.value)
  }

  return <input ref={inputRef} />
}
```

**¿Cuándo usar cada uno?**

| Controlled | Uncontrolled |
|---|---|
| Validación instantánea | Formularios simples |
| Formateo en tiempo real | Integración con librerías no-React |
| Deshabilitar submit según input | Performance crítica |

---

## Patrón: Higher-Order Component (HOC)

Componente que envuelve otro componente:

```tsx
// HOC para autenticación
function withAuth<P extends object>(
  Component: ComponentType<P>
) {
  return function AuthenticatedComponent(props: P) {
    const { isAuthenticated } = useAuth()

    if (!isAuthenticated) {
      return <Navigate to="/login" />
    }

    return <Component {...props} />
  }
}

// Uso
const ProtectedPage = withAuth(MyPage)
```

**Nota:** En este proyecto preferimos **Custom Hooks** sobre HOCs.

---

## Patrón: Error Boundaries

Capturar errores de React:

```tsx
class ErrorBoundary extends React.Component<
  { children: ReactNode },
  { hasError: boolean; error: Error | null }
> {
  state = { hasError: false, error: null }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Error caught:', error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div>
          <h1>Algo salió mal</h1>
          <p>{this.state.error?.message}</p>
        </div>
      )
    }

    return this.props.children
  }
}

// Uso
<ErrorBoundary>
  <App />
</ErrorBoundary>
```

---

## Patrón: Lazy Loading

Cargar componentes bajo demanda:

```tsx
import { lazy, Suspense } from 'react'

const AcademicPeriods = lazy(() => import('./pages/AcademicPeriods'))

function App() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <Routes>
        <Route path="/periods" element={<AcademicPeriods />} />
      </Routes>
    </Suspense>
  )
}
```

**Beneficios:**
- Reduce bundle size inicial
- Mejora tiempo de carga
- Code splitting automático

---

## Patrón: Memoization

### React.memo

Evita re-renders innecesarios:

```tsx
interface UserCardProps {
  name: string
  email: string
}

const UserCard = memo(function UserCard({ name, email }: UserCardProps) {
  return (
    <Card>
      <h3>{name}</h3>
      <p>{email}</p>
    </Card>
  )
})

// Solo re-renderiza si name o email cambian
```

### useMemo

Memoriza valores calculados:

```tsx
function DataTable({ data }: { data: Item[] }) {
  // Solo recalcula si data cambia
  const sortedData = useMemo(
    () => data.sort((a, b) => a.name.localeCompare(b.name)),
    [data]
  )

  return <Table data={sortedData} />
}
```

### useCallback

Memoriza funciones:

```tsx
function Parent() {
  const [count, setCount] = useState(0)

  // Misma referencia de función entre renders
  const handleClick = useCallback(() => {
    setCount(c => c + 1)
  }, [])

  return <MemoizedChild onClick={handleClick} />
}
```

**⚠️ Advertencia:** No optimizar prematuramente. Solo usar cuando hay problema de performance comprobado.

---

## Anti-Patrones

### ❌ Prop Drilling

Pasar props por muchos niveles:

```tsx
// ❌ Mal
<GrandParent user={user}>
  <Parent user={user}>
    <Child user={user}>
      <GrandChild user={user} />
    </Child>
  </Parent>
</GrandParent>
```

**✅ Solución: Context**

```tsx
const UserContext = createContext<User | null>(null)

function GrandParent() {
  const user = useUser()
  return (
    <UserContext.Provider value={user}>
      <Parent>
        <Child>
          <GrandChild />
        </Child>
      </Parent>
    </UserContext.Provider>
  )
}

function GrandChild() {
  const user = useContext(UserContext)
  return <div>{user?.name}</div>
}
```

---

### ❌ Huge Components

Componentes con 500+ líneas:

```tsx
// ❌ Mal
function Dashboard() {
  // 500 líneas de JSX y lógica
}
```

**✅ Solución: Dividir**

```tsx
// ✅ Bien
function Dashboard() {
  return (
    <>
      <DashboardHeader />
      <DashboardStats />
      <DashboardCharts />
      <DashboardActivity />
    </>
  )
}
```

---

### ❌ Inline Functions en Render

```tsx
// ❌ Mal (crea nueva función en cada render)
<Button onClick={() => handleClick(id)}>
```

**✅ Solución:**

```tsx
// Opción 1: useCallback
const handleClick = useCallback(() => {
  doSomething(id)
}, [id])

<Button onClick={handleClick}>

// Opción 2: Curry function
const handleClick = (id: string) => () => {
  doSomething(id)
}

<Button onClick={handleClick(id)}>
```

---

### ❌ Mutación Directa de Estado

```tsx
// ❌ Mal
const [items, setItems] = useState([1, 2, 3])
items.push(4)  // ¡No!
setItems(items)
```

**✅ Solución:**

```tsx
// ✅ Bien (inmutable)
setItems([...items, 4])

// o con callback
setItems(prev => [...prev, 4])
```

---

### ❌ useEffect Faltante Dependencies

```tsx
// ❌ Mal
useEffect(() => {
  fetchData(userId)
}, [])  // userId debería estar en dependencies
```

**✅ Solución:**

```tsx
// ✅ Bien
useEffect(() => {
  fetchData(userId)
}, [userId])

// Si la función también cambia
useEffect(() => {
  fetchData(userId)
}, [fetchData, userId])
```

---

## Mejores Prácticas

### 1. Nombrar Componentes

```tsx
// ✅ Descriptivo y específico
function UserAvatarWithStatus() {}
function AcademicPeriodDataTable() {}

// ❌ Genérico
function Component1() {}
function Thing() {}
```

### 2. Early Returns

```tsx
// ✅ Bien
function UserProfile({ user }: { user: User | null }) {
  if (!user) return <EmptyState title="No user" />
  if (user.deleted) return <DeletedUser />

  return <UserDetails user={user} />
}

// ❌ Mal (demasiados ifs anidados)
function UserProfile({ user }: { user: User | null }) {
  return (
    <div>
      {user ? (
        user.deleted ? (
          <DeletedUser />
        ) : (
          <UserDetails user={user} />
        )
      ) : (
        <EmptyState />
      )}
    </div>
  )
}
```

### 3. Extraer Constantes

```tsx
// ✅ Bien
const MAX_ITEMS = 10
const DEFAULT_PAGE_SIZE = 20

function MyComponent() {
  const [pageSize] = useState(DEFAULT_PAGE_SIZE)
  // ...
}

// ❌ Mal (magic numbers)
function MyComponent() {
  const [pageSize] = useState(20)
  // ...
}
```

### 4. Props Destructuring

```tsx
// ✅ Bien
function UserCard({ name, email, photoUrl }: UserCardProps) {
  return <div>{name}</div>
}

// ❌ Mal
function UserCard(props: UserCardProps) {
  return <div>{props.name}</div>
}
```

---

## Checklist de Componentes

Al crear un componente nuevo:

- [ ] Tiene una sola responsabilidad
- [ ] Props están tipadas con interface
- [ ] Nombre es descriptivo
- [ ] Usa early returns para casos edge
- [ ] No tiene lógica compleja en JSX
- [ ] Extrae sub-componentes si tiene +150 líneas
- [ ] Usa custom hooks para lógica reutilizable
- [ ] No muta estado directamente
- [ ] useEffect tiene dependencies correctas
- [ ] Funciona en light y dark mode
- [ ] Es responsive

---

## Recursos

- [React Patterns](https://reactpatterns.com/)
- [React Design Patterns](https://www.patterns.dev/posts/react-patterns/)
- [Kent C. Dodds Blog](https://kentcdodds.com/blog)
