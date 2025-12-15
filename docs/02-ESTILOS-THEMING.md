# Estilos y Theming

## Sistema de Diseño

Este proyecto usa **shadcn/ui** con **Tailwind CSS** y **CSS Variables** para un sistema de theming robusto y mantenible.

---

## CSS Variables (Tema)

**Archivo:** `src/index.css`

### Paleta de Colores Corporativos

El proyecto usa un esquema de colores **Azul/Índigo** que refleja la identidad corporativa universitaria.

#### Light Mode
```css
:root {
  --primary: 221.2 83.2% 53.3%;      /* Blue-600 */
  --accent: 238.7 83.5% 66.7%;       /* Indigo-500 */
  --background: 0 0% 100%;           /* White */
  --foreground: 222.2 84% 4.9%;      /* Dark text */
}
```

#### Dark Mode
```css
.dark {
  --primary: 217.2 91.2% 59.8%;      /* Blue-500 (más claro) */
  --accent: 238.7 83.5% 66.7%;       /* Indigo-400 */
  --background: 222.2 84% 4.9%;      /* Dark background */
  --foreground: 210 40% 98%;         /* Light text */
}
```

### Formato HSL

**¿Por qué HSL y no HEX?**

Las variables usan formato **HSL sin `hsl()`** para permitir modificadores de opacidad:

```tsx
// ✅ Permite modificadores de opacidad
className="bg-primary/50"  // 50% de opacidad

// Tailwind lo traduce a:
background-color: hsl(221.2 83.2% 53.3% / 0.5)
```

### Variables Disponibles

| Variable | Uso | Light | Dark |
|---|---|---|---|
| `--background` | Fondo principal | Blanco | Gris oscuro |
| `--foreground` | Texto principal | Negro | Blanco |
| `--primary` | Color principal | Blue-600 | Blue-500 |
| `--primary-foreground` | Texto sobre primary | Blanco | Negro |
| `--accent` | Color de acento | Indigo-500 | Indigo-400 |
| `--muted` | Elementos atenuados | Gris claro | Gris oscuro |
| `--destructive` | Acciones peligrosas | Rojo | Rojo oscuro |
| `--border` | Bordes | Gris claro | Gris oscuro |
| `--ring` | Focus rings | Blue-600 | Blue-600 |

---

## Cómo Usar Colores

### 1. Clases de Tailwind (Recomendado)

```tsx
// Background
<div className="bg-primary text-primary-foreground">
  Fondo azul con texto blanco
</div>

// Con opacidad
<div className="bg-primary/10">
  Fondo azul al 10% de opacidad
</div>

// Borders
<div className="border border-border">
  Borde del color del tema
</div>
```

### 2. CSS Variables Directas (Casos Especiales)

```css
.mi-clase-custom {
  background-color: hsl(var(--primary));
  color: hsl(var(--primary-foreground));
}
```

---

## Componentes con Variantes de Color

### Button
```tsx
<Button variant="default">Primary</Button>
<Button variant="destructive">Delete</Button>
<Button variant="outline">Outline</Button>
<Button variant="ghost">Ghost</Button>
```

### Badge
```tsx
<Badge variant="default">Default</Badge>
<Badge variant="secondary">Secondary</Badge>
<Badge variant="destructive">Error</Badge>
<Badge variant="outline">Outline</Badge>
```

### Alert
```tsx
<Alert variant="default">Info</Alert>
<Alert variant="destructive">Error</Alert>
```

### StatCard (Custom)
```tsx
<StatCard variant="default">Normal</StatCard>
<StatCard variant="primary">Azul</StatCard>
<StatCard variant="success">Verde</StatCard>
<StatCard variant="warning">Amarillo</StatCard>
<StatCard variant="destructive">Rojo</StatCard>
```

---

## Dark Mode

### Cómo Funciona

El proyecto usa `ThemeContext` para manejar el tema:

```tsx
// src/context/ThemeContext.tsx
const { theme, toggleTheme } = useTheme()

// theme puede ser: 'light' | 'dark'
```

### Toggle de Tema

```tsx
<button onClick={toggleTheme}>
  {theme === 'light' ? <Moon /> : <Sun />}
</button>
```

