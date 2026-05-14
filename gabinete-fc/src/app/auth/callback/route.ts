import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/db'

/**
 * Callback do Supabase Auth — chamado de duas formas:
 *   1) OAuth providers / PKCE flow → `?code=<auth-code>`
 *   2) Confirmação de email / magic link → `?token_hash=<hash>&type=<email|signup|recovery|invite|email_change>`
 *
 * Cada um exige uma API diferente do Supabase pra trocar pelo session cookie.
 * Depois de autenticado, redireciona pra /onboarding/dados se o perfil
 * ainda não foi completado (CPF/telefone), senão pra `next` (default /minha-conta).
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const tokenHash = searchParams.get('token_hash')
  const type = searchParams.get('type') as
    | 'email'
    | 'signup'
    | 'magiclink'
    | 'recovery'
    | 'invite'
    | 'email_change'
    | null
  const next = searchParams.get('next') ?? '/minha-conta'

  const supabase = await createClient()

  // Caso 1: PKCE/OAuth — trocar code por sessão
  if (code) {
    const { data, error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error && data.user) {
      await ensureProfile(data.user.id, data.user.email!, data.user.user_metadata?.name as string | undefined)
      const dest = await resolveDestination(data.user.id, next)
      return NextResponse.redirect(`${origin}${dest}`)
    }
    return NextResponse.redirect(`${origin}/auth/error?reason=invalid_code&detail=${encodeURIComponent(error?.message ?? '')}`)
  }

  // Caso 2: email confirmation / magic link — verificar OTP por hash
  if (tokenHash && type) {
    const { data, error } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type })
    if (!error && data.user) {
      await ensureProfile(data.user.id, data.user.email!, data.user.user_metadata?.name as string | undefined)
      const dest = await resolveDestination(data.user.id, next)
      return NextResponse.redirect(`${origin}${dest}`)
    }
    return NextResponse.redirect(`${origin}/auth/error?reason=invalid_token&detail=${encodeURIComponent(error?.message ?? '')}`)
  }

  return NextResponse.redirect(`${origin}/auth/error?reason=missing_params`)
}

async function ensureProfile(id: string, email: string, name: string | undefined) {
  await prisma.user.upsert({
    where: { id },
    update: {},
    create: { id, email, name: name ?? null, role: 'customer' },
  })
}

async function resolveDestination(userId: string, next: string): Promise<string> {
  // Se ainda não preencheu dados de cliente, manda pra onboarding
  const profile = await prisma.user.findUnique({
    where: { id: userId },
    select: { cpf: true, phone: true },
  })
  if (!profile?.cpf || !profile.phone) {
    return `/onboarding/dados?next=${encodeURIComponent(next)}`
  }
  return next
}
