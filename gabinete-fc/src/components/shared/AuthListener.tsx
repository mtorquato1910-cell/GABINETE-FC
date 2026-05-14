'use client'
import { useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useCartStore } from '@/stores/cart-store'
import { mergeCart, getServerCart } from '@/lib/actions/cart'

/**
 * Reage a eventos de autenticação Supabase:
 *   • SIGNED_IN → faz merge do cart local com o cart do banco (mantém compras anônimas)
 *   • SIGNED_OUT → limpa cart LOCAL apenas (no banco fica persistido pro próximo login)
 *   • router.refresh sempre que muda o user pra sincronizar Server Components
 */
export function AuthListener() {
  const router = useRouter()
  const lastUserId = useRef<string | null | undefined>(undefined)

  useEffect(() => {
    const supabase = createClient()

    const handleSignIn = async () => {
      const localItems = useCartStore.getState().items
      const payload = localItems.map((i) => ({
        productId: i.product.id,
        size: i.size,
        quantity: i.quantity,
        hasCustomization: !!i.hasCustomization,
        customName: i.customName ?? null,
        customNumber: i.customNumber ?? null,
      }))
      try {
        const result =
          payload.length > 0
            ? await mergeCart(payload)
            : { items: await getServerCart() }
        useCartStore.getState().setItems(result.items)
      } catch (err) {
        console.error('[AuthListener] mergeCart error:', err)
        // Em caso de falha, marca hidratado mesmo assim pra liberar CartSync
        useCartStore.getState().setItems(useCartStore.getState().items)
      }
    }

    const handleSignOut = () => {
      // Limpa LOCAL apenas — itens continuam no banco pro próximo login
      useCartStore.getState().setItems([])
    }

    const { data } = supabase.auth.onAuthStateChange((event, session) => {
      const userId = session?.user?.id ?? null

      // Primeira chamada: registra estado inicial
      if (lastUserId.current === undefined) {
        lastUserId.current = userId
        if (userId) void handleSignIn() // hidrata cart do servidor na primeira carga
        return
      }

      // User mudou (login, logout, troca de conta)
      if (lastUserId.current !== userId) {
        lastUserId.current = userId
        if (userId) void handleSignIn().then(() => router.refresh())
        else {
          handleSignOut()
          router.refresh()
        }
      } else if (event === 'SIGNED_OUT') {
        // Edge case: SIGNED_OUT sem mudança de user (já era null)
        handleSignOut()
      }
    })

    return () => data.subscription.unsubscribe()
  }, [router])

  return null
}
