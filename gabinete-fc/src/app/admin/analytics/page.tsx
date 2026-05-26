import { prisma } from '@/lib/db'
import Link from 'next/link'
import { ChevronRight } from 'lucide-react'

export const dynamic = 'force-dynamic'

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
            <p className="text-[9px] text-muted-foreground/70 uppercase tracking-widest mt-1">
              Clique numa página pra ver os visitantes
            </p>
          </div>
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-border">
                <th className="px-4 py-3 text-left font-bold uppercase tracking-widest text-muted-foreground">Página</th>
                <th className="px-4 py-3 text-left font-bold uppercase tracking-widest text-muted-foreground">Views</th>
                <th className="px-4 py-3 w-8"></th>
              </tr>
            </thead>
            <tbody>
              {topPages.map(p => (
                <tr key={p.pageUrl} className="border-b border-border last:border-0 hover:bg-secondary/30 group">
                  <td className="px-4 py-0">
                    <Link
                      href={`/admin/analytics/pagina?url=${encodeURIComponent(p.pageUrl ?? '')}`}
                      className="block py-3 normal-case hover:text-primary transition-colors"
                    >
                      {p.pageUrl}
                    </Link>
                  </td>
                  <td className="px-4 py-3 font-bold">{p._count.toLocaleString('pt-BR')}</td>
                  <td className="px-4 py-3">
                    <ChevronRight className="w-3 h-3 text-muted-foreground group-hover:text-primary transition-colors" />
                  </td>
                </tr>
              ))}
              {topPages.length === 0 && <tr><td colSpan={3} className="px-4 py-8 text-center text-muted-foreground">Sem dados.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
