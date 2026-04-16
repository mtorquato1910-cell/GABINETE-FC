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

  if (type === 'leads') {
    // Unique sessions with event count and first/last seen
    const sessions = await prisma.$queryRaw<{
      sessionId: string
      events: number
      firstSeen: string
      lastSeen: string
    }[]>`
      SELECT
        sessionId,
        COUNT(id) as events,
        MIN(createdAt) as firstSeen,
        MAX(createdAt) as lastSeen
      FROM behavior_events
      GROUP BY sessionId
      ORDER BY MAX(createdAt) DESC
      LIMIT 100
    `

    // Fetch first event per session for UTM/userId/landing
    const details = await Promise.all(
      sessions.map(async (s) => {
        const first = await prisma.$queryRaw<{
          userId: string | null
          utmSource: string | null
          utmMedium: string | null
          utmCampaign: string | null
          pageUrl: string | null
        }[]>`
          SELECT userId, utmSource, utmMedium, utmCampaign, pageUrl
          FROM behavior_events
          WHERE sessionId = ${s.sessionId}
          ORDER BY createdAt ASC
          LIMIT 1
        `
        const f = first[0]
        return {
          sessionId: s.sessionId,
          events: Number(s.events),
          firstSeen: s.firstSeen,
          lastSeen: s.lastSeen,
          userId: f?.userId ?? null,
          utmSource: f?.utmSource ?? null,
          utmMedium: f?.utmMedium ?? null,
          utmCampaign: f?.utmCampaign ?? null,
          landingPage: f?.pageUrl ?? null,
        }
      })
    )

    return NextResponse.json({ leads: details })
  }

  if (type === 'journey' && sessionId) {
    const events = await prisma.$queryRaw<{
      id: string
      eventType: string
      pageUrl: string | null
      posX: number | null
      posY: number | null
      productId: string | null
      utmSource: string | null
      utmMedium: string | null
      utmCampaign: string | null
      createdAt: string
    }[]>`
      SELECT id, eventType, pageUrl, posX, posY, productId, utmSource, utmMedium, utmCampaign, createdAt
      FROM behavior_events
      WHERE sessionId = ${sessionId}
      ORDER BY createdAt ASC
    `

    return NextResponse.json({ journey: events })
  }

  // Heatmap points for a specific page
  const points = await prisma.$queryRaw<{
    posX: number | null
    posY: number | null
    eventType: string
  }[]>`
    SELECT posX, posY, eventType
    FROM behavior_events
    WHERE pageUrl = ${pageUrl}
      AND eventType IN ('click', 'mouse_move')
      AND posX IS NOT NULL
      AND posY IS NOT NULL
    LIMIT 5000
  `

  return NextResponse.json({ points })
}
