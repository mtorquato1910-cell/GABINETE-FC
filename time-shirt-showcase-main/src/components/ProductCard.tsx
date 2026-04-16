import { useState } from "react";
import { Link } from "react-router-dom";
import { Product } from "@/data/products";
import { useCart } from "@/context/CartContext";
import { toast } from "@/hooks/use-toast";

interface ProductCardProps {
  product: Product;
}

const ProductCard = ({ product }: ProductCardProps) => {
  const { addItem } = useCart();
  const [selectedSize, setSelectedSize] = useState(product.sizes[1] || product.sizes[0]);

  const handleAdd = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    addItem(product, selectedSize);
    toast({
      title: "Adicionado ao carrinho",
      description: `${product.name} (${selectedSize}) foi adicionado.`,
    });
  };

  return (
    <article className="group bg-background flex flex-col relative">
      {product.badge && (
        <div className="absolute top-4 left-4 z-10 bg-primary text-primary-foreground text-xs font-bold px-2 py-1 uppercase tracking-wider">
          {product.badge}
        </div>
      )}
      <Link to={`/produto/${product.id}`} className="relative aspect-[4/5] bg-secondary p-8 overflow-hidden block">
        <img
          src={product.image}
          loading="lazy"
          width={800}
          height={1000}
          className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-500 scale-100 group-hover:scale-105"
          alt={product.name}
        />
      </Link>
      <div className="p-4 md:p-6 flex flex-col justify-between flex-grow gap-4">
        <div>
          <h3 className="text-lg font-bold mb-1 group-hover:text-primary transition-colors uppercase tracking-wide">
            {product.name}
          </h3>
          <p className="text-xs text-muted-foreground uppercase tracking-wider">
            {product.team} / {product.sizes.join(", ")}
          </p>
        </div>
        <div className="flex justify-between items-end">
          <div className="flex items-baseline gap-2">
            {product.originalPrice && (
              <span className="text-sm text-muted-foreground line-through">
                R$ {product.originalPrice.toFixed(2)}
              </span>
            )}
            <span className="text-xl font-bold">
              R$ {product.price.toFixed(2)}
            </span>
          </div>
          <button
            onClick={handleAdd}
            className="text-xs font-bold uppercase tracking-wider border-b border-transparent group-hover:border-primary group-hover:text-primary transition-all"
          >
            + Adicionar
          </button>
        </div>
      </div>
    </article>
  );
};

export default ProductCard;
