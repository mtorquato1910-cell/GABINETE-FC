'use client'
import { useState, useTransition } from 'react'
import { toast } from 'sonner'
import { Plus, Pencil, Trash2, Star, Loader2, X, Check } from 'lucide-react'
import {
  createAddress,
  updateAddress,
  deleteAddress,
  setDefaultAddress,
} from '@/lib/actions/profile'
import { lookupCep } from '@/lib/cep'

export interface AddressDTO {
  id: string
  label: string
  recipientName: string
  recipientCpf: string
  recipientPhone: string
  zipCode: string
  street: string
  number: string
  complement: string
  neighborhood: string
  city: string
  state: string
  isDefault: boolean
}

const maskCpf = (v: string) =>
  v.replace(/\D/g, '').slice(0, 11)
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d{1,2})$/, '$1-$2')

const maskPhone = (v: string) =>
  v.replace(/\D/g, '').slice(0, 11)
    .replace(/(\d{2})(\d)/, '($1) $2')
    .replace(/(\d{5})(\d{1,4})$/, '$1-$2')

const maskCep = (v: string) =>
  v.replace(/\D/g, '').slice(0, 8).replace(/(\d{5})(\d)/, '$1-$2')

const EMPTY: AddressDTO = {
  id: '',
  label: 'Casa',
  recipientName: '',
  recipientCpf: '',
  recipientPhone: '',
  zipCode: '',
  street: '',
  number: '',
  complement: '',
  neighborhood: '',
  city: '',
  state: '',
  isDefault: false,
}

