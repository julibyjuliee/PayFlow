import { useAppSelector } from '../store/hooks';
import type { IRouteGuard } from './RouteGuard';

/**
 * Guard que verifica si hay items en el carrito antes de acceder al checkout
 * Implementa la interfaz IRouteGuard - Principio de Dependency Inversion (SOLID)
 */
export class CheckoutGuard implements IRouteGuard {
    private readonly hasCartItems: boolean;

    constructor(hasCartItems: boolean) {
        this.hasCartItems = hasCartItems;
    }

    canActivate(): boolean {
        return this.hasCartItems;
    }

    redirectTo = '/cart';
}

/**
 * Hook para usar el CheckoutGuard con el estado de Redux
 */
export const useCheckoutGuard = (): IRouteGuard => {
    const cartItems = useAppSelector((state) => state.cart.items);
    return new CheckoutGuard(cartItems.length > 0);
};
