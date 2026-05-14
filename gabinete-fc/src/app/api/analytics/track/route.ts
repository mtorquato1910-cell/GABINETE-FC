import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { checkRateLimit, getClientIp } from '@/lib/rate-limit'

// Rate limit: 30 eventos por minuto por IP (analytics é frequente mas não absurdo)
const RATE_MAX = 30
const RATE_WINDOW_MS = 60_000

export async function POST(req: NextRequest) {
  try {
    const ip = getClientIp(req.headers)
    const rl = checkRateLimit(`analytics:${ip}`, RATE_MAX, RATE_WINDOW_MS)
    if (!rl.allowed) {
      return NextResponse.json(
        { error: 'Rate limit exceeded' },
        {
          status: 429,
          headers: {
            'X-RateLimit-Limit': String(RATE_MAX),
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': String(Math.ceil(rl.resetAt / 1000)),
          },
        }
      )
    }

    const body = await req.json()
    const {
      sessionId,
      userId,
      eventType,
      pageUrl,
      productId,
      metadata,
      utmSource,
      utmMedium,
      utmCampaign,
      posX,
      posY,
    } = body

    if (!sessionId || !eventType) {
      return NextResponse.json({ error: 'sessionId e eventType obrigatórios' }, { status: 400 })
    }
    if (typeof sessionId !== 'string' || sessionId.length > 64) {
      return NextResponse.json({ error: 'sessionId inválido' }, { status: 400 })
    }
    if (typeof eventType !== 'string' || eventType.length > 32) {
      return NextResponse.json({ error: 'eventType inválido' }, { status: 400 })
    }

    await prisma.behaviorEvent.create({
      data: {
        sessionId,
        userId: typeof userId === 'string' ? userId : null,
        eventType,
        pageUrl: typeof pageUrl === 'string' ? pageUrl.slice(0, 512) : null,
        productId: typeof productId === 'string' ? productId : null,
        metadata: metadata ? JSON.stringify(metadata).slice(0, 4000) : null,
        utmSource: typeof utmSource === 'string' ? utmSource.slice(0, 128) : null,
        utmMedium: typeof utmMedium === 'string' ? utmMedium.slice(0, 128) : null,
        utmCampaign: typeof utmCampaign === 'string' ? utmCampaign.slice(0, 128) : null,
        posX: typeof posX === 'number' ? posX : null,
        posY: typeof posY === 'number' ? posY : null,
      },
    })

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[analytics/track]', err)
    return NextResponse.json({ error: 'Erro ao registrar evento' }, { status: 500 })
  }
}
