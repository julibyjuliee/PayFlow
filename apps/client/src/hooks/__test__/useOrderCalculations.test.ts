import { renderHook } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { useOrderCalculations } from '../useOrderCalculations';
import type { CartItem } from '../../store/slices/cartSlice';

describe('useOrderCalculations', () => {
    it('returns 0 for all totals if cart is empty', () => {
        const { result } = renderHook(() => useOrderCalculations([]));
        expect(result.current).toEqual({ subtotal: 0, tax: 0, shipping: 0, total: 0 });
    });

    it('calculates totals for one item', () => {
        const items: CartItem[] = [
            {
                product: {
                    id: '1',
                    name: 'Test',
                    price: 100,
                    category: 'cat',
                    imageUrl: 'img.jpg',
                    stock: 5,
                },
                quantity: 2,
            },
        ];
        const { result } = renderHook(() => useOrderCalculations(items));
        expect(result.current.subtotal).toBe(200);
        expect(result.current.tax).toBeCloseTo(16);
        expect(result.current.shipping).toBe(0);
        expect(result.current.total).toBeCloseTo(216);
    });

    it('calculates totals for multiple items', () => {
        const items: CartItem[] = [
            {
                product: {
                    id: '1',
                    name: 'A',
                    price: 50,
                    category: 'cat',
                    imageUrl: 'img.jpg',
                    stock: 5,
                },
                quantity: 1,
            },
            {
                product: {
                    id: '2',
                    name: 'B',
                    price: 150,
                    category: 'cat',
                    imageUrl: 'img2.jpg',
                    stock: 2,
                },
                quantity: 3,
            },
        ];
        const { result } = renderHook(() => useOrderCalculations(items));
        expect(result.current.subtotal).toBe(500);
        expect(result.current.tax).toBeCloseTo(40);
        expect(result.current.shipping).toBe(0);
        expect(result.current.total).toBeCloseTo(540);
    });
});
