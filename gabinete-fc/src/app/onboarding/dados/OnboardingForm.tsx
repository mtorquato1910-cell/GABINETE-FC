'use client'
import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { completeOnboarding } from '@/lib/actions/profile'
import { lookupCep } from '@/lib/cep'
import { Loader2, CheckCircle2 } from 'lucide-react'

interface Props {
  nextPath: string
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
  v.replace(/\D/g, '').slice(0, 8)
    .replace(/(\d{5})(\d)/, '$1-$2')

export function OnboardingForm({ nextPath }: Props) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [cepLoading, setCepLoading] = useState(false)
  const [form, setForm] = useState({
    phone: '', cpf: '',
    zipCode: '', street: '', number: '', complement: '',
    neighborhood: '', city: '', state: '',
  })
  const [errors, setErrors] = useState<Record<string, string[]>>({})

  const update = (key: keyof typeof form, value: string) => {
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
      toast.warning('CEP não encontrado — preencha manualmente')
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    startTransition(async () => {
      const result = await completeOnboarding({
        ...form,
        zipCode: form.zipCode.replace(/\D/g, ''),
        cpf: form.cpf.replace(/\D/g, ''),
        phone: form.phone.replace(/\D/g, ''),
      })
      if ('error' in result && result.error) {
        const fieldErrors = result.error as Record<string, string[]>
        setErrors(fieldErrors)
        const firstField = Object.keys(fieldErrors)[0]
        const firstMsg = fieldErrors[firstField]?.[0]
        toast.error(firstMsg ?? 'Verifique os campos destacados')
        return
      }
      toast.success('Cadastro completo!')
      router.push(nextPath)
      router.refresh()
    })
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <Field
        label="CPF"
        value={form.cpf}
        onChange={(v) => update('cpf', maskCpf(v))}
        placeholder="000.000.000-00"
        maxLength={14}
        error={errors.cpf}
        required
      />
      <Field
        label="Telefone (com DDD)"
        value={form.phone}
        onChange={(v) => update('phone', maskPhone(v))}
        placeholder="(11) 90000-0000"
        maxLength={15}
        error={errors.phone}
        required
      />

      <div className="border-t border-border pt-4 mt-2">
        <p className="text-[10px] uppercase tracking-widest text-muted-foreground mb-3">
          Endereço de entrega
        </p>
      </div>

      <Field
        label="CEP"
        value={form.zipCode}
        onChange={(v) => update('zipCode', maskCep(v))}
        onBlur={handleCepBlur}
        placeholder="00000-000"
        maxLength={9}
        error={errors.zipCode}
        rightIcon={cepLoading ? <Loader2 className="w-3 h-3 animate-spin text-primary" /> : null}
        required
      />

      <Field
        label="Rua"
        value={form.street}
        onChange={(v) => update('street', v)}
        error={errors.street}
        required
      />

      <div className="grid grid-cols-2 gap-3">
        <Field
          label="Número"
          value={form.number}
          onChange={(v) => update('number', v)}
          error={errors.number}
          required
        />
        <Field
          label="Complemento"
          value={form.complement}
          onChange={(v) => update('complement', v)}
          placeholder="Apto, bloco — opcional"
        />
      </div>

      <Field
        label="Bairro"
        value={form.neighborhood}
        onChange={(v) => update('neighborhood', v)}
        error={errors.neighborhood}
        required
      />

      <div className="grid grid-cols-3 gap-3">
        <div className="col-span-2">
          <Field
            label="Cidade"
            value={form.city}
            onChange={(v) => update('city', v)}
            error={errors.city}
            required
          />
        </div>
        <Field
          label="UF"
          value={form.state}
          onChange={(v) => update('state', v.toUpperCase().slice(0, 2))}
          placeholder="SP"
          maxLength={2}
          error={errors.state}
          required
        />
      </div>

      <button
        type="submit"
        disabled={pending}
        className="mt-2 py-4 bg-primary text-primary-foreground font-bold text-xs uppercase tracking-widest hover:bg-foreground hover:text-background transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
      >
        {pending ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
        {pending ? 'Salvando…' : 'Concluir cadastro'}
      </button>
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
      <label className="text-[10px] uppercase tracking-widest text-muted-foreground">
        {label}
      </label>
      <div className="relative">
        <input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onBlur={onBlur}
          placeholder={placeholder}
          maxLength={maxLength}
          required={required}
          aria-invalid={hasError || undefined}
          className={`bg-secondary border w-full px-3 py-2.5 text-sm normal-case tracking-normal focus:outline-none transition-colors ${
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
        <p key={err} className="text-[10px] text-destructive normal-case">
          {err}
        </p>
      ))}
    </div>
  )
}
