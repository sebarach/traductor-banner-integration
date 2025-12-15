# TypeScript - Buenas Prácticas

## Configuración TypeScript

**Archivo:** `tsconfig.json`

### Opciones Strict Mode

El proyecto usa **strict mode** habilitado:

```json
{
  "compilerOptions": {
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true
  }
}
```

**¿Por qué strict mode?**
- Detecta errores en tiempo de compilación
- Fuerza tipado explícito
- Previene bugs comunes
- Mejor experiencia de desarrollador (autocomplete)

---

## Tipado de Props

### Componentes Funcionales

**✅ Forma Correcta:**

```tsx
interface UserAvatarProps {
  name: string
  email?: string
  photoUrl?: string
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

export function UserAvatar({
  name,
  email,
  photoUrl,
  size = 'md',
  className
}: UserAvatarProps) {
  // ...
}
```

**❌ Forma Incorrecta:**

```tsx
// Sin tipado
export function UserAvatar(props) {
  // ...
}

// Tipado inline (difícil de reutilizar)
export function UserAvatar({
  name,
  email
}: { name: string; email?: string }) {
  // ...
}
```

### Props con Children

```tsx
interface PageLayoutProps {
  children: ReactNode
  title: string
}

export function PageLayout({ children, title }: PageLayoutProps) {
  return (
    <div>
      <h1>{title}</h1>
      {children}
    </div>
  )
}
```

### Props con Eventos

```tsx
interface ButtonProps {
  onClick: () => void
  onHover?: (event: MouseEvent<HTMLButtonElement>) => void
}

export function Button({ onClick, onHover }: ButtonProps) {
  return (
    <button onClick={onClick} onMouseEnter={onHover}>
      Click me
    </button>
  )
}
```

---

## Tipado de Estado

### useState

```tsx
// ✅ Tipo inferido automáticamente
const [count, setCount] = useState(0)  // number

// ✅ Tipo explícito cuando es necesario
const [user, setUser] = useState<User | null>(null)

// ✅ Array tipado
const [items, setItems] = useState<string[]>([])

// ❌ Any implícito
const [data, setData] = useState()  // any
```

### Tipos Complejos

```tsx
interface AcademicPeriod {
  code: string
  desc: string
  startDate: string
  endDate: string
}

const [periods, setPeriods] = useState<AcademicPeriod[]>([])
```

---

## Tipado de API

### Respuestas de API

**Archivo:** `src/types/api.ts`

```tsx
export interface AcademicPeriod {
  code: string
  desc: string
  periodDesc: string
  periodGroup: string
  startDate: string
  endDate: string
  trmtDesc: string
}

export interface User {
  name: string
  email: string
  photoUrl?: string
  tenantId?: string
}
```

### Cliente API

```tsx
// En apiClient.ts
class ApiClient {
  async get<T>(url: string): Promise<T> {
    const response = await fetch(url)
    return response.json() as Promise<T>
  }
}

// Uso con tipo
const periods = await apiClient.get<AcademicPeriod[]>('/api/periods')
```

---

## Tipado de TanStack Table

### Definición de Columnas

```tsx
import type { ColumnDef } from '@tanstack/react-table'

const columns = useMemo<ColumnDef<AcademicPeriod>[]>(
  () => [
    {
      accessorKey: 'code',
      header: 'Código',
      cell: (info) => info.getValue() as string,
    },
    {
      accessorKey: 'startDate',
      header: 'Fecha Inicio',
      cell: (info) => formatDate(info.getValue() as string),
    },
  ],
  []
)
```

**Razón:**
- `ColumnDef<AcademicPeriod>[]` especifica el tipo de datos
- TypeScript infiere los tipos de `info.getValue()`
- Autocomplete funciona en `accessorKey`

---

## Union Types y Enums

### Variantes de Componentes

**✅ Union Types (Recomendado):**

```tsx
type Variant = 'default' | 'primary' | 'success' | 'warning' | 'destructive'

interface StatCardProps {
  variant?: Variant
}
```

