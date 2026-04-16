import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { sessionId, userId, eventType, pageUrl, productId, metadata, utmSource, utmMedium, utmCampaign, posX, posY } = body

    if (!sessionId || !eventType) {
      return NextResponse.json({ error: 'sessionId e eventType obrigatórios' }, { status: 400 })
    }

    const pX = typeof posX === 'number' ? posX : null
    const pY = typeof posY === 'number' ? posY : null
    const meta = metadata ? JSON.stringify(metadata) : null

    // Use raw SQL to insert so posX/posY work even with stale Prisma engine cache
    await prisma.$executeRaw`
      INSERT INTO behavior_events
        (id, sessionId, userId, eventType, pageUrl, productId, metadata, utmSource, utmMedium, utmCampaign, posX, posY, createdAt)
      VALUES
        (${`evt_${Math.random().toString(36).slice(2)}${Date.now().toString(36)}`},
         ${sessionId}, ${userId ?? null}, ${eventType}, ${pageUrl ?? null},
         ${productId ?? null}, ${meta}, ${utmSource ?? null}, ${utmMedium ?? null},
         ${utmCampaign ?? null}, ${pX}, ${pY}, ${new Date().toISOString()})
    `

    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: 'Erro ao registrar evento' }, { status: 500 })
  }
}
