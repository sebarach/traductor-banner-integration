import { useState } from 'react'
import { IPublicClientApplication } from '@azure/msal-browser'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { User, Settings, LogOut, Loader2 } from 'lucide-react'

interface User {
  name: string
  email: string
  photoUrl?: string
  tenantId?: string
}

interface UserDropdownProps {
  user: User | null
  instance: IPublicClientApplication
}

export function UserDropdown({ user, instance }: UserDropdownProps) {
  const [isLoggingOut, setIsLoggingOut] = useState(false)

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

  if (!user) return null

  const initials = user.name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className="flex items-center gap-3 hover:bg-gray-800 dark:hover:bg-gray-900 h-auto px-2 py-2"
        >
          <div className="text-right hidden md:block">
            <p className="text-white font-semibold text-sm">{user.name}</p>
            <p className="text-gray-400 dark:text-gray-500 text-xs">{user.email}</p>
          </div>

          <Avatar className="h-10 w-10 border-2 border-gray-700 dark:border-gray-800 ring-2 ring-transparent hover:ring-blue-500 transition-all">
            <AvatarImage src={user.photoUrl} alt={user.name} />
            <AvatarFallback className="bg-gradient-to-br from-blue-600 to-indigo-600 dark:from-blue-500 dark:to-indigo-500 text-white font-bold">
              {initials}
            </AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent className="w-72" align="end" sideOffset={8}>
        {/* User Info Header */}
        <DropdownMenuLabel className="bg-gradient-to-r from-slate-50 to-blue-50 dark:from-gray-900 dark:to-gray-800 pb-3">
          <div className="flex items-center gap-3">
            <Avatar className="h-12 w-12">
              <AvatarImage src={user.photoUrl} alt={user.name} />
              <AvatarFallback className="bg-primary text-primary-foreground font-bold">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate">
                {user.name}
              </p>
              <p className="text-xs text-gray-600 dark:text-gray-400 truncate">
                {user.email}
              </p>
            </div>
          </div>
        </DropdownMenuLabel>

        <DropdownMenuSeparator />

        {/* Menu Items */}
        <DropdownMenuItem className="cursor-pointer">
          <User className="mr-2 h-4 w-4" />
          <span>Mi Perfil</span>
        </DropdownMenuItem>

        <DropdownMenuItem className="cursor-pointer">
          <Settings className="mr-2 h-4 w-4" />
          <span>Configuración</span>
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        {/* Logout */}
        <DropdownMenuItem
          onClick={handleLogout}
          disabled={isLoggingOut}
          className="cursor-pointer text-red-600 dark:text-red-400 focus:text-red-700 dark:focus:text-red-300 focus:bg-red-50 dark:focus:bg-red-900/20"
        >
          {isLoggingOut ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              <span>Cerrando sesión...</span>
            </>
          ) : (
            <>
              <LogOut className="mr-2 h-4 w-4" />
              <span>Cerrar Sesión</span>
            </>
          )}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
