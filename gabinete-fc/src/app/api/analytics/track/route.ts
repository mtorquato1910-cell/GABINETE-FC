import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { sessionId, userId, eventType, pageUrl, productId, metadata, utmSource, utmMedium, utmCampaign } = body

    if (!sessionId || !eventType) {
      return NextResponse.json({ error: 'sessionId e eventType obrigatórios' }, { status: 400 })
    }

    await prisma.behaviorEvent.create({
      data: { sessionId, userId, eventType, pageUrl, productId, metadata: metadata ? JSON.stringify(metadata) : null, utmSource, utmMedium, utmCampaign },
    })

    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: 'Erro ao registrar evento' }, { status: 500 })
  }
}
