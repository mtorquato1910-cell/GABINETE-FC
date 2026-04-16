'use client'
import { useState, useTransition } from 'react'
import { toast } from 'sonner'
import { updateOrderStatus } from '@/lib/actions/admin'

const ORDER_STATUSES = ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled']

interface Props { orderId: string; currentStatus: string; trackingCode?: string | null }

export function OrderStatusForm({ orderId, currentStatus, trackingCode }: Props) {
  const [isPending, start] = useTransition()
  const [status, setStatus] = useState(currentStatus)
  const [note, setNote] = useState('')

  const handleUpdate = () => {
    start(async () => {
      const result = await updateOrderStatus(orderId, status, note || undefined)
      if ('success' in result) {
        toast.success('Status atualizado!')
        setNote('')
      } else {
        toast.error('Erro ao atualizar')
      }
    })
  }

  const inp = 'bg-secondary border border-border px-3 py-2 text-sm focus:outline-none focus:border-primary normal-case tracking-normal w-full'

  return (
    <div className="border border-border p-4">
      <h2 className="text-xs font-bold uppercase tracking-widest mb-3 border-b border-border pb-2">Atualizar Status</h2>
      {trackingCode && (
        <p className="text-xs text-muted-foreground mb-3 normal-case">
          Rastreio: <span className="font-mono text-foreground">{trackingCode}</span>
        </p>
      )}
      <div className="flex flex-col gap-3">
        <select value={status} onChange={e => setStatus(e.target.value)} className={inp}>
          {ORDER_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        <input value={note} onChange={e => setNote(e.target.value)} placeholder="Nota interna (opcional)" className={inp} />
        <button onClick={handleUpdate} disabled={isPending || status === currentStatus}
          className="py-3 bg-primary text-primary-foreground text-xs font-bold uppercase tracking-widest hover:bg-foreground hover:text-background transition-colors disabled:opacity-50">
          {isPending ? '...' : 'Atualizar'}
        </button>
      </div>
    </div>
  )
}
