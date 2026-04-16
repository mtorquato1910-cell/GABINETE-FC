'use client'
import { useEffect, useState } from 'react'
import { Eye } from 'lucide-react'

// Simula contador de visitantes (em produção: usar Redis/KV)
export function SocialProof({ productId }: { productId: string }) {
  const [viewers, setViewers] = useState<number | null>(null)

  useEffect(() => {
    // Simula 3-15 visitantes
    const n = Math.floor(Math.random() * 13) + 3
    setViewers(n)
  }, [productId])

  if (!viewers) return null

  return (
    <div className="flex items-center gap-2 text-[10px] text-muted-foreground uppercase tracking-widest">
      <Eye className="w-3 h-3 text-primary" />
      <span>{viewers} pessoas estão vendo agora</span>
    </div>
  )
}
