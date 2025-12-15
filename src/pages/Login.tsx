import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMsal } from '@azure/msal-react'
import { loginRequest } from '../config/authConfig'
import { useAuth } from '../context/AuthContext'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { LoadingSpinner } from '@/components/shared/LoadingSpinner'
import { Building2, Shield, AlertCircle } from 'lucide-react'

function Login() {
  const navigate = useNavigate()
  const { instance, inProgress } = useMsal()
  const { isAuthenticated, isLoading } = useAuth()
  const [error, setError] = useState<string | null>(null)
  const [isLoggingIn, setIsLoggingIn] = useState(false)

  // Redirigir si ya está autenticado
  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      navigate('/dashboard', { replace: true })
    }
  }, [isAuthenticated, isLoading, navigate])

  const handleLogin = async () => {
    // Validar variables de entorno
    const clientId = import.meta.env.VITE_AZURE_CLIENT_ID
    const tenantId = import.meta.env.VITE_AZURE_TENANT_ID

    if (!clientId || !tenantId) {
      setError('Error de configuración: Faltan variables de entorno en .env')
      return
    }

    setError(null)
    setIsLoggingIn(true)

    try {
      await instance.loginRedirect(loginRequest)
    } catch (err) {
      console.error('Error al iniciar sesión:', err)
      setError('Error al iniciar sesión. Intenta nuevamente.')
      setIsLoggingIn(false)
    }
  }

  const isButtonDisabled = inProgress !== 'none' || isLoggingIn || isLoading

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 dark:from-gray-950 dark:via-gray-900 dark:to-blue-950 flex items-center justify-center">
        <LoadingSpinner size="xl" text="Verificando sesión..." />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 dark:from-gray-950 dark:via-gray-900 dark:to-blue-950 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md space-y-8">
        {/* Header con Logo y Branding */}
        <div className="text-center space-y-3">
          {/* Logo Institucional */}
          <div className="flex justify-center">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl blur-xl opacity-40 animate-pulse"></div>
              <div className="relative bg-gradient-to-br from-blue-600 to-indigo-600 p-4 rounded-2xl shadow-2xl">
                <Building2 className="h-12 w-12 text-white" strokeWidth={2} />
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">
              Sistema Universitario
            </h1>
            <p className="text-sm text-muted-foreground">
              Gestión Académica - Traductor SIS
            </p>
          </div>
        </div>

        {/* Card de Login */}
        <Card className="shadow-2xl border-0 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm">
          <CardHeader className="space-y-1 pb-4">
            <CardTitle className="text-2xl text-center">Iniciar Sesión</CardTitle>
            <CardDescription className="text-center">
              Autenticación segura con Microsoft Azure AD
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Error Alert */}
            {error && (
              <Alert variant="destructive" className="animate-in slide-in-from-top-2">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {/* Botón de Login con Microsoft */}
            <Button
              onClick={handleLogin}
              disabled={isButtonDisabled}
              size="lg"
              className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg hover:shadow-xl transition-all duration-200 h-12"
            >
              {isLoggingIn ? (
                <span className="flex items-center justify-center gap-2">
                  <LoadingSpinner size="sm" />
                  <span>Redirigiendo a Microsoft...</span>
                </span>
              ) : (
                <span className="flex items-center justify-center gap-3">
                  {/* Microsoft Logo SVG */}
                  <svg className="h-5 w-5" viewBox="0 0 21 21" fill="currentColor">
                    <rect x="1" y="1" width="9" height="9" fill="currentColor" />
                    <rect x="1" y="11" width="9" height="9" fill="currentColor" />
                    <rect x="11" y="1" width="9" height="9" fill="currentColor" />
                    <rect x="11" y="11" width="9" height="9" fill="currentColor" />
                  </svg>
                  <span className="font-semibold">Continuar con Microsoft</span>
                </span>
              )}
            </Button>

            {/* Info adicional */}
            <div className="pt-4 space-y-3">
              <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
                <Shield className="h-3.5 w-3.5" />
                <span>Conexión segura y encriptada</span>
              </div>

              <p className="text-xs text-center text-muted-foreground">
                Serás redirigido a la página de inicio de sesión de Microsoft
                para autenticarte con tu cuenta institucional
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center space-y-2">
          <p className="text-xs text-muted-foreground">
            ¿Problemas para iniciar sesión?{' '}
            <a href="#" className="text-primary hover:underline font-medium">
              Contacta a soporte
            </a>
          </p>
          <p className="text-xs text-muted-foreground">
            UAI - Universidad Adolfo Ibáñez • v1.0.0
          </p>
        </div>
      </div>
    </div>
  )
}

export default Login
