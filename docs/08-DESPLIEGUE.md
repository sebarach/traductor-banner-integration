# Despliegue en Azure Static Web Apps

## Propósito

Esta guía explica cómo desplegar el proyecto completo (frontend React + backend Azure Functions) en Azure Static Web Apps, configurar CI/CD con GitHub Actions, y gestionar diferentes ambientes (dev, staging, production).

---

## Arquitectura de Despliegue

```
┌─────────────────────────────────────────────────────────────┐
│                  Azure Static Web App                       │
│                                                             │
│  ┌──────────────────┐        ┌──────────────────────────┐  │
│  │   Frontend       │        │   Backend Functions      │  │
│  │   (React SPA)    │───────▶│   (Azure Functions)      │  │
│  │   /              │  AJAX  │   /api/*                 │  │
│  └──────────────────┘        └──────────────────────────┘  │
│                                                             │
│  Hosting: Azure CDN (Glo Global)                            │
│  SSL: Auto-provisioned (*.azurestaticapps.net)             │
│  Custom Domain: Configurable                                │
└─────────────────────────────────────────────────────────────┘
                           │
                           │ Deployment
                           ▼
                  ┌─────────────────┐
                  │  GitHub Repo    │
                  │  (main branch)  │
                  └─────────────────┘
                           │
                           │ Webhook
                           ▼
                  ┌─────────────────┐
                  │ GitHub Actions  │
                  │ (Auto CI/CD)    │
                  └─────────────────┘
```

---

## Pre-requisitos

### 1. Cuenta de Azure

- Suscripción activa de Azure
- Permisos para crear recursos (Contributor o Owner)

### 2. Repositorio Git

- Código en GitHub, GitLab, Bitbucket o Azure DevOps
- Branch principal (main/master) con código estable

### 3. Azure CLI (Opcional)

```bash
# Instalar Azure CLI
winget install Microsoft.AzureCLI

# Login
az login

# Verificar suscripción
az account show
```

---

## Crear Azure Static Web App

### Opción 1: Azure Portal (Recomendado para primera vez)

