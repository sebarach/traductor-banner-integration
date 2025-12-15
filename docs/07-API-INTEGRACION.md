# Integración con API (Azure Functions)

## Propósito

Esta guía explica cómo integrar el frontend React con el backend de Azure Functions, cómo realizar llamadas API autenticadas, manejo de errores, y mejores prácticas para consumir endpoints REST.

---

## Arquitectura Backend

```
react-poc-sso/
├── api/                          # ⚠️ Azure Functions (Backend)
│   ├── AcademicPeriod/
│   │   └── index.ts             # GET /api/banner/academic-period
│   ├── host.json                # Configuración de Functions runtime
│   ├── local.settings.json      # Variables de entorno locales (NO committear)
│   └── package.json             # Dependencias del backend
│
└── src/                          # Frontend React
    ├── utils/
    │   └── apiClient.ts         # Cliente HTTP con autenticación
    └── pages/
        └── AcademicPeriods.tsx  # Consume API
```

**Separación de Responsabilidades:**

- **Frontend (`src/`)**: UI, state management, routing
- **Backend (`api/`)**: Lógica de negocio, validación de tokens, acceso a bases de datos

---

## API Client (`src/utils/apiClient.ts`)

### Implementación Completa

```typescript
import { IPublicClientApplication } from '@azure/msal-browser'
import { tokenRequest } from '../config/authConfig'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api'

interface ApiClient {
  get<T>(endpoint: string): Promise<T>
  post<T>(endpoint: string, data: any): Promise<T>
  put<T>(endpoint: string, data: any): Promise<T>
  delete<T>(endpoint: string): Promise<T>
}

export function createApiClient(msalInstance: IPublicClientApplication): ApiClient {
  /**
   * GET request
   * @param endpoint - API endpoint (ej: '/banner/academic-period')
   * @returns Promise con los datos tipados
   */
  async function get<T>(endpoint: string): Promise<T> {
    const token = await acquireToken(msalInstance)
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    })

    if (!response.ok) {
      await handleErrorResponse(response)
    }

    return response.json()
  }

  /**
   * POST request
   * @param endpoint - API endpoint
   * @param data - Request body
   * @returns Promise con los datos tipados
   */
  async function post<T>(endpoint: string, data: any): Promise<T> {
    const token = await acquireToken(msalInstance)
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    })

    if (!response.ok) {
      await handleErrorResponse(response)
    }

    return response.json()
  }

  /**
   * PUT request
   * @param endpoint - API endpoint
   * @param data - Request body
   * @returns Promise con los datos tipados
   */
  async function put<T>(endpoint: string, data: any): Promise<T> {
    const token = await acquireToken(msalInstance)
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    })

    if (!response.ok) {
      await handleErrorResponse(response)
    }

    return response.json()
  }

  /**
   * DELETE request
   * @param endpoint - API endpoint
   * @returns Promise con los datos tipados
   */
  async function deleteRequest<T>(endpoint: string): Promise<T> {
    const token = await acquireToken(msalInstance)
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    })

    if (!response.ok) {
      await handleErrorResponse(response)
    }

    return response.json()
  }

  return {
    get,
    post,
    put,
    delete: deleteRequest,
  }
}

/**
 * Adquiere access token de Azure AD (silencioso o con redirect)
 */
async function acquireToken(msalInstance: IPublicClientApplication): Promise<string> {
  const accounts = msalInstance.getAllAccounts()

  if (accounts.length === 0) {
    throw new Error('No authenticated account found')
  }

  try {
    // Intentar adquirir token silenciosamente (desde cache)
    const response = await msalInstance.acquireTokenSilent({
      ...tokenRequest,
      account: accounts[0],
    })
    return response.accessToken
  } catch (err) {
    console.error('Silent token acquisition failed, acquiring token via redirect')
    // Si falla (token expirado), redirigir para re-autenticar
    await msalInstance.acquireTokenRedirect(tokenRequest)
    throw new Error('Token acquisition in progress')
  }
}

/**
 * Maneja errores HTTP y lanza excepciones con mensajes descriptivos
 */
async function handleErrorResponse(response: Response): Promise<never> {
  let errorMessage = `HTTP ${response.status}: ${response.statusText}`

  try {
    // Intentar leer body del error (puede tener más detalles)
    const errorBody = await response.json()
    if (errorBody.message) {
      errorMessage = errorBody.message
    }
  } catch {
    // Body no es JSON, usar mensaje default
  }

  // Lanzar error específico según código HTTP
  switch (response.status) {
    case 400:
      throw new Error(`Solicitud inválida: ${errorMessage}`)
    case 401:
      throw new Error('No autorizado. Por favor inicia sesión nuevamente.')
    case 403:
      throw new Error('No tienes permisos para realizar esta acción.')
    case 404:
      throw new Error('Recurso no encontrado.')
    case 500:
      throw new Error('Error del servidor. Por favor intenta nuevamente.')
    default:
      throw new Error(errorMessage)
  }
}
```

