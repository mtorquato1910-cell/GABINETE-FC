# Story 004 — Autenticação com NextAuth.js v5

**Epic:** EPIC-01 / EPIC-03
**Sprint:** Sprint 1
**Referência:** US-01.4 + US-03.1 (adaptado para NextAuth)
**Agente:** @dev
**SP:** 5
**Status:** [ ] Não iniciado

---

## Objetivo

Configurar NextAuth.js v5 (Auth.js) com Prisma Adapter para persistir sessões no banco, suporte a Google OAuth e email/senha (Credentials). Criar middleware de proteção de rotas e helpers `getSession`, `requireAuth`, `requireAdmin`.

---

## Tarefas

- [ ] 1. Instalar NextAuth.js v5 + Prisma Adapter
- [ ] 2. Criar auth config (providers: Google + Credentials)
- [ ] 3. Criar middleware de proteção de rotas
- [ ] 4. Criar helpers de sessão
- [ ] 5. Criar página de login
- [ ] 6. Testar login com credenciais e Google

---

## Implementação

### 1. Instalar dependências

```bash
npm install next-auth@beta @auth/prisma-adapter bcrypt-ts
npm install -D @types/bcrypt
```

### 2. Configuração do NextAuth — src/auth.ts

```typescript
// src/auth.ts
import NextAuth from 'next-auth'
import Google from 'next-auth/providers/google'
import Credentials from 'next-auth/providers/credentials'
import { PrismaAdapter } from '@auth/prisma-adapter'
import { prisma } from '@/lib/db'
import { compareSync } from 'bcrypt-ts'
import { z } from 'zod'

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),

  session: {
    strategy: 'jwt', // JWT para Credentials funcionar com edge
  },

  pages: {
    signIn: '/login',
    error: '/login',
  },

  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),

    Credentials({
      name: 'credentials',
      credentials: {
        email: { label: 'E-mail', type: 'email' },
        password: { label: 'Senha', type: 'password' },
      },
      async authorize(credentials) {
        const parsed = z.object({
          email: z.string().email(),
          password: z.string().min(6),
        }).safeParse(credentials)

        if (!parsed.success) return null

        const user = await prisma.user.findUnique({
          where: { email: parsed.data.email },
        })

        if (!user || !user.passwordHash) return null
        if (user.deletedAt) return null // Conta deletada (LGPD)

        const passwordValid = compareSync(parsed.data.password, user.passwordHash)
        if (!passwordValid) return null

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.image,
          role: user.role,
        }
      },
    }),
  ],

  callbacks: {
    async jwt({ token, user, trigger, session }) {
      // Adiciona role e id ao token no login
      if (user) {
        token.id = user.id
        token.role = (user as any).role ?? 'customer'
      }

      // Permite atualizar o token via `update()`
      if (trigger === 'update' && session?.role) {
        token.role = session.role
      }

      return token
    },

    async session({ session, token }) {
      // Disponibiliza id e role na sessão
      if (token) {
        session.user.id = token.id as string
        session.user.role = token.role as string
      }
      return session
    },
  },

  events: {
    async createUser({ user }) {
      // Garante role padrão ao criar via OAuth
      if (user.id) {
        await prisma.user.update({
          where: { id: user.id },
          data: { role: 'customer' },
        })
      }
    },
  },
})
```

### 3. Declaração de tipos — src/types/next-auth.d.ts

```typescript
// src/types/next-auth.d.ts
import { DefaultSession } from 'next-auth'

declare module 'next-auth' {
  interface Session {
    user: {
      id: string
      role: string
    } & DefaultSession['user']
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string
    role: string
  }
}
```

### 4. Route Handler — src/app/api/auth/[...nextauth]/route.ts

```typescript
// src/app/api/auth/[...nextauth]/route.ts
import { handlers } from '@/auth'

export const { GET, POST } = handlers
```

### 5. Middleware de proteção — src/middleware.ts

```typescript
// src/middleware.ts
import { auth } from '@/auth'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export default auth((req) => {
  const { nextUrl, auth: session } = req
  const isLoggedIn = !!session?.user
  const isAdmin = session?.user?.role === 'admin'

  // Rotas de admin — exige role admin
  if (nextUrl.pathname.startsWith('/admin')) {
    if (!isLoggedIn) {
      return NextResponse.redirect(new URL('/login?callbackUrl=/admin', req.url))
    }
    if (!isAdmin) {
      return NextResponse.redirect(new URL('/404', req.url))
    }
    return NextResponse.next()
  }

  // Rotas da área do cliente — exige login
  if (nextUrl.pathname.startsWith('/minha-conta')) {
    if (!isLoggedIn) {
      return NextResponse.redirect(
        new URL(`/login?callbackUrl=${nextUrl.pathname}`, req.url)
      )
    }
    return NextResponse.next()
  }

  // Rotas de auth — redireciona usuários já logados
  if (nextUrl.pathname.startsWith('/login') || nextUrl.pathname.startsWith('/cadastro')) {
    if (isLoggedIn) {
      return NextResponse.redirect(new URL('/minha-conta', req.url))
    }
    return NextResponse.next()
  }

  return NextResponse.next()
})

export const config = {
  matcher: [
    '/admin/:path*',
    '/minha-conta/:path*',
    '/login',
    '/cadastro',
    // Excluir assets e api do middleware
    '/((?!api|_next/static|_next/image|favicon.ico|logo|images).*)',
  ],
}
```

### 6. Helpers de sessão — src/lib/session.ts

