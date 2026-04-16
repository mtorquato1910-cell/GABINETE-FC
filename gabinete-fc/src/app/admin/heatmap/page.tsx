import { HeatmapDashboard } from '@/components/admin/HeatmapDashboard'
import { prisma } from '@/lib/db'

export default async function HeatmapPage() {
  // Get available pages that have click or mouse_move events (raw query bypasses stale engine schema)
  const rows = await prisma.$queryRaw<{ pageUrl: string }[]>`
    SELECT DISTINCT pageUrl
    FROM behavior_events
    WHERE eventType IN ('click', 'mouse_move')
      AND posX IS NOT NULL
      AND pageUrl IS NOT NULL
    LIMIT 50
  `

  const pageList = rows.map(r => r.pageUrl).filter(Boolean)

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
