import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { useMsal } from '@azure/msal-react'
import { AccountInfo } from '@azure/msal-browser'

interface UserInfo {
  name: string
  email: string
  username: string
  tenantId?: string
  localAccountId?: string
  homeAccountId?: string
  photoUrl?: string
}

interface AuthContextType {
  user: UserInfo | null
  isAuthenticated: boolean
  isLoading: boolean
  account: AccountInfo | null
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const { accounts, inProgress, instance } = useMsal()
  const [user, setUser] = useState<UserInfo | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    let photoUrl: string | undefined

    async function loadUserData() {
      if (inProgress === 'none') {
        if (accounts.length > 0) {
          const account: AccountInfo = accounts[0]

          // Crear objeto de usuario básico
          const userInfo: UserInfo = {
            name: account.name || 'Usuario',
            email: account.username || '',
            username: account.username || '',
            tenantId: account.tenantId,
            localAccountId: account.localAccountId,
            homeAccountId: account.homeAccountId,
          }

          // Intentar obtener la foto del usuario desde Microsoft Graph
          try {
            const response = await instance.acquireTokenSilent({
              scopes: ['User.Read'],
              account: account,
            })

            console.log('🔐 Token Response:', response)
            console.log('👤 Account Info:', account)

            if (response.accessToken) {
              // Obtener información completa del usuario desde Graph API
              const userInfoResponse = await fetch('https://graph.microsoft.com/v1.0/me', {
                headers: {
                  'Authorization': `Bearer ${response.accessToken}`,
                },
              })

              if (userInfoResponse.ok) {
                const graphUserData = await userInfoResponse.json()
                console.log('📊 Microsoft Graph User Data (me):', graphUserData)
              }

              // Obtener la foto del usuario
              const photoResponse = await fetch('https://graph.microsoft.com/v1.0/me/photo/$value', {
                headers: {
                  'Authorization': `Bearer ${response.accessToken}`,
                },
              })

              if (photoResponse.ok) {
                const blob = await photoResponse.blob()
                photoUrl = URL.createObjectURL(blob)
                userInfo.photoUrl = photoUrl
                console.log('📸 Foto del usuario cargada correctamente')
              } else {
                console.log('⚠️ No se encontró foto del usuario (status:', photoResponse.status, ')')
              }
            }
          } catch (error) {
            // Si falla obtener la foto, continuamos sin ella
            console.log('❌ No se pudo obtener la foto del usuario:', error)
          }

          setUser(userInfo)
        } else {
          setUser(null)
        }
        setIsLoading(false)
      }
    }

    loadUserData()

    // Cleanup: Liberar la URL del objeto cuando el componente se desmonte
    return () => {
      if (photoUrl) {
        URL.revokeObjectURL(photoUrl)
      }
    }
  }, [accounts, inProgress, instance])

  const value: AuthContextType = {
    user,
    isAuthenticated: !!user,
    isLoading,
    account: accounts.length > 0 ? accounts[0] : null,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
