'use client'
import { Suspense, useState, useTransition } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Logo } from '@/components/layout/Logo'
import { toast } from 'sonner'
import { loginUser } from '@/lib/actions/auth'

function inputCls(value: string, hasError: boolean) {
  const filled = value.trim().length > 0
  const border = hasError
    ? 'border-destructive focus:border-destructive'
    : filled
      ? 'border-primary/40 focus:border-primary'
      : 'border-border focus:border-primary'
  return `bg-secondary border ${border} px-4 py-3 text-sm normal-case tracking-normal focus:outline-none transition-colors`
}

function LoginForm() {
  const searchParams = useSearchParams()
  const callbackUrl = searchParams.get('callbackUrl') || '/minha-conta'
  const [isPending, startTransition] = useTransition()
  const [form, setForm] = useState({ email: '', password: '' })
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    startTransition(async () => {
      // Em caso de sucesso, loginUser faz redirect server-side (essa promise nem retorna)
      const result = await loginUser({ ...form, callbackUrl })
      if (result && 'error' in result && result.error) {
        setError(result.error)
        toast.error(result.error)
      }
    })
  }

  return (
    <div className="border border-border p-8">
      <h1 className="text-lg font-bold uppercase tracking-widest mb-6">Entrar</h1>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="flex flex-col gap-1">
          <label className="text-[10px] uppercase tracking-widest text-muted-foreground">
            Email
          </label>
          <input
            type="email"
            value={form.email}
            onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
            required
            placeholder="seu@email.com"
            className={inputCls(form.email, !!error)}
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-[10px] uppercase tracking-widest text-muted-foreground">
            Senha
          </label>
          <input
            type="password"
            value={form.password}
            onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
            required
            placeholder="••••••••"
            className={inputCls(form.password, !!error)}
          />
        </div>
        {error && <p className="text-[10px] text-destructive normal-case">{error}</p>}
        <button
          type="submit"
          disabled={isPending}
          className="w-full py-4 bg-primary text-primary-foreground font-bold text-xs uppercase tracking-widest hover:bg-foreground hover:text-background transition-colors disabled:opacity-50 mt-2"
        >
          {isPending ? 'Entrando…' : 'Entrar'}
        </button>
      </form>
      <p className="text-center text-xs text-muted-foreground mt-6 uppercase tracking-widest">
        Não tem conta?{' '}
        <Link href="/auth/register" className="text-primary hover:underline">
          Cadastrar
        </Link>
      </p>
    </div>
  )
}

export default function LoginPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex justify-center">
          <Logo variant="text" />
        </div>
        <Suspense
          fallback={
            <div className="border border-border p-8 text-center text-sm text-muted-foreground">
              Carregando...
            </div>
          }
        >
          <LoginForm />
        </Suspense>
      </div>
    </div>
  )
}
