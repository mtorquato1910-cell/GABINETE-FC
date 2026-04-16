'use client'
import { useState, useTransition } from 'react'
import { toast } from 'sonner'
import { Bell } from 'lucide-react'
import { createStockAlert } from '@/lib/actions/stockAlerts'

interface Props {
  productId: string
  size: string
}

export function StockAlertButton({ productId, size }: Props) {
  const [isPending, start] = useTransition()
  const [email, setEmail] = useState('')
  const [showInput, setShowInput] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    start(async () => {
      const result = await createStockAlert({ productId, size, email })
      if ('success' in result) {
        toast.success('Você será avisado quando chegar!')
        setShowInput(false)
        setEmail('')
      } else {
        toast.error('Erro ao criar alerta')
      }
    })
  }

  if (!showInput) {
    return (
      <button
        onClick={() => setShowInput(true)}
        className="flex items-center gap-2 w-full py-3 border border-border text-xs font-bold uppercase tracking-widest hover:border-primary hover:text-primary transition-colors justify-center"
      >
        <Bell className="w-4 h-4" />
        Me Avise Quando Chegar
      </button>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="flex gap-2">
      <input
        type="email"
        value={email}
        onChange={e => setEmail(e.target.value)}
        placeholder="seu@email.com"
        required
        className="flex-1 bg-secondary border border-border px-3 py-2 text-sm focus:outline-none focus:border-primary normal-case"
      />
      <button type="submit" disabled={isPending} className="px-4 py-2 bg-primary text-primary-foreground text-xs font-bold uppercase tracking-widest hover:bg-foreground hover:text-background transition-colors disabled:opacity-50">
        {isPending ? '...' : 'Ok'}
      </button>
    </form>
  )
}
