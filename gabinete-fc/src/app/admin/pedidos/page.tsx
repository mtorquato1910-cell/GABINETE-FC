import { prisma } from '@/lib/db'
import { formatPrice } from '@/lib/db-helpers'
import Link from 'next/link'

export default async function PedidosAdminPage() {
  const orders = await prisma.order.findMany({
    orderBy: { createdAt: 'desc' },
    take: 50,
    include: { user: { select: { name: true, email: true } }, items: true },
  })

  const statusColor: Record<string, string> = {
    pending: 'text-yellow-400', confirmed: 'text-blue-400',
    processing: 'text-blue-400', shipped: 'text-primary',
    delivered: 'text-primary', cancelled: 'text-destructive',
  }

  return (
    <div>
      <div className="px-6 py-6 border-b border-border">
        <h1 className="text-xl font-bold uppercase tracking-widest">Pedidos</h1>
      </div>
      <div className="p-6">
        <div className="border border-border">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-border bg-secondary">
                {['ID', 'Cliente', 'Itens', 'Total', 'Pagamento', 'Status', 'Data', ''].map(h => (
                  <th key={h} className="px-4 py-3 text-left font-bold uppercase tracking-widest text-muted-foreground">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {orders.map(order => (
                <tr key={order.id} className="border-b border-border last:border-0 hover:bg-secondary/30">
                  <td className="px-4 py-3 font-mono">#{order.id.slice(-8).toUpperCase()}</td>
                  <td className="px-4 py-3">
                    <p className="font-bold">{order.user.name ?? '—'}</p>
                    <p className="text-muted-foreground normal-case text-[10px]">{order.user.email}</p>
                  </td>
                  <td className="px-4 py-3">{order.items.length}</td>
                  <td className="px-4 py-3 font-bold">{formatPrice(order.total)}</td>
                  <td className="px-4 py-3 uppercase">{order.paymentMethod}</td>
                  <td className={`px-4 py-3 font-bold uppercase ${statusColor[order.status] ?? ''}`}>{order.status}</td>
                  <td className="px-4 py-3 text-muted-foreground">{new Intl.DateTimeFormat('pt-BR').format(order.createdAt)}</td>
                  <td className="px-4 py-3">
                    <Link href={`/admin/pedidos/${order.id}`} className="text-muted-foreground hover:text-primary transition-colors uppercase text-[10px] tracking-widest">
                      Ver
                    </Link>
                  </td>
                </tr>
              ))}
              {orders.length === 0 && (
                <tr><td colSpan={8} className="px-4 py-8 text-center text-muted-foreground">Nenhum pedido.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