---

## Uso del API Client

### Ejemplo: Cargar Datos (GET)

```typescript
// src/pages/AcademicPeriods.tsx
import { useState, useEffect } from 'react'
import { useMsal } from '@azure/msal-react'
import { createApiClient } from '../utils/apiClient'
import type { AcademicPeriod } from '../types/api'

export default function AcademicPeriods() {
  const { instance } = useMsal()
  const [periods, setPeriods] = useState<AcademicPeriod[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadAcademicPeriods()
  }, [])

  const loadAcademicPeriods = async () => {
    setLoading(true)
    setError(null)

    try {
      // Crear cliente API con instancia MSAL
      const apiClient = createApiClient(instance)

      // GET request con tipo genérico
      const data = await apiClient.get<AcademicPeriod[]>('/banner/academic-period')

      setPeriods(data)
    } catch (err: any) {
      setError(err.message || 'Error al cargar los períodos académicos')
      console.error('Error loading academic periods:', err)
    } finally {
      setLoading(false)
    }
  }

  // ... resto del componente
}
```

### Ejemplo: Crear Recurso (POST)

```typescript
// src/pages/CreateStudent.tsx
const handleSubmit = async (formData: StudentFormData) => {
  setSubmitting(true)
  setError(null)

  try {
    const apiClient = createApiClient(instance)

    // POST request con tipo genérico
    const newStudent = await apiClient.post<Student>('/banner/students', {
      firstName: formData.firstName,
      lastName: formData.lastName,
      email: formData.email,
      studentId: formData.studentId,
    })

    console.log('Student created:', newStudent)

    // Redirigir a lista de estudiantes
    navigate('/students')
  } catch (err: any) {
    setError(err.message || 'Error al crear estudiante')
  } finally {
    setSubmitting(false)
  }
}
```

### Ejemplo: Actualizar Recurso (PUT)

```typescript
// src/pages/EditStudent.tsx
const handleUpdate = async (studentId: string, updates: Partial<Student>) => {
  try {
    const apiClient = createApiClient(instance)

    // PUT request
    const updatedStudent = await apiClient.put<Student>(
      `/banner/students/${studentId}`,
      updates
    )

    console.log('Student updated:', updatedStudent)

    // Actualizar estado local
    setStudent(updatedStudent)
  } catch (err: any) {
    setError(err.message)
  }
}
```

### Ejemplo: Eliminar Recurso (DELETE)

```typescript
// src/pages/StudentList.tsx
const handleDelete = async (studentId: string) => {
  if (!confirm('¿Estás seguro de eliminar este estudiante?')) {
    return
  }

  try {
    const apiClient = createApiClient(instance)

    // DELETE request
    await apiClient.delete(`/banner/students/${studentId}`)

    // Remover de estado local
    setStudents(prev => prev.filter(s => s.id !== studentId))
  } catch (err: any) {
    setError(err.message)
  }
}
```

---

## Types de API (`src/types/api.ts`)

**¿Por qué definir types?**

- **Type safety**: TypeScript valida en compile-time
- **Autocomplete**: IntelliSense sugiere propiedades
- **Documentación**: Types documentan la estructura de datos

