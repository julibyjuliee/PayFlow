import { lazy, Suspense, type ReactNode } from 'react';
import type { RouteObject } from 'react-router-dom';
import { MainLayout, CheckoutLayout } from '../layouts';

/**
 * Lazy loading para optimización de rendimiento
 */
const ShopPage = lazy(() =>
    import('../pages/ShopPage').then((module) => ({ default: module.ShopPage }))
);
const CartPage = lazy(() =>
    import('../pages/CartPage').then((module) => ({ default: module.CartPage }))
);
const ProductDetailPage = lazy(() =>
    import('../pages/ProductDetailPage').then((module) => ({
        default: module.ProductDetailPage,
    }))
);
const CheckoutPage = lazy(() =>
    import('../pages/CheckoutPage').then((module) => ({
        default: module.CheckoutPage,
    }))
);
const NotFoundPage = lazy(() =>
    import('../pages/NotFoundPage').then((module) => ({
        default: module.NotFoundPage,
    }))
);
const PaymentResultPage = lazy(() =>
    import('../pages/PaymentResultPage').then((module) => ({
        default: module.PaymentResultPage,
    }))
);

const PageLoader = () => (
    <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
            <div className="size-16 border-4 border-sunset-orange border-t-transparent rounded-full animate-spin" />
            <p className="text-slate-600 font-medium">Cargando...</p>
        </div>
    </div>
);

const withSuspense = (Component: ReactNode) => (
    <Suspense fallback={<PageLoader />}>{Component}</Suspense>
);

export const routesConfig: RouteObject[] = [
    {
        path: '/',
        element: <MainLayout />,
        children: [
            {
                index: true,
                element: withSuspense(<ShopPage />),
            },
            {
                path: 'product/:productId',
                element: withSuspense(<ProductDetailPage />),
            },
        ],
    },
    {
        path: '/cart',
        element: <CheckoutLayout />,
        children: [
            {
                index: true,
                element: withSuspense(<CartPage />),
            },
        ],
    },
    {
        path: '/checkout',
        element: <CheckoutLayout />,
        children: [
            {
                index: true,
                element: withSuspense(<CheckoutPage />),
            },
        ],
    },
    {
        path: '/payment-result',
        element: withSuspense(<PaymentResultPage />),
    },
    {
        path: '*',
        element: withSuspense(<NotFoundPage />),
    },
];
