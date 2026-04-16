import { HeatmapDashboard } from '@/components/admin/HeatmapDashboard'
import { prisma } from '@/lib/db'

export default async function HeatmapPage() {
  // Get available pages that have position events
  const pages = await prisma.behaviorEvent.findMany({
    where: {
      eventType: { in: ['click', 'mouse_move'] },
      posX: { not: null },
      pageUrl: { not: null },
    },
    select: { pageUrl: true },
    distinct: ['pageUrl'],
  })

  const pageList = pages.map(p => p.pageUrl as string).filter(Boolean)

  return (
    <div>
      <div className="px-6 py-6 border-b border-border">
        <h1 className="text-xl font-bold uppercase tracking-widest">Heatmap & Jornada de Leads</h1>
        <p className="text-xs text-muted-foreground mt-1 normal-case">
          Visualize onde os usuários clicam e se movem. Filtre por lead para ver o caminho completo.
        </p>
      </div>
      <HeatmapDashboard availablePages={pageList} />
    </div>
  )
}