```typescript
// src/lib/session.ts
import { auth } from '@/auth'
import { redirect } from 'next/navigation'

/**
 * Retorna a sessão atual ou null — para Server Components
 */
export async function getSession() {
  return await auth()
}

/**
 * Retorna o usuário logado ou redireciona para /login
 */
export async function requireAuth() {
  const session = await auth()
  if (!session?.user) {
    redirect('/login')
  }
  return session.user
}

/**
 * Retorna o usuário admin ou redireciona — para Server Components de admin
 */
export async function requireAdmin() {
  const session = await auth()
  if (!session?.user) {
    redirect('/login')
  }
  if (session.user.role !== 'admin') {
    redirect('/404')
  }
  return session.user
}
```

### 7. Página de Login — src/app/(auth)/login/page.tsx

```typescript
// src/app/(auth)/login/page.tsx
import { LoginForm } from '@/components/auth/LoginForm'
import { Logo } from '@/components/layout/Logo'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Login',
}

export default function LoginPage() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-gfc-black px-4">
      <div className="w-full max-w-md space-y-8">
        <div className="flex justify-center">
          <Logo variant="full" />
        </div>

        <div className="bg-gfc-card border border-gfc-border rounded-lg p-8 space-y-6">
          <div className="text-center space-y-1">
            <h1 className="text-2xl font-bold text-gfc-white">Entrar na sua conta</h1>
            <p className="text-gfc-gray text-sm">Acesse seus pedidos e favoritos</p>
          </div>

          <LoginForm />
        </div>
      </div>
    </main>
  )
}
```

```typescript
// src/components/auth/LoginForm.tsx
'use client'

import { signIn } from 'next-auth/react'
import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'

export function LoginForm() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()
  const searchParams = useSearchParams()
  const callbackUrl = searchParams.get('callbackUrl') || '/minha-conta'

  async function handleCredentials(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const result = await signIn('credentials', {
      email,
      password,
      redirect: false,
    })

    if (result?.error) {
      setError('E-mail ou senha incorretos')
      setLoading(false)
      return
    }

    router.push(callbackUrl)
    router.refresh()
  }

  return (
    <div className="space-y-4">
      {/* Google OAuth */}
      <Button
        variant="outline"
        className="w-full border-gfc-border bg-transparent text-gfc-white hover:bg-gfc-border"
        onClick={() => signIn('google', { callbackUrl })}
        type="button"
      >
        <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
          <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
        </svg>
        Entrar com Google
      </Button>

      <div className="flex items-center gap-4">
        <Separator className="flex-1 bg-gfc-border" />
        <span className="text-gfc-gray text-sm">ou</span>
        <Separator className="flex-1 bg-gfc-border" />
      </div>

      {/* Credentials */}
      <form onSubmit={handleCredentials} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email" className="text-gfc-white">E-mail</Label>
          <Input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="seu@email.com"
            required
            className="bg-gfc-dark border-gfc-border text-gfc-white placeholder:text-gfc-gray focus:border-gfc-green"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="password" className="text-gfc-white">Senha</Label>
          <Input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            required
            className="bg-gfc-dark border-gfc-border text-gfc-white placeholder:text-gfc-gray focus:border-gfc-green"
          />
        </div>

        {error && (
          <p className="text-red-400 text-sm" role="alert">{error}</p>
        )}

        <Button
          type="submit"
          disabled={loading}
          className="w-full bg-gfc-green text-gfc-black font-bold hover:bg-gfc-green-dark"
        >
          {loading ? 'Entrando...' : 'Entrar'}
        </Button>
      </form>

      <p className="text-center text-gfc-gray text-sm">
        Não tem conta?{' '}
        <a href="/cadastro" className="text-gfc-green hover:underline">
          Cadastre-se
        </a>
      </p>
    </div>
  )
}
```

### 8. Provider do NextAuth — SessionProvider

```typescript
// src/components/providers/SessionProvider.tsx
'use client'

import { SessionProvider as NextAuthSessionProvider } from 'next-auth/react'

export function SessionProvider({ children }: { children: React.ReactNode }) {
  return <NextAuthSessionProvider>{children}</NextAuthSessionProvider>
}
```

```typescript
// src/app/layout.tsx — adicionar o provider
import { SessionProvider } from '@/components/providers/SessionProvider'

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className="dark">
      <body className={`${inter.variable} font-sans bg-gfc-black text-gfc-white`}>
        <SessionProvider>
          {children}
        </SessionProvider>
      </body>
    </html>
  )
}
```

---

## Critérios de Aceitação

- [ ] Login com email/senha `admin@gabinetefc.com.br` / `Admin@123` funciona
- [ ] Sessão persiste após refresh da página
- [ ] `/minha-conta` redireciona para `/login` se não autenticado
- [ ] `/admin` redireciona para `/login` ou `/404` se não for admin
- [ ] `requireAdmin()` em Server Component funciona sem erros
- [ ] Google OAuth configurado (pode ser opcional no dev local)
- [ ] Logout limpa a sessão

---

## Arquivos criados/modificados

- [ ] `src/auth.ts`
- [ ] `src/middleware.ts`
- [ ] `src/lib/session.ts`
- [ ] `src/types/next-auth.d.ts`
- [ ] `src/app/api/auth/[...nextauth]/route.ts`
- [ ] `src/app/(auth)/login/page.tsx`
- [ ] `src/components/auth/LoginForm.tsx`
- [ ] `src/components/providers/SessionProvider.tsx`
- [ ] `src/app/layout.tsx` (atualizado com SessionProvider)

---

*Story 004 | Sprint 1 | Gabinete FC*
