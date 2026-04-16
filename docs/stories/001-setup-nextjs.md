# Story 001 — Setup do Projeto Next.js 14

**Epic:** EPIC-01 (Infraestrutura)
**Sprint:** Sprint 1
**Referência:** US-01.1
**Agente:** @dev
**SP:** 5
**Status:** [ ] Não iniciado

---

## Objetivo

Criar o projeto Next.js 14 com App Router, TypeScript strict, Tailwind CSS, shadcn/ui com o tema do Gabinete FC (verde neon + preto) e estrutura de pastas padronizada. O resultado é um servidor rodando em `http://localhost:3000` com a identidade visual da loja.

---

## Stack desta Story

- Next.js 14 (App Router)
- TypeScript `strict: true`
- Tailwind CSS 3
- shadcn/ui
- Logo: `Logo/Gemini_Generated_Image_4fidwr4fidwr4fid.png`

**Sem banco de dados nesta story** — dados virão como mock estático.

---

## Tarefas

- [ ] 1. Inicializar o projeto Next.js 14
- [ ] 2. Configurar Tailwind com tema Gabinete FC
- [ ] 3. Instalar e configurar shadcn/ui
- [ ] 4. Criar estrutura de pastas
- [ ] 5. Copiar logo para `public/`
- [ ] 6. Criar layout raiz com tema aplicado
- [ ] 7. Criar página de teste confirmando que está funcional

---

## Implementação

### 1. Criar o projeto

```bash
npx create-next-app@latest gabinete-fc \
  --typescript \
  --tailwind \
  --eslint \
  --app \
  --src-dir \
  --import-alias "@/*"

cd gabinete-fc
```

### 2. Instalar dependências base

```bash
npm install \
  zustand \
  zod \
  @hookform/resolvers \
  react-hook-form \
  lucide-react \
  clsx \
  tailwind-merge \
  class-variance-authority

npm install -D prettier prettier-plugin-tailwindcss
```

### 3. Configurar shadcn/ui

```bash
npx shadcn@latest init
```

Quando perguntar, responder:
- Style: **Default**
- Base color: **Zinc** (vamos sobrescrever com o tema)
- CSS variables: **Yes**

Instalar componentes iniciais:
```bash
npx shadcn@latest add button badge card separator sheet
npx shadcn@latest add input label textarea select
npx shadcn@latest add dialog drawer toast
npx shadcn@latest add navigation-menu
```

### 4. Configurar tema Gabinete FC no Tailwind

```typescript
// tailwind.config.ts
import type { Config } from 'tailwindcss'

const config: Config = {
  darkMode: ['class'],
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Paleta Gabinete FC
        'gfc-black':   '#111111',
        'gfc-dark':    '#1A1A1A',
        'gfc-card':    '#222222',
        'gfc-border':  '#2A2A2A',
        'gfc-green':   '#A3D900',  // Verde neon da logo
        'gfc-green-dark': '#7DAA00',
        'gfc-white':   '#FFFFFF',
        'gfc-gray':    '#9CA3AF',
        'gfc-gray-light': '#D1D5DB',
        // shadcn/ui variables (sobrescrever)
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'system-ui', 'sans-serif'],
        display: ['var(--font-bebas)', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
}

export default config
```

### 5. CSS Global com variáveis do tema

```css
/* src/app/globals.css */
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    /* Tema escuro é o padrão (dark mode primeiro) */
    --background: 0 0% 7%;          /* #111111 */
    --foreground: 0 0% 100%;        /* #FFFFFF */

    --card: 0 0% 13%;               /* #222222 */
    --card-foreground: 0 0% 100%;

    --popover: 0 0% 10%;
    --popover-foreground: 0 0% 100%;

    --primary: 78 100% 42%;         /* Verde neon #A3D900 */
    --primary-foreground: 0 0% 7%;  /* Preto sobre verde */

    --secondary: 0 0% 16%;
    --secondary-foreground: 0 0% 100%;

    --muted: 0 0% 16%;
    --muted-foreground: 0 0% 60%;

    --accent: 78 100% 42%;
    --accent-foreground: 0 0% 7%;

    --destructive: 0 84% 60%;
    --destructive-foreground: 0 0% 100%;

    --border: 0 0% 17%;             /* #2A2A2A */
    --input: 0 0% 17%;
    --ring: 78 100% 42%;

    --radius: 0.5rem;
  }
}

@layer base {
  * {
    @apply border-border;
  }

  body {
    @apply bg-gfc-black text-gfc-white font-sans antialiased;
  }

  /* Scrollbar customizada */
  ::-webkit-scrollbar {
    width: 6px;
    height: 6px;
  }
  ::-webkit-scrollbar-track {
    @apply bg-gfc-dark;
  }
  ::-webkit-scrollbar-thumb {
    @apply bg-gfc-border rounded-full;
  }
  ::-webkit-scrollbar-thumb:hover {
    @apply bg-gfc-green;
  }
}

@layer components {
  /* Botão padrão Gabinete FC */
  .btn-gfc {
    @apply bg-gfc-green text-gfc-black font-bold uppercase tracking-widest
           hover:bg-gfc-green-dark transition-colors duration-200
           px-6 py-3 rounded-sm;
  }

  /* Badge de desconto */
  .badge-pix {
    @apply bg-gfc-green/10 text-gfc-green border border-gfc-green/30
           text-xs font-bold uppercase px-2 py-0.5 rounded;
  }

  /* Card de produto */
  .product-card {
    @apply bg-gfc-card border border-gfc-border rounded-lg overflow-hidden
           hover:border-gfc-green/50 transition-colors duration-200;
  }
}
```

