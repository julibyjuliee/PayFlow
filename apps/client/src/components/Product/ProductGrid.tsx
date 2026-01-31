import type { Product } from "../../types";
import { ProductCard } from "./ProductCard";

interface ProductGridProps {
  products: Product[];
  onAddToCart?: (productId: string) => void;
  onViewProduct?: (product: Product) => void;
}

export const ProductGrid = ({ products, onAddToCart, onViewProduct }: ProductGridProps) => {
  console.log('Rendering ProductGrid with products:', products);
  console.log('onAddToCart ProductGrid with products:', onAddToCart);
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {products.map((product) => (
        <ProductCard
          key={product.id}
          product={product}
          onAddToCart={onAddToCart}
          onViewProduct={onViewProduct}
        />
      ))}
    </div>
  );
};