### Persistencia

El tema se guarda en `localStorage`:
- Key: `'theme'`
- Values: `'light'` | `'dark'`

### Aplicación del Tema

La clase `.dark` se aplica al `<html>` tag:

```tsx
// En ThemeContext
useEffect(() => {
  const root = window.document.documentElement
  root.classList.remove('light', 'dark')
  root.classList.add(theme)
}, [theme])
```

---

## Tailwind CSS

### Configuración

**Archivo:** `tailwind.config.js`

```js
module.exports = {
  darkMode: 'class',  // Modo basado en clase .dark
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        // Usa las CSS variables
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        // ... más colores
      },
    },
  },
}
```

### cn() Helper

**Archivo:** `src/lib/utils.ts`

Función helper para combinar clases de Tailwind:

```tsx
import { cn } from '@/lib/utils'

// Combina clases y resuelve conflictos
<div className={cn(
  'bg-white p-4',
  isActive && 'bg-primary',
  className  // Props adicionales
)}>
```

**¿Por qué usar cn()?**
- Resuelve conflictos de clases (ej: `bg-white` vs `bg-primary`)
- Maneja condicionales limpiamente
- Integra `clsx` + `tailwind-merge`

---

## Iconos

### lucide-react

El proyecto usa **lucide-react** para iconos profesionales.

#### Instalación
```bash
npm install lucide-react
```

#### Uso
```tsx
import { Calendar, User, Settings, LogOut } from 'lucide-react'

<Calendar className="h-5 w-5" />
<User className="h-4 w-4 text-primary" />
```

#### Tamaños Recomendados

| Contexto | Tamaño | Clase |
|---|---|---|
| Iconos inline | 16px | `h-4 w-4` |
| Iconos en botones | 20px | `h-5 w-5` |
| Iconos en headers | 24px | `h-6 w-6` |
| Iconos grandes | 32px | `h-8 w-8` |
| Iconos hero | 64px | `h-16 w-16` |

#### ¿Por qué lucide-react?

**✅ Ventajas:**
- Iconos vectoriales escalables
- Consistencia visual
- Soporte para dark mode
- Accesibilidad (aria-hidden por defecto)
- Profesional (no emojis)

**❌ Evitar:**
- Emojis (🏠, 📅, etc.) - No son consistentes entre plataformas
- Font icons - Problemas de carga
- SVG inline - Difícil de mantener

---

## Gradientes

### Gradientes de Marca

Usados en headers y elementos destacados:

```tsx
// Azul a Índigo (marca principal)
className="bg-gradient-to-r from-blue-600 to-indigo-600"

// Con dark mode
className="bg-gradient-to-r from-blue-600 to-indigo-600
           dark:from-blue-700 dark:to-indigo-700"
```

### PageHeader con Gradient

```tsx
<PageHeader
  variant="gradient"  // Aplica gradiente azul/índigo
  title="Mi Página"
/>
```

---

## Animaciones

### Transiciones

Usar `transition-all` para transiciones suaves:

```tsx
className="transition-all duration-200 hover:scale-105"
```

### Animaciones de shadcn

Los componentes shadcn incluyen animaciones sutiles:

```tsx
// Dropdown con animación
<DropdownMenuContent className="animate-in fade-in slide-in-from-top-2" />

// Skeleton con pulse
<Skeleton className="animate-pulse" />
```

---

## Responsive Design

### Breakpoints de Tailwind

| Breakpoint | Tamaño | Uso |
|---|---|---|
| `sm` | 640px | Tablets pequeñas |
| `md` | 768px | Tablets |
| `lg` | 1024px | Laptops |
| `xl` | 1280px | Desktops |
| `2xl` | 1536px | Pantallas grandes |

### Ejemplos

```tsx
// Grid responsive
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3">

// Ocultar en mobile
<div className="hidden md:block">

// Tamaño de texto responsive
<h1 className="text-2xl md:text-3xl lg:text-4xl">
```

---

## Spacing (Espaciado)

### Scale de Tailwind

Usar la escala de Tailwind para consistencia:

