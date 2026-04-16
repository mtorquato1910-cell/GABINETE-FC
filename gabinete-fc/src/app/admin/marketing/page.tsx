import { prisma } from '@/lib/db'

export default async function MarketingPage() {
  const [
    utmSources,
    totalOrdersPaid,
    recentOrders,
    addToCartEvents,
    checkoutEvents,
    clickEvents,
    abandonedSessions,
  ] = await Promise.all([
    // UTM breakdown
    prisma.behaviorEvent.groupBy({
      by: ['utmSource', 'utmMedium', 'utmCampaign'],
      where: { utmSource: { not: null } },
      _count: { sessionId: true },
      orderBy: { _count: { sessionId: 'desc' } },
      take: 20,
    }),
    // Pedidos pagos
    prisma.order.count({ where: { paymentStatus: 'paid' } }),
    // Últimos pedidos com UTM (para atribuição)
    prisma.order.findMany({
      where: { paymentStatus: 'paid' },
      select: { total: true, createdAt: true },
      orderBy: { createdAt: 'desc' },
      take: 30,
    }),
    // Funil: add_to_cart
    prisma.behaviorEvent.count({ where: { eventType: 'add_to_cart' } }),
    // Funil: checkout iniciado
    prisma.behaviorEvent.count({ where: { eventType: 'checkout_start' } }),
    // Heatmap: cliques por página
    prisma.behaviorEvent.groupBy({
      by: ['pageUrl'],
      where: { eventType: 'click', pageUrl: { not: null } },
      _count: true,
      orderBy: { _count: { pageUrl: 'desc' } },
      take: 15,
    }),
    // Sessões com add_to_cart (estimativa de abandonados)
    prisma.behaviorEvent.findMany({
      where: { eventType: 'add_to_cart' },
      select: { sessionId: true },
      distinct: ['sessionId'],
    }).then((r: { sessionId: string | null }[]) => r.length),
  ])

  // Receita últimos pedidos
  const totalRevenue = recentOrders.reduce((s: number, o: { total: number }) => s + o.total, 0)

  // Funil de conversão
  const totalSessions = await prisma.behaviorEvent.findMany({
    select: { sessionId: true },
    distinct: ['sessionId'],
  }).then(r => r.length)

  const funnelData = [
    { label: 'Sessões únicas', value: totalSessions, color: 'bg-blue-500' },
    { label: 'Add to Cart', value: addToCartEvents, color: 'bg-yellow-500' },
    { label: 'Checkout iniciado', value: checkoutEvents, color: 'bg-orange-500' },
    { label: 'Compras finalizadas', value: totalOrdersPaid, color: 'bg-green-500' },
  ]

  const maxFunnel = Math.max(totalSessions, 1)

  return (
    <div>
      <div className="px-6 py-6 border-b border-border">
        <h1 className="text-xl font-bold uppercase tracking-widest">Marketing & Campanhas</h1>
      </div>

      <div className="p-6 space-y-6">

        {/* KPIs */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: 'Pedidos pagos', value: totalOrdersPaid },
            { label: 'Add-to-cart (eventos)', value: addToCartEvents },
            { label: 'Sessões c/ add-to-cart', value: abandonedSessions },
            { label: 'Carrinhos abandonados*', value: Math.max(0, abandonedSessions - totalOrdersPaid) },
          ].map(kpi => (
            <div key={kpi.label} className="border border-border p-4">
              <p className="text-[10px] text-muted-foreground uppercase tracking-widest mb-2">{kpi.label}</p>
              <p className="text-2xl font-bold">{kpi.value.toLocaleString('pt-BR')}</p>
            </div>
          ))}
        </div>

        {/* Funil de Conversão */}
        <div className="border border-border">
          <div className="px-4 py-3 border-b border-border bg-secondary">
            <h2 className="text-xs font-bold uppercase tracking-widest">Funil de Conversão</h2>
          </div>
          <div className="p-4 space-y-3">
            {funnelData.map((step) => {
              const pct = totalSessions > 0 ? Math.round((step.value / maxFunnel) * 100) : 0
              const convRate = step.value > 0 && funnelData[0].value > 0
                ? ((step.value / funnelData[0].value) * 100).toFixed(1)
                : '0.0'
              return (
                <div key={step.label}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="uppercase tracking-widest text-muted-foreground">{step.label}</span>
                    <span className="font-bold">{step.value.toLocaleString('pt-BR')} <span className="text-muted-foreground font-normal">({convRate}%)</span></span>
                  </div>
                  <div className="h-2 bg-secondary rounded-none">
                    <div
                      className={`h-2 ${step.color} transition-all`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Performance por Campanha (UTM) */}
        <div className="border border-border">
          <div className="px-4 py-3 border-b border-border bg-secondary">
            <h2 className="text-xs font-bold uppercase tracking-widest">Performance por Campanha (UTM)</h2>
          </div>
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-border">
                {['Fonte', 'Médio', 'Campanha', 'Sessões', 'Share'].map(h => (
                  <th key={h} className="px-4 py-3 text-left font-bold uppercase tracking-widest text-muted-foreground">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {utmSources.map((row: { utmSource: string | null; utmMedium: string | null; utmCampaign: string | null; _count: { sessionId: number } }, i: number) => {
                const share = totalSessions > 0 ? ((row._count.sessionId / totalSessions) * 100).toFixed(1) : '0'
                return (
                  <tr key={i} className="border-b border-border last:border-0 hover:bg-secondary/30">
                    <td className="px-4 py-3 font-bold">{row.utmSource ?? '—'}</td>
                    <td className="px-4 py-3 text-muted-foreground">{row.utmMedium ?? '—'}</td>
                    <td className="px-4 py-3 text-muted-foreground normal-case">{row.utmCampaign ?? '—'}</td>
                    <td className="px-4 py-3 font-bold">{row._count.sessionId.toLocaleString('pt-BR')}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="h-1.5 bg-primary rounded-none" style={{ width: `${Math.min(100, parseFloat(share) * 3)}px` }} />
                        <span className="text-muted-foreground">{share}%</span>
                      </div>
                    </td>
                  </tr>
                )
              })}
              {utmSources.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground text-xs normal-case">
                    Sem dados de UTM ainda. Adicione parâmetros utm_source, utm_medium e utm_campaign nos links das campanhas.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Heatmap de Cliques por Página */}
        <div className="border border-border">
          <div className="px-4 py-3 border-b border-border bg-secondary">
            <h2 className="text-xs font-bold uppercase tracking-widest">Heatmap — Páginas com mais cliques</h2>
          </div>
          <div className="p-4 space-y-2">
            {clickEvents.length === 0 ? (
              <p className="text-xs text-muted-foreground normal-case py-4 text-center">
                Sem dados de clique ainda. Os eventos são coletados automaticamente pelo AnalyticsTracker.
              </p>
            ) : (
              clickEvents.map((ev: { pageUrl: string | null; _count: number }) => {
                const maxClicks = clickEvents[0]._count
                const pct = maxClicks > 0 ? (ev._count / maxClicks) * 100 : 0
                const heat = pct > 70 ? 'bg-red-500' : pct > 40 ? 'bg-orange-400' : pct > 20 ? 'bg-yellow-400' : 'bg-blue-400'
                return (
                  <div key={ev.pageUrl} className="flex items-center gap-3">
                    <div className={`w-3 h-3 shrink-0 ${heat}`} />
                    <span className="text-xs normal-case flex-1 truncate text-muted-foreground">{ev.pageUrl}</span>
                    <span className="text-xs font-bold shrink-0">{ev._count.toLocaleString('pt-BR')}</span>
                  </div>
                )
              })
            )}
            <div className="flex gap-4 pt-2 text-[10px] text-muted-foreground uppercase tracking-widest border-t border-border mt-2">
              <span className="flex items-center gap-1"><span className="w-2 h-2 bg-red-500 inline-block" /> Alto</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 bg-orange-400 inline-block" /> Médio</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 bg-yellow-400 inline-block" /> Baixo</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 bg-blue-400 inline-block" /> Mínimo</span>
            </div>
          </div>
        </div>

        {/* Receita recente */}
        <div className="border border-border p-4">
          <p className="text-[10px] text-muted-foreground uppercase tracking-widest mb-1">Receita (últimos {recentOrders.length} pedidos)</p>
          <p className="text-3xl font-bold">R$ {totalRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
        </div>

        {/* Meta BM — Configuração */}
        <div className="border border-border">
          <div className="px-4 py-3 border-b border-border bg-secondary">
            <h2 className="text-xs font-bold uppercase tracking-widest">Meta Business Manager — Configuração</h2>
          </div>
          <div className="p-4 space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="border border-border p-3 space-y-1">
                <p className="text-[10px] uppercase tracking-widest text-primary font-bold">1. Pixel ID</p>
                <p className="text-xs text-muted-foreground normal-case">Configure em <a href="/admin/configuracoes" className="text-foreground hover:underline">Configurações → Meta / Pixel</a> → campo <strong>Meta Pixel ID</strong>.</p>
              </div>
              <div className="border border-border p-3 space-y-1">
                <p className="text-[10px] uppercase tracking-widest text-primary font-bold">2. Business Manager ID (BM)</p>
                <p className="text-xs text-muted-foreground normal-case">Configure em <a href="/admin/configuracoes" className="text-foreground hover:underline">Configurações → Meta / Pixel</a> → campo <strong>Meta BM ID</strong>.</p>
              </div>
              <div className="border border-border p-3 space-y-1">
                <p className="text-[10px] uppercase tracking-widest text-primary font-bold">3. Access Token CAPI</p>
                <p className="text-xs text-muted-foreground normal-case">Configure em <a href="/admin/configuracoes" className="text-foreground hover:underline">Configurações → Meta / Pixel</a> → campo <strong>Meta Access Token (CAPI)</strong>. Obtenha no Events Manager do BM.</p>
              </div>
              <div className="border border-border p-3 space-y-1">
                <p className="text-[10px] uppercase tracking-widest text-primary font-bold">4. Verificar eventos</p>
                <p className="text-xs text-muted-foreground normal-case">Acesse Meta Events Manager → Ferramenta de Teste de Eventos e faça uma compra no site para verificar.</p>
              </div>
            </div>
            <p className="text-[10px] text-muted-foreground normal-case border-t border-border pt-3">
              * Carrinhos abandonados = sessões com add-to-cart estimadas. O cron <code className="text-primary">/api/cron/abandoned-cart</code> dispara emails de recuperação automáticos a cada hora.
            </p>
          </div>
        </div>

      </div>
    </div>
  )
}
