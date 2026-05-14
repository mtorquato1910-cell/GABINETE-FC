import type { Metadata } from 'next'
import Link from 'next/link'
import { Navbar } from '@/components/layout/Navbar'
import { Footer } from '@/components/layout/Footer'
import { prisma } from '@/lib/db'
import { auth } from '@/lib/auth'
import { formatPrice } from '@/lib/db-helpers'
import { ClearCartOnSuccess } from '@/components/checkout/ClearCartOnSuccess'

export const metadata: Metadata = { title: 'Pedido Confirmado | Gabinete FC' }

interface Props {
  searchParams: Promise<{ orderId?: string; redirect_status?: string }>
}

export default async function SucessoPage({ searchParams }: Props) {
  const { orderId, redirect_status } = await searchParams
  const session = await auth()
  const paymentOk = redirect_status === 'succeeded' || redirect_status === undefined

  const order = orderId
    ? await prisma.order.findFirst({
        where: {
          id: orderId,
          userId: (session?.user as { id?: string })?.id,
        },
        include: { items: true },
      })
    : null

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      {paymentOk && <ClearCartOnSuccess />}
      <main className="flex-1 flex items-center justify-center px-4">
        <div className="max-w-md w-full text-center py-16">
          <div className={`text-6xl mb-6 font-black tracking-tighter ${paymentOk ? 'text-primary' : 'text-destructive'}`}>
            {paymentOk ? '✓' : '✕'}
          </div>
          <h1 className="text-2xl font-bold uppercase tracking-widest mb-4">
            {paymentOk ? 'Pedido Confirmado' : 'Pagamento Falhou'}
          </h1>
          {order && (
            <>
              <p className="text-xs text-muted-foreground uppercase tracking-widest mb-2">
                #{order.id.slice(-8).toUpperCase()}
              </p>
              <p className="text-lg font-bold mb-6">{formatPrice(order.total)}</p>
              <p className="text-xs text-muted-foreground uppercase tracking-widest mb-8">
                {order.paymentMethod === 'pix'
                  ? 'Aguardando pagamento Pix. Você tem 60 minutos.'
                  : 'Pagamento em processamento.'}
              </p>
            </>
          )}
          {!order && (
            <p className="text-xs text-muted-foreground uppercase tracking-widest mb-8">
              Seu pedido foi recebido com sucesso!
            </p>
          )}
          <div className="flex flex-col gap-3">
            <Link
              href="/minha-conta/pedidos"
              className="py-4 bg-primary text-primary-foreground font-bold text-xs uppercase tracking-widest hover:bg-foreground hover:text-background transition-colors"
            >
              Ver Meus Pedidos
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
