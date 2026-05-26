import { HeatmapDashboard } from '@/components/admin/HeatmapDashboard'
import { prisma } from '@/lib/db'

export const dynamic = 'force-dynamic'

export default async function HeatmapPage() {
  let pageList: string[] = []

  try {
    // Lista distinct de páginas que têm clicks/mouse_move
    const rows = await prisma.behaviorEvent.findMany({
      where: {
        eventType: { in: ['click', 'mouse_move'] },
        posX: { not: null },
        pageUrl: { not: null },
      },
      select: { pageUrl: true },
      distinct: ['pageUrl'],
      take: 50,
    })
    pageList = rows.map((r) => r.pageUrl).filter((u): u is string => !!u)
  } catch (err) {
    console.error('[/admin/heatmap] Falha ao listar páginas:', err)
    // Fallback gracioso — renderiza a página com lista vazia,
    // o dashboard mostra o empty state em vez de quebrar tudo.
  }

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