```typescript
// src/types/api.ts

/**
 * Período académico del sistema Banner
 */
export interface AcademicPeriod {
  /** Código único del período (ej: "202401") */
  code: string

  /** Descripción del período (ej: "Primer Semestre 2024") */
  desc: string

  /** Descripción del tipo de período (ej: "Semestre", "Trimestre") */
  periodDesc: string

  /** Grupo del período (ej: "Pregrado", "Postgrado") */
  periodGroup: string

  /** Fecha de inicio en formato ISO (ej: "2024-03-01") */
  startDate: string

  /** Fecha de término en formato ISO (ej: "2024-06-30") */
  endDate: string

  /** Descripción del tipo de término (ej: "Regular", "Intensivo") */
  trmtDesc: string
}

/**
 * Estudiante del sistema Banner
 */
export interface Student {
  /** ID único del estudiante */
  id: string

  /** Número de matrícula del estudiante */
  studentId: string

  /** Nombre del estudiante */
  firstName: string

  /** Apellido del estudiante */
  lastName: string

  /** Email institucional */
  email: string

  /** Carrera */
  program?: string

  /** Fecha de ingreso */
  enrollmentDate?: string
}

/**
 * Curso del sistema Banner
 */
export interface Course {
  /** Código del curso (ej: "CS101") */
  code: string

  /** Nombre del curso */
  name: string

  /** Descripción del curso */
  description?: string

  /** Créditos */
  credits: number

  /** Departamento */
  department: string
}

/**
 * Respuesta genérica de API con paginación
 */
export interface PaginatedResponse<T> {
  /** Items de la página actual */
  items: T[]

  /** Número de página actual (base 1) */
  page: number

  /** Tamaño de página */
  pageSize: number

  /** Total de items */
  totalItems: number

  /** Total de páginas */
  totalPages: number
}

/**
 * Error de API
 */
export interface ApiError {
  /** Mensaje de error */
  message: string

  /** Código de error (opcional) */
  code?: string

  /** Detalles adicionales (opcional) */
  details?: Record<string, any>
}
```

**Uso con API Client:**

```typescript
// ✅ Correcto (tipo genérico)
const data = await apiClient.get<AcademicPeriod[]>('/banner/academic-period')
// TypeScript sabe que data es AcademicPeriod[]

// ✅ Correcto (paginación)
const response = await apiClient.get<PaginatedResponse<Student>>('/banner/students?page=1')
// TypeScript sabe que response.items es Student[]

// ❌ Incorrecto (sin tipo)
const data = await apiClient.get('/banner/academic-period')
// TypeScript no sabe qué es data (tipo 'any')
```

---

## Manejo de Errores

### Estrategia de Error Handling

```typescript
// src/pages/AcademicPeriods.tsx
const loadData = async () => {
  setLoading(true)
  setError(null) // Limpiar error anterior

  try {
    const apiClient = createApiClient(instance)
    const data = await apiClient.get<AcademicPeriod[]>('/banner/academic-period')
    setPeriods(data)
  } catch (err: any) {
    // err.message ya tiene mensaje user-friendly (generado por handleErrorResponse)
    setError(err.message || 'Error al cargar los datos')
    console.error('Error loading data:', err)
  } finally {
    setLoading(false) // Siempre ejecuta (éxito o error)
  }
}
```

### Mostrar Errores al Usuario

```typescript
// src/pages/AcademicPeriods.tsx
if (error) {
  return (
    <Alert variant="destructive">
      <AlertCircle className="h-4 w-4" />
      <AlertDescription className="flex items-center justify-between gap-4">
        <div>
          <p className="font-semibold mb-1">Error al cargar datos</p>
          <p className="text-sm">{error}</p>
        </div>
        <Button onClick={loadData} variant="outline" size="sm">
          <RefreshCw className="h-4 w-4 mr-2" />
          Reintentar
        </Button>
      </AlertDescription>
    </Alert>
  )
}
```

### Tipos de Errores

