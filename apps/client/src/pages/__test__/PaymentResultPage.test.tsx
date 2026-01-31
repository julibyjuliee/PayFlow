import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, cleanup, waitFor } from '@testing-library/react';
import { PaymentResultPage } from '../PaymentResultPage';
import '@testing-library/jest-dom/vitest';

const mockSearchParams = new URLSearchParams();
const mockUseSearchParams = vi.fn(() => [mockSearchParams]);

vi.mock('react-router-dom', async (importOriginal) => {
    const actual: any = await importOriginal();
    return {
        ...actual,
        useSearchParams: () => mockUseSearchParams(),
    };
});

vi.mock('../../components/States', () => ({
    StateComponent: ({ status, orderNumber, customerInfo, product, deliveryAddress, totalAmount, errorMessage }: any) => (
        <div data-testid="state-component">
            <span data-testid="status">{status}</span>
            <span data-testid="order-number">{orderNumber}</span>
            {customerInfo && (
                <span data-testid="customer-name">
                    {customerInfo.firstName} {customerInfo.lastName}
                </span>
            )}
            {product && (
                <div data-testid="product-info">
                    <span data-testid="product-name">{product.name}</span>
                    <span data-testid="product-price">{product.price}</span>
                    <span data-testid="product-quantity">{product.quantity}</span>
                </div>
            )}
            {deliveryAddress && (
                <div data-testid="delivery-address">
                    <span>{deliveryAddress.street}</span>
                    <span>{deliveryAddress.city}</span>
                    <span>{deliveryAddress.postalCode}</span>
                </div>
            )}
            {totalAmount && <span data-testid="total-amount">{totalAmount}</span>}
            {errorMessage && <span data-testid="error-message">{errorMessage}</span>}
        </div>
    ),
}));

const mockTransaction = {
    id: 'TXN-123',
    productId: 'PROD-456',
    firstName: 'Juan',
    lastName: 'Pérez',
    quantity: 2,
    amount: 300,
    address: 'Calle 123',
    city: 'Bogotá',
    postalCode: '110111',
};

const mockProduct = {
    id: 'PROD-456',
    name: 'Product Test',
    price: 150,
    imageUrl: 'https://example.com/image.jpg',
    category: 'test',
    stock: 10,
};

