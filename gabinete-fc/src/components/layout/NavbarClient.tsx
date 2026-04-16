'use client'
import { useState } from 'react'
import Link from 'next/link'
import { Search, Menu, X, ShoppingCart, User, Shield } from 'lucide-react'
import { Logo } from './Logo'
import { useCartStore } from '@/stores/cart-store'

interface Props {
  isLoggedIn?: boolean
  isAdmin?: boolean
  userName?: string
}

export function NavbarClient({ isLoggedIn = false, isAdmin = false, userName }: Props) {
  const [mobileOpen, setMobileOpen] = useState(false)
  const totalItems = useCartStore((s) => s.totalItems())

  return (
    <nav className="flex justify-between items-center px-4 md:px-6 py-4 border-b border-border sticky top-0 bg-background/95 backdrop-blur-sm z-50">
      <Logo variant="text" />

      {/* Desktop nav */}
      <div className="hidden md:flex gap-8 text-xs font-bold uppercase tracking-widest">
        <Link href="/loja" className="hover:text-primary transition-colors">Camisas</Link>
        <Link href="/loja?categoria=selecoes" className="hover:text-primary transition-colors">Seleções</Link>
        <Link href="/loja?categoria=clubes-europeus" className="hover:text-primary transition-colors">Clubes</Link>
        <Link href="/loja/retro" className="hover:text-primary transition-colors">Retrô</Link>
        <Link href="/lancamentos" className="hover:text-primary transition-colors text-primary">New</Link>
      </div>

      {/* Actions */}
      <div className="flex gap-4 md:gap-6 items-center text-xs font-bold uppercase tracking-widest">
        <Link href="/busca" className="hover:text-primary transition-colors hidden md:block">
          <Search className="w-4 h-4" />
        </Link>
        {isAdmin && (
          <Link href="/admin" className="hover:text-primary transition-colors hidden md:flex items-center gap-1 text-primary">
            <Shield className="w-4 h-4" />
          </Link>
        )}
        <Link href="/minha-conta" className="hover:text-primary transition-colors hidden md:flex items-center gap-1">
          <User className="w-4 h-4" />
          {isLoggedIn && userName && (
            <span className="text-[10px] text-primary">{userName.split(' ')[0]}</span>
          )}
        </Link>
        <Link href="/carrinho" className="hover:text-primary transition-colors flex items-center gap-1">
          <ShoppingCart className="w-4 h-4" />
          <span>[ {String(totalItems).padStart(2, '0')} ]</span>
        </Link>
        <button className="md:hidden hover:text-primary transition-colors" onClick={() => setMobileOpen(!mobileOpen)} aria-label="Menu">
          {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="absolute top-full left-0 right-0 bg-background border-b border-border p-6 flex flex-col gap-4 text-xs font-bold uppercase tracking-widest md:hidden z-50">
          {[
            { href: '/loja', label: 'Camisas' },
            { href: '/loja/selecoes', label: 'Seleções' },
            { href: '/loja/clubes-europeus', label: 'Clubes' },
            { href: '/loja/retro', label: 'Retrô' },
            { href: '/lancamentos', label: 'Lançamentos' },
            { href: '/busca', label: 'Buscar' },
            { href: '/minha-conta', label: isLoggedIn ? 'Minha Conta' : 'Login' },
            ...(isAdmin ? [{ href: '/admin', label: 'Admin ⚡' }] : []),
          ].map(({ href, label }) => (
            <Link key={href} href={href} onClick={() => setMobileOpen(false)}
              className="hover:text-primary transition-colors py-2 border-b border-border last:border-0">
              {label}
            </Link>
          ))}
        </div>
      )}
    </nav>
  )
}