export function EnderecosClient({ addresses }: { addresses: AddressDTO[] }) {
  const [editing, setEditing] = useState<string | null>(null) // address id or 'new'
  const [form, setForm] = useState<AddressDTO>(EMPTY)
  const [errors, setErrors] = useState<Record<string, string[]>>({})
  const [cepLoading, setCepLoading] = useState(false)
  const [pending, startTransition] = useTransition()

  const openCreate = () => {
    setForm({ ...EMPTY, isDefault: addresses.length === 0 })
    setErrors({})
    setEditing('new')
  }

  const openEdit = (addr: AddressDTO) => {
    setForm({
      ...addr,
      recipientCpf: maskCpf(addr.recipientCpf),
      recipientPhone: maskPhone(addr.recipientPhone),
      zipCode: maskCep(addr.zipCode),
    })
    setErrors({})
    setEditing(addr.id)
  }

  const close = () => {
    setEditing(null)
    setErrors({})
  }

  const update = <K extends keyof AddressDTO>(key: K, value: AddressDTO[K]) => {
    setForm((f) => ({ ...f, [key]: value }))
    setErrors((e) => ({ ...e, [key]: [] }))
  }

  const handleCepBlur = async () => {
    const digits = form.zipCode.replace(/\D/g, '')
    if (digits.length !== 8) return
    setCepLoading(true)
    const result = await lookupCep(digits)
    setCepLoading(false)
    if (result) {
      setForm((f) => ({
        ...f,
        street: f.street || result.street,
        neighborhood: f.neighborhood || result.neighborhood,
        city: f.city || result.city,
        state: f.state || result.state,
      }))
      toast.success('Endereço preenchido pelo CEP')
    } else {
      toast.warning('CEP não encontrado')
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    startTransition(async () => {
      const payload = {
        ...form,
        recipientCpf: form.recipientCpf.replace(/\D/g, ''),
        recipientPhone: form.recipientPhone.replace(/\D/g, ''),
        zipCode: form.zipCode.replace(/\D/g, ''),
      }
      const result =
        editing === 'new'
          ? await createAddress(payload)
          : await updateAddress(editing!, payload)

      if ('error' in result && result.error) {
        if (typeof result.error === 'string') {
          toast.error(result.error)
        } else {
          setErrors(result.error as Record<string, string[]>)
          toast.error('Verifique os campos destacados')
        }
        return
      }
      toast.success(editing === 'new' ? 'Endereço adicionado' : 'Endereço atualizado')
      close()
    })
  }

  const handleDelete = (id: string) => {
    if (!confirm('Remover este endereço?')) return
    startTransition(async () => {
      const result = await deleteAddress(id)
      if ('error' in result && result.error) {
        toast.error(typeof result.error === 'string' ? result.error : 'Erro ao remover')
        return
      }
      toast.success('Endereço removido')
    })
  }

  const handleSetDefault = (id: string) => {
    startTransition(async () => {
      const result = await setDefaultAddress(id)
      if ('error' in result && result.error) {
        toast.error(typeof result.error === 'string' ? result.error : 'Erro')
        return
      }
      toast.success('Endereço padrão atualizado')
    })
  }

  return (
    <div className="flex flex-col gap-4">
      {addresses.length === 0 && editing !== 'new' && (
        <p className="text-muted-foreground text-xs uppercase tracking-widest">
          Nenhum endereço cadastrado.
        </p>
      )}

      {addresses.map((addr) =>
        editing === addr.id ? (
          <AddressForm
            key={addr.id}
            form={form}
            errors={errors}
            update={update}
            cepLoading={cepLoading}
            onCepBlur={handleCepBlur}
            onSubmit={handleSubmit}
            onCancel={close}
            pending={pending}
            submitLabel="Salvar"
          />
        ) : (
          <div key={addr.id} className="border border-border p-4">
            <div className="flex items-start justify-between gap-2 mb-2">
              <p className="text-xs font-bold uppercase tracking-wider">
                {addr.label}
                {addr.isDefault && (
                  <span className="text-primary ml-2 inline-flex items-center gap-1">
                    <Star className="w-3 h-3 fill-primary" /> Padrão
                  </span>
                )}
              </p>
              <div className="flex gap-2">
                {!addr.isDefault && (
                  <button
                    onClick={() => handleSetDefault(addr.id)}
                    disabled={pending}
                    className="text-[10px] uppercase tracking-widest text-muted-foreground hover:text-primary transition-colors flex items-center gap-1"
                  >
                    <Star className="w-3 h-3" /> Padrão
                  </button>
                )}
                <button
                  onClick={() => openEdit(addr)}
                  disabled={pending}
                  className="text-muted-foreground hover:text-primary transition-colors"
                  aria-label="Editar"
                >
                  <Pencil className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => handleDelete(addr.id)}
                  disabled={pending}
                  className="text-muted-foreground hover:text-destructive transition-colors"
                  aria-label="Remover"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
            <p className="text-xs text-muted-foreground normal-case leading-relaxed">
              {addr.recipientName} · CPF {addr.recipientCpf}
              <br />
              {addr.street}, {addr.number}
              {addr.complement && ` — ${addr.complement}`}
              <br />
              {addr.neighborhood} — {addr.city}/{addr.state} · CEP {maskCep(addr.zipCode)}
            </p>
          </div>
        )
      )}

      {editing === 'new' && (
        <AddressForm
          form={form}
          errors={errors}
          update={update}
          cepLoading={cepLoading}
          onCepBlur={handleCepBlur}
          onSubmit={handleSubmit}
          onCancel={close}
          pending={pending}
          submitLabel="Adicionar"
        />
      )}

      {editing === null && (
        <button
          onClick={openCreate}
          className="flex items-center justify-center gap-2 py-4 border border-dashed border-border text-xs uppercase tracking-widest text-muted-foreground hover:border-primary hover:text-primary transition-colors"
        >
          <Plus className="w-4 h-4" /> Adicionar novo endereço
        </button>
      )}
    </div>
  )
}

