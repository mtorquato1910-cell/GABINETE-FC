'use client'
import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Search } from 'lucide-react'

interface Props {
  initialQuery?: string
}

export function SearchForm({ initialQuery = '' }: Props) {
  const router = useRouter()
  const [query, setQuery] = useState(initialQuery)
  const [isPending, startTransition] = useTransition()

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!query.trim()) return
    startTransition(() => {
      router.push(`/busca?q=${encodeURIComponent(query.trim())}`)
    })
  }

  return (
    <form onSubmit={handleSubmit} className="flex gap-0 max-w-lg">
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Buscar camisas, times..."
        className="flex-1 bg-secondary border border-border px-4 py-3 text-sm focus:outline-none focus:border-primary placeholder:text-muted-foreground uppercase tracking-wider"
        autoFocus
      />
      <button
        type="submit"
        disabled={isPending}
        className="px-6 py-3 bg-primary text-primary-foreground font-bold text-xs uppercase tracking-widest hover:bg-foreground hover:text-background transition-colors disabled:opacity-50"
      >
        <Search className="w-4 h-4" />
      </button>
    </form>
  )
}
