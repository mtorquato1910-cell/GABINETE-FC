import { prisma } from '@/lib/db'

export default async function FidelidadeAdminPage() {
  const [totalPoints, topUsers] = await Promise.all([
    prisma.loyaltyPoint.aggregate({ _sum: { points: true }, where: { points: { gt: 0 } } }),
    prisma.loyaltyPoint.groupBy({
      by: ['userId'],
      _sum: { points: true },
      orderBy: { _sum: { points: 'desc' } },
      take: 10,
    }),
  ])

  const userIds = topUsers.map(u => u.userId)
  const users = await prisma.user.findMany({
    where: { id: { in: userIds } },
    select: { id: true, name: true, email: true },
  })
  const userMap = Object.fromEntries(users.map(u => [u.id, u]))

  return (
    <div>
      <div className="px-6 py-6 border-b border-border">
        <h1 className="text-xl font-bold uppercase tracking-widest">Fidelidade</h1>
      </div>
      <div className="p-6 space-y-6">
        <div className="border border-border p-4">
          <p className="text-[10px] text-muted-foreground uppercase tracking-widest mb-2">Total de pontos em circulação</p>
          <p className="text-3xl font-bold text-primary">{(totalPoints._sum.points ?? 0).toLocaleString('pt-BR')}</p>
        </div>

        <div className="border border-border">
          <div className="px-4 py-3 border-b border-border bg-secondary">
            <h2 className="text-xs font-bold uppercase tracking-widest">Top 10 clientes por pontos</h2>
          </div>
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-border">
                {['Cliente', 'Email', 'Pontos'].map(h => (
                  <th key={h} className="px-4 py-3 text-left font-bold uppercase tracking-widest text-muted-foreground">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {topUsers.map(u => {
                const user = userMap[u.userId]
                return (
                  <tr key={u.userId} className="border-b border-border last:border-0 hover:bg-secondary/30">
                    <td className="px-4 py-3 font-bold">{user?.name ?? '—'}</td>
                    <td className="px-4 py-3 text-muted-foreground normal-case">{user?.email ?? '—'}</td>
                    <td className="px-4 py-3 font-bold text-primary">{(u._sum.points ?? 0).toLocaleString('pt-BR')}</td>
                  </tr>
                )
              })}
              {topUsers.length === 0 && (
                <tr>
                  <td colSpan={3} className="px-4 py-8 text-center text-muted-foreground">
                    Nenhum ponto registrado.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
