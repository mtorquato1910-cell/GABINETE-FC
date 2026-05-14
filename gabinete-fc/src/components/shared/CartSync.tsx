'use client'
import { useEffect, useRef } from 'react'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import { useCartStore } from '@/stores/cart-store'
import { syncCart } from '@/lib/actions/cart'

/**
 * Sincroniza o carrinho local (Zustand) com o servidor (banco).
 *
 * Regras:
 *   • Só sincroniza quando usuário está logado
 *   • Espera o hidrato do servidor antes do primeiro sync (evita apagar cart remoto
 *     com items vazios do load inicial — race AuthListener × CartSync)
 *   • Debounce 1s · skip se hash não mudou
 *   • Mostra toast se quantidade foi capada pelo limite server
 */
export function CartSync() {
  const items = useCartStore((s) => s.items)
  const hydratedAt = useCartStore((s) => s.hydratedAt)
  const lastSentRef = useRef<string>('')
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const userIdRef = useRef<string | null>(null)

  // Observa sessão pra saber quando sincronizar
  useEffect(() => {
    const supabase = createClient()
    let mounted = true
    void supabase.auth.getUser().then(({ data }) => {
      if (mounted) userIdRef.current = data.user?.id ?? null
    })
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      userIdRef.current = session?.user?.id ?? null
    })
    return () => {
      mounted = false
      sub.subscription.unsubscribe()
    }
  }, [])

  // Sincroniza com servidor sempre que items mudam (debounced)
  useEffect(() => {
    if (!userIdRef.current) return

    // Espera o AuthListener completar o merge antes do primeiro sync
    // (hydratedAt > 0 = mergeCart já preencheu items)
    if (hydratedAt === 0) return

    const payload = items.map((i) => ({
      productId: i.product.id,
      size: i.size,
      quantity: i.quantity,
      hasCustomization: !!i.hasCustomization,
      customName: i.customName ?? null,
      customNumber: i.customNumber ?? null,
    }))
    const serialized = JSON.stringify(payload)
    if (serialized === lastSentRef.current) return

    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      void syncCart(payload).then((result) => {
        lastSentRef.current = serialized
        if (result.cappedItems && result.cappedItems.length > 0) {
          toast.info('Limite de 20 unidades por item', {
            description: 'Algumas quantidades foram ajustadas.',
          })
        }
      })
    }, 1000)

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [items, hydratedAt])

  return null
}
