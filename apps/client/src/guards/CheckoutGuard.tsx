import { useAppSelector } from '../store/hooks';
import type { IRouteGuard } from './RouteGuard';

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

export const useCheckoutGuard = (): IRouteGuard => {
    const cartItems = useAppSelector((state) => state.cart.items);
    return new CheckoutGuard(cartItems.length > 0);
};
