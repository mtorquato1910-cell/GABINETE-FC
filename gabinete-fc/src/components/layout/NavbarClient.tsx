'use client'
import { useState } from 'react'
import Link from 'next/link'
import { Search, Menu, X } from 'lucide-react'
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
    <nav className="flex justify-between items-center px-6 md:px-8 py-4 border-b border-[#1a1a1a] sticky top-0 bg-black z-50">
      {/* Logo */}
      <Logo variant="text" />

      {/* Desktop nav — igual Lovable: DROPS CAMISAS CADASTRO */}
      <div className="hidden md:flex items-center gap-10 text-xs font-bold uppercase tracking-widest text-white">
        <Link href="/lancamentos" className="hover:text-primary transition-colors duration-150">
          Drops
        </Link>
        <Link href="/loja" className="hover:text-primary transition-colors duration-150">
          Camisas
        </Link>
        {isAdmin && (
          <Link href="/admin" className="text-primary hover:text-primary/80 transition-colors duration-150">
            Admin
          </Link>
        )}
        <Link
          href={isLoggedIn ? '/minha-conta' : '/auth/login'}
          className="hover:text-primary transition-colors duration-150"
        >
          {isLoggedIn ? (userName?.split(' ')[0] ?? 'Conta') : 'Cadastro'}
        </Link>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-6">
        <Link
          href="/busca"
          className="hidden md:flex text-white hover:text-primary transition-colors duration-150"
          aria-label="Buscar"
        >
          <Search className="w-4 h-4" />
        </Link>

        <Link
          href="/carrinho"
          className="text-xs font-bold uppercase tracking-widest text-white hover:text-primary transition-colors duration-150"
        >
          [ CART: {String(totalItems).padStart(2, '0')} ]
        </Link>

        <button
          className="flex md:hidden text-white hover:text-primary transition-colors"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label="Menu"
        >
          {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="absolute top-full left-0 right-0 bg-black border-b border-[#1a1a1a] flex flex-col text-xs font-bold uppercase tracking-widest md:hidden z-50">
          {[
            { href: '/lancamentos', label: 'Drops' },
            { href: '/loja', label: 'Camisas' },
            { href: '/busca', label: 'Buscar' },
            { href: isLoggedIn ? '/minha-conta' : '/auth/login', label: isLoggedIn ? 'Minha Conta' : 'Cadastro' },
            ...(isAdmin ? [{ href: '/admin', label: 'Admin' }] : []),
          ].map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              onClick={() => setMobileOpen(false)}
              className="px-6 py-4 border-b border-[#1a1a1a] last:border-0 text-white hover:text-primary transition-colors"
            >
              {label}
            </Link>
          ))}
        </div>
      )}
    </nav>
  )
}
