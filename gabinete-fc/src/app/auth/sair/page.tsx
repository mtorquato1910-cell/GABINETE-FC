'use client'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useCartStore } from '@/stores/cart-store'
import { Logo } from '@/components/layout/Logo'

/**
 * Sair da conta — feito client-side pra garantir que:
 *   1) Cookie do Supabase é limpo no MESMO browser
 *   2) Cart local (Zustand/localStorage) é esvaziado
 *   3) router.refresh força Server Components a reler a sessão (null)
 *   4) Redirect pra home
 */
export default function SairPage() {
  const router = useRouter()

  useEffect(() => {
    let mounted = true
    const run = async () => {
      const supabase = createClient()
      try {
        await supabase.auth.signOut()
      } catch (err) {
        console.error('[sair] signOut error:', err)
      }
      if (!mounted) return
      useCartStore.getState().clearCart()
      router.refresh()
      router.replace('/')
    }
    void run()
    return () => {
      mounted = false
    }
  }, [router])

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background px-4">
      <div className="text-center">
        <div className="mb-6 flex justify-center">
          <Logo variant="text" />
        </div>
        <div className="flex items-center justify-center gap-3 text-xs uppercase tracking-widest text-muted-foreground">
          <Loader2 className="w-4 h-4 animate-spin text-primary" />
          Saindo da conta…
        </div>
      </div>
    </div>
  )
}
