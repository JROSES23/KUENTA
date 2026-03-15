# KUENTA — Design System v1.0

> **Instrucción para Claude Code:** Lee este archivo completo antes de crear o modificar cualquier componente visual. Cada decisión de diseño aquí es definitiva. No uses ShadCN, no inventes tokens, no uses emojis. Solo iconos SVG.

---

## 1. Tipografía

KUENTA usa exactamente **dos familias de fuentes**. No más.

### 1.1 Fuente de marca — Syne

Usada **únicamente** para el wordmark `K U E N T A`.

```html
<!-- En index.html, dentro de <head> -->
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,600;9..40,700&display=swap" rel="stylesheet">
```

```css
/* Reglas de uso — Syne */
font-family: 'Syne', sans-serif;
font-weight: 800;
letter-spacing: 8px;      /* splash screen */
letter-spacing: 6px;      /* header inline */
text-transform: uppercase;
```

**Syne se usa SOLO para el wordmark.** En ningún otro lugar de la app.

### 1.2 Fuente de interfaz — DM Sans

Usada en **todo lo demás**: títulos, cuerpo, labels, botones, inputs, captions.

```css
font-family: 'DM Sans', system-ui, -apple-system, sans-serif;
```

#### Escala tipográfica completa

| Nombre | Tamaño | Peso | Tracking | Uso |
|---|---|---|---|---|
| `display` | 42px | 700 | -1.5px | Montos grandes en pantalla de split |
| `h1` | 26px | 700 | -0.5px | Nombre de usuario en header |
| `h2` | 22px | 700 | -0.3px | Títulos de sección (login, grupos) |
| `h3` | 17px | 700 | 0 | Títulos de página en back-row |
| `title` | 15px | 600 | 0 | Nombre en cards, títulos de grupo |
| `body` | 14px | 400 | 0 | Texto general, inputs |
| `body-sm` | 13px | 400 | 0 | Subtítulos de cards, labels secundarios |
| `caption` | 11px | 700 | 0.8px | Section labels (uppercase) |
| `micro` | 10px | 600 | 0.5px | Tab bar labels, badges secundarios |

```css
/* Implementación en Tailwind — añadir a tailwind.config.ts */
theme: {
  extend: {
    fontFamily: {
      brand: ['Syne', 'sans-serif'],
      ui: ['DM Sans', 'system-ui', '-apple-system', 'sans-serif'],
    },
    fontSize: {
      'display': ['42px', { lineHeight: '1', letterSpacing: '-1.5px', fontWeight: '700' }],
      'h1':      ['26px', { lineHeight: '1.2', letterSpacing: '-0.5px', fontWeight: '700' }],
      'h2':      ['22px', { lineHeight: '1.25', letterSpacing: '-0.3px', fontWeight: '700' }],
      'h3':      ['17px', { lineHeight: '1.3', fontWeight: '700' }],
      'title':   ['15px', { lineHeight: '1.4', fontWeight: '600' }],
      'body':    ['14px', { lineHeight: '1.5', fontWeight: '400' }],
      'body-sm': ['13px', { lineHeight: '1.5', fontWeight: '400' }],
      'caption': ['11px', { lineHeight: '1.4', letterSpacing: '0.8px', fontWeight: '700' }],
      'micro':   ['10px', { lineHeight: '1.3', letterSpacing: '0.5px', fontWeight: '600' }],
    },
  }
}
```

---

## 2. El Wordmark

El wordmark `K U E N T A` es el elemento de identidad central. Se renderiza siempre igual.

### 2.1 Componente React

```tsx
// src/components/ui/Wordmark.tsx
import { cn } from '@/utils/cn'

interface WordmarkProps {
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

const sizes = {
  sm: 'text-[22px] tracking-[6px]',
  md: 'text-[28px] tracking-[8px]',
  lg: 'text-[42px] tracking-[12px]',
}

export function Wordmark({ size = 'md', className }: WordmarkProps) {
  return (
    <span
      className={cn(
        'font-brand font-extrabold uppercase select-none',
        'bg-gradient-to-br from-[#8880DE] via-[#4C44AA] to-[#6860C8]',
        'bg-clip-text text-transparent',
        '[filter:drop-shadow(0_0_16px_rgba(136,128,222,0.45))]',
        sizes[size],
        className
      )}
    >
      K U E N T A
    </span>
  )
}
```

