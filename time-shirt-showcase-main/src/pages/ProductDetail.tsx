import { useParams, Link } from "react-router-dom";
import { useState } from "react";
import { products } from "@/data/products";
import { useCart } from "@/context/CartContext";
import { toast } from "@/hooks/use-toast";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { ArrowLeft } from "lucide-react";

const ProductDetail = () => {
  const { id } = useParams();
  const product = products.find((p) => p.id === id);
  const { addItem } = useCart();
  const [selectedSize, setSelectedSize] = useState("");

  if (!product) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <p className="text-muted-foreground uppercase tracking-widest">Produto não encontrado.</p>
        </div>
      </div>
    );
  }

  const handleAdd = () => {
    if (!selectedSize) {
      toast({ title: "Selecione um tamanho", variant: "destructive" });
      return;
    }
    addItem(product, selectedSize);
    toast({
      title: "Adicionado!",
      description: `${product.name} (${selectedSize}) no carrinho.`,
    });
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <div className="flex-1">
        <div className="p-4 md:p-6 border-b border-border">
          <Link to="/produtos" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors uppercase tracking-widest">
            <ArrowLeft className="w-4 h-4" /> Voltar
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2">
          <div className="bg-secondary p-8 lg:p-16 flex items-center justify-center min-h-[50vh]">
            <img
              src={product.image}
              alt={product.name}
              className="max-h-[60vh] object-contain"
              width={800}
              height={1000}
            />
          </div>

          <div className="p-6 lg:p-16 flex flex-col justify-center gap-8">
            <div>
              {product.badge && (
                <span className="inline-block bg-primary text-primary-foreground text-xs font-bold px-3 py-1 uppercase tracking-wider mb-4">
                  {product.badge}
                </span>
              )}
              <h1 className="text-3xl md:text-5xl font-bold tracking-tighter uppercase mb-2">
                {product.name}
              </h1>
              <p className="text-sm text-muted-foreground uppercase tracking-wider">{product.team}</p>
            </div>

            <p className="text-muted-foreground text-sm leading-relaxed normal-case tracking-normal">
              {product.description}
            </p>

            <div className="flex items-baseline gap-3">
              {product.originalPrice && (
                <span className="text-lg text-muted-foreground line-through">
                  R$ {product.originalPrice.toFixed(2)}
                </span>
              )}
              <span className="text-3xl font-bold">
                R$ {product.price.toFixed(2)}
              </span>
            </div>

            <div>
              <p className="text-xs uppercase tracking-widest text-muted-foreground mb-3">Tamanho</p>
              <div className="flex gap-2 flex-wrap">
                {product.sizes.map((size) => (
                  <button
                    key={size}
                    onClick={() => setSelectedSize(size)}
                    className={`w-12 h-12 text-sm font-bold uppercase transition-colors ${
                      selectedSize === size
                        ? "bg-foreground text-background"
                        : "border border-border text-muted-foreground hover:border-foreground hover:text-foreground"
                    }`}
                  >
                    {size}
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={handleAdd}
              className="w-full bg-primary text-primary-foreground py-4 font-bold text-lg uppercase tracking-widest hover:bg-foreground hover:text-background transition-colors"
            >
              Adicionar ao Carrinho
            </button>

            <div className="grid grid-cols-2 gap-4 text-xs uppercase tracking-wider text-muted-foreground border-t border-border pt-6">
              <div>
                <span className="text-foreground font-bold block mb-1">Frete</span>
                Grátis acima de R$ 500
              </div>
              <div>
                <span className="text-foreground font-bold block mb-1">Troca</span>
                Em até 30 dias
              </div>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default ProductDetail;
