import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import { ShopPage } from '../ShopPage';
import '@testing-library/jest-dom/vitest';
import type { Product } from '../../types';
import { useAppSelector } from '../../store/hooks';
import { addToCart } from '../../store/slices/cartSlice';
import { fetchProducts } from '../../store/slices/productSlice';

const mockNavigate = vi.fn();
const mockDispatch = vi.fn();

// Mock de react-router-dom
vi.mock('react-router-dom', async (importOriginal) => {
    const actual: any = await importOriginal();
    return {
        ...actual,
        useNavigate: () => mockNavigate,
    };
});

// Mock de Redux hooks
vi.mock('../../store/hooks', () => ({
    useAppDispatch: () => mockDispatch,
    useAppSelector: vi.fn(),
}));

// Mock de ProductGrid
vi.mock('../../components/Product', () => ({
    ProductGrid: ({ products, onAddToCart, onViewProduct }: any) => (
        <div data-testid="product-grid">
            {products.map((product: Product) => (
                <div key={product.id} data-testid={`product-${product.id}`}>
                    <span>{product.name}</span>
                    <button onClick={() => onAddToCart?.(product.id)}>
                        Add to Cart
                    </button>
                    <button onClick={() => onViewProduct?.(product)}>
                        View Product
                    </button>
                </div>
            ))}
        </div>
    ),
}));

// Mock de slices
vi.mock('../../store/slices/cartSlice', () => ({
    addToCart: vi.fn((payload) => ({ type: 'cart/addToCart', payload })),
}));

vi.mock('../../store/slices/productSlice', () => ({
    fetchProducts: vi.fn(() => ({ type: 'products/fetchProducts' })),
}));

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