```tsx
// Padding
p-2  // 0.5rem (8px)
p-4  // 1rem (16px)
p-6  // 1.5rem (24px)
p-8  // 2rem (32px)

// Margin
m-2, m-4, m-6, m-8

// Gap (en grid/flex)
gap-2, gap-4, gap-6, gap-8
```

### Espaciado Recomendado

| Contexto | Spacing |
|---|---|
| Entre elementos inline | `gap-2` (8px) |
| Entre secciones pequeñas | `gap-4` (16px) |
| Entre cards | `gap-6` (24px) |
| Entre secciones de página | `space-y-6` (24px) |
| Padding de cards | `p-6` (24px) |

---

## Shadows (Sombras)

### Niveles de Elevación

```tsx
// Sin sombra
className="shadow-none"

// Sombra suave
className="shadow-sm"

// Sombra normal
className="shadow-md"

// Sombra prominente
className="shadow-lg"

// Sombra muy prominente
className="shadow-xl"

// Sombra máxima
className="shadow-2xl"
```

### Uso Recomendado

| Elemento | Shadow |
|---|---|
| Cards normales | `shadow-md` |
| Cards elevadas | `shadow-lg` |
| Modals/Dropdowns | `shadow-2xl` |
| Headers sticky | `shadow-xl` |

---

## Borders y Radius

### Border Radius

El proyecto usa `--radius: 0.5rem` (8px) como estándar:

```tsx
// Redondeado estándar
className="rounded-lg"  // 0.5rem

// Otros tamaños
className="rounded-md"  // 0.375rem
className="rounded-xl"  // 0.75rem
className="rounded-2xl" // 1rem
className="rounded-full" // Círculo perfecto
```

### Borders

```tsx
// Border simple
className="border"

// Border con color del tema
className="border border-border"

// Border con grosor
className="border-2"

// Border en un lado
className="border-t border-l"
```

---

## Mejores Prácticas

### 1. Usar Variables del Tema

**✅ Correcto:**
```tsx
className="bg-primary text-primary-foreground"
```

**❌ Incorrecto:**
```tsx
className="bg-blue-600 text-white"  // Hardcoded
```

### 2. Soportar Dark Mode

Todos los componentes DEBEN funcionar en light y dark mode:

```tsx
// ✅ Funciona en ambos modos
className="bg-white dark:bg-gray-800
           text-gray-900 dark:text-gray-100"

// ❌ Solo light mode
className="bg-white text-black"
```

### 3. Usar cn() para Clases Condicionales

**✅ Correcto:**
```tsx
import { cn } from '@/lib/utils'

<div className={cn(
  'base-classes',
  isActive && 'active-classes',
  variant === 'primary' && 'primary-classes'
)}>
```

**❌ Incorrecto:**
```tsx
<div className={`base-classes ${isActive ? 'active' : ''}`}>
```

### 4. Consistencia de Iconos

**✅ Correcto:**
```tsx
import { Calendar } from 'lucide-react'
<Calendar className="h-5 w-5" />
```

**❌ Incorrecto:**
```tsx
<span>📅</span>  // Emoji
```

### 5. Responsive por Defecto

Siempre pensar en mobile-first:

```tsx
// ✅ Mobile first
className="flex-col md:flex-row"

// ❌ Desktop first
className="flex-row max-md:flex-col"
```

---

## Checklist de Estilos

Al crear un componente nuevo, verificar:

- [ ] Usa variables CSS del tema (no colores hardcoded)
- [ ] Funciona en light y dark mode
- [ ] Es responsive (mobile, tablet, desktop)
- [ ] Usa `cn()` para clases condicionales
- [ ] Usa lucide-react para iconos (no emojis)
- [ ] Sigue la escala de spacing de Tailwind
- [ ] Usa las variantes de color apropiadas
- [ ] Tiene transiciones suaves donde aplique
- [ ] Sombras y borders consistentes con el diseño

---

## Recursos

- [shadcn/ui Docs](https://ui.shadcn.com/)
- [Tailwind CSS Docs](https://tailwindcss.com/)
- [lucide-react Icons](https://lucide.dev/)
- [Radix UI Primitives](https://www.radix-ui.com/)
