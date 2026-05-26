import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { auth } from '@/lib/auth'

export async function GET(req: NextRequest) {
  const session = await auth()
  const user = session?.user as { role?: string } | undefined
  if (user?.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(req.url)
  const pageUrl = searchParams.get('page') ?? '/'
  const sessionId = searchParams.get('session') ?? undefined
  const type = searchParams.get('type') ?? 'heatmap'

  try {
    if (type === 'leads') {
      // Top 100 sessões mais recentes, com contagem de eventos e janela first/last
      const grouped = await prisma.behaviorEvent.groupBy({
        by: ['sessionId'],
        _count: { id: true },
        _min: { createdAt: true },
        _max: { createdAt: true },
        orderBy: { _max: { createdAt: 'desc' } },
        take: 100,
      })

      // Pega o primeiro evento de cada sessão pra extrair UTM/userId/landing
      const firstEvents = await prisma.behaviorEvent.findMany({
        where: { sessionId: { in: grouped.map((g) => g.sessionId) } },
        orderBy: { createdAt: 'asc' },
        distinct: ['sessionId'],
        select: {
          sessionId: true,
          userId: true,
          utmSource: true,
          utmMedium: true,
          utmCampaign: true,
          pageUrl: true,
        },
      })
      const firstBySession = new Map(firstEvents.map((f) => [f.sessionId, f]))

      const leads = grouped.map((g) => {
        const f = firstBySession.get(g.sessionId)
        return {
          sessionId: g.sessionId,
          events: g._count.id,
          firstSeen: g._min.createdAt?.toISOString() ?? null,
          lastSeen: g._max.createdAt?.toISOString() ?? null,
          userId: f?.userId ?? null,
          utmSource: f?.utmSource ?? null,
          utmMedium: f?.utmMedium ?? null,
          utmCampaign: f?.utmCampaign ?? null,
          landingPage: f?.pageUrl ?? null,
        }
      })

      return NextResponse.json({ leads })
    }

    if (type === 'journey' && sessionId) {
      const events = await prisma.behaviorEvent.findMany({
        where: { sessionId },
        orderBy: { createdAt: 'asc' },
        select: {
          id: true,
          eventType: true,
          pageUrl: true,
          posX: true,
          posY: true,
          productId: true,
          utmSource: true,
          utmMedium: true,
          utmCampaign: true,
          createdAt: true,
        },
      })

      return NextResponse.json({
        journey: events.map((e) => ({ ...e, createdAt: e.createdAt.toISOString() })),
      })
    }

    // Heatmap default: pontos de click/mouse_move pra página específica
    const points = await prisma.behaviorEvent.findMany({
      where: {
        pageUrl,
        eventType: { in: ['click', 'mouse_move'] },
        posX: { not: null },
        posY: { not: null },
      },
      select: { posX: true, posY: true, eventType: true },
      take: 5000,
    })

    return NextResponse.json({ points })
  } catch (err) {
    console.error('[/api/analytics/heatmap]', { type, pageUrl, sessionId, error: err })
    // Retornar shape consistente com dataset vazio + flag de erro pra UI mostrar mensagem clara
    return NextResponse.json(
      {
        points: [],
        leads: [],
        journey: [],
        error: 'Falha ao consultar dados. Veja logs do servidor.',
      },
      { status: 500 },
    )
  }
}