### 2.2 Reglas de uso del wordmark

- **Splash screen:** size `lg` (42px), centrado, sobre fondo oscuro con blobs de luz
- **Login header:** size `md` (28px), alineado a la izquierda, sobre gradiente morado
- **Top bar (app):** versión simplificada en texto plano `text-[15px] tracking-[2px]` color `text-primary`
- **Nunca** cambiar el gradient del wordmark
- **Nunca** usar el wordmark sobre fondo claro sin ajustar el drop-shadow
- **Nunca** escribir "kuenta" en minúscula como wordmark

### 2.3 CSS puro (para contextos sin Tailwind)

```css
.wordmark {
  font-family: 'Syne', sans-serif;
  font-size: 28px;
  font-weight: 800;
  letter-spacing: 8px;
  text-transform: uppercase;
  background: linear-gradient(135deg, #8880DE 0%, #4C44AA 50%, #6860C8 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  filter: drop-shadow(0 0 14px rgba(136, 128, 222, 0.5));
}
```

---

## 3. Paleta de colores

### 3.1 Tokens de color — implementación CSS

```css
/* src/styles/tokens.css */
:root {
  /* Brand */
  --color-primary:    #4C44AA;
  --color-primary-2:  #6860C8;
  --color-primary-3:  #8880DE;

  /* Semantic */
  --color-success:    #0A5C45;
  --color-success-2:  #1DAD87;
  --color-error:      #8B2020;
  --color-error-2:    #D95C5C;
}

/* Modo claro */
[data-theme="light"] {
  --bg:           #F4F3FA;
  --bg-2:         #ECEAF7;
  --surface:      rgba(255, 255, 255, 0.85);
  --surface-2:    rgba(255, 255, 255, 0.6);
  --border:       rgba(0, 0, 0, 0.07);
  --border-2:     rgba(76, 68, 170, 0.15);
  --text:         #0D0C1A;
  --text-2:       #6B6882;
  --text-3:       #9996B0;
  --green:        #0A5C45;
  --green-bg:     rgba(10, 92, 69, 0.1);
  --red:          #8B2020;
  --red-bg:       rgba(139, 32, 32, 0.1);
  --purple-text:  #4C44AA;
  --purple-bg:    rgba(76, 68, 170, 0.1);
  --input-bg:     rgba(0, 0, 0, 0.04);
  --input-border: rgba(0, 0, 0, 0.09);
  --tab-bg:       rgba(255, 255, 255, 0.82);
  --card-shadow:  0 2px 20px rgba(76, 68, 170, 0.08), 0 1px 4px rgba(0, 0, 0, 0.04);
}

/* Modo oscuro (default) */
[data-theme="dark"] {
  --bg:           #0D0B1A;
  --bg-2:         #130F24;
  --surface:      rgba(255, 255, 255, 0.06);
  --surface-2:    rgba(255, 255, 255, 0.04);
  --border:       rgba(255, 255, 255, 0.08);
  --border-2:     rgba(136, 128, 222, 0.2);
  --text:         #F0EFF8;
  --text-2:       #9490B8;
  --text-3:       #5C5878;
  --green:        #3DC99A;
  --green-bg:     rgba(61, 201, 154, 0.12);
  --red:          #F07070;
  --red-bg:       rgba(240, 112, 112, 0.12);
  --purple-text:  #A8A2F0;
  --purple-bg:    rgba(168, 162, 240, 0.12);
  --input-bg:     rgba(255, 255, 255, 0.06);
  --input-border: rgba(255, 255, 255, 0.1);
  --tab-bg:       rgba(13, 11, 26, 0.85);
  --card-shadow:  0 2px 20px rgba(0, 0, 0, 0.3);
}
```

### 3.2 Tokens Tailwind

