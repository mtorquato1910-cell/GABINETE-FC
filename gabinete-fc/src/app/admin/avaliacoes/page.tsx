import { prisma } from '@/lib/db'

export default async function AvaliacoesAdminPage() {
  const reviews = await prisma.review.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      user: { select: { name: true, email: true } },
      product: { select: { name: true } },
    },
    take: 50,
  })

  const statusColor: Record<string, string> = {
    pending: 'text-yellow-400',
    approved: 'text-primary',
    rejected: 'text-destructive',
  }

  return (
    <div>
      <div className="px-6 py-6 border-b border-border">
        <h1 className="text-xl font-bold uppercase tracking-widest">Avaliações</h1>
      </div>
      <div className="p-6">
        <div className="border border-border">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-border bg-secondary">
                {['Produto', 'Cliente', 'Nota', 'Comentário', 'Status', 'Data'].map(h => (
                  <th key={h} className="px-4 py-3 text-left font-bold uppercase tracking-widest text-muted-foreground">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {reviews.map(r => (
                <tr key={r.id} className="border-b border-border last:border-0 hover:bg-secondary/30">
                  <td className="px-4 py-3 font-bold max-w-32 truncate">{r.product.name}</td>
                  <td className="px-4 py-3 text-muted-foreground">{r.user.name ?? r.user.email}</td>
                  <td className="px-4 py-3">{'★'.repeat(r.rating)}{'☆'.repeat(5 - r.rating)}</td>
                  <td className="px-4 py-3 text-muted-foreground normal-case max-w-48 truncate">{r.body ?? '—'}</td>
                  <td className={`px-4 py-3 font-bold ${statusColor[r.status] ?? ''}`}>{r.status}</td>
                  <td className="px-4 py-3 text-muted-foreground">{new Intl.DateTimeFormat('pt-BR').format(r.createdAt)}</td>
                </tr>
              ))}
              {reviews.length === 0 && <tr><td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">Nenhuma avaliação.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
