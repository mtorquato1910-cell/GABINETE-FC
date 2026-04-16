import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import Link from 'next/link'
import { formatPrice } from '@/lib/db-helpers'

export default async function PedidosPage() {
  const session = await auth()
  const userId = (session?.user as { id?: string })?.id

  const orders = userId
    ? await prisma.order.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        include: { items: { take: 1 } },
        take: 20,
      })
    : []

  const statusLabel: Record<string, string> = {
    pending: 'Aguardando',
    confirmed: 'Confirmado',
    processing: 'Processando',
    shipped: 'Enviado',
    delivered: 'Entregue',
    cancelled: 'Cancelado',
    refunded: 'Reembolsado',
  }

  const statusColor: Record<string, string> = {
    pending: 'text-yellow-400',
    confirmed: 'text-blue-400',
    processing: 'text-blue-400',
    shipped: 'text-primary',
    delivered: 'text-primary',
    cancelled: 'text-destructive',
    refunded: 'text-muted-foreground',
  }

  if (orders.length === 0) {
    return (
      <div className="py-16 text-center">
        <p className="text-muted-foreground text-xs uppercase tracking-widest mb-6">
          Você ainda não fez pedidos.
        </p>
        <Link
          href="/loja"
          className="inline-block px-8 py-4 bg-primary text-primary-foreground font-bold text-xs uppercase tracking-widest hover:bg-foreground hover:text-background transition-colors"
        >
          Ver Camisas
        </Link>
      </div>
    )
  }

  return (
    <div>
      <h2 className="text-xs font-bold uppercase tracking-widest mb-6 border-b border-border pb-4">
        Meus Pedidos
      </h2>
      <div className="flex flex-col gap-2">
        {orders.map((order) => (
          <div key={order.id} className="border border-border p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider">
                #{order.id.slice(-8).toUpperCase()}
              </p>
              <p className="text-[10px] text-muted-foreground uppercase tracking-widest">
                {new Intl.DateTimeFormat('pt-BR').format(order.createdAt)} · {order.items.length} item(s)
              </p>
            </div>
            <div className="flex items-center gap-6">
              <span className={`text-[10px] font-bold uppercase tracking-widest ${statusColor[order.status] ?? 'text-foreground'}`}>
                {statusLabel[order.status] ?? order.status}
              </span>
              <span className="text-sm font-bold">{formatPrice(order.total)}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
