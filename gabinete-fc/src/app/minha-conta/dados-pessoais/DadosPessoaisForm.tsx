'use client'
import { useState, useTransition } from 'react'
import { toast } from 'sonner'
import { Loader2, Save, Lock } from 'lucide-react'
import { updateProfile } from '@/lib/actions/profile'

interface Initial {
  name: string
  email: string
  phone: string
  cpf: string
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

export function DadosPessoaisForm({ initial }: { initial: Initial }) {
  const [pending, startTransition] = useTransition()
  const [form, setForm] = useState({
    name: initial.name,
    phone: maskPhone(initial.phone),
    cpf: maskCpf(initial.cpf),
  })
  const [errors, setErrors] = useState<Record<string, string[]>>({})

  const update = (key: keyof typeof form, value: string) => {
    setForm((f) => ({ ...f, [key]: value }))
    setErrors((e) => ({ ...e, [key]: [] }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    startTransition(async () => {
      const result = await updateProfile({
        name: form.name,
        cpf: form.cpf.replace(/\D/g, ''),
        phone: form.phone.replace(/\D/g, ''),
      })
      if ('error' in result && result.error) {
        const fieldErrors = result.error as Record<string, string[]>
        setErrors(fieldErrors)
        toast.error('Verifique os campos destacados')
        return
      }
      toast.success('Dados atualizados!')
    })
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4 max-w-lg">
      <Field
        label="Nome completo"
        value={form.name}
        onChange={(v) => update('name', v)}
        error={errors.name}
        required
      />

      <div className="flex flex-col gap-1">
        <label className="text-[10px] uppercase tracking-widest text-muted-foreground flex items-center gap-1.5">
          <Lock className="w-3 h-3" /> Email · não editável
        </label>
        <input
          value={initial.email}
          readOnly
          disabled
          className="bg-secondary/50 border border-border px-3 py-2.5 text-sm text-muted-foreground cursor-not-allowed normal-case tracking-normal"
        />
      </div>

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

      <button
        type="submit"
        disabled={pending}
        className="mt-2 py-4 bg-primary text-primary-foreground font-bold text-xs uppercase tracking-widest hover:bg-foreground hover:text-background transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
      >
        {pending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
        {pending ? 'Salvando…' : 'Salvar alterações'}
      </button>
    </form>
  )
}

function Field({
  label, value, onChange, placeholder, maxLength, error, required,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  placeholder?: string
  maxLength?: number
  error?: string[]
  required?: boolean
}) {
  const filled = value.trim().length > 0
  const hasError = !!error?.[0]
  return (
    <div className="flex flex-col gap-1">
      <label className="text-[10px] uppercase tracking-widest text-muted-foreground">
        {label}
      </label>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
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
      {error?.map((err) => (
        <p key={err} className="text-[10px] text-destructive normal-case">
          {err}
        </p>
      ))}
    </div>
  )
}
