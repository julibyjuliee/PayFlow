import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
    localStorageMiddleware,
    loadStateFromStorage,
    clearStateFromStorage,
} from '../localStorageMiddleware';

class LocalStorageMock {
    private store: Record<string, string> = {};

    getItem(key: string): string | null {
        return this.store[key] || null;
    }

    setItem(key: string, value: string): void {
        this.store[key] = value;
    }

    removeItem(key: string): void {
        delete this.store[key];
    }

    clear(): void {
        this.store = {};
    }

    get length(): number {
        return Object.keys(this.store).length;
    }

    key(index: number): string | null {
        const keys = Object.keys(this.store);
        return keys[index] || null;
    }
}

describe('localStorageMiddleware', () => {
    const STORAGE_KEY = 'payflow_app_state';

    // Mock store
    const mockStore = {
        getState: vi.fn(),
        dispatch: vi.fn(),
    };

    // Mock next function
    const mockNext = vi.fn((action: unknown) => action) as unknown as (action: unknown) => unknown;

    // Mock state
    const mockState = {
        cart: {
            items: [
                {
                    product: {
                        id: '1',
                        name: 'Product 1',
                        price: 100,
                    },
                    quantity: 2,
                },
            ],
            totalItems: 2,
            totalAmount: 200,
        },
        checkout: {
            currentTransaction: {
                id: 'TXN-123',
                status: 'pending',
            },
            transactions: [],
            shippingAddress: {
                firstName: 'John',
                lastName: 'Doe',
                email: 'john@example.com',
                address: '123 Main St',
                city: 'New York',
                postalCode: '10001',
            },
        },
    };

    let localStorageMock: LocalStorageMock;

    beforeEach(() => {
        // Clear all mocks
        vi.clearAllMocks();
        mockStore.getState.mockReturnValue(mockState);

        // Create new localStorage mock
        localStorageMock = new LocalStorageMock();
        globalThis.localStorage = localStorageMock as any;

        // Spy on localStorage methods
        vi.spyOn(localStorageMock, 'getItem');
        vi.spyOn(localStorageMock, 'setItem');
        vi.spyOn(localStorageMock, 'removeItem');
        vi.spyOn(localStorageMock, 'clear');

        // Mock console methods
        vi.spyOn(console, 'error').mockImplementation(() => { });
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    describe('Middleware Behavior', () => {
        it('should be a valid middleware function', () => {
            expect(typeof localStorageMiddleware).toBe('function');
            const middleware = localStorageMiddleware(mockStore as any);
            expect(typeof middleware).toBe('function');
            const nextHandler = middleware(mockNext);
            expect(typeof nextHandler).toBe('function');
        });

        it('should call next with the action', () => {
            const middleware = localStorageMiddleware(mockStore as any);
            const nextHandler = middleware(mockNext);
            const action = { type: 'cart/addToCart', payload: {} };

            nextHandler(action);

            expect(mockNext).toHaveBeenCalledWith(action);
        });

        it('should return the result from next', () => {
            const middleware = localStorageMiddleware(mockStore as any);
            const nextHandler = middleware(mockNext);
            const action = { type: 'cart/addToCart', payload: {} };
            const expectedResult = { type: 'RESULT' };

            (mockNext as any).mockImplementation(() => expectedResult);
            const result = nextHandler(action);

            expect(result).toBe(expectedResult);
        });
    });

    describe('Action Filtering', () => {
        it('should save to localStorage when cart/addToCart action is dispatched', () => {
            const middleware = localStorageMiddleware(mockStore as any);
            const nextHandler = middleware(mockNext);
            const action = { type: 'cart/addToCart', payload: {} };

            nextHandler(action);

            expect(localStorage.setItem).toHaveBeenCalled();
        });

        it('should save to localStorage when cart/removeFromCart action is dispatched', () => {
            const middleware = localStorageMiddleware(mockStore as any);
            const nextHandler = middleware(mockNext);
            const action = { type: 'cart/removeFromCart', payload: '1' };

            nextHandler(action);

            expect(localStorage.setItem).toHaveBeenCalled();
        });

        it('should save to localStorage when cart/updateQuantity action is dispatched', () => {
            const middleware = localStorageMiddleware(mockStore as any);
            const nextHandler = middleware(mockNext);
            const action = { type: 'cart/updateQuantity', payload: {} };

            nextHandler(action);

            expect(localStorage.setItem).toHaveBeenCalled();
        });

        it('should save to localStorage when cart/clearCart action is dispatched', () => {
            const middleware = localStorageMiddleware(mockStore as any);
            const nextHandler = middleware(mockNext);
            const action = { type: 'cart/clearCart' };

            nextHandler(action);

            expect(localStorage.setItem).toHaveBeenCalled();
        });

        it('should save to localStorage when checkout/setShippingAddress action is dispatched', () => {
            const middleware = localStorageMiddleware(mockStore as any);
            const nextHandler = middleware(mockNext);
            const action = { type: 'checkout/setShippingAddress', payload: {} };

            nextHandler(action);

            expect(localStorage.setItem).toHaveBeenCalled();
        });

        it('should save to localStorage when checkout/completeTransaction action is dispatched', () => {
            const middleware = localStorageMiddleware(mockStore as any);
            const nextHandler = middleware(mockNext);
            const action = { type: 'checkout/completeTransaction' };

            nextHandler(action);

            expect(localStorage.setItem).toHaveBeenCalled();
        });

        it('should NOT save to localStorage for other actions', () => {
            const middleware = localStorageMiddleware(mockStore as any);
            const nextHandler = middleware(mockNext);
            const action = { type: 'product/fetchProducts' };

            nextHandler(action);

            expect(localStorage.setItem).not.toHaveBeenCalled();
        });

        it('should NOT save to localStorage for random actions', () => {
            const middleware = localStorageMiddleware(mockStore as any);
            const nextHandler = middleware(mockNext);
            const action = { type: 'random/action' };

            nextHandler(action);

            expect(localStorage.setItem).not.toHaveBeenCalled();
        });

        it('should handle actions with no type property', () => {
            const middleware = localStorageMiddleware(mockStore as any);
            const nextHandler = middleware(mockNext);
            const action = {} as any;

            expect(() => nextHandler(action)).not.toThrow();
            expect(localStorage.setItem).not.toHaveBeenCalled();
        });

        it('should handle null action', () => {
            const middleware = localStorageMiddleware(mockStore as any);
            const nextHandler = middleware(mockNext);

            expect(() => nextHandler(null as any)).not.toThrow();
            expect(localStorage.setItem).not.toHaveBeenCalled();
        });

        it('should handle undefined action', () => {
            const middleware = localStorageMiddleware(mockStore as any);
            const nextHandler = middleware(mockNext);

            expect(() => nextHandler(undefined as any)).not.toThrow();
            expect(localStorage.setItem).not.toHaveBeenCalled();
        });
    });

    describe('Data Persistence', () => {
        it('should save encrypted state to localStorage', () => {
            const middleware = localStorageMiddleware(mockStore as any);
            const nextHandler = middleware(mockNext);
            const action = { type: 'cart/addToCart', payload: {} };

            nextHandler(action);

            expect(localStorage.setItem).toHaveBeenCalledWith(
                STORAGE_KEY,
                expect.any(String)
            );
        });

        it('should exclude currentTransaction from persisted checkout state', () => {
            const middleware = localStorageMiddleware(mockStore as any);
            const nextHandler = middleware(mockNext);
            const action = { type: 'cart/addToCart', payload: {} };

            nextHandler(action);

            const savedData = (localStorage.setItem as any).mock.calls[0][1];
            const decrypted = atob(savedData);
            const parsed = JSON.parse(decrypted);

            expect(parsed.checkout.currentTransaction).toBeNull();
        });

        it('should persist cart state', () => {
            const middleware = localStorageMiddleware(mockStore as any);
            const nextHandler = middleware(mockNext);
            const action = { type: 'cart/addToCart', payload: {} };

            nextHandler(action);

            const savedData = (localStorage.setItem as any).mock.calls[0][1];
            const decrypted = atob(savedData);
            const parsed = JSON.parse(decrypted);

            expect(parsed.cart).toEqual(mockState.cart);
        });

        it('should persist checkout state without currentTransaction', () => {
            const middleware = localStorageMiddleware(mockStore as any);
            const nextHandler = middleware(mockNext);
            const action = { type: 'cart/addToCart', payload: {} };

            nextHandler(action);

            const savedData = (localStorage.setItem as any).mock.calls[0][1];
            const decrypted = atob(savedData);
            const parsed = JSON.parse(decrypted);

            expect(parsed.checkout).toEqual({
                ...mockState.checkout,
                currentTransaction: null,
            });
        });

        it('should use btoa for encryption', () => {
            const middleware = localStorageMiddleware(mockStore as any);
            const nextHandler = middleware(mockNext);
            const action = { type: 'cart/addToCart', payload: {} };

            nextHandler(action);

            const savedData = (localStorage.setItem as any).mock.calls[0][1];

            // Verify it's base64 encoded
            expect(() => atob(savedData)).not.toThrow();
        });

        it('should handle localStorage errors gracefully', () => {
            (localStorage.setItem as any).mockImplementation(() => {
                throw new Error('Storage full');
            });

            const middleware = localStorageMiddleware(mockStore as any);
            const nextHandler = middleware(mockNext);
            const action = { type: 'cart/addToCart', payload: {} };

            expect(() => nextHandler(action)).not.toThrow();
            expect(console.error).toHaveBeenCalledWith(
                'Error saving to localStorage:',
                expect.any(Error)
            );
        });

        it('should handle JSON.stringify errors gracefully', () => {
            const originalStringify = JSON.stringify;
            JSON.stringify = vi.fn(() => {
                throw new Error('stringify error');
            });

            const middleware = localStorageMiddleware(mockStore as any);
            const nextHandler = middleware(mockNext);
            const action = { type: 'cart/addToCart', payload: {} };

            expect(() => nextHandler(action)).not.toThrow();
            expect(console.error).toHaveBeenCalledWith(
                'Error saving to localStorage:',
                expect.any(Error)
            );

            JSON.stringify = originalStringify;
        });
    });

    describe('loadStateFromStorage', () => {
        it('should return undefined when localStorage is empty', () => {
            (localStorage.getItem as any).mockReturnValue(null);

            const result = loadStateFromStorage();

            expect(result).toBeUndefined();
        });

        it('should load and decrypt state from localStorage', () => {
            const stateToSave = {
                cart: mockState.cart,
                checkout: {
                    ...mockState.checkout,
                    currentTransaction: null,
                },
            };

            const encrypted = btoa(JSON.stringify(stateToSave));
            (localStorage.getItem as any).mockReturnValue(encrypted);

            const result = loadStateFromStorage();

            expect(result).toEqual(stateToSave);
        });

        it('should use atob for decryption', () => {
            const stateToSave = { cart: mockState.cart };
            const encrypted = btoa(JSON.stringify(stateToSave));
            (localStorage.getItem as any).mockReturnValue(encrypted);

            const result = loadStateFromStorage();

            expect(result).toBeDefined();
            expect(result.cart).toEqual(mockState.cart);
        });

        it('should handle decryption errors gracefully', () => {
            (localStorage.getItem as any).mockReturnValue('invalid-base64-!@#$%');

            const result = loadStateFromStorage();

            expect(result).toBeUndefined();
            expect(console.error).toHaveBeenCalledWith(
                'Error loading from localStorage:',
                expect.any(Error)
            );
        });

        it('should handle JSON.parse errors gracefully', () => {
            const invalidJSON = btoa('not valid json {]}');
            (localStorage.getItem as any).mockReturnValue(invalidJSON);

            const result = loadStateFromStorage();

            expect(result).toBeUndefined();
            expect(console.error).toHaveBeenCalledWith(
                'Error loading from localStorage:',
                expect.any(Error)
            );
        });

        it('should handle localStorage.getItem errors gracefully', () => {
            (localStorage.getItem as any).mockImplementation(() => {
                throw new Error('localStorage unavailable');
            });

            const result = loadStateFromStorage();

            expect(result).toBeUndefined();
            expect(console.error).toHaveBeenCalledWith(
                'Error loading from localStorage:',
                expect.any(Error)
            );
        });

        it('should load complex state correctly', () => {
            const complexState = {
                cart: {
                    items: [
                        { product: { id: '1', name: 'Product 1', price: 100 }, quantity: 2 },
                        { product: { id: '2', name: 'Product 2', price: 50 }, quantity: 1 },
                    ],
                    totalItems: 3,
                    totalAmount: 250,
                },
                checkout: {
                    transactions: [
                        { id: 'TXN-1', status: 'completed' },
                        { id: 'TXN-2', status: 'failed' },
                    ],
                    shippingAddress: {
                        firstName: 'Jane',
                        lastName: 'Smith',
                    },
                    currentTransaction: null,
                },
            };

            const encrypted = btoa(JSON.stringify(complexState));
            (localStorage.getItem as any).mockReturnValue(encrypted);

            const result = loadStateFromStorage();

            expect(result).toEqual(complexState);
        });
    });

    describe('clearStateFromStorage', () => {
        it('should remove item from localStorage', () => {
            clearStateFromStorage();

            expect(localStorage.removeItem).toHaveBeenCalledWith(STORAGE_KEY);
        });

        it('should handle localStorage.removeItem errors gracefully', () => {
            (localStorage.removeItem as any).mockImplementation(() => {
                throw new Error('localStorage unavailable');
            });

            expect(() => clearStateFromStorage()).not.toThrow();
            expect(console.error).toHaveBeenCalledWith(
                'Error clearing localStorage:',
                expect.any(Error)
            );
        });

        it('should not throw when localStorage is empty', () => {
            (localStorage.getItem as any).mockReturnValue(null);

            expect(() => clearStateFromStorage()).not.toThrow();
            expect(localStorage.removeItem).toHaveBeenCalledWith(STORAGE_KEY);
        });
    });

    describe('Encryption/Decryption', () => {
        it('should encrypt and decrypt data correctly', () => {
            const originalData = { test: 'data', number: 123 };
            const serialized = JSON.stringify(originalData);
            const encrypted = btoa(serialized);
            const decrypted = atob(encrypted);
            const parsed = JSON.parse(decrypted);

            expect(parsed).toEqual(originalData);
        });

        it('should handle special characters in encryption', () => {
            const specialData = {
                text: 'Hello 世界 🌍',
                symbols: '!@#$%^&*()',
            };

            const middleware = localStorageMiddleware(mockStore as any);
            mockStore.getState.mockReturnValue({
                cart: specialData,
                checkout: { currentTransaction: null },
            });

            const nextHandler = middleware(mockNext);
            const action = { type: 'cart/addToCart', payload: {} };

            // Should not throw even with special characters
            expect(() => nextHandler(action)).not.toThrow();
        });

        it('should handle empty state encryption', () => {
            mockStore.getState.mockReturnValue({
                cart: { items: [], totalItems: 0, totalAmount: 0 },
                checkout: { currentTransaction: null, transactions: [] },
            });

            const middleware = localStorageMiddleware(mockStore as any);
            const nextHandler = middleware(mockNext);
            const action = { type: 'cart/addToCart', payload: {} };

            nextHandler(action);

            expect(localStorage.setItem).toHaveBeenCalled();
        });
    });

    describe('Integration Tests', () => {
        it('should save and load state correctly', () => {
            const testState = {
                cart: mockState.cart,
                checkout: {
                    ...mockState.checkout,
                    currentTransaction: null,
                },
            };

            // Save state
            const middleware = localStorageMiddleware(mockStore as any);
            const nextHandler = middleware(mockNext);
            const action = { type: 'cart/addToCart', payload: {} };

            nextHandler(action);

            // Get what was saved
            const savedData = (localStorage.setItem as any).mock.calls[0][1];

            // Mock getItem to return saved data
            (localStorage.getItem as any).mockReturnValue(savedData);

            // Load state
            const loadedState = loadStateFromStorage();

            expect(loadedState).toEqual(testState);
        });

        it('should handle save, load, and clear cycle', () => {
            // Save
            const middleware = localStorageMiddleware(mockStore as any);
            const nextHandler = middleware(mockNext);
            nextHandler({ type: 'cart/addToCart', payload: {} });

            const savedData = (localStorage.setItem as any).mock.calls[0][1];
            (localStorage.getItem as any).mockReturnValue(savedData);

            // Load
            const loadedState = loadStateFromStorage();
            expect(loadedState).toBeDefined();

            // Clear
            clearStateFromStorage();
            expect(localStorage.removeItem).toHaveBeenCalledWith(STORAGE_KEY);

            // Verify cleared
            (localStorage.getItem as any).mockReturnValue(null);
            const reloadedState = loadStateFromStorage();
            expect(reloadedState).toBeUndefined();
        });

        it('should handle multiple saves', () => {
            const middleware = localStorageMiddleware(mockStore as any);
            const nextHandler = middleware(mockNext);

            // First save
            nextHandler({ type: 'cart/addToCart', payload: {} });
            expect(localStorage.setItem).toHaveBeenCalledTimes(1);

            // Second save
            nextHandler({ type: 'cart/updateQuantity', payload: {} });
            expect(localStorage.setItem).toHaveBeenCalledTimes(2);

            // Third save
            nextHandler({ type: 'cart/removeFromCart', payload: '1' });
            expect(localStorage.setItem).toHaveBeenCalledTimes(3);
        });

        it('should update state on each action', () => {
            const middleware = localStorageMiddleware(mockStore as any);
            const nextHandler = middleware(mockNext);

            // First state
            const state1 = { cart: { items: [], totalItems: 0, totalAmount: 0 }, checkout: {} };
            mockStore.getState.mockReturnValue(state1);
            nextHandler({ type: 'cart/addToCart', payload: {} });

            const saved1 = (localStorage.setItem as any).mock.calls[0][1];

            // Second state
            const state2 = { cart: { items: [{ id: '1' }], totalItems: 1, totalAmount: 100 }, checkout: {} };
            mockStore.getState.mockReturnValue(state2);
            nextHandler({ type: 'cart/addToCart', payload: {} });

            const saved2 = (localStorage.setItem as any).mock.calls[1][1];

            expect(saved1).not.toBe(saved2);
        });
    });

    describe('Edge Cases', () => {
        it('should handle very large state objects', () => {
            const largeState = {
                cart: {
                    items: Array(1000).fill(null).map((_, i) => ({
                        product: { id: `${i}`, name: `Product ${i}`, price: i * 10 },
                        quantity: i,
                    })),
                    totalItems: 1000,
                    totalAmount: 5000000,
                },
                checkout: { currentTransaction: null },
            };

            mockStore.getState.mockReturnValue(largeState);

            const middleware = localStorageMiddleware(mockStore as any);
            const nextHandler = middleware(mockNext);
            const action = { type: 'cart/addToCart', payload: {} };

            expect(() => nextHandler(action)).not.toThrow();
            expect(localStorage.setItem).toHaveBeenCalled();
        });

        it('should handle state with null values', () => {
            const stateWithNulls = {
                cart: {
                    items: null,
                    totalItems: 0,
                    totalAmount: 0,
                },
                checkout: {
                    currentTransaction: null,
                    shippingAddress: null,
                },
            };

            mockStore.getState.mockReturnValue(stateWithNulls);

            const middleware = localStorageMiddleware(mockStore as any);
            const nextHandler = middleware(mockNext);
            const action = { type: 'cart/addToCart', payload: {} };

            expect(() => nextHandler(action)).not.toThrow();
        });

        it('should handle state with undefined values', () => {
            const stateWithUndefined = {
                cart: {
                    items: undefined,
                    totalItems: 0,
                },
                checkout: {},
            };

            mockStore.getState.mockReturnValue(stateWithUndefined);

            const middleware = localStorageMiddleware(mockStore as any);
            const nextHandler = middleware(mockNext);
            const action = { type: 'cart/addToCart', payload: {} };

            expect(() => nextHandler(action)).not.toThrow();
        });

        it('should handle action type that starts with tracked prefix', () => {
            const middleware = localStorageMiddleware(mockStore as any);
            const nextHandler = middleware(mockNext);
            const action = { type: 'cart/addToCart/pending' };

            nextHandler(action);

            expect(localStorage.setItem).toHaveBeenCalled();
        });

        it('should handle non-string action types', () => {
            const middleware = localStorageMiddleware(mockStore as any);
            const nextHandler = middleware(mockNext);
            const action = { type: 12345 as any };

            expect(() => nextHandler(action)).not.toThrow();
            expect(localStorage.setItem).not.toHaveBeenCalled();
        });
    });
});
