'use client'
import { useState, useTransition } from 'react'
import { toast } from 'sonner'
import { createReview } from '@/lib/actions/reviews'

interface Review {
  id: string
  rating: number
  title?: string | null
  body?: string | null
  createdAt: Date
  user: { name?: string | null }
}

interface Props {
  productId: string
  reviews: Review[]
  isLoggedIn: boolean
}

function Stars({ rating, interactive = false, onRate }: { rating: number; interactive?: boolean; onRate?: (n: number) => void }) {
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map(n => (
        <span
          key={n}
          onClick={() => interactive && onRate?.(n)}
          className={`text-xl cursor-${interactive ? 'pointer' : 'default'} transition-colors ${n <= rating ? 'text-primary' : 'text-muted-foreground'}`}
        >
          ★
        </span>
      ))}
    </div>
  )
}

export function ReviewSection({ productId, reviews, isLoggedIn }: Props) {
  const [isPending, start] = useTransition()
  const [form, setForm] = useState({ rating: 0, title: '', body: '' })
  const [showForm, setShowForm] = useState(false)

  const avg = reviews.length ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1) : null

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (form.rating === 0) { toast.error('Selecione uma nota'); return }
    start(async () => {
      const result = await createReview({ productId, ...form })
      if ('error' in result && result.error) {
        toast.error('Erro ao enviar avaliação')
        return
      }
      toast.success('Avaliação enviada! Aguarda moderação.')
      setShowForm(false)
      setForm({ rating: 0, title: '', body: '' })
    })
  }

  const inp = 'bg-secondary border border-border px-3 py-2 text-sm focus:outline-none focus:border-primary normal-case tracking-normal w-full'

  return (
    <div className="border-t border-border mt-12 pt-8 px-6 lg:px-16">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-xs font-bold uppercase tracking-widest">Avaliações</h2>
          {avg && <p className="text-3xl font-bold mt-1">{avg} <span className="text-primary">★</span> <span className="text-muted-foreground text-sm font-normal">({reviews.length})</span></p>}
        </div>
        {isLoggedIn && !showForm && (
          <button onClick={() => setShowForm(true)} className="px-4 py-2 border border-border text-xs font-bold uppercase tracking-widest hover:border-primary hover:text-primary transition-colors">
            Avaliar
          </button>
        )}
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="border border-border p-6 mb-8 flex flex-col gap-4">
          <div>
            <p className="text-[10px] uppercase tracking-widest text-muted-foreground mb-2">Sua nota *</p>
            <Stars rating={form.rating} interactive onRate={n => setForm(f => ({ ...f, rating: n }))} />
          </div>
          <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="Título (opcional)" className={inp} />
          <textarea value={form.body} onChange={e => setForm(f => ({ ...f, body: e.target.value }))} placeholder="Seu comentário..." rows={3} className={`${inp} resize-none`} />
          <div className="flex gap-3">
            <button type="submit" disabled={isPending} className="flex-1 py-3 bg-primary text-primary-foreground text-xs font-bold uppercase tracking-widest hover:bg-foreground hover:text-background transition-colors disabled:opacity-50">
              {isPending ? '...' : 'Enviar'}
            </button>
            <button type="button" onClick={() => setShowForm(false)} className="px-6 py-3 border border-border text-xs font-bold uppercase tracking-widest hover:border-primary transition-colors">
              Cancelar
            </button>
          </div>
        </form>
      )}

      {reviews.length === 0 ? (
        <p className="text-muted-foreground text-xs uppercase tracking-widest">Nenhuma avaliação ainda. Seja o primeiro!</p>
      ) : (
        <div className="flex flex-col gap-6">
          {reviews.map(r => (
            <div key={r.id} className="border-b border-border pb-6 last:border-0">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <Stars rating={r.rating} />
                  {r.title && <p className="font-bold text-sm uppercase tracking-wider mt-1">{r.title}</p>}
                </div>
                <div className="text-right">
                  <p className="text-xs font-bold">{r.user.name ?? 'Cliente'}</p>
                  <p className="text-[10px] text-muted-foreground">{new Intl.DateTimeFormat('pt-BR').format(r.createdAt)}</p>
                </div>
              </div>
              {r.body && <p className="text-sm text-muted-foreground normal-case leading-relaxed mt-2">{r.body}</p>}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
