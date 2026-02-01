import { paymentService } from '../paymentService';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

// Mock fetch global
const globalAny: any = globalThis;

describe('PaymentService', () => {
    beforeEach(() => {
        globalAny.fetch = vi.fn();
        Object.defineProperty(import.meta, 'env', {
            value: {
                VITE_WP_API_URL: 'https://fake-wp.com/tokenize',
                VITE_WP_PUBLIC_KEY: 'fake-public-key',
                VITE_API_URL: 'https://fake-api.com',
            },
            writable: true,
        });
    });

    afterEach(() => {
        vi.resetAllMocks();
    });

    describe('tokenizeCard', () => {
        it('debería devolver el id del token al tokenizar correctamente', async () => {
            const mockId = 'tok_123';
            globalAny.fetch.mockResolvedValueOnce({
                ok: true,
                json: async () => ({ data: { id: mockId } }),
            });

            const id = await paymentService.tokenizeCard({
                cardNumber: '4111 1111 1111 1111',
                cvv: '123',
                expiryMonth: '12',
                expiryYear: '30',
                cardHolder: 'Juan Perez',
            });
            expect(id).toBe(mockId);
        });

        it('debería lanzar error si la respuesta no es ok', async () => {
            globalAny.fetch.mockResolvedValueOnce({
                ok: false,
                json: async () => ({ message: 'error' }),
            });
            await expect(paymentService.tokenizeCard({
                cardNumber: '4111 1111 1111 1111',
                cvv: '123',
                expiryMonth: '12',
                expiryYear: '30',
                cardHolder: 'Juan Perez',
            })).rejects.toThrow('No se pudo procesar la tarjeta');
        });
    });

    describe('createTransaction', () => {
        it('debería devolver la transacción al crear correctamente', async () => {
            const mockTransaction = { id: 'tx_1', status: 'APPROVED' };
            globalAny.fetch.mockResolvedValueOnce({
                ok: true,
                json: async () => mockTransaction,
            });
            const tx = await paymentService.createTransaction({
                productId: '1',
                quantity: 2,
                customerEmail: 'test@correo.com',
                paymentToken: 'tok_123',
                firstName: 'Juan',
                lastName: 'Perez',
                address: 'Calle 1',
                city: 'Bogotá',
                postalCode: '110111',
            });
            expect(tx).toEqual(mockTransaction);
        });

        it('debería lanzar error si la respuesta no es ok', async () => {
            globalAny.fetch.mockResolvedValueOnce({
                ok: false,
                json: async () => ({ message: 'Error al procesar el pago' }),
            });
            await expect(paymentService.createTransaction({
                productId: '1',
                quantity: 2,
                customerEmail: 'test@correo.com',
                paymentToken: 'tok_123',
                firstName: 'Juan',
                lastName: 'Perez',
                address: 'Calle 1',
                city: 'Bogotá',
                postalCode: '110111',
            })).rejects.toThrow('Error al procesar el pago');
        });
    });

    describe('processPayment', () => {
        it('debería ejecutar el flujo completo correctamente', async () => {
            const mockId = 'tok_123';
            const mockTransaction = { id: 'tx_1', status: 'APPROVED' };
            globalAny.fetch
                .mockResolvedValueOnce({ ok: true, json: async () => ({ data: { id: mockId } }) }) // tokenizeCard
                .mockResolvedValueOnce({ ok: true, json: async () => mockTransaction }); // createTransaction

            const tx = await paymentService.processPayment(
                {
                    cardNumber: '4111 1111 1111 1111',
                    cvv: '123',
                    expiryMonth: '12',
                    expiryYear: '30',
                    cardHolder: 'Juan Perez',
                },
                {
                    productId: '1',
                    quantity: 2,
                    customerEmail: 'test@correo.com',
                    firstName: 'Juan',
                    lastName: 'Perez',
                    address: 'Calle 1',
                    city: 'Bogotá',
                    postalCode: '110111',
                }
            );
            expect(tx).toEqual(mockTransaction);
        });
    });
});
