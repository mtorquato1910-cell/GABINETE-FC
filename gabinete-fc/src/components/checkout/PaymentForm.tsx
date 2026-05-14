'use client'
import { useState } from 'react'
import {
  PaymentElement,
  useStripe,
  useElements,
} from '@stripe/react-stripe-js'
import { toast } from 'sonner'
import { formatPrice } from '@/lib/db-helpers'

interface Props {
  orderId: string
  total: number
  onBack: () => void
}

export function PaymentForm({ orderId, total, onBack }: Props) {
  const stripe = useStripe()
  const elements = useElements()
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!stripe || !elements) return

    setLoading(true)

    const { error } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/checkout/sucesso?orderId=${orderId}`,
      },
    })

    if (error) {
      toast.error(error.message ?? 'Falha no pagamento')
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <h2 className="text-sm font-bold uppercase tracking-widest mb-6">
        Pagamento Seguro
      </h2>

      <div className="mb-6">
        <PaymentElement
          options={{
            layout: 'tabs',
          }}
        />
      </div>

      <div className="bg-secondary border border-border p-4 mb-6 text-xs">
        <p className="font-bold uppercase tracking-widest mb-1 text-primary">
          🔒 Pagamento seguro via Stripe
        </p>
        <p className="text-muted-foreground normal-case">
          Seus dados são criptografados. Pix, cartão de crédito e débito disponíveis.
        </p>
      </div>

      <div className="flex gap-4">
        <button
          type="button"
          onClick={onBack}
          disabled={loading}
          className="flex-1 py-4 border border-border font-bold text-xs uppercase tracking-widest hover:border-primary hover:text-primary transition-colors disabled:opacity-50"
        >
          ← Voltar
        </button>
        <button
          type="submit"
          disabled={!stripe || !elements || loading}
          className="flex-1 py-4 bg-primary text-primary-foreground font-bold text-xs uppercase tracking-widest hover:bg-foreground hover:text-background transition-colors disabled:opacity-50"
        >
          {loading ? 'Processando...' : `Pagar ${formatPrice(total)}`}
        </button>
      </div>
    </form>
  )
}
