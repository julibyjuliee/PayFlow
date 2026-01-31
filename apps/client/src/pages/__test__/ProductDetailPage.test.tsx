import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, cleanup, fireEvent } from '@testing-library/react';
import { ProductDetailPage } from '../ProductDetailPage';
import '@testing-library/jest-dom/vitest';
import type { Product } from '../../types';
import { useAppSelector } from '../../store/hooks';
import { fetchProducts } from '../../store/slices/productSlice';

const mockNavigate = vi.fn();
const mockDispatch = vi.fn();
const mockProductId = '123';

// Mock de react-router-dom
vi.mock('react-router-dom', async (importOriginal) => {
    const actual: any = await importOriginal();
    return {
        ...actual,
        useNavigate: () => mockNavigate,
        useParams: () => ({ productId: mockProductId }),
    };
});

// Mock de Redux hooks
vi.mock('../../store/hooks', () => ({
    useAppDispatch: () => mockDispatch,
    useAppSelector: vi.fn(),
}));

// Mock de ProductDetail
vi.mock('../../components/ProductDetail', () => ({
    ProductDetail: ({ product, onNavigateToCart }: any) => (
        <div data-testid="product-detail">
            <h1>{product.name}</h1>
            <p>{product.description}</p>
            <span>Precio: ${product.price}</span>
            <button onClick={onNavigateToCart}>Ir al carrito</button>
        </div>
    ),
}));

// Mock de slices
vi.mock('../../store/slices/productSlice', () => ({
    fetchProducts: vi.fn(() => ({ type: 'products/fetchProducts' })),
}));

const mockProduct: Product = {
    id: '123',
    name: 'Product Test',
    description: 'Test Description',
    price: 150,
    category: 'test-category',
    imageUrl: 'https://example.com/image.jpg',
    stock: 15,
};

const mockProducts: Product[] = [
    mockProduct,
    {
        id: '456',
        name: 'Another Product',
        description: 'Another Description',
        price: 200,
        category: 'another-category',
        imageUrl: 'https://example.com/image2.jpg',
        stock: 10,
    },
];

