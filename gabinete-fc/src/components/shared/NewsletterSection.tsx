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
    <section className="px-4 md:px-8 py-16 md:py-24 flex flex-col items-start md:items-center justify-center md:text-center bg-[#080808] border-t border-[#1a1a1a]">
      <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-primary mb-4">Newsletter</p>
      <h2
        className="text-[clamp(3rem,8vw,7rem)] font-black leading-[0.9] tracking-tight uppercase mb-6 text-white"
        style={{ fontFamily: "'Barlow Condensed', 'Space Grotesk', sans-serif", fontWeight: 900 }}
      >
        Fique por<br className="md:hidden" /> dentro.
      </h2>
      <p className="text-muted-foreground text-sm max-w-[40ch] mb-10 lowercase leading-relaxed">
        receba antes de todo mundo. drops exclusivos, promoções e lançamentos direto no seu e-mail.
      </p>
      <form onSubmit={handleSubmit} className="w-full max-w-xl flex flex-col sm:flex-row gap-0">
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="SEU@EMAIL.COM"
          className="flex-1 bg-[#0d0d0d] border border-[#2a2a2a] text-foreground p-4 placeholder:text-muted-foreground/40 focus:outline-none focus:border-primary transition-colors font-bold text-xs uppercase tracking-wider"
          required
        />
        <button
          type="submit"
          disabled={loading}
          className="shrink-0 bg-primary text-primary-foreground px-8 py-4 font-black text-xs uppercase tracking-widest hover:bg-foreground hover:text-background transition-all duration-200 disabled:opacity-50"
        >
          {loading ? '...' : 'Entrar'}
        </button>
      </form>
    </section>
  )
}
