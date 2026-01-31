import { Outlet } from 'react-router-dom';

/**
 * Layout específico para el flujo de checkout
 * No incluye Header normal, usa el Header del CheckoutInfo
 */
export const CheckoutLayout = () => {
    return (
        <div className="min-h-screen bg-background-light">
            <Outlet />
        </div>
    );
};