### 6. Instalar e configurar fontes

```bash
npm install next/font
```

```typescript
// src/app/layout.tsx
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
})

export const metadata: Metadata = {
  title: {
    default: 'Gabinete FC — Camisas de Futebol Premium',
    template: '%s | Gabinete FC',
  },
  description: 'Camisas de futebol autênticas importadas. Seleções e clubes do mundo todo com entrega para todo o Brasil.',
  keywords: ['camisas de futebol', 'camisa importada', 'camisa tailandesa', 'camisa premium'],
  openGraph: {
    type: 'website',
    locale: 'pt_BR',
    siteName: 'Gabinete FC',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="pt-BR" className="dark">
      <body className={`${inter.variable} font-sans bg-gfc-black text-gfc-white`}>
        {children}
      </body>
    </html>
  )
}
```

### 7. Estrutura de pastas a criar

```bash
mkdir -p src/components/{ui,layout,product,cart,checkout,admin,shared}
mkdir -p src/lib/{validators,formatters,hooks}
mkdir -p src/stores
mkdir -p src/actions
mkdir -p src/types
mkdir -p src/data           # Mock data (temporário até banco)
mkdir -p public/logo
mkdir -p public/images/products
```

### 8. Copiar a logo para o projeto

Copiar manualmente:
```
Logo/Gemini_Generated_Image_4fidwr4fidwr4fid.png → public/logo/gabinete-fc-logo.png
Logo/Gemini_Generated_Image_coublucoublucoub.png → public/logo/gabinete-fc-icon.png
```

Criar componente de logo:
```typescript
// src/components/layout/Logo.tsx
import Image from 'next/image'
import Link from 'next/link'

interface LogoProps {
  variant?: 'full' | 'icon'
  className?: string
}

export function Logo({ variant = 'full', className = '' }: LogoProps) {
  return (
    <Link href="/" className={`flex items-center ${className}`}>
      {variant === 'full' ? (
        <Image
          src="/logo/gabinete-fc-logo.png"
          alt="Gabinete FC"
          width={180}
          height={60}
          priority
          className="h-10 w-auto"
        />
      ) : (
        <Image
          src="/logo/gabinete-fc-icon.png"
          alt="Gabinete FC"
          width={40}
          height={40}
          priority
          className="h-10 w-10"
        />
      )}
    </Link>
  )
}
```

### 9. Página home temporária para validar setup

```typescript
// src/app/page.tsx
import { Logo } from '@/components/layout/Logo'

export default function HomePage() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center gap-8 bg-gfc-black">
      <Logo variant="full" />
      <div className="text-center space-y-2">
        <h1 className="text-4xl font-bold text-gfc-white">
          Gabinete <span className="text-gfc-green">FC</span>
        </h1>
        <p className="text-gfc-gray">Camisas de futebol premium</p>
      </div>
      <div className="flex gap-4">
        <button className="btn-gfc">Ver Camisas</button>
        <button className="bg-gfc-card border border-gfc-border text-gfc-white px-6 py-3 rounded-sm uppercase tracking-widest hover:border-gfc-green/50 transition-colors">
          Admin
        </button>
      </div>
      <div className="badge-pix">Pix com 5% de desconto</div>
    </main>
  )
}
```

### 10. Configurar path aliases e ESLint

```json
// tsconfig.json — verificar que está correto
{
  "compilerOptions": {
    "target": "ES2017",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [{ "name": "next" }],
    "paths": {
      "@/*": ["./src/*"]
    }
  }
}
```

```json
// .prettierrc
{
  "semi": false,
  "singleQuote": true,
  "tabWidth": 2,
  "trailingComma": "es5",
  "plugins": ["prettier-plugin-tailwindcss"]
}
```

---

## Critérios de Aceitação

- [ ] `npm run dev` inicia sem erros em `http://localhost:3000`
- [ ] `npm run build` completa sem erros de TypeScript
- [ ] `npm run lint` passa sem warnings
- [ ] Página home exibe logo do Gabinete FC
- [ ] Fundo preto `#111111`, botão CTA verde neon `#A3D900`
- [ ] Fonte Inter carregando corretamente
- [ ] shadcn/ui: `Button`, `Card`, `Badge` importam e renderizam
- [ ] Sem erros no console do browser

---

## Arquivos criados/modificados

- [ ] `package.json`
- [ ] `tailwind.config.ts`
- [ ] `src/app/globals.css`
- [ ] `src/app/layout.tsx`
- [ ] `src/app/page.tsx`
- [ ] `src/components/layout/Logo.tsx`
- [ ] `tsconfig.json`
- [ ] `.prettierrc`
- [ ] `public/logo/gabinete-fc-logo.png`
- [ ] `public/logo/gabinete-fc-icon.png`

---

*Story 001 | Sprint 1 | Gabinete FC*
