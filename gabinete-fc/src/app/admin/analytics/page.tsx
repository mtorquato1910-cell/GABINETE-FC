import { prisma } from '@/lib/db'

export default async function AnalyticsPage() {
  const [pageViews, totalSessions, topPages, eventsByType] = await Promise.all([
    prisma.behaviorEvent.count({ where: { eventType: 'page_view' } }),
    prisma.behaviorEvent.findMany({
      select: { sessionId: true },
      distinct: ['sessionId'],
    }).then(r => r.length),
    prisma.behaviorEvent.groupBy({
      by: ['pageUrl'],
      where: { eventType: 'page_view', pageUrl: { not: null } },
      _count: true,
      orderBy: { _count: { pageUrl: 'desc' } },
      take: 10,
    }),
    prisma.behaviorEvent.groupBy({
      by: ['eventType'],
      _count: true,
      orderBy: { _count: { eventType: 'desc' } },
    }),
  ])

  return (
    <div>
      <div className="px-6 py-6 border-b border-border">
        <h1 className="text-xl font-bold uppercase tracking-widest">Analytics</h1>
      </div>
      <div className="p-6 space-y-6">
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
          {[
            { label: 'Total Page Views', value: pageViews.toLocaleString('pt-BR') },
            { label: 'Sessões únicas', value: totalSessions.toLocaleString('pt-BR') },
            { label: 'Tipos de evento', value: eventsByType.length.toString() },
          ].map(kpi => (
            <div key={kpi.label} className="border border-border p-4">
              <p className="text-[10px] text-muted-foreground uppercase tracking-widest mb-2">{kpi.label}</p>
              <p className="text-2xl font-bold">{kpi.value}</p>
            </div>
          ))}
        </div>

        <div className="border border-border">
          <div className="px-4 py-3 border-b border-border bg-secondary">
            <h2 className="text-xs font-bold uppercase tracking-widest">Páginas mais visitadas</h2>
          </div>
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-border">
                <th className="px-4 py-3 text-left font-bold uppercase tracking-widest text-muted-foreground">Página</th>
                <th className="px-4 py-3 text-left font-bold uppercase tracking-widest text-muted-foreground">Views</th>
              </tr>
            </thead>
            <tbody>
              {topPages.map(p => (
                <tr key={p.pageUrl} className="border-b border-border last:border-0 hover:bg-secondary/30">
                  <td className="px-4 py-3 normal-case">{p.pageUrl}</td>
                  <td className="px-4 py-3 font-bold">{p._count.toLocaleString('pt-BR')}</td>
                </tr>
              ))}
              {topPages.length === 0 && <tr><td colSpan={2} className="px-4 py-8 text-center text-muted-foreground">Sem dados.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
