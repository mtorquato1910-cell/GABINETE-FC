'use client'
import { useTransition } from 'react'
import { toast } from 'sonner'
import { deleteProduct } from '@/lib/actions/admin'

export function DeleteProductButton({ productId }: { productId: string }) {
  const [isPending, start] = useTransition()

  const handleDelete = () => {
    if (!confirm('Desativar este produto?')) return
    start(async () => {
      const result = await deleteProduct(productId)
      if ('success' in result) toast.success('Produto desativado')
      else toast.error('Erro ao desativar')
    })
  }

  return (
    <button
      onClick={handleDelete}
      disabled={isPending}
      className="text-muted-foreground hover:text-destructive transition-colors uppercase text-[10px] tracking-widest disabled:opacity-50"
    >
      {isPending ? '...' : 'Desativar'}
    </button>
  )
}
