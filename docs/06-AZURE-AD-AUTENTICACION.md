# Azure AD Autenticación (MSAL)

## Propósito

Esta guía explica cómo funciona la autenticación con Azure Active Directory (Azure AD) usando MSAL (Microsoft Authentication Library) en este proyecto. Es esencial para entender el flujo de autenticación, manejo de tokens, y cómo agregar nuevas funcionalidades que requieren autenticación.

---

## Arquitectura de Autenticación

```
┌─────────────┐      ┌──────────────┐      ┌─────────────────┐      ┌──────────────┐
│   Usuario   │─────▶│ Login Page   │─────▶│  Azure AD SSO   │─────▶│   Backend    │
│             │      │ (MSAL React) │      │  (Microsoft)    │      │ (Functions)  │
└─────────────┘      └──────────────┘      └─────────────────┘      └──────────────┘
                            │                       │                       │
                            │   1. loginRedirect()  │                       │
                            │──────────────────────▶│                       │
                            │                       │                       │
                            │   2. User authenticates                       │
                            │◀──────────────────────│                       │
                            │                       │                       │
                            │   3. Redirect + code  │                       │
                            │◀──────────────────────│                       │
                            │                       │                       │
                            │   4. Exchange code    │                       │
                            │──────────────────────▶│                       │
                            │                       │                       │
                            │   5. Access Token +   │                       │
                            │      ID Token         │                       │
                            │◀──────────────────────│                       │
                            │                       │                       │
                            │   6. API call with    │                       │
                            │      Bearer token     │                       │
                            │───────────────────────────────────────────────▶│
                            │                       │                       │
                            │   7. Validate token + │                       │
                            │      Return data      │                       │
                            │◀───────────────────────────────────────────────│
```

---

## Componentes Clave

### 1. Configuración MSAL (`src/config/authConfig.ts`)

```typescript
import { Configuration, LogLevel } from '@azure/msal-browser'

export const msalConfig: Configuration = {
  auth: {
    // Application (client) ID del App Registration en Azure Portal
    clientId: import.meta.env.VITE_AZURE_CLIENT_ID,

    // Tenant ID de tu organización
    authority: `https://login.microsoftonline.com/${import.meta.env.VITE_AZURE_TENANT_ID}`,

    // URL a la que Azure AD redirige después de login
    redirectUri: '/',
  },
  cache: {
    // Tipo de almacenamiento para tokens
    cacheLocation: 'sessionStorage', // o 'localStorage'
    storeAuthStateInCookie: false,
  },
  system: {
    loggerOptions: {
      logLevel: LogLevel.Info,
      loggerCallback: (level, message, containsPii) => {
        if (containsPii) return
        switch (level) {
          case LogLevel.Error:
            console.error(message)
            break
          case LogLevel.Info:
            console.info(message)
            break
          case LogLevel.Verbose:
            console.debug(message)
            break
          case LogLevel.Warning:
            console.warn(message)
            break
        }
      },
    },
  },
}

// Scopes (permisos) que necesita la app
export const loginRequest = {
  scopes: [
    'User.Read', // Leer perfil básico
    'openid',    // Información de identidad
    'profile',   // Información de perfil
    'email',     // Email del usuario
  ],
}

// Scopes para acceder al backend
export const tokenRequest = {
  scopes: [`api://${import.meta.env.VITE_AZURE_CLIENT_ID}/access_as_user`],
}
```

**¿Por qué esta configuración?**

- **`clientId`**: Identifica tu aplicación en Azure AD
- **`authority`**: Define qué Azure AD Tenant puede autenticarse
- **`sessionStorage`**: Tokens se borran al cerrar browser (más seguro)
- **`scopes`**: Define qué permisos necesita la app (principio de menor privilegio)

---

### 2. Provider MSAL (`src/main.tsx`)

```typescript
import { MsalProvider } from '@azure/msal-react'
import { PublicClientApplication } from '@azure/msal-browser'
import { msalConfig } from './config/authConfig'

// Inicializar MSAL instance
const msalInstance = new PublicClientApplication(msalConfig)

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <MsalProvider instance={msalInstance}>
      <App />
    </MsalProvider>
  </React.StrictMode>
)
```

**¿Por qué `MsalProvider`?**

- Hace disponible `msalInstance` en toda la app vía context
- Maneja eventos de autenticación (login, logout, token acquisition)
- Permite usar hooks de MSAL (`useMsal`, `useAccount`, etc.)

---

### 3. Context de Autenticación (`src/context/AuthContext.tsx`)

```typescript
import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { useMsal, useAccount } from '@azure/msal-react'

interface User {
  name: string
  email: string
  photoUrl?: string
  tenantId?: string
}

