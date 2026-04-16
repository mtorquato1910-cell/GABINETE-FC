import { prisma } from '@/lib/db'
import { formatPrice } from '@/lib/db-helpers'

export default async function FinanceiroAdminPage() {
  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
  const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)
  const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0)

  const [thisMonth, lastMonth, topProducts, revenueByDay] = await Promise.all([
    prisma.order.aggregate({
      where: { paymentStatus: 'paid', createdAt: { gte: startOfMonth } },
      _sum: { total: true }, _count: true,
    }),
    prisma.order.aggregate({
      where: { paymentStatus: 'paid', createdAt: { gte: startOfLastMonth, lte: endOfLastMonth } },
      _sum: { total: true }, _count: true,
    }),
    prisma.orderItem.groupBy({
      by: ['productName'],
      _sum: { totalPrice: true, quantity: true },
      orderBy: { _sum: { totalPrice: 'desc' } },
      take: 5,
    }),
    prisma.order.findMany({
      where: { paymentStatus: 'paid', createdAt: { gte: startOfMonth } },
      select: { total: true, createdAt: true },
    }),
  ])

  // Agrupa receita por dia
  const dailyRevenue: Record<string, number> = {}
  revenueByDay.forEach(order => {
    const day = new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: '2-digit' }).format(order.createdAt)
    dailyRevenue[day] = (dailyRevenue[day] ?? 0) + order.total
  })

  const thisMtRevenue = thisMonth._sum.total ?? 0
  const lastMtRevenue = lastMonth._sum.total ?? 0
  const growth = lastMtRevenue ? ((thisMtRevenue - lastMtRevenue) / lastMtRevenue * 100) : null

  return (
    <div>
      <div className="px-6 py-6 border-b border-border">
        <h1 className="text-xl font-bold uppercase tracking-widest">Financeiro</h1>
      </div>
      <div className="p-6 space-y-6">
        {/* KPIs do mês */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: 'Receita — Mês Atual', value: formatPrice(thisMtRevenue) },
            { label: 'Pedidos — Mês Atual', value: thisMonth._count.toString() },
            { label: 'Receita — Mês Anterior', value: formatPrice(lastMtRevenue) },
            { label: 'Crescimento', value: growth ? `${growth > 0 ? '+' : ''}${growth.toFixed(1)}%` : '—', highlight: growth !== null && growth > 0 },
          ].map(kpi => (
            <div key={kpi.label} className="border border-border p-4">
              <p className="text-[10px] text-muted-foreground uppercase tracking-widest mb-2">{kpi.label}</p>
              <p className={`text-2xl font-bold tracking-tighter ${kpi.highlight ? 'text-primary' : ''}`}>{kpi.value}</p>
            </div>
          ))}
        </div>

        {/* Receita por dia */}
        <div className="border border-border p-4">
          <h2 className="text-xs font-bold uppercase tracking-widest mb-4">Receita diária — Mês atual</h2>
          {Object.keys(dailyRevenue).length === 0 ? (
            <p className="text-muted-foreground text-xs uppercase tracking-widest">Sem dados ainda.</p>
          ) : (
            <div className="space-y-2">
              {Object.entries(dailyRevenue).map(([day, value]) => {
                const max = Math.max(...Object.values(dailyRevenue))
                const pct = (value / max) * 100
                return (
                  <div key={day} className="flex items-center gap-3 text-xs">
                    <span className="w-12 text-muted-foreground shrink-0">{day}</span>
                    <div className="flex-1 bg-secondary h-6 relative">
                      <div className="bg-primary h-full transition-all" style={{ width: `${pct}%` }} />
                    </div>
                    <span className="w-24 text-right font-bold shrink-0">{formatPrice(value)}</span>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Top produtos */}
        <div className="border border-border">
          <div className="px-4 py-3 border-b border-border bg-secondary">
            <h2 className="text-xs font-bold uppercase tracking-widest">Top 5 Produtos — Total</h2>
          </div>
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-border">
                {['Produto', 'Qtd vendida', 'Receita'].map(h => (
                  <th key={h} className="px-4 py-3 text-left font-bold uppercase tracking-widest text-muted-foreground">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {topProducts.map(p => (
                <tr key={p.productName} className="border-b border-border last:border-0 hover:bg-secondary/30">
                  <td className="px-4 py-3 font-bold uppercase tracking-wider">{p.productName}</td>
                  <td className="px-4 py-3">{p._sum.quantity ?? 0}</td>
                  <td className="px-4 py-3 font-bold">{formatPrice(p._sum.totalPrice ?? 0)}</td>
                </tr>
              ))}
              {topProducts.length === 0 && <tr><td colSpan={3} className="px-4 py-8 text-center text-muted-foreground">Sem dados.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
