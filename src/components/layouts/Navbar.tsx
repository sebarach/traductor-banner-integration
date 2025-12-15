import { useMsal } from '@azure/msal-react'
import { useAuth } from '../../context/AuthContext'
import { useTheme } from '../../context/ThemeContext'
import { Button } from '@/components/ui/button'
import { Building2, Moon, Sun, Menu } from 'lucide-react'
import { UserDropdown } from './UserDropdown'

interface NavbarProps {
  onToggleSidebar: () => void
}

export function Navbar({ onToggleSidebar }: NavbarProps) {
  const { instance } = useMsal()
  const { user } = useAuth()
  const { theme, toggleTheme } = useTheme()

  return (
    <header className="bg-gradient-to-r from-slate-900 via-gray-900 to-slate-800 dark:from-black dark:via-gray-950 dark:to-black shadow-2xl sticky top-0 z-50 border-b border-gray-800 dark:border-gray-950">
      <div className="flex items-center justify-between px-6 py-4">
        {/* Logo y toggle */}
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={onToggleSidebar}
            className="text-gray-300 hover:text-white hover:bg-gray-800 dark:hover:bg-gray-900"
            aria-label="Toggle sidebar"
          >
            <Menu className="h-6 w-6" />
          </Button>

          <div className="flex items-center gap-3">
            <div className="bg-gradient-to-br from-blue-600 to-indigo-600 dark:from-blue-500 dark:to-indigo-500 p-2.5 rounded-xl shadow-lg">
              <Building2 className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-white text-xl font-bold tracking-tight">
                Sistema Universitario
              </h1>
              <p className="text-gray-400 dark:text-gray-500 text-sm">
                Gestión Académica
              </p>
            </div>
          </div>
        </div>

        {/* User menu y controles */}
        <div className="flex items-center gap-3">
          {/* Theme Toggle Button */}
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleTheme}
            className="text-gray-300 hover:text-white hover:bg-gray-800 dark:hover:bg-gray-900 border border-gray-700 dark:border-gray-800"
            aria-label="Toggle theme"
            title={theme === 'light' ? 'Modo Oscuro' : 'Modo Claro'}
          >
            {theme === 'light' ? (
              <Moon className="h-5 w-5" />
            ) : (
              <Sun className="h-5 w-5" />
            )}
          </Button>

          {/* User Dropdown */}
          <UserDropdown user={user} instance={instance} />
        </div>
      </div>
    </header>
  )
}
