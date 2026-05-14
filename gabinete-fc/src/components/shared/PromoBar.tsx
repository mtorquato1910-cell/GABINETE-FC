'use client'
import { useSyncExternalStore } from 'react'
import { toast } from 'sonner'
import { X } from 'lucide-react'

const STORAGE_KEY = 'gfc-promobar-copa5-dismissed'

// External store: localStorage com subscription via storage event + listeners locais
const listeners = new Set<() => void>()

function emit() {
  for (const l of listeners) l()
}

function subscribe(callback: () => void) {
  listeners.add(callback)
  const handler = () => callback()
  window.addEventListener('storage', handler)
  return () => {
    listeners.delete(callback)
    window.removeEventListener('storage', handler)
  }
}

function getSnapshot(): boolean {
  return localStorage.getItem(STORAGE_KEY) === '1'
}

function getServerSnapshot(): boolean {
  return true // SSR esconde até hidratar
}

export function PromoBar() {
  const dismissed = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)
  if (dismissed) return null

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText('COPA5')
      toast.success('Cupom COPA5 copiado!', {
        description: 'Aplique no checkout pra 5% off na primeira compra.',
      })
    } catch {
      toast.info('Use o cupom COPA5 no checkout')
    }
  }

  const handleDismiss = () => {
    localStorage.setItem(STORAGE_KEY, '1')
    emit()
  }

  return (
    <div className="bg-primary text-primary-foreground relative">
      <div className="flex items-center justify-center gap-3 px-6 py-2 text-[10px] md:text-xs font-bold uppercase tracking-[0.2em]">
        <span className="hidden md:inline">⚡ Primeira compra?</span>
        <button
          onClick={handleCopy}
          className="border border-black/40 px-2 py-0.5 hover:bg-black hover:text-primary transition-colors"
          aria-label="Copiar cupom COPA5"
        >
          Cupom COPA5
        </button>
        <span>→ 5% off · não combinável com 3+ peças</span>
      </div>
      <button
        onClick={handleDismiss}
        className="absolute right-2 top-1/2 -translate-y-1/2 p-1 hover:opacity-60 transition-opacity"
        aria-label="Fechar promoção"
      >
        <X className="w-3 h-3" />
      </button>
    </div>
  )
}
