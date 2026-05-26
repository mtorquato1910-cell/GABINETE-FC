import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

// Painel admin: por padrão DESATIVADO até o cliente terminar.
// Ative com ADMIN_ENABLED=true no .env quando quiser liberar.
const ADMIN_ENABLED = process.env.ADMIN_ENABLED === 'true'

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // ─── Admin lockdown ──────────────────────────────────────────
  // Quando desativado, retorna 404 disfarçado pra qualquer rota /admin,
  // /painel ou /api/admin — não revela que o painel existe.
  if (
    !ADMIN_ENABLED &&
    (pathname.startsWith('/admin') ||
      pathname.startsWith('/painel') ||
      pathname.startsWith('/api/admin'))
  ) {
    return new NextResponse('Not Found', { status: 404 })
  }

  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          )
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          )
        },
      },
    },
  )

  const { data: { user } } = await supabase.auth.getUser()
  const isLoggedIn = !!user

  // Rotas que exigem login
  const protectedRoutes = ['/minha-conta', '/checkout']
  const isProtectedRoute = protectedRoutes.some((r) => pathname.startsWith(r))
  if (isProtectedRoute && !isLoggedIn) {
    return NextResponse.redirect(new URL('/auth/login?callbackUrl=' + pathname, request.url))
  }

  // Redireciona quem já logou pra fora de /auth/login e /auth/register
  if ((pathname === '/auth/login' || pathname === '/auth/register') && isLoggedIn) {
    return NextResponse.redirect(new URL('/minha-conta', request.url))
  }

  return supabaseResponse
}

export const config = {
  // Inclui rotas /api (precisamos pra interceptar /api/admin)
  // mas continua excluindo assets estáticos
  matcher: ['/((?!_next/static|_next/image|favicon.ico|images|logo).*)'],
}
