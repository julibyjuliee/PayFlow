import { describe, it, expect, beforeEach } from 'vitest';
import cartReducer, {
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    loadCartFromStorage,
    type CartState,
} from '../cartSlice';
import type { Product } from '../../../types';

describe('cartSlice', () => {
    // Mock products
    const mockProduct1: Product = {
        id: '1',
        name: 'Product 1',
        description: 'Description 1',
        price: 100,
        category: 'Electronics',
        imageUrl: 'https://example.com/image1.jpg',
        stock: 10,
    };

    const mockProduct2: Product = {
        id: '2',
        name: 'Product 2',
        description: 'Description 2',
        price: 50,
        category: 'Books',
        imageUrl: 'https://example.com/image2.jpg',
        stock: 20,
    };

    const mockProduct3: Product = {
        id: '3',
        name: 'Product 3',
        description: 'Description 3',
        price: 75.50,
        category: 'Clothing',
        imageUrl: 'https://example.com/image3.jpg',
        stock: 5,
    };

    let initialState: CartState;

    beforeEach(() => {
        initialState = {
            items: [],
            totalItems: 0,
            totalAmount: 0,
        };
    });

    describe('Initial State', () => {
        it('should have correct initial state', () => {
            const state = cartReducer(undefined, { type: '@@INIT' });
            expect(state).toEqual({
                items: [],
                totalItems: 0,
                totalAmount: 0,
            });
        });
    });

    describe('addToCart', () => {
        it('should add new item to empty cart', () => {
            const state = cartReducer(
                initialState,
                addToCart({ product: mockProduct1, quantity: 2 })
            );

            expect(state.items).toHaveLength(1);
            expect(state.items[0]).toEqual({
                product: mockProduct1,
                quantity: 2,
            });
        });

        it('should calculate totals when adding new item', () => {
            const state = cartReducer(
                initialState,
                addToCart({ product: mockProduct1, quantity: 2 })
            );

            expect(state.totalItems).toBe(2);
            expect(state.totalAmount).toBe(200); // 100 * 2
        });

        it('should increment quantity if product already exists', () => {
            const stateWithItem: CartState = {
                items: [{ product: mockProduct1, quantity: 2 }],
                totalItems: 2,
                totalAmount: 200,
            };

            const state = cartReducer(
                stateWithItem,
                addToCart({ product: mockProduct1, quantity: 3 })
            );

            expect(state.items).toHaveLength(1);
            expect(state.items[0]?.quantity).toBe(5); // 2 + 3
            expect(state.totalItems).toBe(5);
            expect(state.totalAmount).toBe(500); // 100 * 5
        });

        it('should add multiple different products', () => {
            let state = cartReducer(
                initialState,
                addToCart({ product: mockProduct1, quantity: 2 })
            );

            state = cartReducer(
                state,
                addToCart({ product: mockProduct2, quantity: 1 })
            );

            expect(state.items).toHaveLength(2);
            expect(state.totalItems).toBe(3); // 2 + 1
            expect(state.totalAmount).toBe(250); // (100 * 2) + (50 * 1)
        });

        it('should add single item (quantity 1)', () => {
            const state = cartReducer(
                initialState,
                addToCart({ product: mockProduct1, quantity: 1 })
            );

            expect(state.items[0]?.quantity).toBe(1);
            expect(state.totalItems).toBe(1);
            expect(state.totalAmount).toBe(100);
        });

        it('should handle adding large quantities', () => {
            const state = cartReducer(
                initialState,
                addToCart({ product: mockProduct1, quantity: 100 })
            );

            expect(state.items[0]?.quantity).toBe(100);
            expect(state.totalItems).toBe(100);
            expect(state.totalAmount).toBe(10000); // 100 * 100
        });

        it('should handle products with decimal prices', () => {
            const state = cartReducer(
                initialState,
                addToCart({ product: mockProduct3, quantity: 2 })
            );

            expect(state.totalAmount).toBe(151); // 75.50 * 2
        });

        it('should maintain existing items when adding new one', () => {
            const stateWithItem: CartState = {
                items: [{ product: mockProduct1, quantity: 2 }],
                totalItems: 2,
                totalAmount: 200,
            };

            const state = cartReducer(
                stateWithItem,
                addToCart({ product: mockProduct2, quantity: 1 })
            );

            expect(state.items).toHaveLength(2);
            expect(state.items[0]?.product.id).toBe('1');
            expect(state.items[1]?.product.id).toBe('2');
        });
    });

    describe('removeFromCart', () => {
        it('should remove item from cart', () => {
            const stateWithItem: CartState = {
                items: [{ product: mockProduct1, quantity: 2 }],
                totalItems: 2,
                totalAmount: 200,
            };

            const state = cartReducer(stateWithItem, removeFromCart(mockProduct1.id));

            expect(state.items).toHaveLength(0);
            expect(state.totalItems).toBe(0);
            expect(state.totalAmount).toBe(0);
        });

        it('should remove only specified item', () => {
            const stateWithItems: CartState = {
                items: [
                    { product: mockProduct1, quantity: 2 },
                    { product: mockProduct2, quantity: 1 },
                ],
                totalItems: 3,
                totalAmount: 250,
            };

            const state = cartReducer(stateWithItems, removeFromCart(mockProduct1.id));

            expect(state.items).toHaveLength(1);
            expect(state.items[0]?.product.id).toBe('2');
            expect(state.totalItems).toBe(1);
            expect(state.totalAmount).toBe(50);
        });

        it('should handle removing non-existent item', () => {
            const stateWithItem: CartState = {
                items: [{ product: mockProduct1, quantity: 2 }],
                totalItems: 2,
                totalAmount: 200,
            };

            const state = cartReducer(stateWithItem, removeFromCart('non-existent-id'));

            expect(state.items).toHaveLength(1);
            expect(state.totalItems).toBe(2);
            expect(state.totalAmount).toBe(200);
        });

        it('should handle removing from empty cart', () => {
            const state = cartReducer(initialState, removeFromCart('any-id'));

            expect(state.items).toHaveLength(0);
            expect(state.totalItems).toBe(0);
            expect(state.totalAmount).toBe(0);
        });

        it('should recalculate totals correctly after removal', () => {
            const stateWithItems: CartState = {
                items: [
                    { product: mockProduct1, quantity: 2 },
                    { product: mockProduct2, quantity: 3 },
                    { product: mockProduct3, quantity: 1 },
                ],
                totalItems: 6,
                totalAmount: 425.50,
            };

            const state = cartReducer(stateWithItems, removeFromCart(mockProduct2.id));

            expect(state.totalItems).toBe(3); // 2 + 1
            expect(state.totalAmount).toBe(275.50); // (100 * 2) + (75.50 * 1)
        });
    });

    describe('updateQuantity', () => {
        it('should update quantity of existing item', () => {
            const stateWithItem: CartState = {
                items: [{ product: mockProduct1, quantity: 2 }],
                totalItems: 2,
                totalAmount: 200,
            };

            const state = cartReducer(
                stateWithItem,
                updateQuantity({ productId: mockProduct1.id, quantity: 5 })
            );

            expect(state.items[0]?.quantity).toBe(5);
            expect(state.totalItems).toBe(5);
            expect(state.totalAmount).toBe(500);
        });

        it('should handle updating to quantity 1', () => {
            const stateWithItem: CartState = {
                items: [{ product: mockProduct1, quantity: 10 }],
                totalItems: 10,
                totalAmount: 1000,
            };

            const state = cartReducer(
                stateWithItem,
                updateQuantity({ productId: mockProduct1.id, quantity: 1 })
            );

            expect(state.items[0]?.quantity).toBe(1);
            expect(state.totalItems).toBe(1);
            expect(state.totalAmount).toBe(100);
        });

        it('should handle updating to zero quantity', () => {
            const stateWithItem: CartState = {
                items: [{ product: mockProduct1, quantity: 5 }],
                totalItems: 5,
                totalAmount: 500,
            };

            const state = cartReducer(
                stateWithItem,
                updateQuantity({ productId: mockProduct1.id, quantity: 0 })
            );

            expect(state.items[0]?.quantity).toBe(0);
            expect(state.totalItems).toBe(0);
            expect(state.totalAmount).toBe(0);
        });

        it('should not affect other items when updating quantity', () => {
            const stateWithItems: CartState = {
                items: [
                    { product: mockProduct1, quantity: 2 },
                    { product: mockProduct2, quantity: 3 },
                ],
                totalItems: 5,
                totalAmount: 350,
            };

            const state = cartReducer(
                stateWithItems,
                updateQuantity({ productId: mockProduct1.id, quantity: 10 })
            );

            expect(state.items[0]?.quantity).toBe(10);
            expect(state.items[1]?.quantity).toBe(3);
            expect(state.totalItems).toBe(13);
            expect(state.totalAmount).toBe(1150); // (100 * 10) + (50 * 3)
        });

        it('should handle updating non-existent item', () => {
            const stateWithItem: CartState = {
                items: [{ product: mockProduct1, quantity: 2 }],
                totalItems: 2,
                totalAmount: 200,
            };

            const state = cartReducer(
                stateWithItem,
                updateQuantity({ productId: 'non-existent-id', quantity: 5 })
            );

            expect(state.items).toHaveLength(1);
            expect(state.items[0]?.quantity).toBe(2);
            expect(state.totalItems).toBe(2);
            expect(state.totalAmount).toBe(200);
        });

        it('should recalculate totals correctly with multiple items', () => {
            const stateWithItems: CartState = {
                items: [
                    { product: mockProduct1, quantity: 2 },
                    { product: mockProduct2, quantity: 1 },
                    { product: mockProduct3, quantity: 3 },
                ],
                totalItems: 6,
                totalAmount: 476.50,
            };

            const state = cartReducer(
                stateWithItems,
                updateQuantity({ productId: mockProduct3.id, quantity: 1 })
            );

            expect(state.totalItems).toBe(4); // 2 + 1 + 1
            expect(state.totalAmount).toBe(325.50); // (100 * 2) + (50 * 1) + (75.50 * 1)
        });
    });

    describe('clearCart', () => {
        it('should clear all items from cart', () => {
            const stateWithItems: CartState = {
                items: [
                    { product: mockProduct1, quantity: 2 },
                    { product: mockProduct2, quantity: 3 },
                ],
                totalItems: 5,
                totalAmount: 350,
            };

            const state = cartReducer(stateWithItems, clearCart());

            expect(state.items).toHaveLength(0);
            expect(state.totalItems).toBe(0);
            expect(state.totalAmount).toBe(0);
        });

        it('should handle clearing empty cart', () => {
            const state = cartReducer(initialState, clearCart());

            expect(state.items).toHaveLength(0);
            expect(state.totalItems).toBe(0);
            expect(state.totalAmount).toBe(0);
        });

        it('should reset all totals to zero', () => {
            const stateWithItems: CartState = {
                items: [{ product: mockProduct1, quantity: 100 }],
                totalItems: 100,
                totalAmount: 10000,
            };

            const state = cartReducer(stateWithItems, clearCart());

            expect(state).toEqual(initialState);
        });
    });

    describe('loadCartFromStorage', () => {
        it('should replace entire state with loaded data', () => {
            const loadedState: CartState = {
                items: [
                    { product: mockProduct1, quantity: 2 },
                    { product: mockProduct2, quantity: 1 },
                ],
                totalItems: 3,
                totalAmount: 250,
            };

            const state = cartReducer(initialState, loadCartFromStorage(loadedState));

            expect(state).toEqual(loadedState);
        });

        it('should handle loading empty cart', () => {
            const emptyState: CartState = {
                items: [],
                totalItems: 0,
                totalAmount: 0,
            };

            const state = cartReducer(initialState, loadCartFromStorage(emptyState));

            expect(state).toEqual(emptyState);
        });

        it('should overwrite existing cart data', () => {
            const existingState: CartState = {
                items: [{ product: mockProduct3, quantity: 5 }],
                totalItems: 5,
                totalAmount: 377.50,
            };

            const loadedState: CartState = {
                items: [{ product: mockProduct1, quantity: 1 }],
                totalItems: 1,
                totalAmount: 100,
            };

            const state = cartReducer(existingState, loadCartFromStorage(loadedState));

            expect(state).toEqual(loadedState);
            expect(state.items).toHaveLength(1);
            expect(state.items[0]?.product.id).toBe('1');
        });

        it('should handle loading cart with multiple items', () => {
            const loadedState: CartState = {
                items: [
                    { product: mockProduct1, quantity: 2 },
                    { product: mockProduct2, quantity: 3 },
                    { product: mockProduct3, quantity: 1 },
                ],
                totalItems: 6,
                totalAmount: 425.50,
            };

            const state = cartReducer(initialState, loadCartFromStorage(loadedState));

            expect(state.items).toHaveLength(3);
            expect(state.totalItems).toBe(6);
            expect(state.totalAmount).toBe(425.50);
        });
    });

    describe('Integration Tests - State Transitions', () => {
        it('should handle adding, updating, and removing items', () => {
            // Add first item
            let state = cartReducer(
                initialState,
                addToCart({ product: mockProduct1, quantity: 2 })
            );
            expect(state.items).toHaveLength(1);
            expect(state.totalItems).toBe(2);

            // Add second item
            state = cartReducer(
                state,
                addToCart({ product: mockProduct2, quantity: 3 })
            );
            expect(state.items).toHaveLength(2);
            expect(state.totalItems).toBe(5);

            // Update first item quantity
            state = cartReducer(
                state,
                updateQuantity({ productId: mockProduct1.id, quantity: 5 })
            );
            expect(state.totalItems).toBe(8); // 5 + 3

            // Remove second item
            state = cartReducer(state, removeFromCart(mockProduct2.id));
            expect(state.items).toHaveLength(1);
            expect(state.totalItems).toBe(5);
        });

        it('should handle multiple additions of same product', () => {
            let state = cartReducer(
                initialState,
                addToCart({ product: mockProduct1, quantity: 1 })
            );
            expect(state.items[0]?.quantity).toBe(1);

            state = cartReducer(
                state,
                addToCart({ product: mockProduct1, quantity: 2 })
            );
            expect(state.items[0]?.quantity).toBe(3);

            state = cartReducer(
                state,
                addToCart({ product: mockProduct1, quantity: 7 })
            );
            expect(state.items).toHaveLength(1);
            expect(state.items[0]?.quantity).toBe(10);
        });

        it('should handle full shopping flow', () => {
            // Add items to cart
            let state = cartReducer(
                initialState,
                addToCart({ product: mockProduct1, quantity: 2 })
            );
            state = cartReducer(
                state,
                addToCart({ product: mockProduct2, quantity: 1 })
            );
            state = cartReducer(
                state,
                addToCart({ product: mockProduct3, quantity: 3 })
            );

            expect(state.items).toHaveLength(3);
            expect(state.totalItems).toBe(6);

            // Update quantity
            state = cartReducer(
                state,
                updateQuantity({ productId: mockProduct2.id, quantity: 5 })
            );
            expect(state.totalItems).toBe(10);

            // Remove one item
            state = cartReducer(state, removeFromCart(mockProduct3.id));
            expect(state.items).toHaveLength(2);

            // Clear cart after checkout
            state = cartReducer(state, clearCart());
            expect(state).toEqual(initialState);
        });

        it('should maintain consistency after multiple operations', () => {
            let state = cartReducer(
                initialState,
                addToCart({ product: mockProduct1, quantity: 3 })
            );
            state = cartReducer(
                state,
                addToCart({ product: mockProduct2, quantity: 2 })
            );

            const expectedTotalItems = 5;
            const expectedTotalAmount = 400; // (100 * 3) + (50 * 2)

            expect(state.totalItems).toBe(expectedTotalItems);
            expect(state.totalAmount).toBe(expectedTotalAmount);

            // Verify consistency
            const calculatedItems = state.items.reduce(
                (sum, item) => sum + item.quantity,
                0
            );
            const calculatedAmount = state.items.reduce(
                (sum, item) => sum + item.product.price * item.quantity,
                0
            );

            expect(state.totalItems).toBe(calculatedItems);
            expect(state.totalAmount).toBe(calculatedAmount);
        });
    });

    describe('Edge Cases', () => {
        it('should handle zero price products', () => {
            const freeProduct: Product = {
                ...mockProduct1,
                price: 0,
            };

            const state = cartReducer(
                initialState,
                addToCart({ product: freeProduct, quantity: 10 })
            );

            expect(state.totalAmount).toBe(0);
            expect(state.totalItems).toBe(10);
        });

        it('should handle very large quantities', () => {
            const state = cartReducer(
                initialState,
                addToCart({ product: mockProduct1, quantity: 1000000 })
            );

            expect(state.totalItems).toBe(1000000);
            expect(state.totalAmount).toBe(100000000);
        });

        it('should handle products with very high prices', () => {
            const expensiveProduct: Product = {
                ...mockProduct1,
                price: 999999.99,
            };

            const state = cartReducer(
                initialState,
                addToCart({ product: expensiveProduct, quantity: 2 })
            );

            expect(state.totalAmount).toBe(1999999.98);
        });

        it('should handle decimal price calculations correctly', () => {
            const productWithDecimal: Product = {
                ...mockProduct1,
                price: 19.99,
            };

            const state = cartReducer(
                initialState,
                addToCart({ product: productWithDecimal, quantity: 3 })
            );

            expect(state.totalAmount).toBeCloseTo(59.97, 2);
        });

        it('should handle updating to very large quantity', () => {
            const stateWithItem: CartState = {
                items: [{ product: mockProduct1, quantity: 1 }],
                totalItems: 1,
                totalAmount: 100,
            };

            const state = cartReducer(
                stateWithItem,
                updateQuantity({ productId: mockProduct1.id, quantity: 500000 })
            );

            expect(state.totalItems).toBe(500000);
            expect(state.totalAmount).toBe(50000000);
        });

        it('should handle cart with single item', () => {
            const state = cartReducer(
                initialState,
                addToCart({ product: mockProduct1, quantity: 1 })
            );

            expect(state.items).toHaveLength(1);
            expect(state.totalItems).toBe(1);
            expect(state.totalAmount).toBe(100);
        });

        it('should handle multiple products with same price', () => {
            const product1Copy: Product = {
                ...mockProduct1,
                id: '100',
            };

            const product2Copy: Product = {
                ...mockProduct1,
                id: '101',
            };

            let state = cartReducer(
                initialState,
                addToCart({ product: product1Copy, quantity: 2 })
            );
            state = cartReducer(
                state,
                addToCart({ product: product2Copy, quantity: 3 })
            );

            expect(state.items).toHaveLength(2);
            expect(state.totalItems).toBe(5);
            expect(state.totalAmount).toBe(500); // 100 * 5
        });

        it('should maintain precision with floating point calculations', () => {
            const product1: Product = { ...mockProduct1, price: 0.1 };
            const product2: Product = { ...mockProduct1, id: '2', price: 0.2 };

            let state = cartReducer(
                initialState,
                addToCart({ product: product1, quantity: 1 })
            );
            state = cartReducer(
                state,
                addToCart({ product: product2, quantity: 1 })
            );

            expect(state.totalAmount).toBeCloseTo(0.3, 10);
        });
    });

    describe('Total Calculations', () => {
        it('should calculate correct totals for single item', () => {
            const state = cartReducer(
                initialState,
                addToCart({ product: mockProduct1, quantity: 5 })
            );

            expect(state.totalItems).toBe(5);
            expect(state.totalAmount).toBe(500);
        });

        it('should calculate correct totals for multiple items', () => {
            let state = cartReducer(
                initialState,
                addToCart({ product: mockProduct1, quantity: 2 })
            );
            state = cartReducer(
                state,
                addToCart({ product: mockProduct2, quantity: 4 })
            );
            state = cartReducer(
                state,
                addToCart({ product: mockProduct3, quantity: 1 })
            );

            expect(state.totalItems).toBe(7); // 2 + 4 + 1
            expect(state.totalAmount).toBe(475.50); // (100 * 2) + (50 * 4) + (75.50 * 1)
        });

        it('should recalculate totals after quantity update', () => {
            const stateWithItems: CartState = {
                items: [
                    { product: mockProduct1, quantity: 2 },
                    { product: mockProduct2, quantity: 2 },
                ],
                totalItems: 4,
                totalAmount: 300,
            };

            const state = cartReducer(
                stateWithItems,
                updateQuantity({ productId: mockProduct1.id, quantity: 10 })
            );

            expect(state.totalItems).toBe(12); // 10 + 2
            expect(state.totalAmount).toBe(1100); // (100 * 10) + (50 * 2)
        });

        it('should recalculate totals after item removal', () => {
            const stateWithItems: CartState = {
                items: [
                    { product: mockProduct1, quantity: 5 },
                    { product: mockProduct2, quantity: 3 },
                ],
                totalItems: 8,
                totalAmount: 650,
            };

            const state = cartReducer(stateWithItems, removeFromCart(mockProduct1.id));

            expect(state.totalItems).toBe(3);
            expect(state.totalAmount).toBe(150); // 50 * 3
        });
    });
});
