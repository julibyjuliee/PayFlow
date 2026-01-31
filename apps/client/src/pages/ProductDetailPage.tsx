import { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ProductDetail } from '../components/ProductDetail';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { fetchProducts } from '../store/slices/productSlice';

export const ProductDetailPage = () => {
    const navigate = useNavigate();
    const dispatch = useAppDispatch();
    const { productId } = useParams<{ productId: string }>();
    const products = useAppSelector((state) => state.products.items);
    const isLoading = useAppSelector((state) => state.products.loading);

    // Buscar el producto
    const product = products.find((p) => p.id === productId);

    // Si no hay productos y no está cargando, despachar fetchProducts
    useEffect(() => {
        if (!products.length && !isLoading) {
            dispatch(fetchProducts());
        }
    }, [products.length, isLoading, dispatch]);

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <p className="text-slate-500 animate-pulse">Cargando detalles...</p>
            </div>
        );
    }

    // Solo mostrar "no encontrado" si no está cargando y no hay producto
    if (!product && !isLoading) {
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

    if (!product) {
        // Mientras se resuelve, no mostrar nada
        return null;
    }

    return (
        <ProductDetail
            product={product}
            onNavigateToCart={() => navigate('/cart')}
        />
    );
};