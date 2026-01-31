import { useState } from "react";
import type { Product } from "../../types";
import { Modal } from "../Modal";
import { useAppDispatch, useAppSelector } from "../../store/hooks";
import { addToCart } from "../../store/slices/cartSlice";

interface ProductDetailProps {
    product: Product;
    onNavigateBack?: () => void;
    onNavigateToCart?: () => void;
    onCheckout?: (product: Product) => void;
}

export const ProductDetail = ({
    product,
    onNavigateBack,
    onNavigateToCart,
    onCheckout,
}: ProductDetailProps) => {
    const dispatch = useAppDispatch();
    const cartItems = useAppSelector(state => state.cart.items);
    const [selectedImage, setSelectedImage] = useState(0);
    const [selectedQuantity, setSelectedQuantity] = useState(1);
    const [showModal, setShowModal] = useState(false);
    const [addedProduct, setAddedProduct] = useState<{ product: Product; quantity: number } | null>(null);
    const images = [product.imageUrl, product.imageUrl, product.imageUrl]; // Mock: usar la misma imagen 3 veces

    const getStockLabel = (stock: number) => {
        if (stock >= 10) return `${stock} Unidades en stock`;
        if (stock > 0) return `${stock} Unidades en stock`;
        return "No hay stock";
    };

    const handleDecreaseQuantity = () => {
        setSelectedQuantity(Math.max(1, selectedQuantity - 1));
    };

    const handleIncreaseQuantity = () => {
        setSelectedQuantity(Math.min(product.stock, selectedQuantity + 1));
    };

    const handleAddToCart = () => {
        // Verificar cuántos de este producto ya están en el carrito
        const existingCartItem = cartItems.find(item => item.product.id === product.id);
        const currentQuantityInCart = existingCartItem ? existingCartItem.quantity : 0;

        // Verificar si agregar la cantidad seleccionada excedería el stock
        if (currentQuantityInCart + selectedQuantity > product.stock) {
            const availableToAdd = product.stock - currentQuantityInCart;

            if (availableToAdd <= 0) {
                alert(`Ya tienes la cantidad máxima de "${product.name}" en tu carrito (${product.stock} unidades disponibles)`);
            } else {
                alert(`Solo puedes agregar ${availableToAdd} unidad(es) más de "${product.name}" al carrito. Ya tienes ${currentQuantityInCart} en el carrito y hay ${product.stock} en stock.`);
            }
            return;
        }

        // Si no excede el stock, agregar al carrito
        dispatch(addToCart({ product, quantity: selectedQuantity }));
        setAddedProduct({ product, quantity: selectedQuantity });
        setShowModal(true);
    };

    const handleCloseModal = () => {
        setShowModal(false);
        setAddedProduct(null);
    };

    const handleViewCart = () => {
        setShowModal(false);
        if (onNavigateToCart) {
            onNavigateToCart(); // Navegar a la vista del carrito
        }
    };

    return (
        <div className="min-h-screen">

            <main className="max-w-7xl mx-auto px-6 py-12 lg:py-20">
                <div className="lg:flex lg:gap-16 items-start">
                    <div className="lg:w-3/5 space-y-6">
                        {/* Imagen principal */}
                        <div className="aspect-[4/5] w-full bg-sunset-peach dark:bg-orange-900/10 rounded-3xl overflow-hidden flex items-center justify-center">
                            <div
                                className="w-full h-full bg-center bg-no-repeat bg-cover"
                                style={{ backgroundImage: `url("${images[selectedImage]}")` }}
                            />
                        </div>
                    </div>

                    <div className="lg:w-2/5 lg:sticky lg:top-32 mt-12 lg:mt-0">
                        <div className="space-y-8">
                            {/* Header del producto */}
                            <div>
                                <div className="flex items-center gap-4 mb-4">
                                    <div className="flex h-8 shrink-0 items-center justify-center gap-x-2 rounded-full bg-amber-50 dark:bg-amber-900/20 px-3 border border-sunset-gold/30">
                                        <div className="size-1.5 rounded-full bg-sunset-gold" />
                                        <p className="text-sunset-gold text-xs font-bold uppercase tracking-wider">
                                            {getStockLabel(product.stock)}
                                        </p>
                                    </div>
                                    <span className="text-slate-400 text-xs font-medium uppercase tracking-widest">
                                        SKU: {product.category.toUpperCase()}-{product.id.substring(0, 3).toUpperCase()}
                                    </span>
                                </div>
                                <h1 className="text-slate-900 tracking-tight text-5xl font-bold leading-[1.1] mb-4">
                                    {product.name}
                                </h1>
                                <p className="text-sunset-orange text-3xl font-bold">
                                    ${new Intl.NumberFormat('es-CO', { maximumFractionDigits: 0 }).format(Number(product.price))}
                                </p>
                            </div>
                            <div className="pt-6 space-y-6">
                                {/* Descripción */}
                                <div className="space-y-4">
                                    <h4 className="text-slate-900 font-semibold text-lg">
                                        Descripción
                                    </h4>
                                    <p className="text-slate-600 dark:text-slate-400 text-base leading-relaxed">
                                        Eleva tu espacio con esta pieza magistralmente elaborada. Con un
                                        acabado mate suave y líneas arquitectónicas limpias, sirve como
                                        una pieza de declaración perfecta para interiores modernos. Cada
                                        pieza está hecha a mano por artesanos, asegurando una textura
                                        única y una sensación premium.
                                    </p>
                                </div>

                                {/* Especificaciones */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="bg-orange-50/50 p-5 rounded-2xl border border-orange-100/50">
                                        <span className="text-xs text-slate-500 uppercase tracking-widest block mb-2 font-semibold">
                                            Categoría
                                        </span>
                                        <span className="text-base font-medium dark:border-slate-700/50 italic">
                                            {product.category}
                                        </span>
                                    </div>
                                    <div className="bg-orange-50/50 p-5 rounded-2xl border border-orange-100/50">
                                        <span className="text-xs text-slate-500 uppercase tracking-widest block mb-2 font-semibold">
                                            Stock
                                        </span>
                                        <span className="text-base font-medium dark:border-slate-700/50 italic">
                                            {product.stock} unidades
                                        </span>
                                    </div>
                                </div>

                                {/* Acciones */}
                                <div className="pt-6 space-y-4">
                                    <div className="space-y-3">
                                        <span className="text-xs text-slate-500 uppercase tracking-widest block font-bold">Cantidad</span>
                                        <div className="flex items-center justify-between w-32 bg-slate-100 rounded-full p-1.5">
                                            <button
                                                className="size-8 flex items-center justify-center rounded-full bg-white text-slate-900 hover:text-sunset-orange transition-colors shadow-sm"
                                                onClick={handleDecreaseQuantity}
                                                disabled={selectedQuantity <= 1}
                                            >
                                                <span className="material-symbols-outlined text-lg">remove</span>
                                            </button>
                                            <span className="text-lg font-semibold">{selectedQuantity}</span>
                                            <button
                                                className="size-8 flex items-center justify-center rounded-full bg-white text-slate-900 hover:text-sunset-orange transition-colors shadow-sm"
                                                onClick={handleIncreaseQuantity}
                                                disabled={selectedQuantity >= product.stock}
                                            >
                                                <span className="material-symbols-outlined text-lg">add</span>
                                            </button>
                                        </div>
                                    </div>
                                    <div className="flex gap-4">
                                        <button
                                            onClick={handleAddToCart}
                                            disabled={product.stock === 0}
                                            className="flex-1 bg-orange-600 text-white h-16 rounded-2xl font-bold text-xl tracking-tight transition-all shadow-xl shadow-sunset-orange/20 disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            Agregar al Carrito
                                        </button>
                                    </div>
                                    <div className="flex items-center justify-center gap-6 py-4 text-slate-400 border-t border-slate-100 dark:border-slate-800">
                                        <div className="flex items-center gap-2 text-xs uppercase tracking-widest font-semibold">
                                            <span className="material-symbols-outlined text-lg">
                                                local_shipping
                                            </span>
                                            Domicilio gratis
                                        </div>
                                        <div className="flex items-center gap-2 text-xs uppercase tracking-widest font-semibold">
                                            <span className="material-symbols-outlined text-lg">
                                                verified
                                            </span>
                                            2 años de garantía
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
            <Modal
                isOpen={showModal}
                onClose={handleCloseModal}
                product={addedProduct?.product || null}
                quantity={addedProduct?.quantity || 0}
                onViewCart={handleViewCart}
            />
        </div>
    );
};