**¿Por qué Union Types?**
- Más ligero que enums
- Mejor tree-shaking
- Igual de type-safe

**❌ Enums (Evitar):**

```tsx
enum Variant {
  Default = 'default',
  Primary = 'primary',
  // ...
}
```

### Tamaños

```tsx
type Size = 'sm' | 'md' | 'lg' | 'xl'

interface ComponentProps {
  size?: Size
}
```

---

## Utility Types

### Partial

Hace todas las propiedades opcionales:

```tsx
interface User {
  name: string
  email: string
  phone: string
}

// Todas opcionales
function updateUser(updates: Partial<User>) {
  // ...
}
```

### Pick

Selecciona propiedades específicas:

```tsx
type UserBasic = Pick<User, 'name' | 'email'>

// { name: string; email: string }
```

### Omit

Excluye propiedades:

```tsx
type UserWithoutPhone = Omit<User, 'phone'>

// { name: string; email: string }
```

### Record

Crea un objeto con claves y valores tipados:

```tsx
type SizeMap = Record<Size, string>

const sizeClasses: SizeMap = {
  sm: 'h-4 w-4',
  md: 'h-6 w-6',
  lg: 'h-8 w-8',
  xl: 'h-12 w-12',
}
```

---

## Type Guards

### Verificación de Tipos

```tsx
function isUser(value: unknown): value is User {
  return (
    typeof value === 'object' &&
    value !== null &&
    'name' in value &&
    'email' in value
  )
}

// Uso
if (isUser(data)) {
  console.log(data.name)  // TypeScript sabe que data es User
}
```

---

## Generics

### Componente Genérico

```tsx
interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[]
  data: TData[]
}

export function DataTable<TData, TValue>({
  columns,
  data
}: DataTableProps<TData, TValue>) {
  // ...
}

// Uso
<DataTable<AcademicPeriod, any>
  columns={columns}
  data={periods}
/>
```

### Función Genérica

```tsx
function first<T>(array: T[]): T | undefined {
  return array[0]
}

const firstPeriod = first(periods)  // AcademicPeriod | undefined
const firstNumber = first([1, 2, 3])  // number | undefined
```

---

## Null vs Undefined

### Cuándo Usar Cada Uno

**`null`:** Valor ausente **intencional**

```tsx
const [user, setUser] = useState<User | null>(null)

// Usuario no cargado aún
if (user === null) {
  return <Loading />
}
```

**`undefined`:** Valor **no inicializado** u **opcional**

```tsx
interface UserProps {
  email?: string  // Puede no estar presente
}

function getEmail(email?: string) {
  return email ?? 'No email'
}
```

### Optional Chaining

```tsx
// ✅ Safe access
const photoUrl = user?.photoUrl

// ✅ Safe method call
const upperName = user?.name?.toUpperCase()

// ❌ Sin optional chaining (puede fallar)
const photoUrl = user.photoUrl  // Error si user es null
```

### Nullish Coalescing

```tsx
// ✅ Usa ?? para valores null/undefined
const name = user?.name ?? 'Guest'

// ❌ No usar || (0 y '' son falsy)
const count = items.length || 10  // Si length es 0, devuelve 10
const count = items.length ?? 10  // Solo devuelve 10 si es null/undefined
```

---

## Type Assertions

### Cuándo Usar `as`

**✅ Uso Legítimo:**

```tsx
// Sabemos con certeza el tipo
const element = document.getElementById('root') as HTMLDivElement

// API response (ya validado)
const data = await response.json() as AcademicPeriod[]
```

**❌ Evitar:**

```tsx
// Forzar tipo incorrecto
const user = {} as User  // ❌ No tiene las propiedades requeridas

// Uso excesivo
const value = (data as any).someProp  // ❌ Eludiendo TypeScript
```

### as const

Para arrays y objetos inmutables:

```tsx
// Sin as const
const sizes = ['sm', 'md', 'lg']  // string[]

// Con as const
const sizes = ['sm', 'md', 'lg'] as const  // readonly ['sm', 'md', 'lg']
type Size = typeof sizes[number]  // 'sm' | 'md' | 'lg'
```

