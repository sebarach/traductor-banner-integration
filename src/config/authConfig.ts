import { Configuration, LogLevel } from '@azure/msal-browser'

// Validar que las variables de entorno existan
const clientId = import.meta.env.VITE_AZURE_CLIENT_ID
const tenantId = import.meta.env.VITE_AZURE_TENANT_ID
const redirectUri = import.meta.env.VITE_AZURE_REDIRECT_URI || 'http://localhost:5173'

if (!clientId || !tenantId) {
  throw new Error(
    'Faltan variables de entorno requeridas. Verifica tu archivo .env:\n' +
    '- VITE_AZURE_CLIENT_ID\n' +
    '- VITE_AZURE_TENANT_ID'
  )
}

// Configuración de MSAL
export const msalConfig: Configuration = {
  auth: {
    clientId: clientId,
    authority: import.meta.env.VITE_AZURE_AUTHORITY || `https://login.microsoftonline.com/${tenantId}`,
    redirectUri: redirectUri,
    postLogoutRedirectUri: redirectUri,
    navigateToLoginRequestUrl: true,
  },
  cache: {
    cacheLocation: 'sessionStorage', // 'localStorage' o 'sessionStorage'
    storeAuthStateInCookie: false, // Set to true para IE11/Edge
  },
  system: {
    loggerOptions: {
      loggerCallback: (level, message, containsPii) => {
        if (containsPii) return
        switch (level) {
          case LogLevel.Error:
            console.error(message)
            return
          case LogLevel.Info:
            console.info(message)
            return
          case LogLevel.Verbose:
            console.debug(message)
            return
          case LogLevel.Warning:
            console.warn(message)
            return
        }
      },
    },
  },
}

// Scopes para Microsoft Graph API
export const loginRequest = {
  scopes: ['User.Read'],
}

// Scopes adicionales si necesitas más info del usuario
export const graphConfig = {
  graphMeEndpoint: 'https://graph.microsoft.com/v1.0/me',
}
