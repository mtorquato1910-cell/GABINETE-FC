'use client'
import { useState, useTransition } from 'react'
import { toast } from 'sonner'
import { updateStoreSetting } from '@/lib/actions/admin'

interface Props { settings: Record<string, string> }

const SETTING_GROUPS = [
  { title: 'Geral', keys: ['store_name', 'store_email', 'whatsapp'] },
  { title: 'Pagamentos', keys: ['pix_discount_percent', 'pix_expiry_minutes', 'stripe_3ds_threshold'] },
  { title: 'Operações', keys: ['free_shipping_threshold', 'freight_origin_cep'] },
  { title: 'Fidelidade', keys: ['loyalty_points_per_real', 'loyalty_points_expiry_days'] },
  { title: 'Meta / Pixel', keys: ['meta_pixel_id', 'meta_bm_id', 'meta_access_token'] },
]

const LABELS: Record<string, string> = {
  store_name: 'Nome da loja', store_email: 'Email da loja', whatsapp: 'WhatsApp',
  pix_discount_percent: 'Desconto Pix (%)', pix_expiry_minutes: 'Expiração Pix (min)',
  stripe_3ds_threshold: 'Threshold 3DS (R$)', free_shipping_threshold: 'Frete grátis acima de (R$)',
  freight_origin_cep: 'CEP de origem', loyalty_points_per_real: 'Pontos por R$ 1',
  loyalty_points_expiry_days: 'Expiração pontos (dias)',
  meta_pixel_id: 'Meta Pixel ID', meta_bm_id: 'Meta BM ID (Business Manager)',
  meta_access_token: 'Meta Access Token (CAPI)',
}

export function StoreSettingsForm({ settings }: Props) {
  const [isPending, start] = useTransition()
  const [form, setForm] = useState<Record<string, string>>(settings)
  const inp = 'bg-secondary border border-border px-3 py-2 text-sm focus:outline-none focus:border-primary normal-case tracking-normal w-full'

  const handleSave = (key: string) => {
    start(async () => {
      const result = await updateStoreSetting(key, form[key] ?? '')
      if ('success' in result) toast.success(`"${LABELS[key] ?? key}" salvo!`)
      else toast.error('Erro ao salvar')
    })
  }

  return (
    <div className="flex flex-col gap-8">
      {SETTING_GROUPS.map(group => (
        <div key={group.title}>
          <h2 className="text-xs font-bold uppercase tracking-widest mb-4 border-b border-border pb-2 text-primary">
            {group.title}
          </h2>
          <div className="flex flex-col gap-4">
            {group.keys.map(key => (
              <div key={key} className="flex gap-2 items-end">
                <div className="flex-1">
                  <label className="text-[10px] text-muted-foreground uppercase tracking-widest block mb-1">
                    {LABELS[key] ?? key}
                  </label>
                  <input value={form[key] ?? ''} onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))} className={inp} />
                </div>
                <button onClick={() => handleSave(key)} disabled={isPending}
                  className="px-4 py-2 bg-primary text-primary-foreground text-xs font-bold uppercase tracking-widest hover:bg-foreground hover:text-background transition-colors disabled:opacity-50 shrink-0">
                  Salvar
                </button>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
