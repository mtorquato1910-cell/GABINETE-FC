'use client'
import { useEffect, useState } from 'react'
import { ChevronUp } from 'lucide-react'

export function BackToTop() {
  const [show, setShow] = useState(false)

  useEffect(() => {
    const handler = () => setShow(window.scrollY > 400)
    window.addEventListener('scroll', handler)
    return () => window.removeEventListener('scroll', handler)
  }, [])

  if (!show) return null

  return (
    <button
      onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
      className="fixed bottom-24 right-6 w-11 h-11 bg-primary/25 hover:bg-primary/60 border border-primary/40 text-primary-foreground backdrop-blur-sm flex items-center justify-center transition-all duration-200 z-40 shadow-lg"
      aria-label="Voltar ao topo"
    >
      <ChevronUp className="w-5 h-5" />
    </button>
  )
}
