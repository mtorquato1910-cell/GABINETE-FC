import Link from 'next/link'
import { Logo } from './Logo'

export function Footer() {
  return (
    <footer className="border-t border-border mt-auto">
      <div className="p-6 md:p-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-xs">
          <div>
            <Logo variant="text" className="mb-4" />
            <p className="text-muted-foreground leading-relaxed max-w-xs">
              Camisas de futebol autênticas importadas. Seleções e clubes do mundo todo com entrega
              para todo o Brasil.
            </p>
          </div>

          <div className="flex flex-col gap-2 uppercase tracking-widest">
            <span className="text-muted-foreground mb-2 font-bold">Navegação</span>
            <Link href="/" className="hover:text-primary transition-colors">
              Home
            </Link>
            <Link href="/loja" className="hover:text-primary transition-colors">
              Camisas
            </Link>
            <Link href="/carrinho" className="hover:text-primary transition-colors">
              Carrinho
            </Link>
            <Link href="/minha-conta" className="hover:text-primary transition-colors">
              Minha Conta
            </Link>
          </div>

          <div className="flex flex-col gap-2 uppercase tracking-widest">
            <span className="text-muted-foreground mb-2 font-bold">Suporte</span>
            <span className="text-muted-foreground">contato@gabinetefc.com.br</span>
            <span className="text-muted-foreground">Frete grátis acima de R$ 500</span>
            <span className="text-muted-foreground">Troca em até 30 dias</span>
            <Link href="/politicas" className="hover:text-primary transition-colors">
              Políticas
            </Link>
            <Link href="/faq" className="hover:text-primary transition-colors">
              FAQ
            </Link>
          </div>
        </div>

        <div className="mt-12 pt-6 border-t border-border flex flex-col sm:flex-row justify-between items-center gap-4 text-xs text-muted-foreground uppercase tracking-widest">
          <span>© 2026 Gabinete FC. Todos os direitos reservados.</span>
          <div className="flex gap-6">
            <Link href="/politicas/privacidade" className="hover:text-primary transition-colors">
              Privacidade
            </Link>
            <Link href="/politicas/termos" className="hover:text-primary transition-colors">
              Termos
            </Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
