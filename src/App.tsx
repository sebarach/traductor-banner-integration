import { useEffect, useState } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { MsalProvider } from '@azure/msal-react'
import { PublicClientApplication, EventType } from '@azure/msal-browser'
import { AuthProvider } from './context/AuthContext'
import { AuthorizationProvider } from './context/AuthorizationContext'
import { ThemeProvider } from './context/ThemeContext'
import Login from './pages/Login'
import Home from './pages/Home'
import BannerIntegrations from './pages/BannerIntegrations'
import Unauthorized from './pages/Unauthorized'
import AccountDisabled from './pages/AccountDisabled'
import UsersRoles from './pages/UsersRoles'
import DashboardLayout from './components/DashboardLayout'
import ProtectedRoute from './components/ProtectedRoute'
import TabProtectedRoute from './components/TabProtectedRoute'

// Verificar variables de entorno
const clientId = import.meta.env.VITE_AZURE_CLIENT_ID
const tenantId = import.meta.env.VITE_AZURE_TENANT_ID
const redirectUri = import.meta.env.VITE_AZURE_REDIRECT_URI || 'https://localhost:5173'

// Configuración de MSAL
let msalInstance: PublicClientApplication | null = null

if (clientId && tenantId) {
  const msalConfig = {
    auth: {
      clientId: clientId,
      authority: `https://login.microsoftonline.com/${tenantId}`,
      redirectUri: redirectUri,
      postLogoutRedirectUri: redirectUri,
      navigateToLoginRequestUrl: false,
    },
    cache: {
      cacheLocation: 'sessionStorage',
      storeAuthStateInCookie: false,
    },
  }

  msalInstance = new PublicClientApplication(msalConfig)

  // CRÍTICO: Manejar el callback de redirect
  msalInstance.initialize().then(() => {
    // Manejar eventos de autenticación
    msalInstance!.addEventCallback((event) => {
      if (event.eventType === EventType.LOGIN_SUCCESS && event.payload) {
        const payload = event.payload as any
        if (payload.account) {
          msalInstance!.setActiveAccount(payload.account)
        }
      }
    })

    // Manejar el redirect response
    msalInstance!.handleRedirectPromise()
      .then((response) => {
        if (response && response.account) {
          msalInstance!.setActiveAccount(response.account)
        }
      })
      .catch((error) => {
        console.error('Error de autenticación:', error)
      })
  })
}

function App() {
  const [isInitialized, setIsInitialized] = useState(false)

  useEffect(() => {
    if (msalInstance) {
      msalInstance.initialize().then(() => {
        setIsInitialized(true)
      })
    } else {
      setIsInitialized(true)
    }
  }, [])

  // Si faltan variables de entorno, mostrar error
  if (!clientId || !tenantId || !msalInstance) {
    throw new Error('Faltan variables de entorno. Copia .env.example a .env y configura VITE_AZURE_CLIENT_ID y VITE_AZURE_TENANT_ID')
  }

  // Esperar a que MSAL se inicialice
  if (!isInitialized) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <svg className="animate-spin h-12 w-12 text-blue-600 mx-auto mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <p className="text-gray-600">Inicializando...</p>
        </div>
      </div>
    )
  }

  return (
    <ThemeProvider>
      <MsalProvider instance={msalInstance}>
        <AuthProvider>
          <AuthorizationProvider>
            <BrowserRouter>
              <Routes>
                <Route path="/" element={<Navigate to="/login" replace />} />
                <Route path="/login" element={<Login />} />
                <Route path="/unauthorized" element={<Unauthorized />} />
                <Route path="/account-disabled" element={<AccountDisabled />} />
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
                <Route
                  path="/dashboard/banner-integrations"
                  element={
                    <TabProtectedRoute tabCode="integrations">
                      <DashboardLayout>
                        <BannerIntegrations />
                      </DashboardLayout>
                    </TabProtectedRoute>
                  }
                />
                <Route
                  path="/dashboard/users-roles"
                  element={
                    <TabProtectedRoute tabCode="users-roles">
                      <DashboardLayout>
                        <UsersRoles />
                      </DashboardLayout>
                    </TabProtectedRoute>
                  }
                />
              </Routes>
            </BrowserRouter>
          </AuthorizationProvider>
        </AuthProvider>
      </MsalProvider>
    </ThemeProvider>
  )
}

export default App