```ts
// tailwind.config.ts — sección colors
colors: {
  primary:   { DEFAULT: '#4C44AA', 2: '#6860C8', 3: '#8880DE' },
  success:   { DEFAULT: '#0A5C45', 2: '#1DAD87' },
  error:     { DEFAULT: '#8B2020',  2: '#D95C5C' },
  // Semánticos — usar CSS vars en componentes
  bg:        'var(--bg)',
  surface:   'var(--surface)',
  border:    'var(--border)',
  text: {
    DEFAULT: 'var(--text)',
    2:       'var(--text-2)',
    3:       'var(--text-3)',
  },
  green: {
    DEFAULT: 'var(--green)',
    bg:      'var(--green-bg)',
  },
  red: {
    DEFAULT: 'var(--red)',
    bg:      'var(--red-bg)',
  },
},
```

### 3.3 Header gradient (fijo en ambos modos)

El header siempre usa este gradient — es el "acento de marca" de KUENTA:

```css
/* Modo oscuro */
background: linear-gradient(160deg, #1A1640 0%, #2A2468 60%, #1A1640 100%);

/* Modo claro — mismo gradient, la marca siempre se ve igual */
background: linear-gradient(160deg, #3D3890 0%, #4C44AA 60%, #3D3890 100%);
```

---

## 4. Efectos visuales

### 4.1 Glassmorphism — reglas

```css
/* Superficie glass estándar (cards, modals) */
.glass {
  background: var(--surface);
  border: 1px solid var(--border);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
}

/* Glass oscuro para tab bar */
.glass-dark {
  background: var(--tab-bg);
  border: 1px solid var(--border);
  backdrop-filter: blur(30px);
  -webkit-backdrop-filter: blur(30px);
}

/* Glass sobre gradient (balance pills en header) */
.glass-on-gradient {
  background: rgba(255, 255, 255, 0.14);
  border: 1px solid rgba(255, 255, 255, 0.2);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
}
```

### 4.2 Ambient blobs (orbs de luz)

Los orbs van en el header y en las pantallas de auth. Son `position: absolute`, `pointer-events: none`, con `z-index: 0`.

```tsx
// src/components/ui/AmbientBlobs.tsx
export function AmbientBlobs() {
  return (
    <>
      <div className="absolute -top-20 -right-10 w-[200px] h-[200px] rounded-full bg-[rgba(104,96,200,0.3)] blur-[50px] pointer-events-none" />
      <div className="absolute -bottom-15 -left-5 w-[160px] h-[160px] rounded-full bg-[rgba(76,68,170,0.2)] blur-[40px] pointer-events-none" />
    </>
  )
}
```

### 4.3 Sombras

```css
/* Card estándar */
box-shadow: var(--card-shadow);

/* Botón primario (purple glow) */
box-shadow: 0 6px 24px rgba(76, 68, 170, 0.4);

/* FAB */
box-shadow: 0 4px 18px rgba(76, 68, 170, 0.45);

/* Wordmark glow */
filter: drop-shadow(0 0 14px rgba(136, 128, 222, 0.5));

/* Success ring (green glow) */
box-shadow: 0 0 50px rgba(13, 172, 103, 0.35);
```

---

## 5. Tokens de espaciado y forma

```css
/* Border radius */
--radius-phone:  48px;   /* shell del teléfono */
--radius-card:   20px;   /* cards generales */
--radius-modal:  28px;   /* bottom sheets */
--radius-input:  14px;   /* inputs */
--radius-btn:    16px;   /* botones primarios */
--radius-tab:    28px;   /* tab bar */
--radius-pill:   100px;  /* badges, split pills */
--radius-icon:   14px;   /* group icons */
--radius-avatar: 50%;    /* avatares */

/* Tailwind borderRadius extension */
borderRadius: {
  card:   '20px',
  modal:  '28px',
  input:  '14px',
  btn:    '16px',
  tab:    '28px',
  pill:   '100px',
  icon:   '14px',
}
```

---

## 6. Componentes — especificaciones

### 6.1 Pantalla Splash

