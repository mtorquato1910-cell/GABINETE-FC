import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Logo } from '@/components/layout/Logo'
import {
  LayoutDashboard, Package, ShoppingBag, Tag,
  Settings, Star, TrendingUp, Boxes, LogOut,
  Megaphone, LayoutGrid, BarChart2, Flame,
} from 'lucide-react'

const navItems = [
  { href: '/admin/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { href: '/admin/vitrine', icon: LayoutGrid, label: 'Vitrine' },
  { href: '/admin/produtos', icon: Package, label: 'Produtos' },
  { href: '/admin/pedidos', icon: ShoppingBag, label: 'Pedidos' },
  { href: '/admin/cupons', icon: Tag, label: 'Cupons' },
  { href: '/admin/avaliacoes', icon: Star, label: 'Avaliações' },
  { href: '/admin/estoque', icon: Boxes, label: 'Estoque' },
  { href: '/admin/financeiro', icon: TrendingUp, label: 'Financeiro' },
  { href: '/admin/marketing', icon: Megaphone, label: 'Campanhas' },
  { href: '/admin/analytics', icon: BarChart2, label: 'Analytics' },
  { href: '/admin/heatmap', icon: Flame, label: 'Heatmap' },
  { href: '/admin/configuracoes', icon: Settings, label: 'Configurações' },
]

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()
  const user = session?.user as { role?: string; name?: string | null } | undefined
  if (user?.role !== 'admin') redirect('/auth/login')

  return (
    <div className="flex min-h-screen bg-background">
      {/* Sidebar */}
      <aside className="w-56 bg-sidebar border-r border-border flex flex-col shrink-0 sticky top-0 h-screen overflow-y-auto">
        <div className="px-4 py-5 border-b border-border">
          <Logo variant="text" />
          <p className="text-[10px] text-muted-foreground uppercase tracking-widest mt-1">Admin</p>
        </div>
        <nav className="flex-1 py-4">
          {navItems.map(({ href, icon: Icon, label }) => (
            <Link
              key={href}
              href={href}
              className="flex items-center gap-3 px-4 py-3 text-xs font-bold uppercase tracking-widest text-muted-foreground hover:text-primary hover:bg-accent/10 transition-colors"
            >
              <Icon className="w-4 h-4 shrink-0" />
              {label}
            </Link>
          ))}
        </nav>
        <div className="p-4 border-t border-border">
          <p className="text-[10px] text-muted-foreground uppercase tracking-widest mb-2">
            {user?.name ?? 'Admin'}
          </p>
          <Link
            href="/api/auth/signout"
            className="flex items-center gap-2 text-[10px] text-muted-foreground hover:text-destructive transition-colors uppercase tracking-widest"
          >
            <LogOut className="w-3 h-3" />
            Sair
          </Link>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 min-w-0">{children}</main>
    </div>
  )
}