describe('ProductDetailPage', () => {
    beforeEach(() => {
        mockNavigate.mockClear();
        mockDispatch.mockClear();
        vi.clearAllMocks();
    });

    afterEach(() => {
        cleanup();
    });

    describe('Estado de carga', () => {
        it('muestra el mensaje de carga cuando isLoading es true', () => {
            vi.mocked(useAppSelector).mockImplementation((selector: any) => {
                const state = {
                    products: {
                        items: [],
                        loading: true,
                    },
                };
                return selector(state);
            });

            render(<ProductDetailPage />);

            expect(screen.getByText('Cargando detalles...')).toBeInTheDocument();
            expect(screen.queryByTestId('product-detail')).not.toBeInTheDocument();
        });

        it('aplica la clase animate-pulse al mensaje de carga', () => {
            vi.mocked(useAppSelector).mockImplementation((selector: any) => {
                const state = {
                    products: {
                        items: [],
                        loading: true,
                    },
                };
                return selector(state);
            });

            render(<ProductDetailPage />);

            const loadingText = screen.getByText('Cargando detalles...');
            expect(loadingText).toHaveClass('animate-pulse');
        });
    });

    describe('Producto encontrado', () => {
        it('renderiza ProductDetail cuando el producto existe', () => {
            vi.mocked(useAppSelector).mockImplementation((selector: any) => {
                const state = {
                    products: {
                        items: mockProducts,
                        loading: false,
                    },
                };
                return selector(state);
            });

            render(<ProductDetailPage />);

            expect(screen.getByTestId('product-detail')).toBeInTheDocument();
            expect(screen.getByText('Product Test')).toBeInTheDocument();
        });

        it('pasa el producto correcto a ProductDetail', () => {
            vi.mocked(useAppSelector).mockImplementation((selector: any) => {
                const state = {
                    products: {
                        items: mockProducts,
                        loading: false,
                    },
                };
                return selector(state);
            });

            render(<ProductDetailPage />);

            expect(screen.getByText('Product Test')).toBeInTheDocument();
            expect(screen.getByText('Test Description')).toBeInTheDocument();
            expect(screen.getByText('Precio: $150')).toBeInTheDocument();
        });

        it('navega al carrito cuando se hace click en el botón', () => {
            vi.mocked(useAppSelector).mockImplementation((selector: any) => {
                const state = {
                    products: {
                        items: mockProducts,
                        loading: false,
                    },
                };
                return selector(state);
            });

            render(<ProductDetailPage />);

            const cartButton = screen.getByText('Ir al carrito');
            fireEvent.click(cartButton);

            expect(mockNavigate).toHaveBeenCalledWith('/cart');
        });
    });

    describe('Producto no encontrado', () => {
        it('muestra mensaje de producto no encontrado cuando no existe', () => {
            vi.mocked(useAppSelector).mockImplementation((selector: any) => {
                const state = {
                    products: {
                        items: [mockProducts[1]], // Solo el producto con id 456
                        loading: false,
                    },
                };
                return selector(state);
            });

            render(<ProductDetailPage />);

            expect(screen.getByText('Producto no encontrado')).toBeInTheDocument();
            expect(screen.queryByTestId('product-detail')).not.toBeInTheDocument();
        });

        it('muestra el ID del producto no encontrado', () => {
            vi.mocked(useAppSelector).mockImplementation((selector: any) => {
                const state = {
                    products: {
                        items: [],
                        loading: false,
                    },
                };
                return selector(state);
            });

            render(<ProductDetailPage />);

            expect(screen.getByText(`ID: ${mockProductId}`)).toBeInTheDocument();
        });

        it('navega a la tienda cuando se hace click en Volver a la tienda', () => {
            vi.mocked(useAppSelector).mockImplementation((selector: any) => {
                const state = {
                    products: {
                        items: [],
                        loading: false,
                    },
                };
                return selector(state);
            });

            render(<ProductDetailPage />);

            const backButton = screen.getByText('Volver a la tienda');
            fireEvent.click(backButton);

            expect(mockNavigate).toHaveBeenCalledWith('/');
        });

        it('renderiza null cuando el producto no existe y está cargando', () => {
            vi.mocked(useAppSelector).mockImplementation((selector: any) => {
                const state = {
                    products: {
                        items: [],
                        loading: true,
                    },
                };
                return selector(state);
            });

            render(<ProductDetailPage />);

            // Durante la carga, muestra el mensaje de carga, no null
            expect(screen.getByText('Cargando detalles...')).toBeInTheDocument();
        });
    });

    describe('useEffect - fetchProducts', () => {
        it('dispara fetchProducts cuando no hay productos y no está cargando', () => {
            vi.mocked(useAppSelector).mockImplementation((selector: any) => {
                const state = {
                    products: {
                        items: [],
                        loading: false,
                    },
                };
                return selector(state);
            });

            render(<ProductDetailPage />);

            expect(fetchProducts).toHaveBeenCalled();
            expect(mockDispatch).toHaveBeenCalledWith({ type: 'products/fetchProducts' });
        });

        it('no dispara fetchProducts cuando ya hay productos', () => {
            vi.mocked(useAppSelector).mockImplementation((selector: any) => {
                const state = {
                    products: {
                        items: mockProducts,
                        loading: false,
                    },
                };
                return selector(state);
            });

            vi.clearAllMocks(); // Limpiar mocks antes de renderizar

            render(<ProductDetailPage />);

            // fetchProducts no debería ser llamado porque ya hay productos
            expect(fetchProducts).not.toHaveBeenCalled();
        });

        it('no dispara fetchProducts cuando está cargando', () => {
            vi.mocked(useAppSelector).mockImplementation((selector: any) => {
                const state = {
                    products: {
                        items: [],
                        loading: true,
                    },
                };
                return selector(state);
            });

            vi.clearAllMocks(); // Limpiar mocks antes de renderizar

            render(<ProductDetailPage />);

            // fetchProducts no debería ser llamado porque ya está cargando
            expect(fetchProducts).not.toHaveBeenCalled();
        });
    });

    describe('Búsqueda de producto por ID', () => {
        it('encuentra el producto correcto basado en el productId de los params', () => {
            vi.mocked(useAppSelector).mockImplementation((selector: any) => {
                const state = {
                    products: {
                        items: mockProducts,
                        loading: false,
                    },
                };
                return selector(state);
            });

            render(<ProductDetailPage />);

            // Debe encontrar y renderizar el producto con id '123'
            expect(screen.getByText('Product Test')).toBeInTheDocument();
            expect(screen.queryByText('Another Product')).not.toBeInTheDocument();
        });
    });
});
