import { notFound } from 'next/navigation'
import { prisma } from '@/lib/db'
import { formatPrice } from '@/lib/db-helpers'
import { OrderStatusForm } from '@/components/admin/OrderStatusForm'

interface Props { params: Promise<{ id: string }> }

export default async function PedidoDetalheAdmin({ params }: Props) {
  const { id } = await params
  const order = await prisma.order.findUnique({
    where: { id },
    include: {
      user: { select: { name: true, email: true, phone: true } },
      address: true,
      items: true,
      history: { orderBy: { createdAt: 'desc' } },
    },
  })
  if (!order) notFound()

  return (
    <div>
      <div className="px-6 py-6 border-b border-border">
        <h1 className="text-xl font-bold uppercase tracking-widest">Pedido #{id.slice(-8).toUpperCase()}</h1>
      </div>
      <div className="p-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Items */}
        <div className="lg:col-span-2 space-y-4">
          <div className="border border-border">
            <div className="px-4 py-3 border-b border-border bg-secondary">
              <h2 className="text-xs font-bold uppercase tracking-widest">Itens</h2>
            </div>
            {order.items.map(item => (
              <div key={item.id} className="flex justify-between items-center px-4 py-3 border-b border-border last:border-0 text-xs">
                <div>
                  <p className="font-bold uppercase tracking-wider">{item.productName}</p>
                  <p className="text-muted-foreground">Tam: {item.size} · Qtd: {item.quantity}</p>
                </div>
                <span className="font-bold">{formatPrice(item.totalPrice)}</span>
              </div>
            ))}
            <div className="px-4 py-3 bg-secondary flex flex-col gap-1 text-xs">
              <div className="flex justify-between"><span className="text-muted-foreground">Subtotal</span><span>{formatPrice(order.subtotal)}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Frete</span><span>{formatPrice(order.freightCost)}</span></div>
              {order.discountAmount > 0 && <div className="flex justify-between text-primary"><span>Desconto</span><span>-{formatPrice(order.discountAmount)}</span></div>}
              <div className="flex justify-between font-bold border-t border-border pt-2"><span>Total</span><span>{formatPrice(order.total)}</span></div>
            </div>
          </div>

          {/* Histórico */}
          <div className="border border-border">
            <div className="px-4 py-3 border-b border-border bg-secondary">
              <h2 className="text-xs font-bold uppercase tracking-widest">Histórico</h2>
            </div>
            {order.history.map(h => (
              <div key={h.id} className="px-4 py-2 border-b border-border last:border-0 text-xs flex gap-4">
                <span className="text-muted-foreground shrink-0">{new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short' }).format(h.createdAt)}</span>
                <span>{h.action} {h.fromStatus && `(${h.fromStatus} → ${h.toStatus})`} {h.note && `— ${h.note}`}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          <div className="border border-border p-4">
            <h2 className="text-xs font-bold uppercase tracking-widest mb-3 border-b border-border pb-2">Cliente</h2>
            <p className="text-xs font-bold">{order.user.name ?? '—'}</p>
            <p className="text-xs text-muted-foreground normal-case">{order.user.email}</p>
            {order.user.phone && <p className="text-xs text-muted-foreground">{order.user.phone}</p>}
          </div>

          {order.address && (
            <div className="border border-border p-4">
              <h2 className="text-xs font-bold uppercase tracking-widest mb-3 border-b border-border pb-2">Endereço</h2>
              <p className="text-xs text-muted-foreground normal-case leading-relaxed">
                {order.address.street}, {order.address.number}<br />
                {order.address.neighborhood} — {order.address.city}/{order.address.state}<br />
                CEP {order.address.zipCode}
              </p>
            </div>
          )}

          <OrderStatusForm orderId={order.id} currentStatus={order.status} trackingCode={order.trackingCode} />
        </div>
      </div>
    </div>
  )
}
