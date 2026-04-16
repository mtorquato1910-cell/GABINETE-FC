import { Link } from "react-router-dom";
import { useCart } from "@/context/CartContext";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Minus, Plus, Trash2 } from "lucide-react";

const Carrinho = () => {
  const { items, updateQuantity, removeItem, totalPrice, totalItems } = useCart();

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <div className="flex-1 p-6 md:p-12">
        <h1 className="text-3xl md:text-5xl font-bold tracking-tighter uppercase mb-8">
          Carrinho [{String(totalItems).padStart(2, "0")}]
        </h1>

        {items.length === 0 ? (
          <div className="text-center py-24">
            <p className="text-muted-foreground uppercase tracking-widest text-sm mb-6">Seu carrinho está vazio.</p>
            <Link
              to="/produtos"
              className="inline-block bg-primary text-primary-foreground px-8 py-4 font-bold uppercase tracking-widest text-sm hover:bg-foreground hover:text-background transition-colors"
            >
              Ver Camisas
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 flex flex-col gap-px">
              {items.map((item) => (
                <div
                  key={`${item.product.id}-${item.size}`}
                  className="flex gap-4 md:gap-6 p-4 md:p-6 bg-secondary border border-border"
                >
                  <Link to={`/produto/${item.product.id}`} className="w-20 md:w-28 shrink-0 bg-card">
                    <img
                      src={item.product.image}
                      alt={item.product.name}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                  </Link>
                  <div className="flex-1 flex flex-col justify-between">
                    <div>
                      <h3 className="font-bold uppercase tracking-wide text-sm md:text-base">
                        {item.product.name}
                      </h3>
                      <p className="text-xs text-muted-foreground uppercase tracking-wider">
                        Tamanho: {item.size}
                      </p>
                    </div>
                    <div className="flex items-center justify-between mt-4">
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => updateQuantity(item.product.id, item.size, item.quantity - 1)}
                          className="w-8 h-8 border border-border flex items-center justify-center hover:border-foreground transition-colors"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="text-sm font-bold w-6 text-center">{item.quantity}</span>
                        <button
                          onClick={() => updateQuantity(item.product.id, item.size, item.quantity + 1)}
                          className="w-8 h-8 border border-border flex items-center justify-center hover:border-foreground transition-colors"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="font-bold">
                          R$ {(item.product.price * item.quantity).toFixed(2)}
                        </span>
                        <button
                          onClick={() => removeItem(item.product.id, item.size)}
                          className="text-muted-foreground hover:text-destructive transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="bg-secondary border border-border p-6 md:p-8 h-fit sticky top-24">
              <h2 className="text-lg font-bold uppercase tracking-widest mb-6 pb-4 border-b border-border">
                Resumo
              </h2>
              <div className="flex flex-col gap-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground uppercase tracking-wider">Subtotal</span>
                  <span className="font-bold">R$ {totalPrice.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground uppercase tracking-wider">Frete</span>
                  <span className="font-bold text-primary">
                    {totalPrice >= 500 ? "Grátis" : "R$ 29,90"}
                  </span>
                </div>
                <div className="flex justify-between pt-4 border-t border-border text-lg">
                  <span className="font-bold uppercase tracking-wider">Total</span>
                  <span className="font-bold">
                    R$ {(totalPrice + (totalPrice >= 500 ? 0 : 29.9)).toFixed(2)}
                  </span>
                </div>
              </div>
              <button className="w-full mt-8 bg-primary text-primary-foreground py-4 font-bold uppercase tracking-widest hover:bg-foreground hover:text-background transition-colors">
                Finalizar Compra
              </button>
              <p className="text-xs text-muted-foreground mt-4 text-center uppercase tracking-wider">
                Frete grátis acima de R$ 500
              </p>
            </div>
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
};

export default Carrinho;