| HTTP Status | Error Mensaje | Causa Común | Acción Sugerida |
|---|---|---|---|
| 400 | Solicitud inválida | Request body malformado | Revisar datos enviados |
| 401 | No autorizado | Token expirado/inválido | Re-login automático (MSAL) |
| 403 | Sin permisos | Usuario no tiene scope | Contactar admin |
| 404 | No encontrado | Endpoint no existe | Revisar URL |
| 500 | Error del servidor | Bug en backend | Reportar a equipo backend |

---

## Endpoints Backend (Azure Functions)

### Estructura de un Endpoint

```typescript
// api/AcademicPeriod/index.ts
import { AzureFunction, Context, HttpRequest } from '@azure/functions'

const httpTrigger: AzureFunction = async (
  context: Context,
  req: HttpRequest
): Promise<void> => {
  context.log('HTTP trigger function processed a request.')

  // Validar autenticación
  const token = req.headers.authorization?.split(' ')[1]
  if (!token) {
    context.res = {
      status: 401,
      body: { message: 'No autorizado' }
    }
    return
  }

  try {
    // Lógica de negocio
    const data = await getAcademicPeriodsFromDatabase()

    context.res = {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
      },
      body: data,
    }
  } catch (err: any) {
    context.log.error('Error:', err)
    context.res = {
      status: 500,
      body: { message: 'Error interno del servidor' }
    }
  }
}

export default httpTrigger
```

### Configuración de Function

```json
// api/AcademicPeriod/function.json
{
  "bindings": [
    {
      "authLevel": "function",
      "type": "httpTrigger",
      "direction": "in",
      "name": "req",
      "methods": ["get"],
      "route": "banner/academic-period"
    },
    {
      "type": "http",
      "direction": "out",
      "name": "res"
    }
  ]
}
```

**Mapeo de Routes:**

- **Frontend**: `apiClient.get('/banner/academic-period')`
- **Backend Route**: `route: "banner/academic-period"`
- **Full URL** (dev): `http://localhost:7071/api/banner/academic-period`
- **Full URL** (prod): `https://your-app.azurewebsites.net/api/banner/academic-period`

---

## CORS (Cross-Origin Resource Sharing)

### ¿Por qué necesitas CORS?

```
Frontend:  http://localhost:5173      ─┐
                                        ├─ Diferente origen
Backend:   http://localhost:7071      ─┘
```

**Solución:** Configurar CORS en Azure Functions

### Configuración Local (`api/host.json`)

```json
{
  "version": "2.0",
  "extensions": {
    "http": {
      "routePrefix": "api",
      "cors": {
        "allowedOrigins": [
          "http://localhost:5173",
          "https://localhost:5173"
        ],
        "supportCredentials": true
      }
    }
  }
}
```

### Configuración en Azure Portal

1. Azure Portal → **Function App** → **CORS**
2. Agregar allowed origins:
   - Development: `http://localhost:5173`
   - Production: `https://your-app.azurestaticapps.net`
3. Enable **Access-Control-Allow-Credentials**: ✅

---

## Variables de Entorno

### Frontend (`.env.local`)

```bash
# URL base del backend
VITE_API_BASE_URL=http://localhost:7071/api  # Development
# VITE_API_BASE_URL=https://prod-app.azurewebsites.net/api  # Production
```

### Backend (`api/local.settings.json`)

```json
{
  "IsEncrypted": false,
  "Values": {
    "AzureWebJobsStorage": "",
    "FUNCTIONS_WORKER_RUNTIME": "node",

    "DATABASE_CONNECTION_STRING": "your-connection-string",
    "BANNER_API_URL": "https://banner-api.university.edu",
    "BANNER_API_KEY": "your-api-key"
  }
}
```

**⚠️ Importante:**

- `local.settings.json` **NO committear** a Git (contiene secrets)
- Agregar a `.gitignore`
- En producción, configurar en Azure Portal → **Configuration**

---

## Paginación

### Request

```typescript
const loadStudents = async (page: number, pageSize: number) => {
  const apiClient = createApiClient(instance)

  // Query params en URL
  const response = await apiClient.get<PaginatedResponse<Student>>(
    `/banner/students?page=${page}&pageSize=${pageSize}`
  )

  return response
}
```

