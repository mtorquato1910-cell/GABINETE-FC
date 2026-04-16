import Navbar from "@/components/Navbar";
import ProductGrid from "@/components/ProductGrid";
import Footer from "@/components/Footer";

const Produtos = () => {
  return (
    <div className="min-h-screen flex flex-col uppercase tracking-widest">
      <Navbar />
      <div className="p-6 md:p-12 border-b border-border">
        <h1 className="text-4xl md:text-6xl font-bold tracking-tighter">Todas as Camisas</h1>
        <p className="text-muted-foreground text-sm mt-2 lowercase tracking-normal">
          encontre a camisa da sua seleção favorita.
        </p>
      </div>
      <ProductGrid />
      <Footer />
    </div>
  );
};

export default Produtos;
