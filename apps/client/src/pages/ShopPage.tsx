import { useEffect } from "react";
import { useNavigate } from 'react-router-dom';
import { ProductGrid } from '../components/Product';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { addToCart } from '../store/slices/cartSlice';
import type { Product } from '../types';
import { fetchProducts } from "../store/slices/productSlice";

export const ShopPage = () => {
    const navigate = useNavigate();
    const dispatch = useAppDispatch();
    const { items: products, loading, error } = useAppSelector(state => state.products);

    const handleAddToCart = (productId: string) => {
        const product = products.find((p: Product) => p.id === productId);
        if (product) {
            dispatch(addToCart({ product, quantity: 1 }));
        }
    };

    useEffect(() => {
        dispatch(fetchProducts());
    }, [dispatch]);

    const handleViewProduct = (product: Product) => {
        navigate(`/product/${product.id}`);
    };

    const handleRetry = () => {
        dispatch(fetchProducts());
    };

    let content;
    if (loading) {
        content = (
            <div className="flex flex-col items-center justify-center py-20">
                <div className="relative">
                    <div className="w-16 h-16 border-4 border-slate-200 border-t-slate-600 rounded-full animate-spin"></div>
                </div>
                <p className="mt-6 text-slate-600 text-lg font-medium">
                    Cargando productos...
                </p>
            </div>
        );
    } else if (error) {
        content = (
            <div className="flex flex-col items-center justify-center py-20">
                <div className="text-center max-w-md">
                    <div className="mb-6">
                        <span className="material-symbols-outlined text-6xl text-orange-500">
                            error
                        </span>
                    </div>
                    <h2 className="text-2xl font-bold text-slate-900 mb-4">
                        Error al cargar productos
                    </h2>
                    <p className="text-slate-600 mb-6">
                        {error}
                    </p>
                    <button
                        onClick={handleRetry}
                        className="bg-orange-600 text-white px-6 py-3 rounded-xl hover:bg-orange-700 transition-colors font-medium"
                    >
                        Reintentar
                    </button>
                </div>
            </div>
        );
    } else {
        content = (
            <ProductGrid
                products={products}
                onAddToCart={handleAddToCart}
                onViewProduct={handleViewProduct}
            />
        );
    }

    return (
        <main className="max-w-7xl mx-auto px-6 py-12">
            <div className="mb-12">
                <h1 className="text-4xl font-bold text-slate-900 tracking-tight mb-2">
                    Nuevos Productos

                </h1>
                <p className="text-slate-500 text-lg">
                    Descubre las últimas incorporaciones a nuestra colección.
                </p>
            </div>

            {content}
        </main>
    );
};
