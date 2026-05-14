'use client'
import { useEffect, useState } from 'react'
import { Eye } from 'lucide-react'

function randomViewers(): number {
  return Math.floor(Math.random() * 9) + 4
}

export function SocialProof({ productId }: { productId: string }) {
  const [viewers, setViewers] = useState<number | null>(null)

  useEffect(() => {
    let active = true
    // Defere o primeiro update pra fora do body do effect (evita cascading render)
    Promise.resolve().then(() => {
      if (active) setViewers(randomViewers())
    })
    const interval = setInterval(() => {
      if (active) setViewers(randomViewers())
    }, 30_000)
    return () => {
      active = false
      clearInterval(interval)
    }
  }, [productId])

  if (viewers === null) return null

  return (
    <div className="flex items-center gap-2 text-[10px] uppercase tracking-widest">
      <span className="relative flex h-2 w-2">
        <span className="absolute inline-flex h-full w-full rounded-full bg-primary opacity-60 animate-ping" />
        <span className="relative inline-flex rounded-full h-2 w-2 bg-primary" />
      </span>
      <Eye className="w-3 h-3 text-primary" />
      <span className="text-primary font-bold">{viewers}</span>
      <span className="text-muted-foreground">pessoas vendo esta camisa agora</span>
    </div>
  )
}
