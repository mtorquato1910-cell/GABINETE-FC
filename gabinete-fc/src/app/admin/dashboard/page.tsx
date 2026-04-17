import { prisma } from '@/lib/db'
import { formatPrice } from '@/lib/db-helpers'
import Link from 'next/link'

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

  const statusConfig: Record<string, { label: string; color: string; bg: string }> = {
    pending:   { label: 'Pendente',   color: 'text-yellow-400', bg: 'bg-yellow-400/10' },
    confirmed: { label: 'Confirmado', color: 'text-blue-400',   bg: 'bg-blue-400/10' },
    shipped:   { label: 'Enviado',    color: 'text-primary',    bg: 'bg-primary/10' },
    delivered: { label: 'Entregue',   color: 'text-green-400',  bg: 'bg-green-400/10' },
    cancelled: { label: 'Cancelado',  color: 'text-red-400',    bg: 'bg-red-400/10' },
  }

  const kpis = [
    {
      label: 'Receita Total',
      value: formatPrice(totalRevenue._sum.total ?? 0),
      sub: 'pagamentos confirmados',
      trend: '+12%',
      trendUp: true,
    },
    {
      label: 'Total de Pedidos',
      value: totalOrders.toString(),
      sub: 'todos os status',
      trend: '+8%',
      trendUp: true,
    },
    {
      label: 'Aguardando',
      value: pendingOrders.toString(),
      sub: 'pedidos pendentes',
      trend: pendingOrders > 5 ? 'Atenção' : 'Normal',
      trendUp: pendingOrders <= 5,
    },
    {
      label: 'Produtos Ativos',
      value: totalProducts.toString(),
      sub: 'no catálogo',
      trend: 'Catálogo',
      trendUp: true,
    },
  ]

  return (
    <div className="min-h-screen bg-black">
      {/* Page Header */}
      <div className="px-8 py-6 border-b border-[#1a1a1a] flex items-end justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.25em] text-white/30 mb-1">
            Gabinete FC — Painel
          </p>
          <h1
            className="text-3xl md:text-4xl font-black uppercase leading-none text-white"
            style={{
              fontFamily: "'Barlow Condensed', sans-serif",
              fontWeight: 900,
              letterSpacing: '-0.02em',
            }}
          >
            Dashboard
          </h1>
        </div>
        <div className="text-xs text-white/30 uppercase tracking-[0.2em] font-bold hidden sm:block">
          {new Intl.DateTimeFormat('pt-BR', { dateStyle: 'long' }).format(new Date())}
        </div>
      </div>

      <div className="p-8">
        {/* KPIs */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-px bg-[#111] mb-8">
          {kpis.map((kpi) => (
            <div key={kpi.label} className="bg-[#0a0a0a] p-6 hover:bg-[#111] transition-colors duration-200">
              <p className="text-xs font-bold text-white/40 uppercase tracking-[0.2em] mb-4">
                {kpi.label}
              </p>
              <p
                className="text-3xl md:text-4xl font-black text-white leading-none mb-3"
                style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 900, letterSpacing: '-0.02em' }}
              >
                {kpi.value}
              </p>
              <div className="flex items-center gap-2">
                <span className={`text-xs font-bold uppercase tracking-[0.1em] ${kpi.trendUp ? 'text-primary' : 'text-yellow-400'}`}>
                  {kpi.trend}
                </span>
                <span className="text-xs text-white/30 uppercase tracking-[0.1em]">
                  {kpi.sub}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Pedidos recentes */}
        <div className="bg-[#0a0a0a]">
          <div className="px-6 py-4 border-b border-[#1a1a1a] flex items-center justify-between">
            <h2
              className="text-lg font-black uppercase text-white"
              style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 900, letterSpacing: '-0.02em' }}
            >
              Pedidos Recentes
            </h2>
            <Link
              href="/admin/pedidos"
              className="text-xs font-bold text-white/30 uppercase tracking-[0.2em] hover:text-white transition-colors"
            >
              Ver todos →
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-[#1a1a1a]">
                  {['ID', 'Cliente', 'Total', 'Pagamento', 'Status', 'Data'].map((h) => (
                    <th
                      key={h}
                      className="px-6 py-3 text-left text-xs font-bold uppercase tracking-[0.2em] text-white/30"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {recentOrders.map((order, i) => {
                  const st = statusConfig[order.status] ?? { label: order.status, color: 'text-white/50', bg: 'bg-white/5' }
                  return (
                    <tr
                      key={order.id}
                      className={`border-b border-[#111] last:border-0 hover:bg-[#111] transition-colors duration-150 ${i % 2 === 0 ? '' : 'bg-[#080808]'}`}
                    >
                      <td className="px-6 py-4 font-mono text-xs text-white/50">
                        #{order.id.slice(-8).toUpperCase()}
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-[11px] font-bold text-white/90">{order.user.name ?? '—'}</p>
                        <p className="text-xs text-white/30 normal-case mt-0.5">{order.user.email}</p>
                      </td>
                      <td className="px-6 py-4 text-[11px] font-bold text-white">
                        {formatPrice(order.total)}
                      </td>
                      <td className="px-6 py-4 text-xs text-white/40 uppercase tracking-[0.1em]">
                        {order.paymentMethod}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-2 py-0.5 text-xs font-bold uppercase tracking-[0.1em] ${st.color} ${st.bg}`}>
                          {st.label}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-xs text-white/30 font-mono">
                        {new Intl.DateTimeFormat('pt-BR').format(order.createdAt)}
                      </td>
                    </tr>
                  )
                })}
                {recentOrders.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-6 py-16 text-center text-xs text-white/20 uppercase tracking-[0.2em]">
                      Nenhum pedido ainda.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}
