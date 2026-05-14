import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
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
  const { pathname } = request.nextUrl
  const isLoggedIn = !!user

  // Admin precisa de role=admin no public.users
  const isAdminRoute = pathname.startsWith('/admin')
  if (isAdminRoute) {
    if (!isLoggedIn) {
      return NextResponse.redirect(new URL('/auth/login?callbackUrl=' + pathname, request.url))
    }
    // Verificação de role acontece no layout/admin via requireAdmin() (DB query)
  }

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
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|images|logo).*)'],
}