interface AuthContextType {
  user: User | null
  loading: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const { instance, accounts } = useMsal()
  const account = useAccount(accounts[0] || null)
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (account) {
      setUser({
        name: account.name || '',
        email: account.username || '',
        tenantId: account.tenantId,
      })

      // Intentar obtener foto de Microsoft Graph
      loadUserPhoto()
    } else {
      setUser(null)
    }
    setLoading(false)
  }, [account])

  const loadUserPhoto = async () => {
    try {
      // Adquirir token para Microsoft Graph
      const response = await instance.acquireTokenSilent({
        scopes: ['User.Read'],
        account: account!,
      })

      // Llamar a Microsoft Graph API
      const photoResponse = await fetch('https://graph.microsoft.com/v1.0/me/photo/$value', {
        headers: {
          Authorization: `Bearer ${response.accessToken}`,
        },
      })

      if (photoResponse.ok) {
        const photoBlob = await photoResponse.blob()
        const photoUrl = URL.createObjectURL(photoBlob)
        setUser(prev => prev ? { ...prev, photoUrl } : null)
      }
    } catch (err) {
      console.error('Error loading user photo:', err)
    }
  }

  return (
    <AuthContext.Provider value={{ user, loading }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}
```

**¿Por qué este Context?**

- **Centraliza** el estado del usuario autenticado
- **Evita prop drilling** de `user` por toda la app
- **Carga foto** del usuario desde Microsoft Graph automáticamente
- **Maneja loading state** global de autenticación

---

### 4. Página de Login (`src/pages/Login.tsx`)

```typescript
import { useMsal } from '@azure/msal-react'
import { loginRequest } from '../config/authConfig'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'

export default function Login() {
  const { instance } = useMsal()
  const [loading, setLoading] = useState(false)

  const handleLogin = async () => {
    setLoading(true)
    try {
      // Redirigir a Azure AD para login
      await instance.loginRedirect(loginRequest)
    } catch (err) {
      console.error('Login failed:', err)
      setLoading(false)
    }
  }

  return (
    <Card>
      <Button onClick={handleLogin} disabled={loading}>
        {loading ? 'Redirigiendo...' : 'Continuar con Microsoft'}
      </Button>
    </Card>
  )
}
```

**Flujo de `loginRedirect()`:**

1. Usuario hace clic en botón
2. MSAL redirige a `https://login.microsoftonline.com/{tenant-id}`
3. Usuario ingresa credenciales en Azure AD
4. Azure AD valida credenciales
5. Azure AD redirige de vuelta a la app con authorization code
6. MSAL intercambia code por access token + ID token
7. Tokens se guardan en `sessionStorage`
8. Usuario autenticado, app renderiza Dashboard

---

### 5. Protected Routes (`src/components/guards/ProtectedRoute.tsx`)

```typescript
import { ReactNode } from 'react'
import { Navigate } from 'react-router-dom'
import { useIsAuthenticated } from '@azure/msal-react'
import { LoadingSpinner } from '@/components/shared/LoadingSpinner'
import { useAuth } from '../../context/AuthContext'

interface ProtectedRouteProps {
  children: ReactNode
}

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const isAuthenticated = useIsAuthenticated()
  const { loading } = useAuth()

  // Esperar a que termine de cargar el estado de autenticación
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner size="xl" text="Verificando autenticación..." />
      </div>
    )
  }

  // Si no está autenticado, redirigir a login
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  // Usuario autenticado, renderizar contenido protegido
  return <>{children}</>
}
```

**¿Por qué este componente?**

- **Protege rutas** que requieren autenticación
- **Evita flash** de contenido no autorizado durante loading
- **Redirige** automáticamente a login si no autenticado

**Uso en routes:**

```typescript
<Route
  path="/dashboard"
  element={
    <ProtectedRoute>
      <DashboardLayout>
        <Home />
      </DashboardLayout>
    </ProtectedRoute>
  }
/>
```

---

### 6. API Client con Tokens (`src/utils/apiClient.ts`)

```typescript
import { IPublicClientApplication } from '@azure/msal-browser'
import { tokenRequest } from '../config/authConfig'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api'

export function createApiClient(msalInstance: IPublicClientApplication) {
  return {
    async get<T>(endpoint: string): Promise<T> {
      const token = await acquireToken(msalInstance)
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      return response.json()
    },

    async post<T>(endpoint: string, data: any): Promise<T> {
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
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      return response.json()
    },
  }
}

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
```

**¿Por qué `acquireTokenSilent()`?**

- **Primero intenta** obtener token del cache (rápido, sin redirect)
- **Si token expirado**, automáticamente lo refresca usando refresh token
- **Si refresh falla**, redirige a Azure AD para re-autenticar
- **Transparente** para el usuario (no ve redirects si token válido)

**¿Por qué Bearer token?**

- **Estándar OAuth 2.0** para APIs
- **Stateless**: Backend no necesita sesiones
- **Seguro**: Firmado por Azure AD, backend valida firma
- **Temporal**: Expira en 1 hora (configurable)

---

## Flujo Completo de Autenticación

### Primer Login (Sin Token)

```
1. Usuario visita /dashboard
   ↓
2. ProtectedRoute detecta no autenticado
   ↓
3. Redirige a /login
   ↓
4. Usuario hace clic "Continuar con Microsoft"
   ↓
5. loginRedirect() redirige a login.microsoftonline.com
   ↓
6. Usuario ingresa credenciales Azure AD
   ↓
7. Azure AD valida credenciales
   ↓
8. Azure AD redirige a / con authorization code
   ↓
9. MSAL intercambia code por tokens
   ↓
10. Tokens guardados en sessionStorage
    ↓
11. useIsAuthenticated() retorna true
    ↓
12. ProtectedRoute renderiza Dashboard
    ↓
13. AuthContext carga user info + foto
```

### Navegación con Token Válido

```
1. Usuario visita /banner-integrations
   ↓
2. ProtectedRoute detecta autenticado (token en cache)
   ↓
3. Renderiza página inmediatamente
   ↓
4. Página llama API:
   const apiClient = createApiClient(instance)
   const data = await apiClient.get('/banner/academic-period')
   ↓
5. acquireTokenSilent() obtiene token del cache
   ↓
6. fetch() con Authorization: Bearer {token}
   ↓
7. Backend valida token (firma, expiración, scopes)
   ↓
8. Backend retorna datos
```

### Token Expirado (Refresh Automático)

```
1. Usuario hace clic "Actualizar" en tabla
   ↓
2. apiClient.get() llama acquireTokenSilent()
   ↓
3. MSAL detecta token expirado (>1 hora)
   ↓
4. MSAL usa refresh token para obtener nuevo access token
   ↓
5. Nuevo token guardado en cache
   ↓
6. fetch() con nuevo token
   ↓
7. Usuario NO ve redirect (transparente)
```

---

## Variables de Entorno

**Archivo:** `.env.local` (NO commitear a Git)

```bash
# Azure AD App Registration
VITE_AZURE_CLIENT_ID=12345678-1234-1234-1234-123456789abc
VITE_AZURE_TENANT_ID=87654321-4321-4321-4321-cba987654321

# Backend API
VITE_API_BASE_URL=https://your-app.azurewebsites.net/api
```

**¿Cómo obtener estos valores?**

1. **Azure Portal** → **Azure Active Directory** → **App registrations**
2. Click en tu app registration
3. **`VITE_AZURE_CLIENT_ID`** = Application (client) ID
4. **`VITE_AZURE_TENANT_ID`** = Directory (tenant) ID
5. **`VITE_API_BASE_URL`** = URL de tus Azure Functions

---

## Scopes (Permisos)

### Microsoft Graph Scopes

```typescript
// Para leer perfil de usuario
scopes: ['User.Read']

// Para leer calendario
scopes: ['Calendars.Read']

// Para enviar email
scopes: ['Mail.Send']

// Múltiples scopes
scopes: ['User.Read', 'Mail.Send', 'Calendars.Read']
```

### Custom API Scopes

```typescript
// Para acceder a tu backend
scopes: [`api://${clientId}/access_as_user`]

// Con permiso específico
scopes: [`api://${clientId}/read_data`]
```

**¿Cómo crear custom scope?**

1. Azure Portal → App Registration → **Expose an API**
2. Click **Add a scope**
3. Nombre: `access_as_user`
4. Who can consent: **Admins and users**
5. Display name: "Access application as user"
6. Description: "Allows the app to access the API on behalf of the signed-in user"

---

## Logout

```typescript
const handleLogout = async () => {
  await instance.logoutRedirect({
    postLogoutRedirectUri: '/',
  })
}
```

**¿Qué hace `logoutRedirect()`?**

1. Borra tokens de sessionStorage
2. Redirige a Azure AD logout endpoint
3. Azure AD cierra sesión (revoca tokens)
4. Azure AD redirige a `postLogoutRedirectUri`

**⚠️ Importante:**

- Logout cierra sesión en Azure AD (SSO logout)
- Si usuario tiene sesión de Windows, Azure AD puede recordar credenciales
- Para forzar re-login completo, agregar `prompt: 'login'` en `loginRequest`

---

## Manejo de Errores

### Error: Interaction Required

```typescript
try {
  const response = await instance.acquireTokenSilent(tokenRequest)
} catch (err) {
  if (err instanceof InteractionRequiredAuthError) {
    // Token expirado o revocado, redirigir para re-autenticar
    await instance.acquireTokenRedirect(tokenRequest)
  } else {
    console.error('Token acquisition failed:', err)
  }
}
```

### Error: User Cancelled Login

```typescript
instance.addEventCallback((event) => {
  if (event.eventType === EventType.LOGIN_FAILURE) {
    if (event.error?.errorCode === 'user_cancelled') {
      console.log('User cancelled login')
    }
  }
})
```

### Error: Network Error

```typescript
try {
  const data = await apiClient.get('/endpoint')
} catch (err) {
  if (err instanceof TypeError && err.message === 'Failed to fetch') {
    // Error de red (sin internet, CORS, etc.)
    console.error('Network error')
  } else {
    // Otro error (401, 403, 500, etc.)
    console.error('API error:', err)
  }
}
```

---

## Seguridad

### ✅ Buenas Prácticas

1. **No exponer tokens** en console.log
   ```typescript
   // ❌ Mal
   console.log('Token:', token)

   // ✅ Bien
   console.log('Token acquired successfully')
   ```

2. **Usar HTTPS** en producción (obligatorio para MSAL)
   ```typescript
   // Vite config
   server: {
     https: true,
   }
   ```

3. **Validar tokens en backend**
   ```csharp
   // Azure Functions C#
   [Authorize]
   public IActionResult Get() {
     var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
     // ...
   }
   ```

4. **Usar `sessionStorage`** en vez de `localStorage`
   - Tokens se borran al cerrar browser
   - Más seguro contra XSS attacks

5. **Definir scopes mínimos** necesarios
   ```typescript
   // ❌ Mal (pedir más permisos de los necesarios)
   scopes: ['User.Read', 'Mail.Send', 'Calendars.ReadWrite']

   // ✅ Bien (solo lo necesario)
   scopes: ['User.Read']
   ```

6. **Configurar Token Lifetime** en Azure Portal
   - Access Token: 1 hora (default)
   - Refresh Token: 90 días (default)
   - Reducir si necesitas mayor seguridad

---

## Testing en Desarrollo

### 1. Crear App Registration de Dev

- **Nombre**: "My App - Development"
- **Redirect URI**: `http://localhost:5173`
- **Scopes**: Solo `User.Read` y `access_as_user`

### 2. Usar diferentes `.env` por ambiente

```bash
# .env.development
VITE_AZURE_CLIENT_ID=dev-client-id
VITE_AZURE_TENANT_ID=dev-tenant-id
VITE_API_BASE_URL=http://localhost:7071/api

# .env.production
VITE_AZURE_CLIENT_ID=prod-client-id
VITE_AZURE_TENANT_ID=prod-tenant-id
VITE_API_BASE_URL=https://prod-app.azurewebsites.net/api
```

### 3. Testing de Logout

```typescript
// Forzar logout completo (borrar session de Azure AD)
await instance.logoutRedirect({
  postLogoutRedirectUri: '/',
  onRedirectNavigate: () => {
    sessionStorage.clear()
    return true
  }
})
```

---

## Troubleshooting

### Problema: "AADSTS50011: No reply address is registered"

**Causa:** Redirect URI en código no coincide con Azure Portal

**Solución:**

1. Azure Portal → App Registration → **Authentication**
2. Verificar que Redirect URIs incluya:
   - Development: `http://localhost:5173`
   - Production: `https://your-app.azurestaticapps.net`

---

### Problema: "Token acquisition failed silently"

**Causa:** Token expirado y refresh token también expiró

**Solución:**

```typescript
try {
  const response = await instance.acquireTokenSilent(tokenRequest)
} catch (err) {
  // Redirigir para re-login
  await instance.acquireTokenRedirect(tokenRequest)
}
```

---

### Problema: "401 Unauthorized" en API calls

**Causa:** Backend no valida correctamente el token

**Solución:**

1. Verificar que API scope coincida con backend:
   ```typescript
   // Frontend
   scopes: [`api://${clientId}/access_as_user`]

   // Backend debe estar configurado con el mismo Application ID URI
   ```

2. Verificar que backend valida token signature y expiration

---

### Problema: "Correlation ID mismatch"

**Causa:** Múltiples instances de MSAL (re-renders)

**Solución:**

```typescript
// main.tsx
const msalInstance = new PublicClientApplication(msalConfig)

// ✅ Crear instance FUERA del componente
ReactDOM.createRoot(document.getElementById('root')!).render(
  <MsalProvider instance={msalInstance}>
    <App />
  </MsalProvider>
)
```

---

## Recursos Adicionales

- [MSAL.js Documentation](https://github.com/AzureAD/microsoft-authentication-library-for-js/tree/dev/lib/msal-react)
- [Azure AD App Registration Guide](https://docs.microsoft.com/azure/active-directory/develop/quickstart-register-app)
- [Microsoft Graph API Explorer](https://developer.microsoft.com/graph/graph-explorer)
- [MSAL React Samples](https://github.com/Azure-Samples/ms-identity-javascript-react-tutorial)
