'use client'
import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Logo } from '@/components/layout/Logo'
import { toast } from 'sonner'
import { registerUser } from '@/lib/actions/auth'

export default function RegisterPage() {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [form, setForm] = useState({ name: '', email: '', password: '', confirm: '' })
  const [errors, setErrors] = useState<Record<string, string[]>>({})

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (form.password !== form.confirm) {
      setErrors({ confirm: ['Senhas não conferem'] })
      return
    }
    startTransition(async () => {
      const result = await registerUser({ name: form.name, email: form.email, password: form.password })
      if ('error' in result && result.error) {
        setErrors(result.error as Record<string, string[]>)
        toast.error('Verifique os campos')
      } else {
        toast.success('Conta criada! Faça login.')
        router.push('/auth/login')
      }
    })
  }

  const field = (name: string) => ({
    className: `bg-secondary border ${errors[name] ? 'border-destructive' : 'border-border'} px-4 py-3 text-sm focus:outline-none focus:border-primary placeholder:text-muted-foreground normal-case tracking-normal`,
  })

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex justify-center">
          <Logo variant="text" />
        </div>
        <div className="border border-border p-8">
          <h1 className="text-lg font-bold uppercase tracking-widest mb-6">Criar Conta</h1>
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {[
              { name: 'name', label: 'Nome completo', type: 'text', placeholder: 'Seu nome' },
              { name: 'email', label: 'Email', type: 'email', placeholder: 'seu@email.com' },
              { name: 'password', label: 'Senha', type: 'password', placeholder: '••••••••' },
              { name: 'confirm', label: 'Confirmar senha', type: 'password', placeholder: '••••••••' },
            ].map(({ name, label, type, placeholder }) => (
              <div key={name} className="flex flex-col gap-1">
                <label className="text-[10px] uppercase tracking-widest text-muted-foreground">
                  {label}
                </label>
                <input
                  type={type}
                  value={form[name as keyof typeof form]}
                  onChange={(e) => { setForm(f => ({ ...f, [name]: e.target.value })); setErrors(er => ({ ...er, [name]: [] })) }}
                  required
                  placeholder={placeholder}
                  {...field(name)}
                />
                {errors[name]?.map((err) => (
                  <p key={err} className="text-[10px] text-destructive">{err}</p>
                ))}
              </div>
            ))}
            <button
              type="submit"
              disabled={isPending}
              className="w-full py-4 bg-primary text-primary-foreground font-bold text-xs uppercase tracking-widest hover:bg-foreground hover:text-background transition-colors disabled:opacity-50 mt-2"
            >
              {isPending ? 'Criando...' : 'Criar Conta'}
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
