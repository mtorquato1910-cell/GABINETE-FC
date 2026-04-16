'use client'

import { useState } from 'react'
import { toast } from 'sonner'

export function NewsletterSection() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email) return
    setLoading(true)
    try {
      await fetch('/api/newsletter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
      toast.success('Cadastrado!', { description: 'Você receberá novidades em breve.' })
      setEmail('')
    } catch {
      toast.error('Erro ao cadastrar. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <section className="p-6 lg:p-24 flex flex-col items-center justify-center text-center bg-secondary border-t border-border">
      <h2 className="text-4xl lg:text-7xl font-bold tracking-tighter mb-4 uppercase">
        Fique por dentro.
      </h2>
      <p className="text-muted-foreground text-sm max-w-[40ch] mb-8 lowercase tracking-normal">
        receba antes de todo mundo. drops exclusivos, promoções e lançamentos direto no seu e-mail.
      </p>
      <form onSubmit={handleSubmit} className="w-full max-w-xl flex flex-col sm:flex-row gap-0">
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="SEU@EMAIL.COM"
          className="flex-1 bg-background border border-border text-foreground p-4 placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors font-bold text-xs uppercase tracking-wider"
          required
        />
        <button
          type="submit"
          disabled={loading}
          className="shrink-0 bg-primary text-primary-foreground px-8 py-4 font-bold text-xs uppercase tracking-widest hover:bg-foreground hover:text-background transition-colors disabled:opacity-50"
        >
          {loading ? '...' : 'Cadastrar'}
        </button>
      </form>
    </section>
  )
}
