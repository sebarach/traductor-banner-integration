import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMsal } from '@azure/msal-react'
import { useAuth } from '../context/AuthContext'

function Dashboard() {
  const navigate = useNavigate()
  const { instance } = useMsal()
  const { user, isAuthenticated, isLoading } = useAuth()
  const [isLoggingOut, setIsLoggingOut] = useState(false)

  // Proteger ruta: redirigir a login si no autenticado
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      navigate('/login', { replace: true })
    }
  }, [isAuthenticated, isLoading, navigate])

  const handleLogout = async () => {
    setIsLoggingOut(true)
    try {
      await instance.logoutRedirect({
        postLogoutRedirectUri: '/',
      })
    } catch (err) {
      console.error('Error al cerrar sesión:', err)
      setIsLoggingOut(false)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <svg className="animate-spin h-12 w-12 text-blue-600 mx-auto mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <p className="text-gray-600">Cargando...</p>
        </div>
      </div>
    )
  }

  if (!isAuthenticated || !user) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">
            Dashboard POC SSO
          </h1>
          <button
            onClick={handleLogout}
            disabled={isLoggingOut}
            className="bg-red-600 hover:bg-red-700 text-white font-semibold py-2 px-4 rounded-lg transition duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoggingOut ? 'Cerrando sesión...' : 'Cerrar Sesión'}
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Card */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <div className="flex items-center mb-4">
            <div className="bg-blue-100 rounded-full h-16 w-16 flex items-center justify-center mr-4">
              <span className="text-2xl font-bold text-blue-600">
                {user.name.charAt(0).toUpperCase()}
              </span>
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                ¡Bienvenido, {user.name}!
              </h2>
              <p className="text-gray-600">{user.email}</p>
            </div>
          </div>
          <div className="border-t pt-4">
            <p className="text-sm text-green-600 font-semibold mb-2">
              ✓ Autenticación exitosa con Azure AD
            </p>
            <p className="text-gray-600 text-sm">
              Has iniciado sesión correctamente usando Single Sign-On (SSO).
            </p>
          </div>
        </div>

        {/* Info Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">
              Información del Usuario
            </h3>
            <dl className="space-y-2">
              <div>
                <dt className="text-sm font-medium text-gray-500">Nombre completo:</dt>
                <dd className="text-sm text-gray-900 font-semibold">{user.name}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Email / Username:</dt>
                <dd className="text-sm text-gray-900">{user.email}</dd>
              </div>
              {user.tenantId && (
                <div>
                  <dt className="text-sm font-medium text-gray-500">Tenant ID:</dt>
                  <dd className="text-xs text-gray-700 font-mono">{user.tenantId}</dd>
                </div>
              )}
              {user.localAccountId && (
                <div>
                  <dt className="text-sm font-medium text-gray-500">Account ID:</dt>
                  <dd className="text-xs text-gray-700 font-mono break-all">{user.localAccountId}</dd>
                </div>
              )}
            </dl>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">
              Estado de Autenticación
            </h3>
            <div className="space-y-3">
              <div className="flex items-center">
                <span className="inline-block w-3 h-3 bg-green-500 rounded-full mr-2"></span>
                <span className="text-sm text-gray-700">Sesión activa</span>
              </div>
              <div className="flex items-center">
                <span className="inline-block w-3 h-3 bg-green-500 rounded-full mr-2"></span>
                <span className="text-sm text-gray-700">Token válido</span>
              </div>
              <div className="flex items-center">
                <span className="inline-block w-3 h-3 bg-green-500 rounded-full mr-2"></span>
                <span className="text-sm text-gray-700">Azure AD conectado</span>
              </div>
            </div>
          </div>
        </div>

        {/* Data Card */}
        <div className="bg-white rounded-lg shadow p-6 mt-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-3">
            Dashboard Seguro - Datos de Prueba
          </h3>
          <p className="text-gray-600 mb-4">
            Este es un área protegida que solo es accesible después de autenticarse con Azure AD.
          </p>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-800">
              💡 <strong>Nota:</strong> Esta es una POC básica. En producción, aquí mostrarías datos reales
              obtenidos de APIs protegidas usando el token de acceso de Azure AD.
            </p>
          </div>
        </div>
      </main>
    </div>
  )
}

export default Dashboard
