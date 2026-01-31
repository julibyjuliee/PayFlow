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
    const { items: products, loading } = useAppSelector(state => state.products);

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

    return (
        <main className="max-w-7xl mx-auto px-6 py-12">
            <div className="mb-12">
                <h1 className="text-4xl font-bold text-slate-900 tracking-tight mb-2">
                    {import.meta.env.VITE_API_URL}
                </h1>
                <p className="text-slate-500 text-lg">
                    Descubre las últimas incorporaciones a nuestra colección.
                </p>
            </div>

            {loading ? (
                <div className="flex flex-col items-center justify-center py-20">
                    <div className="relative">
                        <div className="w-16 h-16 border-4 border-slate-200 border-t-slate-600 rounded-full animate-spin"></div>
                    </div>
                    <p className="mt-6 text-slate-600 text-lg font-medium">
                        Cargando productos...
                    </p>
                </div>
            ) : (
                <ProductGrid
                    products={products}
                    onAddToCart={handleAddToCart}
                    onViewProduct={handleViewProduct}
                />
            )}
        </main>
    );
};
