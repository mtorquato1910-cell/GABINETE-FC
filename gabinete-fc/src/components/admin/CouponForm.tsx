'use client'
import { useState, useTransition } from 'react'
import { toast } from 'sonner'
import { createCoupon } from '@/lib/actions/admin'

export function CouponForm() {
  const [isPending, start] = useTransition()
  const [form, setForm] = useState({ code: '', type: 'percent' as 'percent' | 'fixed', value: '', minOrderValue: '', maxUses: '', expiresAt: '' })
  const inp = 'bg-secondary border border-border px-3 py-2 text-sm focus:outline-none focus:border-primary normal-case tracking-normal w-full'

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    start(async () => {
      const result = await createCoupon({
        code: form.code.toUpperCase(),
        type: form.type,
        value: parseFloat(form.value),
        minOrderValue: parseFloat(form.minOrderValue || '0'),
        maxUses: form.maxUses ? parseInt(form.maxUses) : undefined,
        expiresAt: form.expiresAt || undefined,
      })
      if ('success' in result) {
        toast.success('Cupom criado!')
        setForm({ code: '', type: 'percent', value: '', minOrderValue: '', maxUses: '', expiresAt: '' })
      } else {
        toast.error('Erro ao criar cupom')
      }
    })
  }

  return (
    <div className="border border-border p-4">
      <h2 className="text-xs font-bold uppercase tracking-widest mb-4 border-b border-border pb-3">Novo Cupom</h2>
      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <div>
          <label className="text-[10px] text-muted-foreground uppercase tracking-widest block mb-1">Código *</label>
          <input value={form.code} onChange={e => setForm(f => ({ ...f, code: e.target.value.toUpperCase() }))} required className={inp} placeholder="SUMMER20" />
        </div>
        <div>
          <label className="text-[10px] text-muted-foreground uppercase tracking-widest block mb-1">Tipo</label>
          <select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value as 'percent' | 'fixed' }))} className={inp}>
            <option value="percent">Percentual (%)</option>
            <option value="fixed">Fixo (R$)</option>
          </select>
        </div>
        <div>
          <label className="text-[10px] text-muted-foreground uppercase tracking-widest block mb-1">Valor *</label>
          <input type="number" step="0.01" value={form.value} onChange={e => setForm(f => ({ ...f, value: e.target.value }))} required className={inp} />
        </div>
        <div>
          <label className="text-[10px] text-muted-foreground uppercase tracking-widest block mb-1">Pedido mínimo</label>
          <input type="number" value={form.minOrderValue} onChange={e => setForm(f => ({ ...f, minOrderValue: e.target.value }))} className={inp} placeholder="0" />
        </div>
        <div>
          <label className="text-[10px] text-muted-foreground uppercase tracking-widest block mb-1">Máx. usos</label>
          <input type="number" value={form.maxUses} onChange={e => setForm(f => ({ ...f, maxUses: e.target.value }))} className={inp} placeholder="Ilimitado" />
        </div>
        <div>
          <label className="text-[10px] text-muted-foreground uppercase tracking-widest block mb-1">Expira em</label>
          <input type="date" value={form.expiresAt} onChange={e => setForm(f => ({ ...f, expiresAt: e.target.value }))} className={inp} />
        </div>
        <button type="submit" disabled={isPending} className="py-3 bg-primary text-primary-foreground text-xs font-bold uppercase tracking-widest hover:bg-foreground hover:text-background transition-colors disabled:opacity-50 mt-2">
          {isPending ? '...' : 'Criar Cupom'}
        </button>
      </form>
    </div>
  )
}
