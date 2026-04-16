import { prisma } from '@/lib/db'

export default async function MarketingPage() {
  // Análise de origem das sessões a partir dos eventos
  const utmSources = await prisma.behaviorEvent.groupBy({
    by: ['utmSource', 'utmMedium', 'utmCampaign'],
    where: { utmSource: { not: null } },
    _count: { sessionId: true },
    orderBy: { _count: { sessionId: 'desc' } },
    take: 20,
  })

  // Pedidos por canal
  const totalOrders = await prisma.order.count({ where: { paymentStatus: 'paid' } })

  return (
    <div>
      <div className="px-6 py-6 border-b border-border">
        <h1 className="text-xl font-bold uppercase tracking-widest">Marketing</h1>
      </div>
      <div className="p-6 space-y-6">
        <div className="border border-border p-4">
          <p className="text-[10px] text-muted-foreground uppercase tracking-widest mb-2">Pedidos pagos (total)</p>
          <p className="text-3xl font-bold">{totalOrders}</p>
        </div>

        <div className="border border-border">
          <div className="px-4 py-3 border-b border-border bg-secondary">
            <h2 className="text-xs font-bold uppercase tracking-widest">Tráfego por UTM</h2>
          </div>
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-border">
                {['Fonte', 'Médio', 'Campanha', 'Sessões'].map(h => (
                  <th key={h} className="px-4 py-3 text-left font-bold uppercase tracking-widest text-muted-foreground">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {utmSources.map((row, i) => (
                <tr key={i} className="border-b border-border last:border-0 hover:bg-secondary/30">
                  <td className="px-4 py-3">{row.utmSource ?? '—'}</td>
                  <td className="px-4 py-3 text-muted-foreground">{row.utmMedium ?? '—'}</td>
                  <td className="px-4 py-3 text-muted-foreground">{row.utmCampaign ?? '—'}</td>
                  <td className="px-4 py-3 font-bold">{row._count.sessionId}</td>
                </tr>
              ))}
              {utmSources.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-muted-foreground">
                    Nenhum dado de UTM ainda.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="border border-border p-4">
          <h2 className="text-xs font-bold uppercase tracking-widest mb-3">Configuração Meta Pixel</h2>
          <p className="text-xs text-muted-foreground normal-case">
            Configure o Meta Pixel ID e Access Token em{' '}
            <a href="/admin/configuracoes" className="text-primary hover:underline">/admin/configuracoes</a>.
            O CAPI envia eventos server-side automaticamente após cada compra, newsletter e add-to-cart.
          </p>
        </div>
      </div>
    </div>
  )
}
