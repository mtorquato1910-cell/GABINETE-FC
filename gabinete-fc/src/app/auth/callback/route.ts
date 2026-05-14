import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/db'

/**
 * Callback do Supabase Auth — fluxo robusto:
 *   1) PKCE/OAuth → ?code=
 *   2) Email/Magic link → ?token_hash=&type=
 *
 * Se a troca de código falhar mas já houver uma sessão válida (cookie),
 * tratamos como sucesso (o usuário já está autenticado).
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const tokenHash = searchParams.get('token_hash')
  const type = searchParams.get('type') as
    | 'email' | 'signup' | 'magiclink' | 'recovery' | 'invite' | 'email_change' | null
  const next = searchParams.get('next') ?? '/minha-conta'

  const supabase = await createClient()

  // 1) PKCE/OAuth
  if (code) {
    const { data, error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error && data.user) {
      await ensureProfile(data.user.id, data.user.email!, data.user.user_metadata?.name as string | undefined)
      return NextResponse.redirect(`${origin}${await resolveDestination(data.user.id, next)}`)
    }

    // Fallback: já estava logado em outra aba (PKCE verifier no outro browser)
    const { data: { user: existing } } = await supabase.auth.getUser()
    if (existing) {
      await ensureProfile(existing.id, existing.email!, existing.user_metadata?.name as string | undefined)
      return NextResponse.redirect(`${origin}${await resolveDestination(existing.id, next)}`)
    }

    // Caso especial: erro PKCE — o usuário confirmou em outro device. Mandamos pro login
    // com mensagem amigável (não erro técnico).
    return NextResponse.redirect(`${origin}/auth/login?confirmed=1`)
  }

  // 2) Email/magic link
  if (tokenHash && type) {
    const { data, error } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type })
    if (!error && data.user) {
      await ensureProfile(data.user.id, data.user.email!, data.user.user_metadata?.name as string | undefined)
      return NextResponse.redirect(`${origin}${await resolveDestination(data.user.id, next)}`)
    }
    return NextResponse.redirect(`${origin}/auth/login?confirmed=1`)
  }

  // Sem parâmetros — provavelmente o link foi seguido sem code/token (ou já consumido)
  const { data: { user: existing } } = await supabase.auth.getUser()
  if (existing) {
    return NextResponse.redirect(`${origin}${await resolveDestination(existing.id, next)}`)
  }
  return NextResponse.redirect(`${origin}/auth/login?confirmed=1`)
}

async function ensureProfile(id: string, email: string, name: string | undefined) {
  try {
    await prisma.user.upsert({
      where: { id },
      update: {},
      create: { id, email, name: name ?? null, role: 'customer' },
    })
  } catch (err) {
    console.error('[callback] ensureProfile error:', err)
  }
}

async function resolveDestination(userId: string, next: string): Promise<string> {
  try {
    const profile = await prisma.user.findUnique({
      where: { id: userId },
      select: { cpf: true, phone: true },
    })
    if (!profile?.cpf || !profile.phone) {
      return `/onboarding/dados?next=${encodeURIComponent(next)}`
    }
  } catch (err) {
    console.error('[callback] resolveDestination error:', err)
  }
  return next
}
