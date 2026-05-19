'use client'
import { toast } from 'sonner'

export function PromoBar() {
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

  return (
    <div className="bg-primary text-primary-foreground sticky top-0 z-[60] h-9">
      <div className="flex items-center justify-center gap-3 px-6 h-full text-[10px] md:text-xs font-bold uppercase tracking-[0.2em]">
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
    </div>
  )
}