---

## Errores Comunes

### 1. Any Implícito

**❌ Problema:**
```tsx
function processData(data) {  // data: any
  return data.value
}
```

**✅ Solución:**
```tsx
function processData(data: { value: string }) {
  return data.value
}
```

### 2. Array Vacío Sin Tipo

**❌ Problema:**
```tsx
const items = []  // never[]
items.push('test')  // Error!
```

**✅ Solución:**
```tsx
const items: string[] = []
items.push('test')  // ✅
```

### 3. useState Sin Tipo Inicial

**❌ Problema:**
```tsx
const [data, setData] = useState()  // undefined
```

**✅ Solución:**
```tsx
const [data, setData] = useState<Data | null>(null)
```

### 4. Event Handlers

**❌ Problema:**
```tsx
function handleClick(e) {  // any
  e.preventDefault()
}
```

**✅ Solución:**
```tsx
function handleClick(e: React.MouseEvent<HTMLButtonElement>) {
  e.preventDefault()
}
```

---

## Types vs Interfaces

### Cuándo Usar Types

```tsx
// Union types
type Status = 'pending' | 'success' | 'error'

// Intersection types
type UserWithPermissions = User & { permissions: string[] }

// Mapped types
type Readonly<T> = { readonly [P in keyof T]: T[P] }
```

### Cuándo Usar Interfaces

```tsx
// Objetos y clases
interface User {
  name: string
  email: string
}

// Extensión (herencia)
interface Admin extends User {
  role: 'admin'
}

// Declaration merging
interface Window {
  customProperty: string
}
```

### Regla General

- **Interfaces:** Para objetos y cuando necesitas extensión
- **Types:** Para unions, intersections, y tipos complejos

---

## Mejores Prácticas

### 1. No Usar `any`

**❌ Nunca:**
```tsx
const data: any = fetchData()
```

**✅ Usar `unknown` si no conoces el tipo:**
```tsx
const data: unknown = fetchData()

if (isUser(data)) {
  console.log(data.name)
}
```

### 2. Exportar Types

```tsx
// ✅ Exportar para reutilizar
export interface UserProps {
  name: string
}

export type Status = 'active' | 'inactive'
```

### 3. Usar Tipos de React

```tsx
import type { ReactNode, MouseEvent, ChangeEvent } from 'react'

interface Props {
  children: ReactNode
  onClick: (e: MouseEvent<HTMLButtonElement>) => void
  onChange: (e: ChangeEvent<HTMLInputElement>) => void
}
```

### 4. Evitar Type Assertions

```tsx
// ❌ Type assertion
const user = data as User

// ✅ Type guard
if (isUser(data)) {
  const user = data  // TypeScript infiere el tipo
}
```

### 5. DRY con Types

```tsx
// ❌ Duplicación
interface UserProps {
  name: string
  email: string
}

interface UserResponse {
  name: string
  email: string
  id: number
}

// ✅ Reutilizar
interface UserBase {
  name: string
  email: string
}

interface UserProps extends UserBase {}

interface UserResponse extends UserBase {
  id: number
}
```

---

## Checklist TypeScript

Al escribir TypeScript, verificar:

- [ ] No uso `any` (usar `unknown` si es necesario)
- [ ] Props de componentes están tipadas con interface
- [ ] Estado tiene tipo explícito cuando no se puede inferir
- [ ] Event handlers tienen tipo correcto
- [ ] API responses están tipadas
- [ ] No hay errores de TypeScript en VSCode
- [ ] Uso optional chaining (`?.`) para acceso seguro
- [ ] Uso nullish coalescing (`??`) para defaults
- [ ] Exporto types que otros archivos puedan necesitar
- [ ] Uso tipos de React (`ReactNode`, `MouseEvent`, etc.)

---

## Recursos

- [TypeScript Handbook](https://www.typescriptlang.org/docs/handbook/intro.html)
- [React TypeScript Cheatsheet](https://react-typescript-cheatsheet.netlify.app/)
- [TypeScript Playground](https://www.typescriptlang.org/play)
