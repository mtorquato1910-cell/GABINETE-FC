import { Link } from "react-router-dom";

const Footer = () => {
  return (
    <footer className="border-t border-border p-6 md:p-12">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8 text-sm">
        <div>
          <div className="text-xl font-bold tracking-tighter mb-4">
            <span className="text-primary">GABINETE</span>//FC
          </div>
          <p className="text-muted-foreground text-xs leading-relaxed max-w-xs">
            Camisas oficiais de seleções do mundo inteiro. Estoque limitado, qualidade premium.
          </p>
        </div>
        <div className="flex flex-col gap-2 uppercase tracking-widest text-xs">
          <span className="text-muted-foreground mb-2">Navegação</span>
          <Link to="/" className="hover:text-primary transition-colors">Home</Link>
          <Link to="/produtos" className="hover:text-primary transition-colors">Camisas</Link>
          <Link to="/carrinho" className="hover:text-primary transition-colors">Carrinho</Link>
          <Link to="/cadastro" className="hover:text-primary transition-colors">Cadastro</Link>
        </div>
        <div className="flex flex-col gap-2 uppercase tracking-widest text-xs">
          <span className="text-muted-foreground mb-2">Suporte</span>
          <span className="text-muted-foreground">contato@gabinetefc.com</span>
          <span className="text-muted-foreground">Frete grátis acima de R$ 500</span>
          <span className="text-muted-foreground">Troca em até 30 dias</span>
        </div>
      </div>
      <div className="mt-12 pt-6 border-t border-border text-center text-xs text-muted-foreground uppercase tracking-widest">
        © 2024 Gabinete FC. Todos os direitos reservados.
      </div>
    </footer>
  );
};

export default Footer;