describe('PaymentResultPage', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockSearchParams.delete('transactionId');
        mockSearchParams.delete('status');
        globalThis.fetch = vi.fn() as any;
    });

    afterEach(() => {
        cleanup();
        vi.restoreAllMocks();
    });

    describe('Estado de carga', () => {
        it('muestra el spinner y mensaje de carga inicialmente', async () => {
            mockSearchParams.set('transactionId', 'TXN-123');
            mockSearchParams.set('status', 'success');

            globalThis.fetch = vi.fn(() => new Promise(() => {})) as any;

            render(<PaymentResultPage />);

            expect(screen.getByText('Cargando resultado...')).toBeInTheDocument();
            expect(screen.queryByTestId('state-component')).not.toBeInTheDocument();
        });

        it('aplica las clases de animación al spinner', () => {
            mockSearchParams.set('transactionId', 'TXN-123');
            mockSearchParams.set('status', 'success');

            globalThis.fetch = vi.fn(() => new Promise(() => {})) as any;

            const { container } = render(<PaymentResultPage />);

            const spinner = container.querySelector('.animate-spin');
            expect(spinner).toBeInTheDocument();
        });
    });

    describe('Transacción exitosa', () => {
        it('carga y muestra los datos de la transacción correctamente', async () => {
            mockSearchParams.set('transactionId', 'TXN-123');
            mockSearchParams.set('status', 'success');

            globalThis.fetch = vi.fn((url: string) => {
                if (url.includes('/transactions/')) {
                    return Promise.resolve({
                        ok: true,
                        json: () => Promise.resolve(mockTransaction),
                    } as Response);
                }
                if (url.includes('/products/')) {
                    return Promise.resolve({
                        ok: true,
                        json: () => Promise.resolve(mockProduct),
                    } as Response);
                }
                return Promise.reject(new Error('Unknown URL'));
            }) as any;

            render(<PaymentResultPage />);

            await waitFor(() => {
                expect(screen.getByTestId('state-component')).toBeInTheDocument();
            });

            expect(screen.getByTestId('status')).toHaveTextContent('success');
            expect(screen.getByTestId('order-number')).toHaveTextContent('TXN-123');
            expect(screen.getByTestId('customer-name')).toHaveTextContent('Juan Pérez');
            expect(screen.getByTestId('product-name')).toHaveTextContent('Product Test');
            expect(screen.getByTestId('total-amount')).toHaveTextContent('300');
        });

        it('hace las llamadas fetch correctas', async () => {
            mockSearchParams.set('transactionId', 'TXN-123');
            mockSearchParams.set('status', 'success');

            const mockFetch = vi.fn((url: string) => {
                if (url.includes('/transactions/')) {
                    return Promise.resolve({
                        ok: true,
                        json: () => Promise.resolve(mockTransaction),
                    } as Response);
                }
                if (url.includes('/products/')) {
                    return Promise.resolve({
                        ok: true,
                        json: () => Promise.resolve(mockProduct),
                    } as Response);
                }
                return Promise.reject(new Error('Unknown URL'));
            });

            globalThis.fetch = mockFetch as any;

            render(<PaymentResultPage />);

            await waitFor(() => {
                expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining('/transactions/TXN-123'));
                expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining('/products/PROD-456'));
            });
        });

        it('usa datos de fallback cuando el producto no se puede cargar', async () => {
            mockSearchParams.set('transactionId', 'TXN-123');
            mockSearchParams.set('status', 'success');

            globalThis.fetch = vi.fn((url: string) => {
                if (url.includes('/transactions/')) {
                    return Promise.resolve({
                        ok: true,
                        json: () => Promise.resolve(mockTransaction),
                    } as Response);
                }
                if (url.includes('/products/')) {
                    return Promise.resolve({
                        ok: false,
                    } as Response);
                }
                return Promise.reject(new Error('Unknown URL'));
            }) as any;

            render(<PaymentResultPage />);

            await waitFor(() => {
                expect(screen.getByTestId('state-component')).toBeInTheDocument();
            });

            expect(screen.getByTestId('product-name')).toHaveTextContent('Producto');
            expect(screen.getByTestId('product-price')).toHaveTextContent('300');
        });
    });

    describe('Parámetros faltantes', () => {
        it('muestra error cuando no hay transactionId', async () => {
            mockSearchParams.set('status', 'success');

            render(<PaymentResultPage />);

            await waitFor(() => {
                expect(screen.getByTestId('state-component')).toBeInTheDocument();
            });

            expect(screen.getByTestId('status')).toHaveTextContent('error');
            expect(screen.getByTestId('error-message')).toHaveTextContent('No se encontró información de la transacción');
        });

        it('muestra error cuando no hay status', async () => {
            mockSearchParams.set('transactionId', 'TXN-123');

            render(<PaymentResultPage />);

            await waitFor(() => {
                expect(screen.getByTestId('state-component')).toBeInTheDocument();
            });

            expect(screen.getByTestId('status')).toHaveTextContent('error');
            expect(screen.getByTestId('error-message')).toHaveTextContent('No se encontró información de la transacción');
        });

        it('muestra error cuando no hay ningún parámetro', async () => {
            render(<PaymentResultPage />);

            await waitFor(() => {
                expect(screen.getByTestId('state-component')).toBeInTheDocument();
            });

            expect(screen.getByTestId('status')).toHaveTextContent('error');
            expect(screen.getByTestId('error-message')).toHaveTextContent('No se encontró información de la transacción');
        });
    });

    describe('Errores de red', () => {
        it('muestra error cuando falla la llamada a la API de transacciones', async () => {
            mockSearchParams.set('transactionId', 'TXN-123');
            mockSearchParams.set('status', 'success');

            globalThis.fetch = vi.fn(() =>
                Promise.resolve({
                    ok: false,
                } as Response)
            ) as any;

            const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

            render(<PaymentResultPage />);

            await waitFor(() => {
                expect(screen.getByTestId('state-component')).toBeInTheDocument();
            });

            expect(screen.getByTestId('status')).toHaveTextContent('error');
            expect(screen.getByTestId('error-message')).toHaveTextContent('Error al cargar la información de la transacción');
            expect(consoleErrorSpy).toHaveBeenCalled();

            consoleErrorSpy.mockRestore();
        });

        it('muestra error cuando la llamada fetch lanza una excepción', async () => {
            mockSearchParams.set('transactionId', 'TXN-123');
            mockSearchParams.set('status', 'success');

            globalThis.fetch = vi.fn(() => Promise.reject(new Error('Network error'))) as any;

            const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

            render(<PaymentResultPage />);

            await waitFor(() => {
                expect(screen.getByTestId('state-component')).toBeInTheDocument();
            });

            expect(screen.getByTestId('status')).toHaveTextContent('error');
            expect(screen.getByTestId('error-message')).toHaveTextContent('Error al cargar la información de la transacción');

            consoleErrorSpy.mockRestore();
        });
    });

    describe('Diferentes estados de transacción', () => {
        it('maneja correctamente el estado pending', async () => {
            mockSearchParams.set('transactionId', 'TXN-123');
            mockSearchParams.set('status', 'pending');

            globalThis.fetch = vi.fn((url: string) => {
                if (url.includes('/transactions/')) {
                    return Promise.resolve({
                        ok: true,
                        json: () => Promise.resolve(mockTransaction),
                    } as Response);
                }
                if (url.includes('/products/')) {
                    return Promise.resolve({
                        ok: true,
                        json: () => Promise.resolve(mockProduct),
                    } as Response);
                }
                return Promise.reject(new Error('Unknown URL'));
            }) as any;

            render(<PaymentResultPage />);

            await waitFor(() => {
                expect(screen.getByTestId('state-component')).toBeInTheDocument();
            });

            expect(screen.getByTestId('status')).toHaveTextContent('pending');
        });

        it('maneja correctamente el estado error con mensaje de error de la transacción', async () => {
            mockSearchParams.set('transactionId', 'TXN-123');
            mockSearchParams.set('status', 'error');

            const transactionWithError = {
                ...mockTransaction,
                errorMessage: 'Tarjeta rechazada',
            };

            globalThis.fetch = vi.fn((url: string) => {
                if (url.includes('/transactions/')) {
                    return Promise.resolve({
                        ok: true,
                        json: () => Promise.resolve(transactionWithError),
                    } as Response);
                }
                if (url.includes('/products/')) {
                    return Promise.resolve({
                        ok: true,
                        json: () => Promise.resolve(mockProduct),
                    } as Response);
                }
                return Promise.reject(new Error('Unknown URL'));
            }) as any;

            render(<PaymentResultPage />);

            await waitFor(() => {
                expect(screen.getByTestId('state-component')).toBeInTheDocument();
            });

            expect(screen.getByTestId('status')).toHaveTextContent('error');
            expect(screen.getByTestId('error-message')).toHaveTextContent('Tarjeta rechazada');
        });
    });

    describe('Dirección de entrega', () => {
        it('pasa la información de dirección correctamente a StateComponent', async () => {
            mockSearchParams.set('transactionId', 'TXN-123');
            mockSearchParams.set('status', 'success');

            globalThis.fetch = vi.fn((url: string) => {
                if (url.includes('/transactions/')) {
                    return Promise.resolve({
                        ok: true,
                        json: () => Promise.resolve(mockTransaction),
                    } as Response);
                }
                if (url.includes('/products/')) {
                    return Promise.resolve({
                        ok: true,
                        json: () => Promise.resolve(mockProduct),
                    } as Response);
                }
                return Promise.reject(new Error('Unknown URL'));
            }) as any;

            render(<PaymentResultPage />);

            await waitFor(() => {
                expect(screen.getByTestId('delivery-address')).toBeInTheDocument();
            });

            const deliveryAddress = screen.getByTestId('delivery-address');
            expect(deliveryAddress).toHaveTextContent('Calle 123');
            expect(deliveryAddress).toHaveTextContent('Bogotá');
            expect(deliveryAddress).toHaveTextContent('110111');
        });
    });
});
