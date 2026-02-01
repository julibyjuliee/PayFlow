import { describe, it, expect, beforeEach, vi } from 'vitest';
import checkoutReducer, {
    setShippingAddress,
    createTransaction,
    completeTransaction,
    failTransaction,
    clearCurrentTransaction,
    loadTransactionsFromStorage,
    type CheckoutState,
    type ShippingAddress,
    type PaymentInfo,
    type Transaction,
} from '../checkoutSlice';
import type { Product } from '../../../types';

describe('checkoutSlice', () => {
    // Mock data
    const mockShippingAddress: ShippingAddress = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@example.com',
        address: '123 Main St',
        city: 'New York',
        postalCode: '10001',
    };

    const mockPaymentInfo: PaymentInfo = {
        cardNumber: '4532015112830366',
        expiryDate: '12/25',
        cvv: '123',
    };

    const mockProduct: Product = {
        id: '1',
        name: 'Test Product',
        description: 'Test Description',
        price: 100,
        category: 'Electronics',
        imageUrl: 'https://example.com/image.jpg',
        stock: 10,
    };

    let initialState: CheckoutState;

    beforeEach(() => {
        initialState = {
            currentTransaction: null,
            transactions: [],
            shippingAddress: null,
            paymentTotal: null,

        };
        vi.clearAllMocks();
    });

    describe('Initial State', () => {
        it('should have correct initial state', () => {
            const state = checkoutReducer(undefined, { type: '@@INIT' });
            expect(state).toEqual({
                currentTransaction: null,
                transactions: [],
                shippingAddress: null,
                paymentTotal: null,
            });
        });
    });

    describe('setShippingAddress', () => {
        it('should set shipping address', () => {
            const state = checkoutReducer(
                initialState,
                setShippingAddress(mockShippingAddress)
            );

            expect(state.shippingAddress).toEqual(mockShippingAddress);
        });

        it('should update existing shipping address', () => {
            const existingAddress: ShippingAddress = {
                firstName: 'Jane',
                lastName: 'Smith',
                email: 'jane@example.com',
                address: '456 Oak Ave',
                city: 'Los Angeles',
                postalCode: '90001',
            };

            const stateWithAddress: CheckoutState = {
                ...initialState,
                shippingAddress: existingAddress,
            };

            const state = checkoutReducer(
                stateWithAddress,
                setShippingAddress(mockShippingAddress)
            );

            expect(state.shippingAddress).toEqual(mockShippingAddress);
            expect(state.shippingAddress).not.toEqual(existingAddress);
        });
    });

    describe('createTransaction', () => {
        it('should create transaction with correct structure', () => {
            const state = checkoutReducer(
                initialState,
                createTransaction({
                    product: mockProduct,
                    quantity: 2,
                    shippingAddress: mockShippingAddress,
                    paymentInfo: mockPaymentInfo,
                    email: mockShippingAddress.email,
                })
            );

            expect(state.currentTransaction).toBeDefined();
            expect(state.currentTransaction?.product).toEqual(mockProduct);
            expect(state.currentTransaction?.quantity).toBe(2);
            expect(state.currentTransaction?.shippingAddress).toEqual(mockShippingAddress);
            expect(state.currentTransaction?.email).toBe(mockShippingAddress.email);
        });

        it('should calculate subtotal correctly', () => {
            const state = checkoutReducer(
                initialState,
                createTransaction({
                    product: mockProduct,
                    quantity: 3,
                    shippingAddress: mockShippingAddress,
                    paymentInfo: mockPaymentInfo,
                    email: mockShippingAddress.email,
                })
            );

            expect(state.currentTransaction?.subtotal).toBe(300); // 100 * 3
        });

        it('should calculate tax correctly (8%)', () => {
            const state = checkoutReducer(
                initialState,
                createTransaction({
                    product: mockProduct,
                    quantity: 2,
                    shippingAddress: mockShippingAddress,
                    paymentInfo: mockPaymentInfo,
                    email: mockShippingAddress.email,
                })
            );

            expect(state.currentTransaction?.tax).toBe(16); // 200 * 0.08
        });

        it('should calculate total correctly', () => {
            const state = checkoutReducer(
                initialState,
                createTransaction({
                    product: mockProduct,
                    quantity: 2,
                    shippingAddress: mockShippingAddress,
                    paymentInfo: mockPaymentInfo,
                    email: mockShippingAddress.email,
                })
            );

            expect(state.currentTransaction?.total).toBe(216); // 200 + 16
        });

        it('should generate unique transaction ID', () => {
            const state1 = checkoutReducer(
                initialState,
                createTransaction({
                    product: mockProduct,
                    quantity: 1,
                    shippingAddress: mockShippingAddress,
                    paymentInfo: mockPaymentInfo,
                    email: mockShippingAddress.email,
                })
            );

            const state2 = checkoutReducer(
                initialState,
                createTransaction({
                    product: mockProduct,
                    quantity: 1,
                    shippingAddress: mockShippingAddress,
                    paymentInfo: mockPaymentInfo,
                    email: mockShippingAddress.email,
                })
            );

            expect(state1.currentTransaction?.id).toBeDefined();
            expect(state2.currentTransaction?.id).toBeDefined();
            expect(state1.currentTransaction?.id).not.toBe(state2.currentTransaction?.id);
            expect(state1.currentTransaction?.id).toMatch(/^TXN-\d+-[a-z0-9]+$/);
        });

        it('should mask card number (only last 4 digits)', () => {
            const state = checkoutReducer(
                initialState,
                createTransaction({
                    product: mockProduct,
                    quantity: 1,
                    shippingAddress: mockShippingAddress,
                    paymentInfo: mockPaymentInfo,
                    email: mockShippingAddress.email,
                })
            );

            expect(state.currentTransaction?.paymentInfo.cardNumber).toBe('****0366');
            expect(state.currentTransaction?.paymentInfo.cardNumber).not.toContain('4532015112830366');
        });

        it('should mask card number correctly for different card lengths', () => {
            const amexPaymentInfo: PaymentInfo = {
                cardNumber: '378282246310005', // 15 digits (Amex)
                expiryDate: '12/25',
                cvv: '1234',
            };

            const state = checkoutReducer(
                initialState,
                createTransaction({
                    product: mockProduct,
                    quantity: 1,
                    shippingAddress: mockShippingAddress,
                    paymentInfo: amexPaymentInfo,
                    email: mockShippingAddress.email,
                })
            );

            expect(state.currentTransaction?.paymentInfo.cardNumber).toBe('****0005');
        });

        it('should not store CVV', () => {
            const state = checkoutReducer(
                initialState,
                createTransaction({
                    product: mockProduct,
                    quantity: 1,
                    shippingAddress: mockShippingAddress,
                    paymentInfo: mockPaymentInfo,
                    email: mockShippingAddress.email,
                })
            );

            expect(state.currentTransaction?.paymentInfo).not.toHaveProperty('cvv');
        });

        it('should store expiry date', () => {
            const state = checkoutReducer(
                initialState,
                createTransaction({
                    product: mockProduct,
                    quantity: 1,
                    shippingAddress: mockShippingAddress,
                    paymentInfo: mockPaymentInfo,
                    email: mockShippingAddress.email,
                })
            );

            expect(state.currentTransaction?.paymentInfo.expiryDate).toBe('12/25');
        });

        it('should set status to "pending"', () => {
            const state = checkoutReducer(
                initialState,
                createTransaction({
                    product: mockProduct,
                    quantity: 1,
                    shippingAddress: mockShippingAddress,
                    paymentInfo: mockPaymentInfo,
                    email: mockShippingAddress.email,
                })
            );

            expect(state.currentTransaction?.status).toBe('pending');
        });

        it('should set timestamp', () => {
            const beforeTime = Date.now();

            const state = checkoutReducer(
                initialState,
                createTransaction({
                    product: mockProduct,
                    quantity: 1,
                    shippingAddress: mockShippingAddress,
                    paymentInfo: mockPaymentInfo,
                    email: mockShippingAddress.email,
                })
            );

            const afterTime = Date.now();

            expect(state.currentTransaction?.timestamp).toBeDefined();
            expect(state.currentTransaction?.timestamp).toBeGreaterThanOrEqual(beforeTime);
            expect(state.currentTransaction?.timestamp).toBeLessThanOrEqual(afterTime);
        });

        it('should set email correctly', () => {
            const customEmail = 'custom@example.com';

            const state = checkoutReducer(
                initialState,
                createTransaction({
                    product: mockProduct,
                    quantity: 1,
                    shippingAddress: mockShippingAddress,
                    paymentInfo: mockPaymentInfo,
                    email: customEmail,
                })
            );

            expect(state.currentTransaction?.email).toBe(customEmail);
        });

        it('should handle decimal calculations correctly', () => {
            const productWithDecimal: Product = {
                ...mockProduct,
                price: 99.99,
            };

            const state = checkoutReducer(
                initialState,
                createTransaction({
                    product: productWithDecimal,
                    quantity: 1,
                    shippingAddress: mockShippingAddress,
                    paymentInfo: mockPaymentInfo,
                    email: mockShippingAddress.email,
                })
            );

            expect(state.currentTransaction?.subtotal).toBe(99.99);
            expect(state.currentTransaction?.tax).toBeCloseTo(7.9992, 4);
            expect(state.currentTransaction?.total).toBeCloseTo(107.9892, 4);
        });
    });

    describe('completeTransaction', () => {
        it('should mark transaction as completed', () => {
            const stateWithTransaction = checkoutReducer(
                initialState,
                createTransaction({
                    product: mockProduct,
                    quantity: 1,
                    shippingAddress: mockShippingAddress,
                    paymentInfo: mockPaymentInfo,
                    email: mockShippingAddress.email,
                })
            );

            const state = checkoutReducer(stateWithTransaction, completeTransaction());

            expect(state.transactions[0]?.status).toBe('completed');
        });

        it('should add transaction to transactions array', () => {
            const stateWithTransaction = checkoutReducer(
                initialState,
                createTransaction({
                    product: mockProduct,
                    quantity: 1,
                    shippingAddress: mockShippingAddress,
                    paymentInfo: mockPaymentInfo,
                    email: mockShippingAddress.email,
                })
            );

            const state = checkoutReducer(stateWithTransaction, completeTransaction());

            expect(state.transactions).toHaveLength(1);
            expect(state.transactions[0]).toBeDefined();
        });

        it('should clear currentTransaction', () => {
            const stateWithTransaction = checkoutReducer(
                initialState,
                createTransaction({
                    product: mockProduct,
                    quantity: 1,
                    shippingAddress: mockShippingAddress,
                    paymentInfo: mockPaymentInfo,
                    email: mockShippingAddress.email,
                })
            );

            const state = checkoutReducer(stateWithTransaction, completeTransaction());

            expect(state.currentTransaction).toBeNull();
        });

        it('should do nothing if no current transaction', () => {
            const state = checkoutReducer(initialState, completeTransaction());

            expect(state.currentTransaction).toBeNull();
            expect(state.transactions).toHaveLength(0);
        });

        it('should preserve existing transactions', () => {
            const existingTransaction: Transaction = {
                id: 'TXN-123',
                timestamp: Date.now(),
                product: mockProduct,
                quantity: 1,
                shippingAddress: mockShippingAddress,
                email: mockShippingAddress.email,
                paymentInfo: {
                    cardNumber: '****1234',
                    expiryDate: '12/25',
                },
                subtotal: 100,
                tax: 8,
                total: 108,
                status: 'completed',
            };

            const stateWithExisting: CheckoutState = {
                ...initialState,
                transactions: [existingTransaction],
            };

            const stateWithNew = checkoutReducer(
                stateWithExisting,
                createTransaction({
                    product: mockProduct,
                    quantity: 2,
                    shippingAddress: mockShippingAddress,
                    paymentInfo: mockPaymentInfo,
                    email: mockShippingAddress.email,
                })
            );

            const finalState = checkoutReducer(stateWithNew, completeTransaction());

            expect(finalState.transactions).toHaveLength(2);
            expect(finalState.transactions[0]).toEqual(existingTransaction);
        });
    });

    describe('failTransaction', () => {
        it('should mark transaction as failed', () => {
            const stateWithTransaction = checkoutReducer(
                initialState,
                createTransaction({
                    product: mockProduct,
                    quantity: 1,
                    shippingAddress: mockShippingAddress,
                    paymentInfo: mockPaymentInfo,
                    email: mockShippingAddress.email,
                })
            );

            const state = checkoutReducer(stateWithTransaction, failTransaction());

            expect(state.transactions[0]?.status).toBe('failed');
        });

        it('should add transaction to transactions array', () => {
            const stateWithTransaction = checkoutReducer(
                initialState,
                createTransaction({
                    product: mockProduct,
                    quantity: 1,
                    shippingAddress: mockShippingAddress,
                    paymentInfo: mockPaymentInfo,
                    email: mockShippingAddress.email,
                })
            );

            const state = checkoutReducer(stateWithTransaction, failTransaction());

            expect(state.transactions).toHaveLength(1);
            expect(state.transactions[0]).toBeDefined();
        });

        it('should clear currentTransaction', () => {
            const stateWithTransaction = checkoutReducer(
                initialState,
                createTransaction({
                    product: mockProduct,
                    quantity: 1,
                    shippingAddress: mockShippingAddress,
                    paymentInfo: mockPaymentInfo,
                    email: mockShippingAddress.email,
                })
            );

            const state = checkoutReducer(stateWithTransaction, failTransaction());

            expect(state.currentTransaction).toBeNull();
        });

        it('should do nothing if no current transaction', () => {
            const state = checkoutReducer(initialState, failTransaction());

            expect(state.currentTransaction).toBeNull();
            expect(state.transactions).toHaveLength(0);
        });

        it('should preserve existing transactions', () => {
            const existingTransaction: Transaction = {
                id: 'TXN-123',
                timestamp: Date.now(),
                product: mockProduct,
                quantity: 1,
                shippingAddress: mockShippingAddress,
                email: mockShippingAddress.email,
                paymentInfo: {
                    cardNumber: '****1234',
                    expiryDate: '12/25',
                },
                subtotal: 100,
                tax: 8,
                total: 108,
                status: 'completed',
            };

            const stateWithExisting: CheckoutState = {
                ...initialState,
                transactions: [existingTransaction],
            };

            const stateWithNew = checkoutReducer(
                stateWithExisting,
                createTransaction({
                    product: mockProduct,
                    quantity: 2,
                    shippingAddress: mockShippingAddress,
                    paymentInfo: mockPaymentInfo,
                    email: mockShippingAddress.email,
                })
            );

            const finalState = checkoutReducer(stateWithNew, failTransaction());

            expect(finalState.transactions).toHaveLength(2);
            expect(finalState.transactions[0]).toEqual(existingTransaction);
        });
    });

    describe('clearCurrentTransaction', () => {
        it('should clear current transaction', () => {
            const stateWithTransaction = checkoutReducer(
                initialState,
                createTransaction({
                    product: mockProduct,
                    quantity: 1,
                    shippingAddress: mockShippingAddress,
                    paymentInfo: mockPaymentInfo,
                    email: mockShippingAddress.email,
                })
            );

            const state = checkoutReducer(stateWithTransaction, clearCurrentTransaction());

            expect(state.currentTransaction).toBeNull();
        });

        it('should not affect transactions array', () => {
            const existingTransaction: Transaction = {
                id: 'TXN-123',
                timestamp: Date.now(),
                product: mockProduct,
                quantity: 1,
                shippingAddress: mockShippingAddress,
                email: mockShippingAddress.email,
                paymentInfo: {
                    cardNumber: '****1234',
                    expiryDate: '12/25',
                },
                subtotal: 100,
                tax: 8,
                total: 108,
                status: 'completed',
            };

            const stateWithTransactions: CheckoutState = {
                currentTransaction: null,
                transactions: [existingTransaction],
                shippingAddress: mockShippingAddress,
                paymentTotal: null,

            };

            const state = checkoutReducer(stateWithTransactions, clearCurrentTransaction());

            expect(state.transactions).toHaveLength(1);
            expect(state.transactions[0]).toEqual(existingTransaction);
        });

        it('should handle clearing when already null', () => {
            const state = checkoutReducer(initialState, clearCurrentTransaction());

            expect(state.currentTransaction).toBeNull();
        });

        it('should not affect shipping address', () => {
            const stateWithAddress: CheckoutState = {
                ...initialState,
                shippingAddress: mockShippingAddress,
            };

            const stateWithTransaction = checkoutReducer(
                stateWithAddress,
                createTransaction({
                    product: mockProduct,
                    quantity: 1,
                    shippingAddress: mockShippingAddress,
                    paymentInfo: mockPaymentInfo,
                    email: mockShippingAddress.email,
                })
            );

            const finalState = checkoutReducer(stateWithTransaction, clearCurrentTransaction());

            expect(finalState.shippingAddress).toEqual(mockShippingAddress);
        });
    });

    describe('loadTransactionsFromStorage', () => {
        it('should replace entire state with loaded data', () => {
            const loadedState: CheckoutState = {
                currentTransaction: null,
                transactions: [
                    {
                        id: 'TXN-123',
                        timestamp: Date.now(),
                        product: mockProduct,
                        quantity: 1,
                        shippingAddress: mockShippingAddress,
                        email: mockShippingAddress.email,
                        paymentInfo: {
                            cardNumber: '****1234',
                            expiryDate: '12/25',
                        },
                        subtotal: 100,
                        tax: 8,
                        total: 108,
                        status: 'completed',
                    },
                ],
                shippingAddress: mockShippingAddress,
                paymentTotal: null,

            };

            const state = checkoutReducer(initialState, loadTransactionsFromStorage(loadedState));

            expect(state).toEqual(loadedState);
        });

        it('should handle loading empty state', () => {
            const emptyLoadedState: CheckoutState = {
                currentTransaction: null,
                transactions: [],
                shippingAddress: null,
                paymentTotal: null,

            };

            const state = checkoutReducer(initialState, loadTransactionsFromStorage(emptyLoadedState));

            expect(state).toEqual(emptyLoadedState);
        });

        it('should handle loading with multiple transactions', () => {
            const multipleTransactions: Transaction[] = [
                {
                    id: 'TXN-1',
                    timestamp: Date.now(),
                    product: mockProduct,
                    quantity: 1,
                    shippingAddress: mockShippingAddress,
                    email: mockShippingAddress.email,
                    paymentInfo: { cardNumber: '****1111', expiryDate: '12/25' },
                    subtotal: 100,
                    tax: 8,
                    total: 108,
                    status: 'completed',
                },
                {
                    id: 'TXN-2',
                    timestamp: Date.now(),
                    product: mockProduct,
                    quantity: 2,
                    shippingAddress: mockShippingAddress,
                    email: mockShippingAddress.email,
                    paymentInfo: { cardNumber: '****2222', expiryDate: '01/26' },
                    subtotal: 200,
                    tax: 16,
                    total: 216,
                    status: 'failed',
                },
            ];

            const loadedState: CheckoutState = {
                currentTransaction: null,
                transactions: multipleTransactions,
                shippingAddress: mockShippingAddress,
                paymentTotal: null,

            };

            const state = checkoutReducer(initialState, loadTransactionsFromStorage(loadedState));

            expect(state.transactions).toHaveLength(2);
            expect(state.transactions).toEqual(multipleTransactions);
        });

        it('should overwrite existing state completely', () => {
            const existingState: CheckoutState = {
                currentTransaction: {
                    id: 'TXN-OLD',
                    timestamp: Date.now(),
                    product: mockProduct,
                    quantity: 5,
                    shippingAddress: mockShippingAddress,
                    email: mockShippingAddress.email,
                    paymentInfo: { cardNumber: '****9999', expiryDate: '12/25' },
                    subtotal: 500,
                    tax: 40,
                    total: 540,
                    status: 'pending',
                },
                transactions: [
                    {
                        id: 'TXN-EXISTING',
                        timestamp: Date.now(),
                        product: mockProduct,
                        quantity: 1,
                        shippingAddress: mockShippingAddress,
                        email: mockShippingAddress.email,
                        paymentInfo: { cardNumber: '****8888', expiryDate: '12/25' },
                        subtotal: 100,
                        tax: 8,
                        total: 108,
                        status: 'completed',
                    },
                ],
                shippingAddress: {
                    firstName: 'Old',
                    lastName: 'User',
                    email: 'old@example.com',
                    address: 'Old Address',
                    city: 'Old City',
                    postalCode: '00000',

                },
                paymentTotal: null,

            };

            const newState: CheckoutState = {
                currentTransaction: null,
                transactions: [],
                shippingAddress: null,
                paymentTotal: null,

            };

            const state = checkoutReducer(existingState, loadTransactionsFromStorage(newState));

            expect(state).toEqual(newState);
            expect(state.currentTransaction).toBeNull();
            expect(state.transactions).toHaveLength(0);
            expect(state.shippingAddress).toBeNull();
        });
    });

    describe('Integration Tests - State Transitions', () => {
        it('should handle complete transaction flow', () => {
            // Create transaction
            let state = checkoutReducer(
                initialState,
                createTransaction({
                    product: mockProduct,
                    quantity: 2,
                    shippingAddress: mockShippingAddress,
                    paymentInfo: mockPaymentInfo,
                    email: mockShippingAddress.email,
                })
            );

            expect(state.currentTransaction).toBeDefined();
            expect(state.currentTransaction?.status).toBe('pending');
            expect(state.transactions).toHaveLength(0);

            // Complete transaction
            state = checkoutReducer(state, completeTransaction());

            expect(state.currentTransaction).toBeNull();
            expect(state.transactions).toHaveLength(1);
            expect(state.transactions[0]?.status).toBe('completed');
        });

        it('should handle failed transaction flow', () => {
            // Create transaction
            let state = checkoutReducer(
                initialState,
                createTransaction({
                    product: mockProduct,
                    quantity: 1,
                    shippingAddress: mockShippingAddress,
                    paymentInfo: mockPaymentInfo,
                    email: mockShippingAddress.email,
                })
            );

            expect(state.currentTransaction).toBeDefined();
            expect(state.currentTransaction?.status).toBe('pending');

            // Fail transaction
            state = checkoutReducer(state, failTransaction());

            expect(state.currentTransaction).toBeNull();
            expect(state.transactions).toHaveLength(1);
            expect(state.transactions[0]?.status).toBe('failed');
        });

        it('should handle multiple sequential transactions', () => {
            // First transaction
            let state = checkoutReducer(
                initialState,
                createTransaction({
                    product: mockProduct,
                    quantity: 1,
                    shippingAddress: mockShippingAddress,
                    paymentInfo: mockPaymentInfo,
                    email: mockShippingAddress.email,
                })
            );
            state = checkoutReducer(state, completeTransaction());

            // Second transaction
            state = checkoutReducer(
                state,
                createTransaction({
                    product: mockProduct,
                    quantity: 2,
                    shippingAddress: mockShippingAddress,
                    paymentInfo: mockPaymentInfo,
                    email: mockShippingAddress.email,
                })
            );
            state = checkoutReducer(state, failTransaction());

            // Third transaction
            state = checkoutReducer(
                state,
                createTransaction({
                    product: mockProduct,
                    quantity: 3,
                    shippingAddress: mockShippingAddress,
                    paymentInfo: mockPaymentInfo,
                    email: mockShippingAddress.email,
                })
            );
            state = checkoutReducer(state, completeTransaction());

            expect(state.transactions).toHaveLength(3);
            expect(state.transactions[0]?.status).toBe('completed');
            expect(state.transactions[0]?.quantity).toBe(1);
            expect(state.transactions[1]?.status).toBe('failed');
            expect(state.transactions[1]?.quantity).toBe(2);
            expect(state.transactions[2]?.status).toBe('completed');
            expect(state.transactions[2]?.quantity).toBe(3);
        });

        it('should handle transaction creation followed by clear', () => {
            let state = checkoutReducer(
                initialState,
                createTransaction({
                    product: mockProduct,
                    quantity: 1,
                    shippingAddress: mockShippingAddress,
                    paymentInfo: mockPaymentInfo,
                    email: mockShippingAddress.email,
                })
            );

            expect(state.currentTransaction).toBeDefined();

            state = checkoutReducer(state, clearCurrentTransaction());

            expect(state.currentTransaction).toBeNull();
            expect(state.transactions).toHaveLength(0);
        });

        it('should persist shipping address across transactions', () => {
            let state = checkoutReducer(initialState, setShippingAddress(mockShippingAddress));

            state = checkoutReducer(
                state,
                createTransaction({
                    product: mockProduct,
                    quantity: 1,
                    shippingAddress: mockShippingAddress,
                    paymentInfo: mockPaymentInfo,
                    email: mockShippingAddress.email,
                })
            );

            state = checkoutReducer(state, completeTransaction());

            expect(state.shippingAddress).toEqual(mockShippingAddress);
        });
    });

    describe('Edge Cases', () => {
        it('should handle zero quantity (edge case)', () => {
            const state = checkoutReducer(
                initialState,
                createTransaction({
                    product: mockProduct,
                    quantity: 0,
                    shippingAddress: mockShippingAddress,
                    paymentInfo: mockPaymentInfo,
                    email: mockShippingAddress.email,
                })
            );

            expect(state.currentTransaction?.subtotal).toBe(0);
            expect(state.currentTransaction?.tax).toBe(0);
            expect(state.currentTransaction?.total).toBe(0);
        });

        it('should handle large quantities', () => {
            const state = checkoutReducer(
                initialState,
                createTransaction({
                    product: mockProduct,
                    quantity: 1000,
                    shippingAddress: mockShippingAddress,
                    paymentInfo: mockPaymentInfo,
                    email: mockShippingAddress.email,
                })
            );

            expect(state.currentTransaction?.subtotal).toBe(100000);
            expect(state.currentTransaction?.tax).toBe(8000);
            expect(state.currentTransaction?.total).toBe(108000);
        });

        it('should handle very short card numbers', () => {
            const shortCardPayment: PaymentInfo = {
                cardNumber: '1234',
                expiryDate: '12/25',
                cvv: '123',
            };

            const state = checkoutReducer(
                initialState,
                createTransaction({
                    product: mockProduct,
                    quantity: 1,
                    shippingAddress: mockShippingAddress,
                    paymentInfo: shortCardPayment,
                    email: mockShippingAddress.email,
                })
            );

            expect(state.currentTransaction?.paymentInfo.cardNumber).toBe('****1234');
        });

        it('should handle product with zero price', () => {
            const freeProduct: Product = {
                ...mockProduct,
                price: 0,
            };

            const state = checkoutReducer(
                initialState,
                createTransaction({
                    product: freeProduct,
                    quantity: 5,
                    shippingAddress: mockShippingAddress,
                    paymentInfo: mockPaymentInfo,
                    email: mockShippingAddress.email,
                })
            );

            expect(state.currentTransaction?.subtotal).toBe(0);
            expect(state.currentTransaction?.tax).toBe(0);
            expect(state.currentTransaction?.total).toBe(0);
        });

        it('should handle special characters in shipping address', () => {
            const specialAddress: ShippingAddress = {
                firstName: "O'Brien",
                lastName: "García-López",
                email: 'test+user@example.com',
                address: '123 Main St., Apt. #456',
                city: 'São Paulo',
                postalCode: '12345',
            };

            const state = checkoutReducer(
                initialState,
                createTransaction({
                    product: mockProduct,
                    quantity: 1,
                    shippingAddress: specialAddress,
                    paymentInfo: mockPaymentInfo,
                    email: specialAddress.email,
                })
            );

            expect(state.currentTransaction?.shippingAddress).toEqual(specialAddress);
        });

        it('should handle very long product names', () => {
            const longNameProduct: Product = {
                ...mockProduct,
                name: 'A'.repeat(500),
            };

            const state = checkoutReducer(
                initialState,
                createTransaction({
                    product: longNameProduct,
                    quantity: 1,
                    shippingAddress: mockShippingAddress,
                    paymentInfo: mockPaymentInfo,
                    email: mockShippingAddress.email,
                })
            );

            expect(state.currentTransaction?.product.name).toBe('A'.repeat(500));
        });
    });
});
