import { useState } from "react";
import { products, categories } from "@/data/products";
import ProductCard from "./ProductCard";

const ProductGrid = () => {
  const [activeCategory, setActiveCategory] = useState("all");

  const filtered =
    activeCategory === "all"
      ? products
      : products.filter((p) => p.category === activeCategory);

  return (
    <section>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-4 md:p-6 border-b border-border gap-4 text-sm font-semibold uppercase tracking-widest">
        <div className="flex gap-2 flex-wrap">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`px-4 py-2 transition-colors ${
                activeCategory === cat.id
                  ? "bg-foreground text-background"
                  : "border border-border text-muted-foreground hover:border-foreground hover:text-foreground"
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
        <div className="text-muted-foreground text-xs">
          {filtered.length} {filtered.length === 1 ? "item" : "itens"}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-px bg-border border-b border-border">
        {filtered.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </section>
  );
};

export default ProductGrid;
