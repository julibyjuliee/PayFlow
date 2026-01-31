import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import productReducer, {
    fetchProducts,
    type ProductState,
} from '../productSlice';
import type { Product } from '../../../types';
import { configureStore } from '@reduxjs/toolkit';

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
    beforeEach(() => {
        vi.clearAllMocks();
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

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

    describe('fetchProducts async thunk', () => {
        describe('pending state', () => {
            it('should set loading to true when fetchProducts is pending', () => {
                const action = { type: fetchProducts.pending.type };
                const state = productReducer(
                    { items: [], loading: false, error: 'Previous error' },
                    action
                );

                expect(state.loading).toBe(true);
                expect(state.error).toBe(null);
            });

            it('should clear previous errors when pending', () => {
                const initialState: ProductState = {
                    items: mockProducts,
                    loading: false,
                    error: 'Some previous error',
                };

                const action = { type: fetchProducts.pending.type };
                const state = productReducer(initialState, action);

                expect(state.error).toBe(null);
            });
        });

        describe('fulfilled state', () => {
            it('should set loading to false and populate items when fulfilled', () => {
                const action = {
                    type: fetchProducts.fulfilled.type,
                    payload: mockProducts,
                };

                const state = productReducer(
                    { items: [], loading: true, error: null },
                    action
                );

                expect(state.loading).toBe(false);
                expect(state.items).toEqual(mockProducts);
                expect(state.error).toBe(null);
            });

            it('should replace existing items with new ones', () => {
                const oldProducts: Product[] = [{
                    id: '999',
                    name: 'Old Product',
                    price: 50,
                    category: 'old',
                    imageUrl: 'old.jpg',
                    stock: 1,
                }];

                const initialState: ProductState = {
                    items: oldProducts,
                    loading: true,
                    error: null,
                };

                const action = {
                    type: fetchProducts.fulfilled.type,
                    payload: mockProducts,
                };

                const state = productReducer(initialState, action);

                expect(state.items).toEqual(mockProducts);
                expect(state.items).not.toEqual(oldProducts);
            });
        });

        describe('rejected state', () => {
            it('should set loading to false and store error message when rejected', () => {
                const errorMessage = 'Network error';
                const action = {
                    type: fetchProducts.rejected.type,
                    error: { message: errorMessage },
                };

                const state = productReducer(
                    { items: [], loading: true, error: null },
                    action
                );

                expect(state.loading).toBe(false);
                expect(state.error).toBe(errorMessage);
            });

            it('should use default error message when error message is undefined', () => {
                const action = {
                    type: fetchProducts.rejected.type,
                    error: {},
                };

                const state = productReducer(
                    { items: [], loading: true, error: null },
                    action
                );

                expect(state.loading).toBe(false);
                expect(state.error).toBe('Error al cargar productos');
            });

            it('should keep existing items when request fails', () => {
                const initialState: ProductState = {
                    items: mockProducts,
                    loading: true,
                    error: null,
                };

                const action = {
                    type: fetchProducts.rejected.type,
                    error: { message: 'Failed to fetch' },
                };

                const state = productReducer(initialState, action);

                expect(state.items).toEqual(mockProducts);
            });
        });
    });

    describe('fetchProducts integration', () => {
        it('should dispatch pending and fulfilled actions on successful fetch', async () => {
            const mockFetch = vi.fn(() =>
                Promise.resolve({
                    ok: true,
                    json: () => Promise.resolve(mockProducts),
                } as Response)
            );

            globalThis.fetch = mockFetch;

            const store = configureStore({
                reducer: {
                    products: productReducer,
                },
            });

            await store.dispatch(fetchProducts());

            const state = store.getState().products;

            expect(state.loading).toBe(false);
            expect(state.items).toEqual(mockProducts);
            expect(state.error).toBe(null);
            expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining('/products'));
        });

        it('should dispatch pending and rejected actions on failed fetch', async () => {
            const mockFetch = vi.fn(() =>
                Promise.resolve({
                    ok: false,
                    status: 500,
                } as Response)
            );

            globalThis.fetch = mockFetch;

            const store = configureStore({
                reducer: {
                    products: productReducer,
                },
            });

            await store.dispatch(fetchProducts());

            const state = store.getState().products;

            expect(state.loading).toBe(false);
            expect(state.items).toEqual([]);
            expect(state.error).toBe('Error al obtener productos');
            // Solo intenta 1 vez para errores HTTP (no es un error de conexión)
            expect(mockFetch).toHaveBeenCalledTimes(1);
        });

        it('should use VITE_API_URL environment variable', async () => {
            const mockFetch = vi.fn(() =>
                Promise.resolve({
                    ok: true,
                    json: () => Promise.resolve(mockProducts),
                } as Response)
            );

            globalThis.fetch = mockFetch;

            const store = configureStore({
                reducer: {
                    products: productReducer,
                },
            });

            await store.dispatch(fetchProducts());

            expect(mockFetch).toHaveBeenCalledWith(
                expect.stringContaining(import.meta.env.VITE_API_URL || '')
            );
        });

        it('should not retry on non-connection errors', async () => {
            const mockFetch = vi.fn(() =>
                Promise.reject(new Error('Some other error'))
            );

            globalThis.fetch = mockFetch;

            const store = configureStore({
                reducer: {
                    products: productReducer,
                },
            });

            await store.dispatch(fetchProducts());

            const state = store.getState().products;

            expect(state.loading).toBe(false);
            expect(state.items).toEqual([]);
            expect(state.error).toBe('Some other error');
            // Solo debe intentar 1 vez para errores que no son de conexión
            expect(mockFetch).toHaveBeenCalledTimes(1);
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
