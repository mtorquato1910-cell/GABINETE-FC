import type { Metadata } from 'next'
import Link from 'next/link'
import { Navbar } from '@/components/layout/Navbar'
import { Footer } from '@/components/layout/Footer'
import { prisma } from '@/lib/db'
import { auth } from '@/lib/auth'
import { formatPrice } from '@/lib/db-helpers'
import { ClearCartOnSuccess } from '@/components/checkout/ClearCartOnSuccess'

export const dynamic = 'force-dynamic'
export const metadata: Metadata = { title: 'Pedido Confirmado | Gabinete FC' }

// Auto-refresh a cada 5s se pedido ainda pending (webhook leva até 1 min).
// Usa <meta http-equiv="refresh"> pra não depender de JS.
const POLL_SECONDS = 5

interface Props {
  // Params retornados pela Infinity Pay na redirect URL
  searchParams: Promise<{
    order_nsu?: string
    receipt_url?: string
    slug?: string
    capture_method?: string
    transaction_nsu?: string
  }>
}

export default async function SucessoPage({ searchParams }: Props) {
  const params = await searchParams
  const orderId = params.order_nsu
  const session = await auth()

  const order = orderId
    ? await prisma.order.findFirst({
        where: {
          id: orderId,
          userId: (session?.user as { id?: string })?.id,
        },
        include: { items: true },
      })
    : null

  const isPaid = order?.paymentStatus === 'paid'
  const isPending = order?.paymentStatus === 'pending'
  const isFailed = order?.paymentStatus === 'failed'

  // Receipt URL: prioriza o que veio do webhook (autoritativo), fallback no query param da redirect
  const receiptUrl = order?.infinitepayReceiptUrl ?? params.receipt_url ?? null

  return (
    <div className="min-h-screen flex flex-col">
      {/* Auto-refresh só enquanto pending — webhook deve chegar em até 1 min */}
      {isPending && (
        <meta httpEquiv="refresh" content={`${POLL_SECONDS}`} />
      )}

      <Navbar />

      {isPaid && order && (
        <ClearCartOnSuccess
          purchase={{
            transactionId: order.id,
            value: order.total,
            shipping: order.freightCost,
            items: order.items.map((it) => ({
              item_id: it.productId,
              item_name: it.productName,
              price: it.unitPrice,
              quantity: it.quantity,
              item_variant: it.size,
            })),
          }}
        />
      )}

      <main className="flex-1 flex items-center justify-center px-4">
        <div className="max-w-md w-full text-center py-16">
          {isPaid && (
            <>
              <div className="text-6xl mb-6 font-black tracking-tighter text-primary">✓</div>
              <h1 className="text-2xl font-bold uppercase tracking-widest mb-4">
                Pedido Confirmado
              </h1>
            </>
          )}

          {isPending && (
            <>
              <div className="text-6xl mb-6 font-black tracking-tighter text-primary animate-pulse">
                ⏳
              </div>
              <h1 className="text-2xl font-bold uppercase tracking-widest mb-4">
                Confirmando pagamento…
              </h1>
              <p className="text-xs text-muted-foreground uppercase tracking-widest normal-case mb-2">
                A página atualiza sozinha a cada {POLL_SECONDS}s. Pode levar até 1 minuto.
              </p>
            </>
          )}

          {isFailed && (
            <>
              <div className="text-6xl mb-6 font-black tracking-tighter text-destructive">✕</div>
              <h1 className="text-2xl font-bold uppercase tracking-widest mb-4">
                Pagamento Falhou
              </h1>
            </>
          )}

          {!order && (
            <>
              <div className="text-6xl mb-6 font-black tracking-tighter text-primary">✓</div>
              <h1 className="text-2xl font-bold uppercase tracking-widest mb-4">
                Pedido Recebido
              </h1>
              <p className="text-xs text-muted-foreground uppercase tracking-widest mb-8">
                Não conseguimos localizar os detalhes — verifique em &quot;Meus Pedidos&quot;.
              </p>
            </>
          )}

          {order && (
            <>
              <p className="text-xs text-muted-foreground uppercase tracking-widest mb-2">
                #{order.id.slice(-8).toUpperCase()}
              </p>
              <p className="text-lg font-bold mb-2">{formatPrice(order.total)}</p>
              {isPaid && order.captureMethod && (
                <p className="text-[10px] text-muted-foreground uppercase tracking-widest mb-6 normal-case">
                  {order.captureMethod === 'pix'
                    ? 'Pago via Pix'
                    : order.captureMethod === 'credit_card'
                      ? `Cartão de crédito${order.installments && order.installments > 1 ? ` · ${order.installments}x` : ''}`
                      : order.captureMethod === 'debit_card'
                        ? 'Cartão de débito'
                        : order.captureMethod}
                </p>
              )}
            </>
          )}

          <div className="flex flex-col gap-3">
            {receiptUrl && (
              <a
                href={receiptUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="py-4 bg-primary text-primary-foreground font-bold text-xs uppercase tracking-widest hover:bg-foreground hover:text-background transition-colors"
              >
                Ver Comprovante
              </a>
            )}
            <Link
              href="/minha-conta/pedidos"
              className={`py-4 font-bold text-xs uppercase tracking-widest transition-colors ${
                receiptUrl
                  ? 'border border-border hover:border-primary hover:text-primary'
                  : 'bg-primary text-primary-foreground hover:bg-foreground hover:text-background'
              }`}
            >
              Meus Pedidos
            </Link>
            <Link
              href="/loja"
              className="py-4 border border-border font-bold text-xs uppercase tracking-widest hover:border-primary hover:text-primary transition-colors"
            >
              Continuar Comprando
            </Link>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}
