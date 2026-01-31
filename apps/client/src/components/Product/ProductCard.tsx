import type { Product } from "../../types";
import { Badge, IconButton } from "../ui";

interface ProductCardProps {
    product: Product;
    onAddToCart?: (productId: string) => void;
    onViewProduct?: (product: Product) => void;
}

export const ProductCard = ({ product, onAddToCart, onViewProduct }: ProductCardProps) => {
    const getStockLabel = (stock: number) => {
        if (stock >= 10) return `${stock} EN STOCK`;
        if (stock > 0) return "BAJO STOCK";
        return "SIN STOCK";
    };

    const isAnimated = product.stock >= 10;

    return (
        <div
            className="group relative flex flex-col bg-white rounded-2xl p-2 border border-orange-50 active:scale-[0.98] transition-all cursor-pointer"
            onClick={() => onViewProduct?.(product)}
        >
            <div className="relative aspect-square rounded-xl overflow-hidden bg-sunset-peach dark:bg-orange-900/10">
                <div
                    className="w-full h-full bg-center bg-cover"
                    style={{ backgroundImage: `url("${product.imageUrl}")` }}
                />

                <IconButton
                    icon="add_shopping_cart"
                    variant="primary"
                    className="absolute bottom-2 right-2"
                    onClick={(e) => {
                        e.stopPropagation();
                        onAddToCart?.(product.id);
                    }}
                    disabled={product.stock === 0}
                />

                <div className="absolute top-2 left-2">
                    <Badge variant={isAnimated ? "animated" : "default"}>
                        {getStockLabel(product.stock)}
                    </Badge>
                </div>
            </div>

            <div className="mt-3 px-1">
                <h3 className="text-slate-900 dark:text-white font-bold text-xs leading-tight line-clamp-1">
                    {product.name}
                </h3>
                <div className="flex items-center justify-between mt-1">
                    <span className="text-terracotta font-bold text-sm">
                        ${new Intl.NumberFormat('es-CO', { maximumFractionDigits: 0 }).format(Number(product.price))}
                    </span>
                    <span className="text-[9px] text-slate-400 uppercase font-bold">
                        {product.category}
                    </span>
                </div>
            </div>
        </div>
    );
};
