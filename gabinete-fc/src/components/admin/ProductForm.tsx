'use client'
import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { createProduct, updateProduct } from '@/lib/actions/admin'

const CATEGORIES = ['selecoes', 'clubes-europeus', 'clubes-brasileiros', 'retro', 'especial']
const ALL_SIZES = ['PP', 'P', 'M', 'G', 'GG', 'XG', '2XL', '3XL']
const TYPES = ['titular', 'reserva', 'terceiro', 'goleiro']

interface InitialData {
  id?: string; name: string; slug: string; description: string;
  price: number; costPrice?: number; supplierCode: string;
  category: string; team: string; type: string; badge: string;
  sizesAvailable: string[]; images: string[];
  isActive: boolean; isFeatured: boolean;
  metaTitle: string; metaDescription: string;
}

export function ProductForm({ initialData }: { initialData?: InitialData }) {
  const router = useRouter()
  const [isPending, start] = useTransition()
  const [form, setForm] = useState<InitialData>(initialData ?? {
    name: '', slug: '', description: '', price: 0, supplierCode: '',
    category: 'selecoes', team: '', type: 'titular', badge: '',
    sizesAvailable: [], images: ['/images/products/placeholder-jersey.svg'],
    isActive: false, isFeatured: false, metaTitle: '', metaDescription: '',
  })

  const inp = 'bg-secondary border border-border px-3 py-2 text-sm focus:outline-none focus:border-primary normal-case tracking-normal w-full'

  const handleSlug = (name: string) => {
    if (!form.slug || !initialData) {
      setForm(f => ({ ...f, slug: name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') }))
    }
  }

  const toggleSize = (size: string) => {
    setForm(f => ({
      ...f,
      sizesAvailable: f.sizesAvailable.includes(size)
        ? f.sizesAvailable.filter(s => s !== size)
        : [...f.sizesAvailable, size],
    }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    start(async () => {
      const data = { ...form, price: parseFloat(form.price as unknown as string) }
      const result = initialData?.id
        ? await updateProduct(initialData.id, data)
        : await createProduct(data)

      if ('error' in result && result.error) {
        toast.error('Verifique os campos')
        return
      }
      toast.success(initialData?.id ? 'Produto atualizado!' : 'Produto criado!')
      router.push('/admin/produtos')
    })
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      <div className="grid grid-cols-2 gap-4">
        <div className="col-span-2">
          <label className="text-[10px] text-muted-foreground uppercase tracking-widest block mb-1">Nome *</label>
          <input value={form.name} onChange={e => { setForm(f => ({ ...f, name: e.target.value })); handleSlug(e.target.value) }} required className={inp} />
        </div>
        <div>
          <label className="text-[10px] text-muted-foreground uppercase tracking-widest block mb-1">Slug *</label>
          <input value={form.slug} onChange={e => setForm(f => ({ ...f, slug: e.target.value }))} required className={inp} />
        </div>
        <div>
          <label className="text-[10px] text-muted-foreground uppercase tracking-widest block mb-1">Time *</label>
          <input value={form.team} onChange={e => setForm(f => ({ ...f, team: e.target.value }))} required className={inp} />
        </div>
        <div>
          <label className="text-[10px] text-muted-foreground uppercase tracking-widest block mb-1">Preço (R$) *</label>
          <input type="number" step="0.01" value={form.price} onChange={e => setForm(f => ({ ...f, price: parseFloat(e.target.value) }))} required className={inp} />
        </div>
        <div>
          <label className="text-[10px] text-muted-foreground uppercase tracking-widest block mb-1">Custo (R$)</label>
          <input type="number" step="0.01" value={form.costPrice ?? ''} onChange={e => setForm(f => ({ ...f, costPrice: parseFloat(e.target.value) }))} className={inp} placeholder="Interno" />
        </div>
        <div>
          <label className="text-[10px] text-muted-foreground uppercase tracking-widest block mb-1">Categoria *</label>
          <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))} className={inp}>
            {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div>
          <label className="text-[10px] text-muted-foreground uppercase tracking-widest block mb-1">Tipo</label>
          <select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))} className={inp}>
            {TYPES.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
        <div>
          <label className="text-[10px] text-muted-foreground uppercase tracking-widest block mb-1">Badge</label>
          <input value={form.badge} onChange={e => setForm(f => ({ ...f, badge: e.target.value }))} placeholder="Lançamento, Promo..." className={inp} />
        </div>
        <div>
          <label className="text-[10px] text-muted-foreground uppercase tracking-widest block mb-1">Código Fornecedor</label>
          <input value={form.supplierCode} onChange={e => setForm(f => ({ ...f, supplierCode: e.target.value }))} className={inp} />
        </div>
        <div className="col-span-2">
          <label className="text-[10px] text-muted-foreground uppercase tracking-widest block mb-1">Descrição</label>
          <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={3} className={`${inp} resize-none`} />
        </div>
      </div>

      {/* Sizes */}
      <div>
        <label className="text-[10px] text-muted-foreground uppercase tracking-widest block mb-2">Tamanhos disponíveis</label>
        <div className="flex gap-2 flex-wrap">
          {ALL_SIZES.map(s => (
            <button key={s} type="button" onClick={() => toggleSize(s)}
              className={`w-12 h-10 text-xs font-bold uppercase transition-colors ${form.sizesAvailable.includes(s) ? 'bg-primary text-primary-foreground' : 'border border-border text-muted-foreground hover:border-foreground'}`}>
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Flags */}
      <div className="flex gap-6">
        {[
          { key: 'isActive', label: 'Produto ativo' },
          { key: 'isFeatured', label: 'Destaque na home' },
        ].map(({ key, label }) => (
          <label key={key} className="flex items-center gap-2 cursor-pointer text-xs uppercase tracking-widest">
            <input type="checkbox" checked={form[key as keyof InitialData] as boolean}
              onChange={e => setForm(f => ({ ...f, [key]: e.target.checked }))}
              className="w-4 h-4 accent-primary" />
            {label}
          </label>
        ))}
      </div>

      <button type="submit" disabled={isPending}
        className="py-4 bg-primary text-primary-foreground font-bold text-xs uppercase tracking-widest hover:bg-foreground hover:text-background transition-colors disabled:opacity-50">
        {isPending ? 'Salvando...' : initialData?.id ? 'Atualizar Produto' : 'Criar Produto'}
      </button>
    </form>
  )
}
