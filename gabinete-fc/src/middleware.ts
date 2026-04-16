import { auth } from '@/lib/auth'
import { NextResponse } from 'next/server'

export default auth((req) => {
  const { pathname } = req.nextUrl
  const isLoggedIn = !!req.auth?.user

  // Rotas que exigem login
  const protectedRoutes = ['/minha-conta', '/checkout']
  const isProtectedRoute = protectedRoutes.some((r) => pathname.startsWith(r))

  // Rotas admin
  const isAdminRoute = pathname.startsWith('/admin')
  const isAdmin = (req.auth?.user as { role?: string })?.role === 'admin'

  if (isAdminRoute && !isAdmin) {
    return NextResponse.redirect(new URL('/auth/login?callbackUrl=' + pathname, req.url))
  }

  if (isProtectedRoute && !isLoggedIn) {
    return NextResponse.redirect(new URL('/auth/login?callbackUrl=' + pathname, req.url))
  }

  // Redirecionar usuário já logado da página de login
  if ((pathname === '/auth/login' || pathname === '/auth/register') && isLoggedIn) {
    return NextResponse.redirect(new URL('/minha-conta', req.url))
  }

  return NextResponse.next()
})

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|images|logo).*)'],
}
