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

    /**
     * Login REAL (anônimo → logado, ou troca de conta).
     * Faz merge do cart local (anônimo) com o cart do banco.
     * Cuidado: usar SÓ quando user mudou. Em page reload já logado, usar
     * loadFromServer() pra evitar duplicação por soma local+server.
     */
    const handleNewLogin = async () => {
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
        useCartStore.getState().setItems(useCartStore.getState().items)
      }
    }

    /**
     * Page reload com user já logado, OU INITIAL_SESSION do Supabase.
     * SOBRESCREVE o cart local pelo cart do servidor — sem merge.
     * Isso evita duplicação quando user vai pro checkout hosted e volta
     * sem pagar (carrinho local mantém items, server também tem, sem fix
     * o merge faria soma).
     */
    const loadFromServer = async () => {
      try {
        const items = await getServerCart()
        useCartStore.getState().setItems(items)
      } catch (err) {
        console.error('[AuthListener] getServerCart error:', err)
        useCartStore.getState().setItems(useCartStore.getState().items)
      }
    }

    const handleSignOut = () => {
      // Limpa LOCAL apenas — itens continuam no banco pro próximo login
      useCartStore.getState().setItems([])
    }

    const { data } = supabase.auth.onAuthStateChange((event, session) => {
      const userId = session?.user?.id ?? null

      // Primeira chamada (INITIAL_SESSION): página carregou.
      // Se já está logado, NÃO faz merge — só carrega do servidor pra
      // substituir o local. Evita o bug de duplicação quando volta do
      // checkout Infinity Pay sem ter pago.
      if (lastUserId.current === undefined) {
        lastUserId.current = userId
        if (userId) void loadFromServer()
        return
      }

      // User mudou (login, logout, troca de conta)
      if (lastUserId.current !== userId) {
        lastUserId.current = userId
        if (userId) {
          // Login REAL — merge faz sentido aqui (anônimo virou logado)
          void handleNewLogin().then(() => router.refresh())
        } else {
          handleSignOut()
          router.refresh()
        }
      } else if (event === 'SIGNED_OUT') {
        handleSignOut()
      }
    })

    return () => data.subscription.unsubscribe()
  }, [router])

  return null
}
