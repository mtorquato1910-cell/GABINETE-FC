import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Navbar } from '@/components/layout/Navbar'
import { Footer } from '@/components/layout/Footer'

const navItems = [
  { href: '/minha-conta', label: 'Dashboard' },
  { href: '/minha-conta/dados-pessoais', label: 'Meus Dados' },
  { href: '/minha-conta/pedidos', label: 'Pedidos' },
  { href: '/minha-conta/rastreio', label: 'Rastrear' },
  { href: '/minha-conta/carrinho-abandonado', label: 'Carrinho' },
  { href: '/minha-conta/enderecos', label: 'Endereços' },
  { href: '/minha-conta/lista-desejos', label: 'Desejos' },
  { href: '/minha-conta/fidelidade', label: 'Fidelidade' },
]

export default async function ContaLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()
  if (!session?.user) redirect('/auth/login')

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1">
        <div className="px-4 md:px-6 py-6 border-b border-border">
          <h1 className="text-sm font-bold uppercase tracking-widest">
            Olá, {session.user.name?.split(' ')[0] ?? 'Cliente'}
          </h1>
          <p className="text-[10px] text-muted-foreground uppercase tracking-widest">
            {session.user.email}
          </p>
        </div>
        <div className="flex flex-col md:flex-row">
          {/* Sidebar */}
          <aside className="w-full md:w-56 border-b md:border-b-0 md:border-r border-border">
            <nav className="flex md:flex-col">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="px-6 py-4 text-xs font-bold uppercase tracking-widest hover:text-primary hover:bg-secondary transition-colors border-r md:border-r-0 md:border-b border-border last:border-0"
                >
                  {item.label}
                </Link>
              ))}
            </nav>
          </aside>
          <div className="flex-1 p-6">{children}</div>
        </div>
      </main>
      <Footer />
    </div>
  )
}
