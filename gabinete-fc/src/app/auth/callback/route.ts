import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/db'

// Rota chamada pelo email de confirmação do Supabase + OAuth providers
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/minha-conta'

  if (code) {
    const supabase = await createClient()
    const { data, error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error && data.user) {
      // Garante o profile no Prisma após confirmação do email
      await prisma.user.upsert({
        where: { id: data.user.id },
        update: {},
        create: {
          id: data.user.id,
          email: data.user.email!,
          name: (data.user.user_metadata?.name as string | undefined) ?? null,
          role: 'customer',
        },
      })

      return NextResponse.redirect(`${origin}${next}`)
    }
  }

  return NextResponse.redirect(`${origin}/auth/error?reason=invalid_code`)
}