function AddressForm({
  form, errors, update, cepLoading, onCepBlur, onSubmit, onCancel, pending, submitLabel,
}: {
  form: AddressDTO
  errors: Record<string, string[]>
  update: <K extends keyof AddressDTO>(key: K, value: AddressDTO[K]) => void
  cepLoading: boolean
  onCepBlur: () => void
  onSubmit: (e: React.FormEvent) => void
  onCancel: () => void
  pending: boolean
  submitLabel: string
}) {
  return (
    <form onSubmit={onSubmit} className="border border-primary p-5 flex flex-col gap-3 bg-[#0a0a0a]">
      <div className="grid grid-cols-2 gap-3">
        <Field label="Identificação" value={form.label} onChange={(v) => update('label', v)} placeholder="Casa, Trabalho…" error={errors.label} />
        <Field label="Destinatário" value={form.recipientName} onChange={(v) => update('recipientName', v)} error={errors.recipientName} required />
        <Field label="CPF" value={form.recipientCpf} onChange={(v) => update('recipientCpf', maskCpf(v))} placeholder="000.000.000-00" maxLength={14} error={errors.recipientCpf} required />
        <Field label="Telefone" value={form.recipientPhone} onChange={(v) => update('recipientPhone', maskPhone(v))} placeholder="(11) 90000-0000" maxLength={15} error={errors.recipientPhone} required />
      </div>

      <Field
        label="CEP"
        value={form.zipCode}
        onChange={(v) => update('zipCode', maskCep(v))}
        onBlur={onCepBlur}
        placeholder="00000-000"
        maxLength={9}
        error={errors.zipCode}
        rightIcon={cepLoading ? <Loader2 className="w-3 h-3 animate-spin text-primary" /> : null}
        required
      />
      <Field label="Rua" value={form.street} onChange={(v) => update('street', v)} error={errors.street} required />
      <div className="grid grid-cols-2 gap-3">
        <Field label="Número" value={form.number} onChange={(v) => update('number', v)} error={errors.number} required />
        <Field label="Complemento" value={form.complement} onChange={(v) => update('complement', v)} placeholder="opcional" />
      </div>
      <Field label="Bairro" value={form.neighborhood} onChange={(v) => update('neighborhood', v)} error={errors.neighborhood} required />
      <div className="grid grid-cols-3 gap-3">
        <div className="col-span-2">
          <Field label="Cidade" value={form.city} onChange={(v) => update('city', v)} error={errors.city} required />
        </div>
        <Field label="UF" value={form.state} onChange={(v) => update('state', v.toUpperCase().slice(0, 2))} maxLength={2} placeholder="SP" error={errors.state} required />
      </div>

      <label className="flex items-center gap-2 text-xs uppercase tracking-widest cursor-pointer">
        <input
          type="checkbox"
          checked={form.isDefault}
          onChange={(e) => update('isDefault', e.target.checked)}
          className="accent-primary"
        />
        <Star className="w-3 h-3" /> Tornar endereço padrão
      </label>

      <div className="flex gap-2 mt-2">
        <button
          type="button"
          onClick={onCancel}
          disabled={pending}
          className="flex-1 py-3 border border-border text-xs uppercase tracking-widest hover:border-primary hover:text-primary transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
        >
          <X className="w-3.5 h-3.5" /> Cancelar
        </button>
        <button
          type="submit"
          disabled={pending}
          className="flex-1 py-3 bg-primary text-primary-foreground font-bold text-xs uppercase tracking-widest hover:bg-foreground hover:text-background transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
        >
          {pending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
          {submitLabel}
        </button>
      </div>
    </form>
  )
}

function Field({
  label, value, onChange, onBlur, placeholder, maxLength, error, required, rightIcon,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  onBlur?: () => void
  placeholder?: string
  maxLength?: number
  error?: string[]
  required?: boolean
  rightIcon?: React.ReactNode
}) {
  const filled = value.trim().length > 0
  const hasError = !!error?.[0]
  return (
    <div className="flex flex-col gap-1">
      <label className="text-[10px] uppercase tracking-widest text-muted-foreground">{label}</label>
      <div className="relative">
        <input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onBlur={onBlur}
          placeholder={placeholder}
          maxLength={maxLength}
          required={required}
          aria-invalid={hasError || undefined}
          className={`bg-secondary border w-full px-3 py-2 text-sm normal-case tracking-normal focus:outline-none transition-colors ${
            hasError
              ? 'border-destructive focus:border-destructive'
              : filled
                ? 'border-primary/40 focus:border-primary'
                : 'border-border focus:border-primary'
          }`}
        />
        {rightIcon && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">{rightIcon}</div>
        )}
      </div>
      {error?.map((err) => (
        <p key={err} className="text-[10px] text-destructive normal-case">{err}</p>
      ))}
    </div>
  )
}
