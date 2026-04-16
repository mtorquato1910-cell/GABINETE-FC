'use client'
import { useState, useTransition } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Logo } from '@/components/layout/Logo'
import { toast } from 'sonner'

export default function LoginPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const callbackUrl = searchParams.get('callbackUrl') || '/minha-conta'
  const [isPending, startTransition] = useTransition()
  const [form, setForm] = useState({ email: '', password: '' })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    startTransition(async () => {
      const result = await signIn('credentials', {
        email: form.email,
        password: form.password,
        redirect: false,
      })
      if (result?.error) {
        toast.error('Email ou senha incorretos')
      } else {
        toast.success('Bem-vindo!')
        router.push(callbackUrl)
        router.refresh()
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
          <h1 className="text-lg font-bold uppercase tracking-widest mb-6">Entrar</h1>
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1">
              <label className="text-[10px] uppercase tracking-widest text-muted-foreground">
                Email
              </label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm(f => ({ ...f, email: e.target.value }))}
                required
                placeholder="seu@email.com"
                className="bg-secondary border border-border px-4 py-3 text-sm focus:outline-none focus:border-primary placeholder:text-muted-foreground normal-case tracking-normal"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[10px] uppercase tracking-widest text-muted-foreground">
                Senha
              </label>
              <input
                type="password"
                value={form.password}
                onChange={(e) => setForm(f => ({ ...f, password: e.target.value }))}
                required
                placeholder="••••••••"
                className="bg-secondary border border-border px-4 py-3 text-sm focus:outline-none focus:border-primary placeholder:text-muted-foreground"
              />
            </div>
            <button
              type="submit"
              disabled={isPending}
              className="w-full py-4 bg-primary text-primary-foreground font-bold text-xs uppercase tracking-widest hover:bg-foreground hover:text-background transition-colors disabled:opacity-50 mt-2"
            >
              {isPending ? 'Entrando...' : 'Entrar'}
            </button>
          </form>
          <p className="text-center text-xs text-muted-foreground mt-6 uppercase tracking-widest">
            Não tem conta?{' '}
            <Link href="/auth/register" className="text-primary hover:underline">
              Cadastrar
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
