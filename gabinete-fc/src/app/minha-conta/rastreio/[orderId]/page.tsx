import Link from 'next/link'
import { notFound } from 'next/navigation'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { ArrowLeft, ExternalLink, Package, Truck, CheckCircle2, Clock } from 'lucide-react'
import { formatPrice } from '@/lib/db-helpers'

interface Props {
  params: Promise<{ orderId: string }>
}

function carrierUrl(carrier: string | null, code: string): string | null {
  if (!code) return null
  if (!carrier) return `https://rastreamento.correios.com.br/app/index.php?objetos=${code}`
  const c = carrier.toLowerCase()
  if (c.includes('correio')) return `https://rastreamento.correios.com.br/app/index.php?objetos=${code}`
  if (c.includes('jadlog')) return `https://www.jadlog.com.br/tracking?cte=${code}`
  return null
}

const STATUS_FLOW = [
  { key: 'confirmed', label: 'Confirmado', Icon: CheckCircle2 },
  { key: 'processing', label: 'Preparando', Icon: Package },
  { key: 'shipped', label: 'Enviado', Icon: Truck },
  { key: 'delivered', label: 'Entregue', Icon: CheckCircle2 },
]

function statusIndex(status: string): number {
  const idx = STATUS_FLOW.findIndex((s) => s.key === status)
  return idx === -1 ? 0 : idx
}

export default async function RastreioDetalhePage({ params }: Props) {
  const { orderId } = await params
  const session = await auth()
  const userId = (session?.user as { id?: string })?.id

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { items: true, address: true },
  })
  if (!order || order.userId !== userId) notFound()

  const currentStep = statusIndex(order.status)
  const url = order.trackingCode ? carrierUrl(order.carrier, order.trackingCode) : null

  return (
    <div>
      <Link
        href="/minha-conta/rastreio"
        className="inline-flex items-center gap-2 text-[10px] uppercase tracking-widest text-muted-foreground hover:text-primary transition-colors mb-6"
      >
        <ArrowLeft className="w-3 h-3" /> Voltar
      </Link>

      <div className="border-b border-border pb-4 mb-6">
        <h2 className="text-xs font-bold uppercase tracking-widest">
          Pedido #{order.id.slice(-8).toUpperCase()}
        </h2>
        <p className="text-[10px] text-muted-foreground uppercase tracking-widest mt-1">
          {new Intl.DateTimeFormat('pt-BR', { dateStyle: 'long' }).format(order.createdAt)}
        </p>
      </div>

      {/* Timeline */}
      <div className="border border-border p-5 mb-6">
        <div className="flex justify-between relative">
          <div className="absolute top-3 left-3 right-3 h-px bg-border" />
          <div
            className="absolute top-3 left-3 h-px bg-primary transition-all"
            style={{ width: `calc(${(currentStep / (STATUS_FLOW.length - 1)) * 100}% - 0.75rem)` }}
          />
          {STATUS_FLOW.map((step, i) => {
            const reached = i <= currentStep
            const Icon = step.Icon
            return (
              <div key={step.key} className="flex flex-col items-center gap-2 z-10">
                <div
                  className={`w-6 h-6 flex items-center justify-center border ${
                    reached ? 'bg-primary border-primary text-primary-foreground' : 'bg-black border-border text-muted-foreground'
                  }`}
                >
                  {reached ? <Icon className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                </div>
                <span
                  className={`text-[9px] font-bold uppercase tracking-widest ${
                    reached ? 'text-primary' : 'text-muted-foreground'
                  }`}
                >
                  {step.label}
                </span>
              </div>
            )
          })}
        </div>
      </div>

      {/* Tracking code box */}
      <div className="border border-border p-5 mb-6">
        <p className="text-[10px] text-muted-foreground uppercase tracking-widest mb-2">
          Código de Rastreio
        </p>
        {order.trackingCode ? (
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <p className="text-xl font-bold tracking-tight">{order.trackingCode}</p>
            {url && (
              <a
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[10px] font-bold uppercase tracking-widest bg-primary text-primary-foreground px-4 py-2.5 flex items-center gap-1.5 self-start hover:bg-foreground hover:text-background transition-colors"
              >
                Abrir na {order.carrier || 'Transportadora'}
                <ExternalLink className="w-3 h-3" />
              </a>
            )}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground normal-case">
            Aguardando despacho. Você receberá o código por email assim que o pedido for enviado.
          </p>
        )}
        {order.trackingUpdatedAt && (
          <p className="text-[10px] text-muted-foreground uppercase tracking-widest mt-2 normal-case">
            Atualizado em{' '}
            {new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short' }).format(
              order.trackingUpdatedAt
            )}
          </p>
        )}
      </div>

      {/* Itens */}
      <h3 className="text-[10px] font-bold uppercase tracking-widest mb-3">Itens deste pedido</h3>
      <div className="flex flex-col gap-2 mb-6">
        {order.items.map((item) => (
          <div key={item.id} className="border border-border p-4 flex justify-between items-center">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider">{item.productName}</p>
              <p className="text-[10px] text-muted-foreground uppercase tracking-widest">
                Tam: {item.size} · Qtd: {item.quantity}
              </p>
              {item.hasCustomization && item.customName && item.customNumber && (
                <p className="text-[10px] text-primary uppercase tracking-widest mt-1">
                  ⚡ {item.customName} · #{item.customNumber}
                </p>
              )}
            </div>
            <span className="text-sm font-bold">{formatPrice(item.totalPrice)}</span>
          </div>
        ))}
      </div>

      {/* Endereço */}
      {order.address && (
        <>
          <h3 className="text-[10px] font-bold uppercase tracking-widest mb-3">Endereço de entrega</h3>
          <div className="border border-border p-4 text-xs normal-case">
            <p className="font-bold uppercase tracking-wider mb-1">
              {order.address.recipientName || order.address.label}
            </p>
            <p className="text-muted-foreground">
              {order.address.street}, {order.address.number}
              {order.address.complement ? ` — ${order.address.complement}` : ''}
            </p>
            <p className="text-muted-foreground">
              {order.address.neighborhood}, {order.address.city}/{order.address.state} · CEP{' '}
              {order.address.zipCode}
            </p>
          </div>
        </>
      )}
    </div>
  )
}
