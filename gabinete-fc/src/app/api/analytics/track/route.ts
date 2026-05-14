import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function POST(req: NextRequest) {
  try {
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

    await prisma.behaviorEvent.create({
      data: {
        sessionId: String(sessionId),
        userId: userId ? String(userId) : null,
        eventType: String(eventType),
        pageUrl: pageUrl ? String(pageUrl) : null,
        productId: productId ? String(productId) : null,
        metadata: metadata ? JSON.stringify(metadata) : null,
        utmSource: utmSource ? String(utmSource) : null,
        utmMedium: utmMedium ? String(utmMedium) : null,
        utmCampaign: utmCampaign ? String(utmCampaign) : null,
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