1. **Abrir Azure Portal**: [https://portal.azure.com](https://portal.azure.com)

2. **Crear Recurso**:
   - Click en "Create a resource"
   - Buscar "Static Web App"
   - Click "Create"

3. **Configuración Básica**:
   ```
   Subscription: [Tu suscripción]
   Resource Group: [Crear nuevo] → "react-sso-rg"
   Name: "react-sso-app"
   Region: "West US 2" (o tu región preferida)
   Plan type: Free (para desarrollo) o Standard (para producción)
   ```

4. **Configuración de Deployment**:
   ```
   Source: GitHub
   Organization: [Tu GitHub org]
   Repository: [Tu repo]
   Branch: main
   ```

5. **Build Configuration**:
   ```
   Build Presets: React
   App location: "/"
   Api location: "api"
   Output location: "dist"
   ```

6. **Review + Create**: Esperar ~2 minutos

7. **Resultado**: Azure genera:
   - Static Web App con URL: `https://<nombre>.azurestaticapps.net`
   - GitHub Action workflow en `.github/workflows/azure-static-web-apps-<nombre>.yml`

---

### Opción 2: Azure CLI

```bash
# Variables
RESOURCE_GROUP="react-sso-rg"
APP_NAME="react-sso-app"
LOCATION="westus2"
GITHUB_REPO="https://github.com/<user>/<repo>"
GITHUB_TOKEN="<tu-github-token>"

# Crear resource group
az group create \
  --name $RESOURCE_GROUP \
  --location $LOCATION

# Crear Static Web App
az staticwebapp create \
  --name $APP_NAME \
  --resource-group $RESOURCE_GROUP \
  --source $GITHUB_REPO \
  --location $LOCATION \
  --branch main \
  --app-location "/" \
  --api-location "api" \
  --output-location "dist" \
  --token $GITHUB_TOKEN
```

---

## Configuración del Workflow (GitHub Actions)

### Archivo Generado: `.github/workflows/azure-static-web-apps-<nombre>.yml`

```yaml
name: Azure Static Web Apps CI/CD

on:
  push:
    branches:
      - main
  pull_request:
    types: [opened, synchronize, reopened, closed]
    branches:
      - main

jobs:
  build_and_deploy_job:
    if: github.event_name == 'push' || (github.event_name == 'pull_request' && github.event.action != 'closed')
    runs-on: ubuntu-latest
    name: Build and Deploy Job
    steps:
      - uses: actions/checkout@v3
        with:
          submodules: true

      - name: Build And Deploy
        id: builddeploy
        uses: Azure/static-web-apps-deploy@v1
        with:
          azure_static_web_apps_api_token: ${{ secrets.AZURE_STATIC_WEB_APPS_API_TOKEN }}
          repo_token: ${{ secrets.GITHUB_TOKEN }}
          action: "upload"
          app_location: "/"
          api_location: "api"
          output_location: "dist"

  close_pull_request_job:
    if: github.event_name == 'pull_request' && github.event.action == 'closed'
    runs-on: ubuntu-latest
    name: Close Pull Request Job
    steps:
      - name: Close Pull Request
        id: closepullrequest
        uses: Azure/static-web-apps-deploy@v1
        with:
          azure_static_web_apps_api_token: ${{ secrets.AZURE_STATIC_WEB_APPS_API_TOKEN }}
          action: "close"
```

**¿Qué hace este workflow?**

1. **Trigger**: Se ejecuta en:
   - Push a `main` → Deploy a producción
   - Pull Request → Deploy a staging environment (preview)

2. **Build Process**:
   - Checkout del código
   - `npm install` (automático)
   - `npm run build` (automático)
   - Deploy de `dist/` a Azure CDN

3. **API Deployment**:
   - Deploy de carpeta `api/` como Azure Functions
   - Automáticamente vinculado al frontend

---

## Variables de Entorno en Azure

### Configurar Application Settings

**Azure Portal:**

1. Azure Portal → Static Web App → **Configuration**
2. Click **+ Add** en "Application settings"
3. Agregar variables:

```
VITE_AZURE_CLIENT_ID=12345678-1234-1234-1234-123456789abc
VITE_AZURE_TENANT_ID=87654321-4321-4321-4321-cba987654321
VITE_API_BASE_URL=/api
```

**Azure CLI:**

```bash
az staticwebapp appsettings set \
  --name react-sso-app \
  --resource-group react-sso-rg \
  --setting-names \
    VITE_AZURE_CLIENT_ID=12345678-1234-1234-1234-123456789abc \
    VITE_AZURE_TENANT_ID=87654321-4321-4321-4321-cba987654321 \
    VITE_API_BASE_URL=/api
```

**⚠️ Importante:**

- Variables deben tener prefijo `VITE_` para ser accesibles en Vite
- **NO** incluir variables secretas en código (usar Azure settings)
- Cambios requieren re-deploy para aplicarse

---

## Configurar Custom Domain

### Agregar Dominio Personalizado

1. Azure Portal → Static Web App → **Custom domains**
2. Click **+ Add**
3. Opciones:
   - **Free subdomain**: `app.mydomain.com` (SSL automático)
   - **CNAME**: Apuntar CNAME a `<nombre>.azurestaticapps.net`

### Configuración DNS

**Ejemplo con Cloudflare:**

```
Type: CNAME
Name: app
Target: react-sso-app.azurestaticapps.net
Proxy status: DNS only (desactivar proxy naranja)
TTL: Auto
```

**Ejemplo con Azure DNS:**

```bash
az network dns record-set cname set-record \
  --resource-group myDNS \
  --zone-name mydomain.com \
  --record-set-name app \
  --cname react-sso-app.azurestaticapps.net
```

### Validación y SSL

1. Azure valida dominio (puede tardar hasta 24h)
2. SSL certificado auto-provisioned por Azure
3. HTTPS obligatorio (HTTP redirige a HTTPS)

---

## Ambientes (Staging/Production)

### Production Environment

- **Branch**: `main`
- **URL**: `https://react-sso-app.azurestaticapps.net`
- **Deploy**: Automático al hacer push a `main`

### Staging Environments (Preview)

- **Trigger**: Pull Request
- **URL**: `https://react-sso-app-<pr-number>.azurestaticapps.net`
- **Deploy**: Automático al crear/actualizar PR
- **Cleanup**: Automático al cerrar/merge PR

**Ejemplo de flujo:**

```bash
# 1. Crear feature branch
git checkout -b feature/new-table

# 2. Commit cambios
git add .
git commit -m "feat: Add students table"
git push origin feature/new-table

# 3. Crear Pull Request en GitHub
# → GitHub Actions automáticamente deploya a staging URL

# 4. Probar en staging
# https://react-sso-app-15.azurestaticapps.net (PR #15)

# 5. Merge PR
# → GitHub Actions deploya a production
# → Staging environment se elimina automáticamente
```

---

## Configurar Azure AD para Producción

### Actualizar Redirect URIs

1. Azure Portal → **Azure Active Directory** → **App registrations**
2. Seleccionar tu app
3. **Authentication** → **Add a platform** → **Single-page application**
4. Agregar URIs:
   ```
   https://react-sso-app.azurestaticapps.net
   https://app.mydomain.com (si tienes custom domain)
   ```

### Actualizar API Scope

1. **Expose an API** → **Application ID URI**
2. Verificar que coincida con `VITE_AZURE_CLIENT_ID` en settings

---

## Rollback de Deployment

### Opción 1: Revert Git Commit

```bash
# 1. Identificar commit malo
git log --oneline

# 2. Revert commit
git revert <commit-hash>

# 3. Push
git push origin main

# → GitHub Actions automáticamente deploya versión anterior
```

### Opción 2: Re-deploy desde Azure Portal

1. Azure Portal → Static Web App → **Deployments**
2. Seleccionar deployment anterior
3. Click **Re-deploy**

---

## Monitoreo y Logs

### Application Insights (Recomendado)

**Habilitar:**

1. Azure Portal → Static Web App → **Application Insights**
2. Click **Enable**
3. Seleccionar región

**Ver Logs:**

1. Application Insights → **Logs**
2. Query ejemplo:

```kql
// Errores en las últimas 24h
traces
| where timestamp > ago(24h)
| where severityLevel >= 3
| order by timestamp desc

// Requests lentos (>2s)
requests
| where timestamp > ago(1h)
| where duration > 2000
| order by duration desc
```

### GitHub Actions Logs

**Ver logs de deployment:**

1. GitHub Repo → **Actions**
2. Seleccionar workflow run
3. Expandir "Build and Deploy" step

---

## Optimizaciones de Performance

### 1. Build Optimization

**vite.config.ts:**

```typescript
export default defineConfig({
  build: {
    // Minificar código
    minify: 'esbuild',

    // Code splitting
    rollupOptions: {
      output: {
        manualChunks: {
          // Separar vendors en chunk aparte
          vendor: ['react', 'react-dom', 'react-router-dom'],
          msal: ['@azure/msal-browser', '@azure/msal-react'],
        },
      },
    },

    // Optimizar tamaño de chunks
    chunkSizeWarningLimit: 1000,
  },
})
```

### 2. Caching Headers

**staticwebapp.config.json:**

```json
{
  "routes": [
    {
      "route": "/assets/*",
      "headers": {
        "Cache-Control": "public, max-age=31536000, immutable"
      }
    },
    {
      "route": "*.js",
      "headers": {
        "Cache-Control": "public, max-age=31536000, immutable"
      }
    },
    {
      "route": "*.css",
      "headers": {
        "Cache-Control": "public, max-age=31536000, immutable"
      }
    }
  ]
}
```

### 3. Preload Critical Resources

**index.html:**

```html
<!DOCTYPE html>
<html lang="es">
  <head>
    <!-- Preload critical CSS -->
    <link rel="preload" href="/assets/index.css" as="style">

    <!-- Preload critical fonts -->
    <link rel="preload" href="/fonts/inter.woff2" as="font" type="font/woff2" crossorigin>

    <!-- DNS prefetch para APIs -->
    <link rel="dns-prefetch" href="https://login.microsoftonline.com">
    <link rel="dns-prefetch" href="https://graph.microsoft.com">
  </head>
</html>
```

---

## Configuración Avanzada: staticwebapp.config.json

**Ubicación:** `/staticwebapp.config.json` (raíz del proyecto)

```json
{
  "routes": [
    {
      "route": "/login",
      "rewrite": "/index.html"
    },
    {
      "route": "/dashboard",
      "rewrite": "/index.html"
    },
    {
      "route": "/api/*",
      "allowedRoles": ["authenticated"]
    }
  ],
  "navigationFallback": {
    "rewrite": "/index.html",
    "exclude": ["/images/*.{png,jpg,gif}", "/css/*"]
  },
  "responseOverrides": {
    "404": {
      "rewrite": "/index.html",
      "statusCode": 200
    }
  },
  "globalHeaders": {
    "X-Content-Type-Options": "nosniff",
    "X-Frame-Options": "DENY",
    "Content-Security-Policy": "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline';"
  },
  "mimeTypes": {
    ".json": "application/json",
    ".woff2": "font/woff2"
  }
}
```

**¿Por qué esta configuración?**

- **routes**: Define reglas de routing (SPA mode)
- **navigationFallback**: Fallback para rutas no encontradas (404 → index.html)
- **globalHeaders**: Security headers (XSS, clickjacking protection)
- **mimeTypes**: Tipos MIME correctos para assets

---

## Checklist de Deployment

### Pre-Deployment

- [ ] Build local exitoso (`npm run build`)
- [ ] No errores TypeScript (`npm run type-check`)
- [ ] Tests pasan (si existen)
- [ ] Variables de entorno configuradas en Azure
- [ ] Azure AD redirect URIs actualizados
- [ ] `staticwebapp.config.json` configurado
- [ ] Secrets no committeados a Git

### Post-Deployment

- [ ] URL de producción accesible
- [ ] Login funciona correctamente
- [ ] API calls exitosos
- [ ] Dark mode funciona
- [ ] Responsive design OK (mobile + desktop)
- [ ] SSL certificado válido (HTTPS)
- [ ] Application Insights recibiendo telemetry
- [ ] No errores en browser console
- [ ] No errores en Application Insights

---

## Troubleshooting

### Error: "404 Not Found" en rutas

**Causa:** SPA routing no configurado

**Solución:** Agregar a `staticwebapp.config.json`:

```json
{
  "navigationFallback": {
    "rewrite": "/index.html"
  }
}
```

---

### Error: "CORS policy" en API calls

**Causa:** CORS no configurado en Azure Functions

**Solución:**

1. Azure Portal → Function App → **CORS**
2. Agregar origin: `https://react-sso-app.azurestaticapps.net`
3. O en `api/host.json`:

```json
{
  "extensions": {
    "http": {
      "cors": {
        "allowedOrigins": ["*"]
      }
    }
  }
}
```

---

### Error: Variables de entorno undefined

**Causa:** Variables no configuradas en Azure o sin prefijo `VITE_`

**Solución:**

1. Verificar que variables tengan prefijo `VITE_`
2. Configurar en Azure Portal → Configuration
3. Re-deploy (cambios no aplican automáticamente)

---

### Error: "Build failed" en GitHub Actions

**Causa:** Dependencias faltantes o error de build

**Solución:**

1. Ver logs en GitHub Actions
2. Reproducir localmente:
   ```bash
   npm ci
   npm run build
   ```
3. Corregir error
4. Push de nuevo

---

## Costos de Azure Static Web Apps

### Plan Free

- **Precio**: $0/mes
- **Bandwidth**: 100 GB/mes
- **Builds**: 500 build minutes/mes
- **Custom domains**: 2
- **Staging environments**: Ilimitados

**Ideal para:** Desarrollo, proyectos pequeños

### Plan Standard

- **Precio**: ~$9/mes
- **Bandwidth**: 100 GB/mes (adicional: $0.20/GB)
- **Builds**: Ilimitados
- **Custom domains**: Ilimitados
- **SLA**: 99.95%

**Ideal para:** Producción, aplicaciones empresariales

---

## Recursos

- [Azure Static Web Apps Docs](https://docs.microsoft.com/azure/static-web-apps/)
- [GitHub Actions for Azure](https://github.com/Azure/actions)
- [staticwebapp.config.json Schema](https://docs.microsoft.com/azure/static-web-apps/configuration)
- [Azure Pricing Calculator](https://azure.microsoft.com/pricing/calculator/)
