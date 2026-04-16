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
      className="fixed bottom-6 left-6 w-10 h-10 bg-secondary border border-border flex items-center justify-center hover:border-primary hover:text-primary transition-colors z-40"
      aria-label="Voltar ao topo"
    >
      <ChevronUp className="w-4 h-4" />
    </button>
  )
}
