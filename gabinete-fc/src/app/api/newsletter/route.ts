import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { capiLead } from '@/lib/actions/capi'
import { checkRateLimit, getClientIp } from '@/lib/rate-limit'

// Rate limit: 3 inscrições por hora por IP (anti-spam de leads)
const RATE_MAX = 3
const RATE_WINDOW_MS = 60 * 60 * 1000

const newsletterSchema = z.object({
  email: z.string().email('Email inválido').max(254),
})

export async function POST(req: NextRequest) {
  try {
    const ip = getClientIp(req.headers)
    const rl = checkRateLimit(`newsletter:${ip}`, RATE_MAX, RATE_WINDOW_MS)
    if (!rl.allowed) {
      return NextResponse.json(
        { error: 'Muitas tentativas — tente mais tarde' },
        { status: 429 }
      )
    }

    const body = await req.json().catch(() => null)
    const parsed = newsletterSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: 'Email inválido' }, { status: 400 })
    }

    const userAgent = req.headers.get('user-agent') ?? undefined

    // Dispara CAPI Lead (non-blocking)
    capiLead({ email: parsed.data.email, clientIp: ip, clientUserAgent: userAgent }).catch(
      () => undefined
    )

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
