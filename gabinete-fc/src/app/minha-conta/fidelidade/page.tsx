import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'

export default async function FidelidadePage() {
  const session = await auth()
  const userId = (session?.user as { id?: string })?.id

  const allPoints = userId
    ? await prisma.loyaltyPoint.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: 20,
      })
    : []

  const now = new Date()
  const activePoints = allPoints
    .filter(p => !p.expiresAt || p.expiresAt > now)
    .reduce((sum, p) => sum + p.points, 0)

  const actionLabel: Record<string, string> = {
    purchase: 'Compra', review: 'Avaliação', referral: 'Indicação',
    double_points: 'Pontos duplos', expired: 'Expirado',
  }

  return (
    <div>
      <h2 className="text-xs font-bold uppercase tracking-widest mb-6 border-b border-border pb-4">
        Programa de Fidelidade
      </h2>
      <div className="border border-border p-6 mb-6 text-center">
        <p className="text-[10px] text-muted-foreground uppercase tracking-widest">Seus pontos</p>
        <p className="text-5xl font-black tracking-tighter text-primary mt-2">{activePoints}</p>
        <p className="text-xs text-muted-foreground mt-2">1 ponto = R$ 0,10 de desconto</p>
      </div>
      {allPoints.length > 0 && (
        <div className="border border-border">
          <div className="px-4 py-3 border-b border-border bg-secondary">
            <h3 className="text-[10px] font-bold uppercase tracking-widest">Histórico</h3>
          </div>
          {allPoints.map(p => (
            <div key={p.id} className="flex justify-between items-center px-4 py-3 border-b border-border last:border-0 text-xs">
              <div>
                <p className="font-bold uppercase tracking-wider">{actionLabel[p.action] ?? p.action}</p>
                <p className="text-muted-foreground text-[10px]">{new Intl.DateTimeFormat('pt-BR').format(p.createdAt)}</p>
              </div>
              <span className={`font-bold text-base ${p.points > 0 ? 'text-primary' : 'text-destructive'}`}>
                {p.points > 0 ? '+' : ''}{p.points}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
