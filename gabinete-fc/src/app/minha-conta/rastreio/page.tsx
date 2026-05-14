import Link from 'next/link'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { Truck, ExternalLink } from 'lucide-react'

function carrierUrl(carrier: string | null, code: string): string | null {
  if (!code) return null
  if (!carrier) return `https://rastreamento.correios.com.br/app/index.php?objetos=${code}`
  const c = carrier.toLowerCase()
  if (c.includes('correio')) return `https://rastreamento.correios.com.br/app/index.php?objetos=${code}`
  if (c.includes('jadlog')) return `https://www.jadlog.com.br/tracking?cte=${code}`
  return null
}

export default async function RastreioListaPage() {
  const session = await auth()
  const userId = (session?.user as { id?: string })?.id

  const orders = userId
    ? await prisma.order.findMany({
        where: {
          userId,
          status: { in: ['confirmed', 'processing', 'shipped', 'delivered'] },
        },
        orderBy: { createdAt: 'desc' },
        take: 30,
      })
    : []

  return (
    <div>
      <div className="border-b border-border pb-4 mb-6">
        <h2 className="text-xs font-bold uppercase tracking-widest">Rastrear Pedido</h2>
        <p className="text-[10px] text-muted-foreground uppercase tracking-widest mt-1 normal-case">
          Acompanhe seus pedidos em trânsito
        </p>
      </div>

      {orders.length === 0 ? (
        <div className="py-16 text-center">
          <Truck className="w-8 h-8 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground text-xs uppercase tracking-widest mb-6">
            Você não tem pedidos em trânsito agora.
          </p>
          <Link
            href="/loja"
            className="inline-block px-8 py-4 bg-primary text-primary-foreground font-bold text-xs uppercase tracking-widest hover:bg-foreground hover:text-background transition-colors"
          >
            Explorar Catálogo
          </Link>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {orders.map((order) => {
            const url = order.trackingCode ? carrierUrl(order.carrier, order.trackingCode) : null
            return (
              <div
                key={order.id}
                className="border border-border p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3"
              >
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider">
                    Pedido #{order.id.slice(-8).toUpperCase()}
                  </p>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-widest normal-case">
                    {order.trackingCode
                      ? `Código: ${order.trackingCode}${order.carrier ? ` · ${order.carrier}` : ''}`
                      : 'Aguardando código de rastreio'}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <Link
                    href={`/minha-conta/rastreio/${order.id}`}
                    className="text-[10px] font-bold uppercase tracking-widest border border-border px-3 py-2 hover:border-primary hover:text-primary transition-colors"
                  >
                    Detalhes
                  </Link>
                  {url && (
                    <a
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[10px] font-bold uppercase tracking-widest bg-primary text-primary-foreground px-3 py-2 flex items-center gap-1.5 hover:bg-foreground hover:text-background transition-colors"
                    >
                      Transportadora
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