```
Fondo:       linear-gradient(160deg, #0D0B1A 0%, #1A1640 50%, #0D1830 100%)
Wordmark:    Syne 800, 42px, tracking 12px, gradient, drop-shadow glow
Tagline:     DM Sans 400, 12px, "divide · paga · listo", rgba(255,255,255,0.35), tracking 2px, uppercase
Dots:        3 puntos 6px, animación pulse con delay 0/0.2s/0.4s
Blobs:       3 orbs — morado top-left, azul bottom-right, morado center blur 70px
Duración:    2.5 segundos → navigate('/login')
```

```tsx
// src/pages/auth/SplashPage.tsx
import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Wordmark } from '@/components/ui/Wordmark'

export default function SplashPage() {
  const navigate = useNavigate()

  useEffect(() => {
    const t = setTimeout(() => navigate('/login', { replace: true }), 2500)
    return () => clearTimeout(t)
  }, [navigate])

  return (
    <div className="relative h-full w-full flex flex-col items-center justify-center overflow-hidden"
         style={{ background: 'linear-gradient(160deg, #0D0B1A 0%, #1A1640 50%, #0D1830 100%)' }}>
      {/* Blobs */}
      <div className="absolute -top-16 -left-16 w-72 h-72 rounded-full bg-[rgba(76,68,170,0.35)] blur-[70px] pointer-events-none" />
      <div className="absolute -bottom-10 -right-12 w-56 h-56 rounded-full bg-[rgba(24,95,165,0.25)] blur-[70px] pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 rounded-full bg-[rgba(104,96,200,0.2)] blur-[70px] pointer-events-none" />

      {/* Contenido */}
      <div className="relative z-10 flex flex-col items-center gap-3">
        <Wordmark size="lg" />
        <p className="font-ui text-[12px] font-medium tracking-[2px] uppercase text-white/35">
          divide · paga · listo
        </p>
      </div>

      {/* Loading dots */}
      <div className="relative z-10 flex gap-2 mt-12">
        {[0, 1, 2].map(i => (
          <div
            key={i}
            className="w-1.5 h-1.5 rounded-full bg-[rgba(136,128,222,0.5)]"
            style={{ animation: `pulse-dot 1.4s ease-in-out ${i * 0.2}s infinite` }}
          />
        ))}
      </div>
    </div>
  )
}
```

```css
/* En globals.css */
@keyframes pulse-dot {
  0%, 80%, 100% {
    background: rgba(136, 128, 222, 0.3);
    transform: scale(0.8);
  }
  40% {
    background: rgba(136, 128, 222, 0.9);
    transform: scale(1.1);
  }
}
```

### 6.2 Pantalla Login

```
Header:     gradient morado, Wordmark md, título h2, subtítulo body-sm blanco 50%
Cuerpo:     fondo bg, padding 28px 20px
Input tel:  bandera CL + +56 como prefix, border radius-input, bg input-bg
Divider:    línea + "o continúa con" + línea
Social:     fila 2 botones (Google, Apple), glass surface, icons SVG
CTA:        botón primario height 52px, gradient, glow, "Continuar" + icono arrow
Terms:      micro, centrado, links en purple-3
```

### 6.3 Header de pantallas principales

```
Fondo:      header gradient (siempre morado, ambos modos)
Padding:    52px top (Dynamic Island), 22px lados, 24px bottom
Saludo:     body-sm, rgba(255,255,255,0.65)
Nombre:     h1, #fff
Balance pills: 3 pills — glass-on-gradient, flex row, gap 8px
  - "te deben" → valor en #72EDBA (verde claro sobre morado)
  - "debes"    → valor en #FFB4B4 (rojo claro sobre morado)
  - "neto"     → valor en #D4D0FF (morado claro sobre morado)
```

### 6.4 Cards

```css
/* Card base */
background: var(--surface);
border: 1px solid var(--border);
border-radius: var(--radius-card); /* 20px */
box-shadow: var(--card-shadow);
backdrop-filter: blur(16px);
-webkit-backdrop-filter: blur(16px);

/* Feed card — padding */
padding: 14px;
margin-bottom: 8px;

/* Group card — padding */
padding: 14px;
margin-bottom: 8px;
```

