'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Search, Menu, X, ShoppingCart, User } from 'lucide-react'
import { Logo } from './Logo'
import { useCartStore } from '@/stores/cart-store'

export function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const totalItems = useCartStore((s) => s.totalItems())

  return (
    <nav className="flex justify-between items-center px-4 md:px-6 py-4 border-b border-border sticky top-0 bg-background/95 backdrop-blur-sm z-50">
      <Logo variant="text" />

      {/* Desktop nav */}
      <div className="hidden md:flex gap-8 text-xs font-bold uppercase tracking-widest">
        <Link href="/loja" className="hover:text-primary transition-colors">
          Camisas
        </Link>
        <Link href="/loja?categoria=selecoes" className="hover:text-primary transition-colors">
          Seleções
        </Link>
        <Link href="/loja?categoria=clubes" className="hover:text-primary transition-colors">
          Clubes
        </Link>
        <Link href="/loja?categoria=retro" className="hover:text-primary transition-colors">
          Retrô
        </Link>
      </div>

      {/* Actions */}
      <div className="flex gap-4 md:gap-6 items-center text-xs font-bold uppercase tracking-widest">
        <Link href="/busca" className="hover:text-primary transition-colors hidden md:block">
          <Search className="w-4 h-4" />
        </Link>
        <Link href="/minha-conta" className="hover:text-primary transition-colors hidden md:block">
          <User className="w-4 h-4" />
        </Link>
        <Link
          href="/carrinho"
          className="hover:text-primary transition-colors flex items-center gap-1"
        >
          <ShoppingCart className="w-4 h-4" />
          <span>[ {String(totalItems).padStart(2, '0')} ]</span>
        </Link>
        <button
          className="md:hidden hover:text-primary transition-colors"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label="Menu"
        >
          {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="absolute top-full left-0 right-0 bg-background border-b border-border p-6 flex flex-col gap-4 text-xs font-bold uppercase tracking-widest md:hidden z-50">
          <Link
            href="/loja"
            onClick={() => setMobileOpen(false)}
            className="hover:text-primary transition-colors py-2 border-b border-border"
          >
            Camisas
          </Link>
          <Link
            href="/loja?categoria=selecoes"
            onClick={() => setMobileOpen(false)}
            className="hover:text-primary transition-colors py-2 border-b border-border"
          >
            Seleções
          </Link>
          <Link
            href="/loja?categoria=clubes"
            onClick={() => setMobileOpen(false)}
            className="hover:text-primary transition-colors py-2 border-b border-border"
          >
            Clubes
          </Link>
          <Link
            href="/busca"
            onClick={() => setMobileOpen(false)}
            className="hover:text-primary transition-colors py-2 border-b border-border"
          >
            Buscar
          </Link>
          <Link
            href="/minha-conta"
            onClick={() => setMobileOpen(false)}
            className="hover:text-primary transition-colors py-2"
          >
            Minha Conta
          </Link>
        </div>
      )}
    </nav>
  )
}
