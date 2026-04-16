'use client'
import { useState, useTransition } from 'react'
import { toast } from 'sonner'

interface Product { id: string; name: string; sizes: string[] }

export function AddStockForm({ products }: { products: Product[] }) {
  const [isPending, start] = useTransition()
  const [form, setForm] = useState({ productId: products[0]?.id ?? '', size: '', type: 'in' as 'in' | 'out', quantity: '', reason: '' })
  const selectedProduct = products.find(p => p.id === form.productId)
  const inp = 'bg-secondary border border-border px-3 py-2 text-sm focus:outline-none focus:border-primary normal-case tracking-normal w-full'

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.size || !form.quantity || !form.reason) {
      toast.error('Preencha todos os campos')
      return
    }
    start(async () => {
      // Server action inline — poderia estar em admin.ts
      const res = await fetch('/api/admin/stock', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, quantity: parseInt(form.quantity) }),
      })
      if (res.ok) {
        toast.success('Movimentação registrada')
        setForm(f => ({ ...f, quantity: '', reason: '' }))
      } else {
        toast.error('Erro ao registrar')
      }
    })
  }

  return (
    <div className="border border-border p-4">
      <h2 className="text-xs font-bold uppercase tracking-widest mb-4 border-b border-border pb-3">Registrar Movimentação</h2>
      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <div>
          <label className="text-[10px] text-muted-foreground uppercase tracking-widest block mb-1">Produto</label>
          <select value={form.productId} onChange={e => setForm(f => ({ ...f, productId: e.target.value, size: '' }))} className={inp}>
            {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        </div>
        <div>
          <label className="text-[10px] text-muted-foreground uppercase tracking-widest block mb-1">Tamanho</label>
          <select value={form.size} onChange={e => setForm(f => ({ ...f, size: e.target.value }))} className={inp}>
            <option value="">Selecione</option>
            {selectedProduct?.sizes.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <div>
          <label className="text-[10px] text-muted-foreground uppercase tracking-widest block mb-1">Tipo</label>
          <select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value as 'in' | 'out' }))} className={inp}>
            <option value="in">Entrada</option>
            <option value="out">Saída</option>
          </select>
        </div>
        <div>
          <label className="text-[10px] text-muted-foreground uppercase tracking-widest block mb-1">Quantidade</label>
          <input type="number" min="1" value={form.quantity} onChange={e => setForm(f => ({ ...f, quantity: e.target.value }))} className={inp} />
        </div>
        <div>
          <label className="text-[10px] text-muted-foreground uppercase tracking-widest block mb-1">Motivo</label>
          <input value={form.reason} onChange={e => setForm(f => ({ ...f, reason: e.target.value }))} placeholder="Compra fornecedor, venda manual..." className={inp} />
        </div>
        <button type="submit" disabled={isPending} className="py-3 bg-primary text-primary-foreground text-xs font-bold uppercase tracking-widest hover:bg-foreground hover:text-background transition-colors disabled:opacity-50 mt-2">
          {isPending ? '...' : 'Registrar'}
        </button>
      </form>
    </div>
  )
}
