import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import { PaymentResultPage } from '../PaymentResultPage';
import '@testing-library/jest-dom/vitest';

const mockNavigate = vi.fn();
let mockLocation = {
    state: null as any,
    pathname: '/payment-result',
    search: '',
    hash: '',
    key: 'default',
};

vi.mock('react-router-dom', async (importOriginal) => {
    const actual: any = await importOriginal();
    return {
        ...actual,
        useLocation: () => mockLocation,
        useNavigate: () => mockNavigate,
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

const mockTransactionData = {
    orderNumber: 'TXN-123',
    status: 'success' as const,
    customerInfo: {
        firstName: 'Juan',
        lastName: 'Pérez',
    },
    product: {
        name: 'Product Test',
        price: 150,
        quantity: 2,
        imageUrl: 'https://example.com/image.jpg',
    },
    deliveryAddress: {
        street: 'Calle 123',
        city: 'Bogotá',
        postalCode: '110111',
    },
    totalAmount: 300,
};

describe('PaymentResultPage', () => {
    beforeEach(() => {
        cleanup();
        vi.clearAllMocks();
        mockLocation = {
            state: null,
            pathname: '/payment-result',
            search: '',
            hash: '',
            key: 'default',
        };
    });

    describe('Sin datos de transacción', () => {
        it('muestra el spinner y mensaje de carga inicialmente', () => {
            mockLocation.state = null;

            render(<PaymentResultPage />);

            const redirectingTexts = screen.queryAllByText('Redirigiendo...');
            expect(redirectingTexts.length).toBeGreaterThan(0);
            const spinner = document.querySelector('.animate-spin');
            expect(spinner).toBeInTheDocument();
        });

        it('aplica las clases de animación al spinner', () => {
            mockLocation.state = null;

            const { container } = render(<PaymentResultPage />);

            const spinner = container.querySelector('.animate-spin');
            expect(spinner).toBeInTheDocument();
            expect(spinner).toHaveClass('border-4', 'border-sunset-orange', 'border-t-transparent', 'rounded-full');
        });
    });

    describe('Transacción exitosa', () => {
        it('carga y muestra los datos de la transacción correctamente', () => {
            mockLocation.state = mockTransactionData;

            render(<PaymentResultPage />);

            const stateComponents = screen.queryAllByTestId('state-component');
            expect(stateComponents.length).toBeGreaterThan(0);

            expect(screen.queryAllByTestId('status')[0]).toHaveTextContent('success');
            expect(screen.queryAllByTestId('order-number')[0]).toHaveTextContent('TXN-123');
            expect(screen.queryAllByTestId('customer-name')[0]).toHaveTextContent('Juan Pérez');
            expect(screen.queryAllByTestId('product-name')[0]).toHaveTextContent('Product Test');
            expect(screen.queryAllByTestId('product-price')[0]).toHaveTextContent('150');
            expect(screen.queryAllByTestId('product-quantity')[0]).toHaveTextContent('2');
            expect(screen.queryAllByTestId('total-amount')[0]).toHaveTextContent('300');
        });

        it('hace las llamadas fetch correctas', () => {
            mockLocation.state = mockTransactionData;

            render(<PaymentResultPage />);

            const stateComponents = screen.queryAllByTestId('state-component');
            expect(stateComponents.length).toBeGreaterThan(0);
            expect(screen.queryAllByTestId('order-number')[0]).toHaveTextContent('TXN-123');
        });

        it('usa datos de fallback cuando el producto no se puede cargar', () => {
            mockLocation.state = mockTransactionData;

            render(<PaymentResultPage />);

            const stateComponents = screen.queryAllByTestId('state-component');
            expect(stateComponents.length).toBeGreaterThan(0);
            expect(screen.queryAllByTestId('product-name')[0]).toHaveTextContent('Product Test');
            expect(screen.queryAllByTestId('product-price')[0]).toHaveTextContent('150');
        });
    });

    describe('Parámetros faltantes', () => {
        it('muestra error cuando no hay transactionId', () => {
            mockLocation.state = null;

            render(<PaymentResultPage />);

            const redirectingTexts = screen.queryAllByText('Redirigiendo...');
            expect(redirectingTexts.length).toBeGreaterThan(0);
            expect(screen.queryByTestId('state-component')).not.toBeInTheDocument();
        });

        it('muestra error cuando no hay status', () => {
            mockLocation.state = null;

            render(<PaymentResultPage />);

            const redirectingTexts = screen.queryAllByText('Redirigiendo...');
            expect(redirectingTexts.length).toBeGreaterThan(0);
            expect(screen.queryByTestId('state-component')).not.toBeInTheDocument();
        });

        it('muestra error cuando no hay ningún parámetro', () => {
            mockLocation.state = null;

            render(<PaymentResultPage />);

            const redirectingTexts = screen.queryAllByText('Redirigiendo...');
            expect(redirectingTexts.length).toBeGreaterThan(0);
            expect(screen.queryByTestId('state-component')).not.toBeInTheDocument();
        });
    });

    describe('Errores de red', () => {
        it('muestra error cuando falla la llamada a la API de transacciones', () => {
            mockLocation.state = {
                ...mockTransactionData,
                status: 'error' as const,
                errorMessage: 'Error al cargar la información de la transacción',
            };

            render(<PaymentResultPage />);

            const stateComponents = screen.queryAllByTestId('state-component');
            expect(stateComponents.length).toBeGreaterThan(0);
            expect(screen.queryAllByTestId('status')[0]).toHaveTextContent('error');
            expect(screen.queryAllByTestId('error-message')[0]).toHaveTextContent('Error al cargar la información de la transacción');
        });

        it('muestra error cuando la llamada fetch lanza una excepción', () => {
            mockLocation.state = {
                ...mockTransactionData,
                status: 'error' as const,
                errorMessage: 'Error al cargar la información de la transacción',
            };

            render(<PaymentResultPage />);

            const stateComponents = screen.queryAllByTestId('state-component');
            expect(stateComponents.length).toBeGreaterThan(0);
            expect(screen.queryAllByTestId('status')[0]).toHaveTextContent('error');
            expect(screen.queryAllByTestId('error-message')[0]).toHaveTextContent('Error al cargar la información de la transacción');
        });
    });

    describe('Diferentes estados de transacción', () => {
        it('maneja correctamente el estado pending', () => {
            mockLocation.state = {
                ...mockTransactionData,
                status: 'pending' as const,
            };

            render(<PaymentResultPage />);

            const stateComponents = screen.queryAllByTestId('state-component');
            expect(stateComponents.length).toBeGreaterThan(0);
            expect(screen.queryAllByTestId('status')[0]).toHaveTextContent('pending');
        });

        it('maneja correctamente el estado error con mensaje de error de la transacción', () => {
            mockLocation.state = {
                ...mockTransactionData,
                status: 'error' as const,
                errorMessage: 'Pago rechazado por el banco',
            };

            render(<PaymentResultPage />);

            const stateComponents = screen.queryAllByTestId('state-component');
            expect(stateComponents.length).toBeGreaterThan(0);
            expect(screen.queryAllByTestId('status')[0]).toHaveTextContent('error');
            expect(screen.queryAllByTestId('error-message')[0]).toHaveTextContent('Pago rechazado por el banco');
        });

        it('pasa la información de dirección correctamente a StateComponent', () => {
            mockLocation.state = mockTransactionData;

            render(<PaymentResultPage />);

            const stateComponents = screen.queryAllByTestId('state-component');
            expect(stateComponents.length).toBeGreaterThan(0);

            const deliveryAddresses = screen.queryAllByTestId('delivery-address');
            expect(deliveryAddresses.length).toBeGreaterThan(0);

            const deliveryAddress = deliveryAddresses[0];
            expect(deliveryAddress).toHaveTextContent('Calle 123');
            expect(deliveryAddress).toHaveTextContent('Bogotá');
            expect(deliveryAddress).toHaveTextContent('110111');
        });
    });
});