### Response Type

```typescript
interface PaginatedResponse<T> {
  items: T[]
  page: number
  pageSize: number
  totalItems: number
  totalPages: number
}
```

### Uso en Componente

```typescript
const [students, setStudents] = useState<Student[]>([])
const [page, setPage] = useState(1)
const [totalPages, setTotalPages] = useState(1)

const loadStudents = async () => {
  const response = await apiClient.get<PaginatedResponse<Student>>(
    `/banner/students?page=${page}&pageSize=20`
  )

  setStudents(response.items)
  setTotalPages(response.totalPages)
}

// Pagination controls
<Button onClick={() => setPage(p => p - 1)} disabled={page === 1}>
  Anterior
</Button>
<span>Página {page} de {totalPages}</span>
<Button onClick={() => setPage(p => p + 1)} disabled={page === totalPages}>
  Siguiente
</Button>
```

---

## Testing de API

### Testing Local

1. **Levantar Backend:**
   ```bash
   cd api
   npm start
   # Backend running on http://localhost:7071
   ```

2. **Levantar Frontend:**
   ```bash
   npm run dev
   # Frontend running on http://localhost:5173
   ```

3. **Probar Endpoint:**
   ```bash
   # Con curl
   curl http://localhost:7071/api/banner/academic-period \
     -H "Authorization: Bearer {token}"

   # Con Postman
   GET http://localhost:7071/api/banner/academic-period
   Headers:
     Authorization: Bearer {token}
   ```

### Obtener Token para Testing

```typescript
// En browser console (mientras estás logueado)
const accounts = msalInstance.getAllAccounts()
const response = await msalInstance.acquireTokenSilent({
  scopes: [`api://${clientId}/access_as_user`],
  account: accounts[0]
})
console.log('Token:', response.accessToken)
```

---

## Mejores Prácticas

### ✅ Usar Custom Hooks

```typescript
// src/hooks/useAcademicPeriods.ts
import { useState, useEffect, useCallback } from 'react'
import { useMsal } from '@azure/msal-react'
import { createApiClient } from '../utils/apiClient'
import type { AcademicPeriod } from '../types/api'

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

### ✅ Loading States Optimistas

```typescript
// Actualización optimista (UI responde inmediatamente)
const handleToggleFavorite = async (periodId: string) => {
  // 1. Actualizar UI inmediatamente
  setPeriods(prev =>
    prev.map(p => p.id === periodId ? { ...p, isFavorite: !p.isFavorite } : p)
  )

  try {
    // 2. Actualizar en backend
    await apiClient.post(`/banner/academic-period/${periodId}/favorite`, {})
  } catch (err) {
    // 3. Si falla, revertir cambio en UI
    setPeriods(prev =>
      prev.map(p => p.id === periodId ? { ...p, isFavorite: !p.isFavorite } : p)
    )
    setError('Error al actualizar favorito')
  }
}
```

### ✅ Debouncing de Búsquedas

```typescript
import { useState, useEffect } from 'react'
import { useDebounce } from '@/hooks/useDebounce'

function StudentSearch() {
  const [searchTerm, setSearchTerm] = useState('')
  const debouncedSearch = useDebounce(searchTerm, 500) // 500ms delay

  useEffect(() => {
    if (debouncedSearch) {
      searchStudents(debouncedSearch)
    }
  }, [debouncedSearch])

  const searchStudents = async (query: string) => {
    const apiClient = createApiClient(instance)
    const results = await apiClient.get<Student[]>(`/banner/students/search?q=${query}`)
    setResults(results)
  }

  return (
    <Input
      value={searchTerm}
      onChange={(e) => setSearchTerm(e.target.value)}
      placeholder="Buscar estudiantes..."
    />
  )
}
```

---

## Recursos

- [Azure Functions HTTP Triggers](https://docs.microsoft.com/azure/azure-functions/functions-bindings-http-webhook-trigger)
- [Fetch API MDN](https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API)
- [React Query](https://tanstack.com/query/latest) (alternativa avanzada para data fetching)
