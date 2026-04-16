'use client'
import { useTransition } from 'react'
import { toast } from 'sonner'
import { toggleFeatured } from '@/lib/actions/admin'

interface Props {
  productId: string
  isFeatured: boolean
  productName: string
}

export function FeaturedToggle({ productId, isFeatured, productName }: Props) {
  const [isPending, start] = useTransition()

  const handleToggle = () => {
    start(async () => {
      const result = await toggleFeatured(productId, !isFeatured)
      if ('success' in result) {
        toast.success(
          !isFeatured
            ? `"${productName}" adicionado à vitrine`
            : `"${productName}" removido da vitrine`
        )
      } else {
        toast.error('Erro ao atualizar')
      }
    })
  }

  return (
    <button
      onClick={handleToggle}
      disabled={isPending}
      className={`text-[10px] font-bold uppercase tracking-widest px-3 py-1.5 transition-colors disabled:opacity-50 ${
        isFeatured
          ? 'bg-primary text-primary-foreground hover:bg-foreground hover:text-background'
          : 'border border-border text-muted-foreground hover:border-primary hover:text-primary'
      }`}
    >
      {isPending ? '...' : isFeatured ? '★ Destaque' : '☆ Adicionar'}
    </button>
  )
}
