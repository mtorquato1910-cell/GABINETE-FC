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
  const type = searchParams.get('type') ?? 'heatmap' // 'heatmap' | 'journey' | 'leads'

  if (type === 'leads') {
    // Return list of unique sessions with UTM info and first/last seen
    const sessions = await prisma.behaviorEvent.groupBy({
      by: ['sessionId'],
      _count: { id: true },
      _min: { createdAt: true },
      _max: { createdAt: true },
      orderBy: { _max: { createdAt: 'desc' } },
      take: 100,
    })

    // Fetch UTM + userId for each session (first event)
    const details = await Promise.all(
      sessions.map(async (s) => {
        const first = await prisma.behaviorEvent.findFirst({
          where: { sessionId: s.sessionId },
          select: { userId: true, utmSource: true, utmMedium: true, utmCampaign: true, pageUrl: true },
          orderBy: { createdAt: 'asc' },
        })
        return {
          sessionId: s.sessionId,
          events: s._count.id,
          firstSeen: s._min.createdAt,
          lastSeen: s._max.createdAt,
          userId: first?.userId ?? null,
          utmSource: first?.utmSource ?? null,
          utmMedium: first?.utmMedium ?? null,
          utmCampaign: first?.utmCampaign ?? null,
          landingPage: first?.pageUrl ?? null,
        }
      })
    )

    return NextResponse.json({ leads: details })
  }

  if (type === 'journey' && sessionId) {
    // Return ordered events for a specific session
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

    return NextResponse.json({ journey: events })
  }

  // Default: heatmap data for a specific page
  const events = await prisma.behaviorEvent.findMany({
    where: {
      pageUrl,
      eventType: { in: ['click', 'mouse_move'] },
      posX: { not: null },
      posY: { not: null },
    },
    select: { posX: true, posY: true, eventType: true },
    take: 5000,
  })

  return NextResponse.json({ points: events })
}
