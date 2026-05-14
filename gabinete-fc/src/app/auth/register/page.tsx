'use client'
import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Logo } from '@/components/layout/Logo'
import { toast } from 'sonner'
import { registerUser } from '@/lib/actions/auth'

function inputCls(value: string, hasError: boolean) {
  const filled = value.trim().length > 0
  const border = hasError
    ? 'border-destructive focus:border-destructive'
    : filled
      ? 'border-primary/40 focus:border-primary'
      : 'border-border focus:border-primary'
  return `bg-secondary border ${border} px-4 py-3 text-sm normal-case tracking-normal focus:outline-none transition-colors placeholder:text-muted-foreground`
}

export default function RegisterPage() {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [form, setForm] = useState({ name: '', email: '', password: '', confirm: '' })
  const [errors, setErrors] = useState<Record<string, string[]>>({})

  const update = (key: keyof typeof form, value: string) => {
    setForm((f) => ({ ...f, [key]: value }))
    // Remove a entrada do erro completamente (não deixa array vazio "truthy")
    setErrors((er) => {
      if (!er[key]) return er
      const { [key]: _omit, ...rest } = er
      return rest
    })
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (form.password !== form.confirm) {
      setErrors({ confirm: ['Senhas não conferem'] })
      toast.error('Senhas não conferem')
      return
    }
    startTransition(async () => {
      const result = await registerUser({
        name: form.name,
        email: form.email,
        password: form.password,
      })
      if ('error' in result && result.error) {
        setErrors(result.error as Record<string, string[]>)
        const firstField = Object.keys(result.error)[0]
        const firstMsg = (result.error as Record<string, string[]>)[firstField]?.[0]
        toast.error(firstMsg ?? 'Verifique os campos')
        return
      }
      toast.success('Conta criada! Verifique seu email para ativar.')
      router.push('/auth/login?verifique=1')
    })
  }

  const fields: Array<{ name: keyof typeof form; label: string; type: string; placeholder: string }> = [
    { name: 'name', label: 'Nome completo', type: 'text', placeholder: 'Seu nome' },
    { name: 'email', label: 'Email', type: 'email', placeholder: 'seu@email.com' },
    { name: 'password', label: 'Senha', type: 'password', placeholder: '••••••••' },
    { name: 'confirm', label: 'Confirmar senha', type: 'password', placeholder: '••••••••' },
  ]

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex justify-center">
          <Logo variant="text" />
        </div>
        <div className="border border-border p-8">
          <h1 className="text-lg font-bold uppercase tracking-widest mb-6">Criar Conta</h1>
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {fields.map(({ name, label, type, placeholder }) => {
              const value = form[name]
              const fieldErrors = errors[name] ?? []
              const hasError = fieldErrors.length > 0
              return (
                <div key={name} className="flex flex-col gap-1">
                  <label className="text-[10px] uppercase tracking-widest text-muted-foreground">
                    {label}
                  </label>
                  <input
                    type={type}
                    value={value}
                    onChange={(e) => update(name, e.target.value)}
                    required
                    placeholder={placeholder}
                    aria-invalid={hasError || undefined}
                    className={inputCls(value, hasError)}
                  />
                  {fieldErrors.map((err) => (
                    <p key={err} className="text-[10px] text-destructive normal-case">
                      {err}
                    </p>
                  ))}
                </div>
              )
            })}
            <button
              type="submit"
              disabled={isPending}
              className="w-full py-4 bg-primary text-primary-foreground font-bold text-xs uppercase tracking-widest hover:bg-foreground hover:text-background transition-colors disabled:opacity-50 mt-2"
            >
              {isPending ? 'Criando…' : 'Criar Conta'}
            </button>
          </form>
          <p className="text-center text-xs text-muted-foreground mt-6 uppercase tracking-widest">
            Já tem conta?{' '}
            <Link href="/auth/login" className="text-primary hover:underline">
              Entrar
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
