import { prisma } from '@/lib/db'
import { formatPrice } from '@/lib/db-helpers'

export default async function DashboardPage() {
  const [totalOrders, totalRevenue, pendingOrders, totalProducts] = await Promise.all([
    prisma.order.count(),
    prisma.order.aggregate({ _sum: { total: true }, where: { paymentStatus: 'paid' } }),
    prisma.order.count({ where: { status: 'pending' } }),
    prisma.product.count({ where: { isActive: true } }),
  ])

  const recentOrders = await prisma.order.findMany({
    orderBy: { createdAt: 'desc' },
    take: 8,
    include: { user: { select: { name: true, email: true } } },
  })

  const statusColor: Record<string, string> = {
    pending: 'text-yellow-400',
    confirmed: 'text-blue-400',
    shipped: 'text-primary',
    delivered: 'text-primary',
    cancelled: 'text-destructive',
  }

  const kpis = [
    { label: 'Receita Total', value: formatPrice(totalRevenue._sum.total ?? 0), sub: 'pagamentos confirmados' },
    { label: 'Total de Pedidos', value: totalOrders.toString(), sub: 'todos os status' },
    { label: 'Aguardando', value: pendingOrders.toString(), sub: 'pedidos pendentes' },
    { label: 'Produtos Ativos', value: totalProducts.toString(), sub: 'no catálogo' },
  ]

  return (
    <div>
      <div className="px-6 py-6 border-b border-border">
        <h1 className="text-xl font-bold uppercase tracking-widest">Dashboard</h1>
      </div>
      <div className="p-6">
        {/* KPIs */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {kpis.map(kpi => (
            <div key={kpi.label} className="border border-border p-4">
              <p className="text-[10px] text-muted-foreground uppercase tracking-widest mb-2">{kpi.label}</p>
              <p className="text-2xl font-bold tracking-tighter">{kpi.value}</p>
              <p className="text-[10px] text-muted-foreground mt-1">{kpi.sub}</p>
            </div>
          ))}
        </div>

        {/* Pedidos recentes */}
        <div className="border border-border">
          <div className="px-4 py-3 border-b border-border">
            <h2 className="text-xs font-bold uppercase tracking-widest">Pedidos Recentes</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-border bg-secondary">
                  {['ID', 'Cliente', 'Total', 'Pagamento', 'Status', 'Data'].map(h => (
                    <th key={h} className="px-4 py-3 text-left font-bold uppercase tracking-widest text-muted-foreground">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {recentOrders.map(order => (
                  <tr key={order.id} className="border-b border-border last:border-0 hover:bg-secondary/30">
                    <td className="px-4 py-3 font-mono">#{order.id.slice(-8).toUpperCase()}</td>
                    <td className="px-4 py-3">
                      <p className="font-bold">{order.user.name ?? '—'}</p>
                      <p className="text-muted-foreground normal-case">{order.user.email}</p>
                    </td>
                    <td className="px-4 py-3 font-bold">{formatPrice(order.total)}</td>
                    <td className="px-4 py-3 uppercase">{order.paymentMethod}</td>
                    <td className={`px-4 py-3 font-bold ${statusColor[order.status] ?? ''}`}>{order.status}</td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {new Intl.DateTimeFormat('pt-BR').format(order.createdAt)}
                    </td>
                  </tr>
                ))}
                {recentOrders.length === 0 && (
                  <tr><td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">Nenhum pedido ainda.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}
