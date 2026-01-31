import { describe, it, expect } from 'vitest';
import productReducer, {
    type ProductState,
} from '../productSlice';
import type { Product } from '../../../types';

const mockProducts: Product[] = [
    {
        id: '1',
        name: 'Product 1',
        description: 'Description 1',
        price: 100,
        category: 'category1',
        imageUrl: 'https://example.com/image1.jpg',
        stock: 10,
    },
    {
        id: '2',
        name: 'Product 2',
        description: 'Description 2',
        price: 200,
        category: 'category2',
        imageUrl: 'https://example.com/image2.jpg',
        stock: 5,
    },
];

describe('productSlice', () => {
    describe('Initial State', () => {
        it('should return the initial state', () => {
            const state = productReducer(undefined, { type: '@@INIT' });

            expect(state).toEqual({
                items: [],
                loading: false,
                error: null,
            });
        });

        it('should have correct initial state shape', () => {
            const state = productReducer(undefined, { type: '@@INIT' });

            expect(state).toHaveProperty('items');
            expect(state).toHaveProperty('loading');
            expect(state).toHaveProperty('error');
            expect(Array.isArray(state.items)).toBe(true);
            expect(typeof state.loading).toBe('boolean');
        });
    });

    describe('reducer export', () => {
        it('should export the reducer as default', () => {
            expect(productReducer).toBeDefined();
            expect(typeof productReducer).toBe('function');
        });

        it('should handle unknown actions by returning current state', () => {
            const currentState: ProductState = {
                items: mockProducts,
                loading: false,
                error: null,
            };

            const state = productReducer(currentState, { type: 'UNKNOWN_ACTION' });

            expect(state).toEqual(currentState);
        });
    });
});
