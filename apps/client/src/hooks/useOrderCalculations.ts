import { useMemo } from 'react';
import type { CartItem } from '../store/slices/cartSlice';

interface OrderTotals {
    subtotal: number;
    tax: number;
    shipping: number;
    total: number;
}

const TAX_RATE = 0.08;
const SHIPPING_COST = 0;

export const useOrderCalculations = (items: CartItem[]): OrderTotals => {
    const calculations = useMemo(() => {
        const subtotal = items.reduce(
            (sum, item) => sum + item.product.price * item.quantity,
            0
        );

        const tax = subtotal * TAX_RATE;
        const shipping = SHIPPING_COST;
        const total = subtotal + tax + shipping;

        return {
            subtotal,
            tax,
            shipping,
            total,
        };
    }, [items]);

    return calculations;
};
