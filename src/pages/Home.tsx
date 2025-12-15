import { useAuth } from '../context/AuthContext'
import { PageHeader } from '@/components/shared/PageHeader'
import { StatCard } from '@/components/shared/StatCard'
import { UserAvatar } from '@/components/shared/UserAvatar'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Button } from '@/components/ui/button'
import {
  User,
  Shield,
  Zap,
  Calendar,
  Info,
  CheckCircle2,
  ArrowRight
} from 'lucide-react'
import { Link } from 'react-router-dom'

export default function Home() {
  const { user } = useAuth()

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <PageHeader
        title={`¡Bienvenido, ${user?.name}!`}
        description="Sistema de Gestión Universitaria - Traductor SIS"
        icon={<User className="h-8 w-8" />}
        variant="gradient"
        stats={[
          {
            label: 'Estado',
            value: 'Activo',
            icon: <CheckCircle2 className="h-5 w-5" />
          },
          {
            label: 'Email',
            value: user?.email.split('@')[0] || '',
            icon: '📧'
          },
          {
            label: 'Autenticación',
            value: 'Azure AD',
            icon: <Shield className="h-5 w-5" />
          }
        ]}
      />

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard
          title="Información de Usuario"
          value={user?.name || 'N/A'}
          description={user?.email || ''}
          icon={<User className="h-5 w-5" />}
          variant="primary"
        />

        <StatCard
          title="Estado de Sesión"
          value="Activa"
          description="Token válido y autenticado"
          icon={<Shield className="h-5 w-5" />}
          variant="success"
          trend={{
            value: 100,
            label: 'Seguridad óptima'
          }}
        />

        <StatCard
          title="Módulos Disponibles"
          value="1"
          description="Integraciones Banner activas"
          icon={<Zap className="h-5 w-5" />}
          variant="default"
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* User Details Card */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <User className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1">
                <CardTitle className="text-lg">Detalles del Usuario</CardTitle>
                <CardDescription>Información de tu cuenta</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <UserAvatar
              name={user?.name || ''}
              email={user?.email || ''}
              photoUrl={user?.photoUrl}
              size="lg"
              showInfo
            />

            <Separator />

            <div className="space-y-3">
              <div>
                <p className="text-xs font-medium text-muted-foreground">Nombre completo</p>
                <p className="text-sm font-semibold text-foreground">{user?.name}</p>
              </div>

              <div>
                <p className="text-xs font-medium text-muted-foreground">Email institucional</p>
                <p className="text-sm text-foreground">{user?.email}</p>
              </div>

              {user?.tenantId && (
                <div>
                  <p className="text-xs font-medium text-muted-foreground">Tenant ID</p>
                  <p className="text-xs font-mono text-muted-foreground break-all bg-muted p-2 rounded">
                    {user.tenantId}
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Auth Status & Quick Access */}
        <div className="lg:col-span-2 space-y-6">
          {/* Authentication Status */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-green-500/10">
                  <Shield className="h-5 w-5 text-green-600 dark:text-green-500" />
                </div>
                <div className="flex-1">
                  <CardTitle className="text-lg">Estado de Autenticación</CardTitle>
                  <CardDescription>Verificación de seguridad activa</CardDescription>
                </div>
                <Badge variant="outline" className="border-green-500/50 text-green-600 dark:text-green-500">
                  <div className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></div>
                  Conectado
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                  <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-500" />
                  <div>
                    <p className="text-sm font-semibold text-foreground">Sesión Activa</p>
                    <p className="text-xs text-muted-foreground">Autenticado</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                  <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-500" />
                  <div>
                    <p className="text-sm font-semibold text-foreground">Token Válido</p>
                    <p className="text-xs text-muted-foreground">JWT activo</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                  <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-500" />
                  <div>
                    <p className="text-sm font-semibold text-foreground">Azure AD</p>
                    <p className="text-xs text-muted-foreground">Conectado</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Quick Access */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-indigo-500/10">
                  <Zap className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                </div>
                <div className="flex-1">
                  <CardTitle className="text-lg">Acceso Rápido</CardTitle>
                  <CardDescription>Módulos y funcionalidades</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <Link to="/dashboard/banner-integrations">
                <Button
                  variant="outline"
                  className="w-full justify-between hover:bg-primary/5 hover:border-primary/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <Calendar className="h-4 w-4" />
                    <div className="text-left">
                      <p className="font-semibold text-sm">Integraciones Banner</p>
                      <p className="text-xs text-muted-foreground">Períodos Académicos</p>
                    </div>
                  </div>
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>

              <div className="p-4 bg-muted/50 rounded-lg border border-dashed">
                <p className="text-sm text-muted-foreground text-center">
                  Más módulos próximamente...
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* System Information */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-500/10">
              <Info className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <CardTitle className="text-lg">Sistema de Gestión Universitaria</CardTitle>
              <CardDescription>Información técnica del sistema</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground leading-relaxed">
            Este es un sistema seguro de gestión académica integrado con Azure AD para Single Sign-On (SSO).
            Los datos se obtienen de APIs protegidas usando tokens JWT de Azure Entra ID.
          </p>

          <div className="bg-blue-50 dark:bg-blue-950/30 border-l-4 border-blue-600 dark:border-blue-500 rounded-r-lg p-4">
            <div className="flex items-start gap-3">
              <Info className="h-5 w-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
              <div className="space-y-2">
                <p className="text-sm font-semibold text-blue-900 dark:text-blue-100">
                  Información Técnica
                </p>
                <p className="text-sm text-blue-800 dark:text-blue-200">
                  Este sistema utiliza <Badge variant="secondary" className="mx-1">MSAL.js</Badge> para autenticación,
                  <Badge variant="secondary" className="mx-1">React Router</Badge> para navegación,
                  y se comunica con el backend a través de <Badge variant="secondary" className="mx-1">Azure Functions</Badge>.
                  Todos los endpoints están protegidos con autenticación JWT.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
