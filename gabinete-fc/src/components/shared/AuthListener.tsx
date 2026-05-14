'use client'
import { useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useCartStore } from '@/stores/cart-store'

/**
 * Observa eventos de autenticação Supabase e reage:
 * - Em SIGNED_IN ou SIGNED_OUT: limpa o carrinho local (Zustand)
 *   pra evitar que um usuário veja itens de outro no mesmo navegador.
 * - Faz router.refresh pra sincronizar Server Components com a sessão nova.
 *
 * Montado no app/layout.tsx (efeito global).
 */
export function AuthListener() {
  const router = useRouter()
  const lastUserId = useRef<string | null | undefined>(undefined)

  useEffect(() => {
    const supabase = createClient()

    const handleEvent = (event: string, userId: string | null) => {
      // userId pode ser null (deslogado). Comparamos com o último visto.
      if (lastUserId.current === undefined) {
        lastUserId.current = userId
        return
      }
      if (lastUserId.current !== userId) {
        useCartStore.getState().clearCart()
        lastUserId.current = userId
        router.refresh()
      } else if (event === 'SIGNED_OUT') {
        useCartStore.getState().clearCart()
        lastUserId.current = null
        router.refresh()
      }
    }

    const { data } = supabase.auth.onAuthStateChange((event, session) => {
      handleEvent(event, session?.user?.id ?? null)
    })

    return () => {
      data.subscription.unsubscribe()
    }
  }, [router])

  return null
}