### 6.5 Tab Bar

```css
/* Contenedor */
position: absolute; bottom: 0; left: 0; right: 0;
padding: 0 14px 24px; /* 24px safe area bottom */

/* Inner */
display: flex; align-items: center; justify-content: space-around;
padding: 10px 6px;
background: var(--tab-bg);
border: 1px solid var(--border);
border-radius: 28px;
backdrop-filter: blur(30px);
-webkit-backdrop-filter: blur(30px);
```

```tsx
// Tab item
// Activo: icon color primary-2, label color primary-2, font-weight 600
// Inactivo: icon color text-3, label color text-3
```

### 6.6 FAB (botón central del tab bar)

```css
width: 50px; height: 50px; border-radius: 50%;
background: linear-gradient(135deg, #4C44AA, #6860C8);
box-shadow: 0 4px 18px rgba(76, 68, 170, 0.45);
/* Icono: + blanco, stroke 2.5px */
```

### 6.7 Botón primario

```css
padding: 16px; width: 100%;
background: linear-gradient(135deg, #4C44AA, #6860C8);
border-radius: 16px; border: none;
color: #fff; font-family: DM Sans; font-size: 15px; font-weight: 700;
box-shadow: 0 6px 24px rgba(76, 68, 170, 0.4);
/* Active: transform scale(0.98) */
```

### 6.8 Inputs

```css
padding: 13px 14px; width: 100%;
background: var(--input-bg);
border: 1px solid var(--input-border);
border-radius: 14px;
color: var(--text); font-family: DM Sans; font-size: 14px;
/* Focus: border-color var(--border-2), background var(--surface) */
/* Placeholder: color var(--text-3) */
```

### 6.9 Avatares

```
Tamaño estándar: 40×40px, border-radius 50%
Tamaño small:    34×34px, border-radius 50%
Contenido:       iniciales 2 letras, 11–13px, font-weight 700
Border:          1px solid var(--border)
```

Paleta de colores de avatares (asignada por hash del nombre):

```ts
// src/utils/avatarColor.ts
const AVATAR_COLORS = [
  { bg: 'var(--purple-bg)', text: 'var(--purple-text)' },   // morado
  { bg: 'var(--green-bg)',  text: 'var(--green)' },          // verde
  { bg: 'rgba(24,95,165,0.12)', text: '#185FA5' },           // azul
  { bg: 'var(--red-bg)',   text: 'var(--red)' },             // rojo
]

export function getAvatarColor(name: string) {
  const hash = name.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0)
  return AVATAR_COLORS[hash % AVATAR_COLORS.length]
}
```

---

## 7. Iconografía

**Regla absoluta: cero emojis en toda la app.** Todo ícono es SVG inline o componente SVG.

### 7.1 Librería

Usar **Lucide React** como fuente principal de íconos:

```bash
npm install lucide-react
```

```tsx
import { Home, Users, Plus, DollarSign, User, ArrowRight,
         ChevronLeft, Check, Bell, LogOut, Camera, Share2 } from 'lucide-react'
```

### 7.2 Tamaños estándar

| Contexto | Tamaño | Stroke |
|---|---|---|
| Tab bar | 20×20px | 2px |
| Cards / listas | 18×18px | 2px |
| FAB (plus) | 22×22px | 2.5px |
| Botones inline | 16×16px | 2px |
| Back chevron | 14×14px | 2.5px |

### 7.3 Íconos por pantalla

```
Inicio (Feed):  Home (tab), Bell (notificaciones)
Grupos:         Users (tab), Globe / Home / Calendar (tipos de grupo)
Split:          ChevronLeft (back), DollarSign (monto), Users (participantes)
Deudas:         DollarSign (tab), ArrowRight (pagar), Bell (recordar)
Perfil:         User (tab), LogOut, ChevronRight
Pago OK:        Check (en success ring)
Scan recibo:    Camera
Compartir:      Share2
```

