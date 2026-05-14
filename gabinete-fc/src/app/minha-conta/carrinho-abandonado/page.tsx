import Link from 'next/link'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { ShoppingBag } from 'lucide-react'
import { formatPrice } from '@/lib/db-helpers'

export default async function CarrinhoAbandonadoPage() {
  const session = await auth()
  const userId = (session?.user as { id?: string })?.id

  // Carrinhos abandonados = orders pending sem pagamento
  const abandoned = userId
    ? await prisma.order.findMany({
        where: {
          userId,
          status: 'pending',
          paymentStatus: 'pending',
        },
        orderBy: { createdAt: 'desc' },
        include: { items: true },
        take: 10,
      })
    : []

  return (
    <div>
      <div className="border-b border-border pb-4 mb-6">
        <h2 className="text-xs font-bold uppercase tracking-widest">Carrinho Abandonado</h2>
        <p className="text-[10px] text-muted-foreground uppercase tracking-widest mt-1 normal-case">
          Pedidos iniciados mas não finalizados — você pode retomar a qualquer momento
        </p>
      </div>

      {abandoned.length === 0 ? (
        <div className="py-16 text-center">
          <ShoppingBag className="w-8 h-8 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground text-xs uppercase tracking-widest mb-6">
            Nenhum carrinho abandonado. Tudo finalizado ✓
          </p>
          <Link
            href="/loja"
            className="inline-block px-8 py-4 bg-primary text-primary-foreground font-bold text-xs uppercase tracking-widest hover:bg-foreground hover:text-background transition-colors"
          >
            Continuar Comprando
          </Link>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {abandoned.map((order) => (
            <div key={order.id} className="border border-border p-4">
              <div className="flex justify-between items-center mb-3 pb-3 border-b border-border">
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider">
                    Pedido #{order.id.slice(-8).toUpperCase()}
                  </p>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-widest">
                    Iniciado em{' '}
                    {new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short' }).format(order.createdAt)}
                  </p>
                </div>
                <span className="text-base font-bold">{formatPrice(order.total)}</span>
              </div>

              <ul className="flex flex-col gap-1 mb-4">
                {order.items.map((item) => (
                  <li
                    key={item.id}
                    className="text-[10px] text-muted-foreground uppercase tracking-widest"
                  >
                    {item.quantity}× {item.productName} ({item.size})
                    {item.hasCustomization && item.customName && (
                      <span className="text-primary ml-2">
                        ⚡ {item.customName} #{item.customNumber}
                      </span>
                    )}
                  </li>
                ))}
              </ul>

              <div className="flex flex-col sm:flex-row gap-2">
                <Link
                  href={`/checkout?retake=${order.id}`}
                  className="flex-1 text-center py-3 bg-primary text-primary-foreground font-bold text-[10px] uppercase tracking-widest hover:bg-foreground hover:text-background transition-colors"
                >
                  Retomar Pedido
                </Link>
                <Link
                  href={`/minha-conta/pedidos`}
                  className="flex-1 text-center py-3 border border-border font-bold text-[10px] uppercase tracking-widest hover:border-primary hover:text-primary transition-colors"
                >
                  Ver Detalhes
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}

      <p className="text-[10px] text-muted-foreground uppercase tracking-widest mt-6 normal-case">
        Carrinhos com mais de 30 dias podem ter os produtos esgotados ou preços alterados.
      </p>
    </div>
  )
}
