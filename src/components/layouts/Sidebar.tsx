import { Link, useLocation } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { cn } from '@/lib/utils'
import { Home, Link as LinkIcon, Shield } from 'lucide-react'
import { useAuthorization } from '@/context/AuthorizationContext'

interface NavItem {
  name: string
  path: string
  icon: React.ReactNode
}

interface SidebarProps {
  isOpen: boolean
}

export function Sidebar({ isOpen }: SidebarProps) {
  const location = useLocation()
  const { canAccessIntegrations, canManageUsers } = useAuthorization()

  const navItems: NavItem[] = [
    { name: 'Inicio', path: '/dashboard', icon: <Home className="h-5 w-5" /> },
    ...(canAccessIntegrations() ? [
      { name: 'Integraciones Banner', path: '/dashboard/banner-integrations', icon: <LinkIcon className="h-5 w-5" /> }
    ] : []),
    ...(canManageUsers() ? [
      { name: 'Usuarios y Roles', path: '/dashboard/users-roles', icon: <Shield className="h-5 w-5" /> }
    ] : []),
  ]

  const isActive = (path: string) => {
    if (path === '/dashboard') {
      return location.pathname === '/dashboard'
    }
    return location.pathname.startsWith(path)
  }

  return (
    <aside
      className={cn(
        'bg-gradient-to-b from-slate-900 to-slate-800 dark:from-black dark:to-gray-950 shadow-2xl transition-all duration-300 flex-shrink-0 flex flex-col border-r border-gray-800 dark:border-gray-950',
        isOpen ? 'w-64' : 'w-0'
      )}
    >
      {/* Navigation */}
      <nav className="p-4 space-y-2 flex-1 overflow-hidden">
        {navItems.map((item) => (
          <Link key={item.path} to={item.path}>
            <Button
              variant={isActive(item.path) ? 'default' : 'ghost'}
              className={cn(
                'w-full justify-start gap-3 transition-all',
                isActive(item.path)
                  ? 'bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-700 dark:to-indigo-700 text-white shadow-lg'
                  : 'text-gray-300 dark:text-gray-400 hover:bg-gray-800 dark:hover:bg-gray-900 hover:text-white'
              )}
            >
              {item.icon}
              <span className="font-medium whitespace-nowrap">{item.name}</span>
            </Button>
          </Link>
        ))}
      </nav>

      {/* Sidebar Footer */}
      <div className="p-4 border-t border-gray-800 dark:border-gray-950 bg-gradient-to-br from-gray-900 to-slate-900 dark:from-gray-950 dark:to-black overflow-hidden">
        <div className="text-xs text-gray-400 dark:text-gray-600 text-center space-y-1">
          <p className="font-semibold text-gray-300 dark:text-gray-500">
            UAI - Universidad
          </p>
          <p>Traductor SIS</p>
          <Separator className="my-2 bg-gray-800 dark:bg-gray-950" />
          <p className="text-gray-500 dark:text-gray-700">v1.0.0</p>
        </div>
      </div>
    </aside>
  )
}