### 7.4 Colores de íconos

```
Tab activo:      var(--primary-2)  — #6860C8
Tab inactivo:    var(--text-3)
Cards:           var(--text-2) por defecto
Success:         white (sobre fondo verde)
Error/alerta:    var(--red)
```

---

## 8. Animaciones

### 8.1 Transiciones estándar

```css
/* Transición suave de modo claro/oscuro */
* { transition: background-color 0.3s ease, border-color 0.3s ease, color 0.2s ease; }

/* Cards — hover en desktop */
.card:active { transform: scale(0.99); }

/* Botones */
button:active { transform: scale(0.96); transition: transform 0.1s ease; }

/* FAB */
.fab:active { transform: scale(0.88); }
```

### 8.2 Entrada de pantallas

```css
@keyframes slide-up {
  from { opacity: 0; transform: translateY(16px); }
  to   { opacity: 1; transform: translateY(0); }
}
.screen-enter { animation: slide-up 0.25s cubic-bezier(0.4, 0, 0.2, 1); }
```

### 8.3 Success ring

```css
@keyframes pop-in {
  from { transform: scale(0); opacity: 0; }
  to   { transform: scale(1); opacity: 1; }
}
.success-ring { animation: pop-in 0.45s cubic-bezier(0.34, 1.56, 0.64, 1); }
```

### 8.4 Skeleton loading

```css
@keyframes shimmer {
  0%   { background-position: -200% 0; }
  100% { background-position: 200% 0; }
}
.skeleton {
  background: linear-gradient(90deg,
    var(--surface) 25%,
    var(--surface-2) 50%,
    var(--surface) 75%
  );
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
  border-radius: 8px;
}
```

---

## 9. Mobile-first — reglas de layout

```
Viewport base:   375px (iPhone SE)
Padding lateral: 14px en scroll-body, 22px en headers
Touch target:    mínimo 44×44px
Font mínimo:     11px (captions). Nunca menos.
Safe area top:   52px (Dynamic Island / notch)
Safe area bottom: 24px (tab bar)
Scroll:          -webkit-overflow-scrolling: touch; scrollbar-width: none
Sin scroll X:    overflow-x: hidden en el contenedor root
```

```tsx
// src/main.tsx — aplicar tema y safe areas
document.documentElement.setAttribute('data-theme', 'dark') // default

// index.html — meta tags obligatorios
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
<meta name="theme-color" content="#1A1640">
```

---

## 10. Tema claro/oscuro — implementación

```tsx
// src/store/themeStore.ts
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface ThemeStore {
  theme: 'light' | 'dark'
  toggle: () => void
}

export const useTheme = create<ThemeStore>()(
  persist(
    (set, get) => ({
      theme: 'dark',
      toggle: () => {
        const next = get().theme === 'dark' ? 'light' : 'dark'
        document.documentElement.setAttribute('data-theme', next)
        set({ theme: next })
      },
    }),
    {
      name: 'kuenta-theme',
      onRehydrateStorage: () => (state) => {
        if (state) document.documentElement.setAttribute('data-theme', state.theme)
      },
    }
  )
)
```

```tsx
// src/components/ui/ThemeToggle.tsx
import { Sun, Moon } from 'lucide-react'
import { useTheme } from '@/store/themeStore'

export function ThemeToggle() {
  const { theme, toggle } = useTheme()
  return (
    <button
      onClick={toggle}
      className="w-9 h-9 rounded-full flex items-center justify-center
                 bg-[var(--surface)] border border-[var(--border)]
                 shadow-[var(--card-shadow)] transition-transform hover:scale-105 active:scale-95"
    >
      {theme === 'dark'
        ? <Sun size={16} className="text-[var(--text-2)]" />
        : <Moon size={16} className="text-[var(--text-2)]" />
      }
    </button>
  )
}
```

---

## 11. Estructura de archivos de estilos

