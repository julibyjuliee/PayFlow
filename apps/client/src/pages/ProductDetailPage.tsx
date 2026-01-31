import { useNavigate, useParams } from 'react-router-dom';
import { ProductDetail } from '../components/ProductDetail';
import { useAppSelector } from '../store/hooks'; // 1. Usar el hook de Redux
import type { Product } from '../types';

export const ProductDetailPage = () => {
    const navigate = useNavigate();
    const { productId } = useParams<{ productId: string }>();
    const products = useAppSelector((state) => state.products.items);
    const product = products.find((p) => p.id === productId);
    const isLoading = useAppSelector((state) => state.products.loading);

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <p className="text-slate-500 animate-pulse">Cargando detalles...</p>
            </div>
        );
    }

    if (!product) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <h1 className="text-4xl font-bold text-slate-900 mb-4">
                        Producto no encontrado
                    </h1>
                    <p className="mb-6 text-slate-500">ID: {productId}</p>
                    <button
                        onClick={() => navigate('/')}
                        className="bg-orange-600 text-white px-6 py-3 rounded-xl hover:bg-orange-700 transition-colors"
                    >
                        Volver a la tienda
                    </button>
                </div>
            </div>
        );
    }

    const handleCheckout = (product: Product) => {
        navigate('/cart');
    };

    return (
        <ProductDetail
            product={product}
            onNavigateBack={() => navigate('/')}
            onNavigateToCart={() => navigate('/cart')}
            onCheckout={handleCheckout}
        />
    );
};