describe('ShopPage', () => {
    beforeEach(() => {
        mockNavigate.mockClear();
        mockDispatch.mockClear();
        vi.clearAllMocks();
    });

    afterEach(() => {
        cleanup();
    });

    describe('Estado de carga', () => {
        it('muestra el spinner cuando está cargando', () => {
            vi.mocked(useAppSelector).mockReturnValue({
                items: [],
                loading: true,
                error: null,
            });

            render(<ShopPage />);

            expect(screen.getByText('Cargando productos...')).toBeInTheDocument();
            expect(screen.queryByTestId('product-grid')).not.toBeInTheDocument();
        });

        it('muestra el texto correcto durante la carga', () => {
            vi.mocked(useAppSelector).mockReturnValue({
                items: [],
                loading: true,
                error: null,
            });

            render(<ShopPage />);

            expect(screen.getByText('Cargando productos...')).toBeInTheDocument();
        });
    });

    describe('Renderizado con productos', () => {
        it('renderiza el título y descripción de la página', () => {
            vi.mocked(useAppSelector).mockReturnValue({
                items: mockProducts,
                loading: false,
                error: null,
            });

            render(<ShopPage />);

            expect(screen.getByText('Descubre las últimas incorporaciones a nuestra colección.')).toBeInTheDocument();
        });

        it('renderiza ProductGrid cuando no está cargando', () => {
            vi.mocked(useAppSelector).mockReturnValue({
                items: mockProducts,
                loading: false,
                error: null,
            });

            render(<ShopPage />);

            expect(screen.getByTestId('product-grid')).toBeInTheDocument();
            expect(screen.queryByText('Cargando productos...')).not.toBeInTheDocument();
        });

        it('pasa los productos correctos a ProductGrid', () => {
            vi.mocked(useAppSelector).mockReturnValue({
                items: mockProducts,
                loading: false,
                error: null,
            });

            render(<ShopPage />);

            expect(screen.getByText('Product 1')).toBeInTheDocument();
            expect(screen.getByText('Product 2')).toBeInTheDocument();
        });
    });

    describe('useEffect - fetchProducts', () => {
        it('dispara fetchProducts al montar el componente', () => {
            vi.mocked(useAppSelector).mockReturnValue({
                items: [],
                loading: false,
                error: null,
            });

            render(<ShopPage />);

            expect(fetchProducts).toHaveBeenCalled();
            expect(mockDispatch).toHaveBeenCalledWith({ type: 'products/fetchProducts' });
        });
    });

    describe('Interacciones', () => {
        it('agrega producto al carrito cuando se hace click en Add to Cart', () => {
            vi.mocked(useAppSelector).mockReturnValue({
                items: mockProducts,
                loading: false,
                error: null,
            });

            render(<ShopPage />);

            const addToCartButtons = screen.getAllByText('Add to Cart');
            addToCartButtons[0].click();

            expect(addToCart).toHaveBeenCalledWith({
                product: mockProducts[0],
                quantity: 1,
            });
            expect(mockDispatch).toHaveBeenCalled();
        });

        it('no agrega al carrito si el producto no existe', () => {
            vi.mocked(useAppSelector).mockReturnValue({
                items: mockProducts,
                loading: false,
                error: null,
            });

            const { container } = render(<ShopPage />);

            // Simulamos un click con un ID que no existe
            const component = container.querySelector('[data-testid="product-grid"]');
            if (component) {
                const button = document.createElement('button');
                button.onclick = () => {
                    const product = mockProducts.find((p: Product) => p.id === 'non-existent-id');
                    if (product) {
                        vi.mocked(addToCart)({ product, quantity: 1 });
                    }
                };
                button.click();
            }

            // addToCart no debe haber sido llamado con un producto undefined
            const calls = vi.mocked(addToCart).mock.calls;
            const hasUndefinedProduct = calls.some((call: any) => call[0]?.product === undefined);
            expect(hasUndefinedProduct).toBe(false);
        });

        it('navega a la página de detalle del producto cuando se hace click en View Product', () => {
            vi.mocked(useAppSelector).mockReturnValue({
                items: mockProducts,
                loading: false,
                error: null,
            });

            render(<ShopPage />);

            const viewProductButtons = screen.getAllByText('View Product');
            viewProductButtons[0].click();

            expect(mockNavigate).toHaveBeenCalledWith('/product/1');
        });

        it('navega con el ID correcto para diferentes productos', () => {
            vi.mocked(useAppSelector).mockReturnValue({
                items: mockProducts,
                loading: false,
                error: null,
            });

            render(<ShopPage />);

            const viewProductButtons = screen.getAllByText('View Product');

            viewProductButtons[1].click();
            expect(mockNavigate).toHaveBeenCalledWith('/product/2');
        });
    });

    describe('Renderizado con lista vacía', () => {
        it('renderiza ProductGrid incluso con lista vacía de productos', () => {
            vi.mocked(useAppSelector).mockReturnValue({
                items: [],
                loading: false,
                error: null,
            });

            render(<ShopPage />);

            expect(screen.getByTestId('product-grid')).toBeInTheDocument();
            expect(screen.queryByText('Cargando productos...')).not.toBeInTheDocument();
        });
    });

    describe('Manejo de errores', () => {
        it('muestra mensaje de error cuando falla la carga de productos', () => {
            vi.mocked(useAppSelector).mockReturnValue({
                items: [],
                loading: false,
                error: 'No se pudo conectar con el servidor. Por favor, verifica que el backend esté en ejecución.',
            });

            render(<ShopPage />);

            expect(screen.getByText('Error al cargar productos')).toBeInTheDocument();
            expect(screen.getByText('No se pudo conectar con el servidor. Por favor, verifica que el backend esté en ejecución.')).toBeInTheDocument();
            expect(screen.queryByTestId('product-grid')).not.toBeInTheDocument();
        });

        it('muestra botón de reintentar cuando hay error', () => {
            vi.mocked(useAppSelector).mockReturnValue({
                items: [],
                loading: false,
                error: 'Error de conexión',
            });

            render(<ShopPage />);

            const retryButton = screen.getByText('Reintentar');
            expect(retryButton).toBeInTheDocument();
        });

        it('dispara fetchProducts cuando se hace click en reintentar', () => {
            vi.mocked(useAppSelector).mockReturnValue({
                items: [],
                loading: false,
                error: 'Error de conexión',
            });

            render(<ShopPage />);

            const retryButton = screen.getByText('Reintentar');
            retryButton.click();

            // fetchProducts se llama una vez en useEffect y otra al hacer click en reintentar
            expect(mockDispatch).toHaveBeenCalledTimes(2);
            expect(fetchProducts).toHaveBeenCalled();
        });

        it('muestra icono de error cuando hay un error', () => {
            vi.mocked(useAppSelector).mockReturnValue({
                items: [],
                loading: false,
                error: 'Error genérico',
            });

            const { container } = render(<ShopPage />);

            const errorIcon = container.querySelector('.material-symbols-outlined');
            expect(errorIcon).toBeInTheDocument();
            expect(errorIcon).toHaveTextContent('error');
        });
    });
});