```
src/
├── styles/
│   ├── globals.css        ← @tailwind + tokens CSS + keyframes + resets
│   ├── tokens.css         ← :root, [data-theme="light"], [data-theme="dark"]
│   └── animations.css     ← todos los @keyframes
├── components/
│   └── ui/
│       ├── Wordmark.tsx   ← el wordmark K U E N T A
│       ├── ThemeToggle.tsx
│       ├── AmbientBlobs.tsx
│       ├── Card.tsx
│       ├── Button.tsx
│       ├── Input.tsx
│       ├── Avatar.tsx
│       ├── Badge.tsx
│       ├── Spinner.tsx
│       └── Skeleton.tsx
```

---

## 12. Icono de la app — K Knockout

El icono oficial de KUENTA es una **K blanca knockout** sobre fondo morado degradado. Diseño minimalista, premium, funciona igual en 512px que en 32px.

### Especificación exacta (canvas 512×512)

| Parámetro | Valor | Descripción |
|---|---|---|
| `stroke-width` | 60.4px | ~11.8% del canvas |
| Altura K | 286px | ~55.9% del canvas |
| Ancho K | 225px | ~43.9% del canvas |
| Centro óptico X | 256px | Centro geométrico exacto |
| Centro óptico Y | 257px | +1px bajo centro para equilibrio óptico |
| `border-radius` | 114px | Radio iOS estándar (22.2% del lado) |

### Gradiente de fondo

```
#4C44AA → #5C54BC → #2E2880  (diagonal: top-left a bottom-right)
```

### Archivo fuente

El SVG base está en `public/icons/kuenta-icon.svg`. No modificar — usar solo para exportar.

### Cómo generar todos los tamaños PWA

```bash
# Instalar una vez
npm install -g pwa-asset-generator

# Generar todos los tamaños (192, 512, maskable, favicon, apple-touch-icon...)
npx pwa-asset-generator public/icons/kuenta-icon.svg public/icons \
  --background "#4C44AA" \
  --padding "10%" \
  --manifest public/manifest.json \
  --index index.html
```

Esto genera automáticamente:
- `icon-192.png` y `icon-512.png` para el `manifest.json`
- `apple-touch-icon.png` (180×180) para iOS
- `favicon.ico` (32×32 + 16×16)
- Iconos maskable para Android

### Uso en manifest.json

```json
{
  "icons": [
    { "src": "/icons/icon-192.png", "sizes": "192x192", "type": "image/png" },
    { "src": "/icons/icon-512.png", "sizes": "512x512", "type": "image/png" },
    { "src": "/icons/icon-512.png", "sizes": "512x512", "type": "image/png", "purpose": "maskable" }
  ]
}
```

### Uso en index.html

```html
<link rel="icon" href="/icons/favicon.ico" sizes="any"/>
<link rel="icon" href="/icons/kuenta-icon.svg" type="image/svg+xml"/>
<link rel="apple-touch-icon" href="/icons/apple-touch-icon.png"/>
```

### Reglas irrompibles del icono

1. **Nunca** cambiar el SVG fuente manualmente — regenerar con el archivo base
2. **Nunca** usar el icono sobre fondo blanco sin el contenedor morado
3. **Nunca** escalar el SVG con diferentes proporciones (siempre 1:1)
4. El icono en la app se referencia solo como PNG — nunca SVG inline en React

---

## 13. Checklist de implementación

Antes de marcar cualquier pantalla como completa, verificar:

- [ ] No hay emojis — solo SVG/Lucide
- [ ] Wordmark usa `<Wordmark />` component, nunca texto plano
- [ ] Todos los colores usan CSS vars o tokens Tailwind, no hex hardcodeado
- [ ] Touch targets ≥ 44px
- [ ] Loading states con `<Skeleton />` o `<Spinner />`
- [ ] Empty states con mensaje y ícono (no pantalla en blanco)
- [ ] Funciona en ambos modos (light/dark)
- [ ] `font-family: var(--f-ui)` en todos los elementos de texto
- [ ] Header con gradient morado siempre (no cambia por tema)
- [ ] Safe areas respetadas (top 52px, bottom 24px)
- [ ] Sin `any` en TypeScript
- [ ] Sin `console.log` en producción
