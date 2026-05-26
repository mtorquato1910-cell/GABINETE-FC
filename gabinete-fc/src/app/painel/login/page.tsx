'use client'
import { useState, useTransition } from 'react'
import { Logo } from '@/components/layout/Logo'
import { toast } from 'sonner'
import { loginAdmin } from '@/lib/actions/auth-admin'

// Painel admin nunca pré-renderiza estaticamente
export const dynamic = 'force-dynamic'

function inputCls(value: string, hasError: boolean) {
  const filled = value.trim().length > 0
  const border = hasError
    ? 'border-destructive focus:border-destructive'
    : filled
      ? 'border-primary/40 focus:border-primary'
      : 'border-border focus:border-primary'
  return `bg-secondary border ${border} px-4 py-3 text-sm normal-case tracking-normal focus:outline-none transition-colors`
}

export default function PainelLoginPage() {
  const [isPending, startTransition] = useTransition()
  const [form, setForm] = useState({ email: '', password: '' })
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    startTransition(async () => {
      const result = await loginAdmin(form)
      if (result && 'error' in result && result.error) {
        setError(result.error)
        toast.error(result.error)
      }
    })
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex justify-center">
          <Logo variant="text" />
        </div>
        <div className="border border-border p-8">
          <div className="flex items-center gap-2 mb-1">
            <span className="w-1.5 h-1.5 rounded-full bg-primary dot-pulse shrink-0" />
            <p className="text-[10px] text-primary uppercase tracking-widest font-bold">
              Admin Panel
            </p>
          </div>
          <h1 className="text-lg font-bold uppercase tracking-widest mb-6">Acesso restrito</h1>
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
                autoComplete="username"
                placeholder="admin@dominio.com"
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
                autoComplete="current-password"
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
              {isPending ? 'Autenticando…' : 'Entrar no painel'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
