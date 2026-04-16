import { useState } from "react";
import { Link } from "react-router-dom";
import { Search, Menu, X } from "lucide-react";
import { useCart } from "@/context/CartContext";

const Navbar = () => {
  const { totalItems } = useCart();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <nav className="flex justify-between items-center p-4 md:p-6 border-b border-border sticky top-0 bg-background/95 backdrop-blur-sm z-50">
      <Link to="/" className="text-xl md:text-2xl font-bold tracking-tighter">
        <span className="text-primary">GABINETE</span>
        <span className="text-foreground">//</span>
        <span className="text-foreground">FC</span>
      </Link>

      <div className="hidden md:flex gap-8 text-sm font-semibold uppercase tracking-widest">
        <Link to="/" className="hover:text-primary transition-colors">Drops</Link>
        <Link to="/produtos" className="hover:text-primary transition-colors">Camisas</Link>
        <Link to="/cadastro" className="hover:text-primary transition-colors">Cadastro</Link>
      </div>

      <div className="flex gap-4 md:gap-6 text-sm font-semibold uppercase tracking-widest items-center">
        <Link to="/produtos" className="hover:text-primary transition-colors hidden md:block">
          <Search className="w-5 h-5" />
        </Link>
        <Link to="/carrinho" className="hover:text-primary transition-colors">
          [ Cart: {String(totalItems).padStart(2, "0")} ]
        </Link>
        <button
          className="md:hidden hover:text-primary transition-colors"
          onClick={() => setMobileOpen(!mobileOpen)}
        >
          {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {mobileOpen && (
        <div className="absolute top-full left-0 right-0 bg-background border-b border-border p-6 flex flex-col gap-4 text-sm font-semibold uppercase tracking-widest md:hidden z-50">
          <Link to="/" onClick={() => setMobileOpen(false)} className="hover:text-primary transition-colors py-2">Drops</Link>
          <Link to="/produtos" onClick={() => setMobileOpen(false)} className="hover:text-primary transition-colors py-2">Camisas</Link>
          <Link to="/cadastro" onClick={() => setMobileOpen(false)} className="hover:text-primary transition-colors py-2">Cadastro</Link>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
