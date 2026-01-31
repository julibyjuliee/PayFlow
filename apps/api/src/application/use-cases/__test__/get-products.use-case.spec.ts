import { Test, TestingModule } from '@nestjs/testing';
import { GetProductsUseCase } from '../get-products.use-case';
import { IProductRepository } from '../../../domain/repositories';
import { Product } from '../../../domain/entities';
import { Result } from '../../../shared/result';
import { Money } from '../../../domain/value-objects/money';

describe('GetProductsUseCase', () => {
    let useCase: GetProductsUseCase;
    let productRepository: jest.Mocked<IProductRepository>;

    const mockProducts: Product[] = [
        new Product(
            'product-1',
            'Laptop HP',
            new Money(2500000, 'COP'),
            10,
            'Electronics',
            'High performance laptop',
            'https://example.com/laptop.jpg',
        ),
        new Product(
            'product-2',
            'Mouse Logitech',
            new Money(50000, 'COP'),
            25,
            'Accessories',
            'Wireless mouse',
            'https://example.com/mouse.jpg',
        ),
        new Product(
            'product-3',
            'Keyboard Mechanical',
            new Money(350000, 'COP'),
            15,
            'Accessories',
            'RGB mechanical keyboard',
            'https://example.com/keyboard.jpg',
        ),
    ];

    beforeEach(async () => {
        // Create mock repository
        const mockProductRepository: Partial<IProductRepository> = {
            findAll: jest.fn(),
        };

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                GetProductsUseCase,
                {
                    provide: 'IProductRepository',
                    useValue: mockProductRepository,
                },
            ],
        }).compile();

        useCase = module.get<GetProductsUseCase>(GetProductsUseCase);
        productRepository = module.get('IProductRepository');
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('execute', () => {
        it('should be defined', () => {
            expect(useCase).toBeDefined();
        });

        it('should return success result with all products', async () => {
            const successResult = Result.ok(mockProducts);
            productRepository.findAll.mockResolvedValue(successResult);

            const result = await useCase.execute();

            expect(productRepository.findAll).toHaveBeenCalledTimes(1);
            expect(result.isSuccess()).toBe(true);
            expect(result.getValue()).toBe(mockProducts);
            expect(result.getValue()).toHaveLength(3);
        });

        it('should return empty array when no products exist', async () => {
            const emptyResult = Result.ok<Product[], Error>([]);
            productRepository.findAll.mockResolvedValue(emptyResult);

            const result = await useCase.execute();

            expect(productRepository.findAll).toHaveBeenCalledTimes(1);
            expect(result.isSuccess()).toBe(true);
            expect(result.getValue()).toEqual([]);
            expect(result.getValue()).toHaveLength(0);
        });

        it('should return failure result when repository fails', async () => {
            const error = new Error('Database connection error');
            const failureResult = Result.fail<Product[], Error>(error);
            productRepository.findAll.mockResolvedValue(failureResult);

            const result = await useCase.execute();

            expect(productRepository.findAll).toHaveBeenCalledTimes(1);
            expect(result.isFailure()).toBe(true);
            expect(result.getError()).toBe(error);
            expect(result.getError().message).toBe('Database connection error');
        });

        it('should return all products with correct properties', async () => {
            const successResult = Result.ok(mockProducts);
            productRepository.findAll.mockResolvedValue(successResult);

            const result = await useCase.execute();
            const products = result.getValue();

            expect(products[0].id).toBe('product-1');
            expect(products[0].name).toBe('Laptop HP');
            expect(products[0].price.amount).toBe(2500000);

            expect(products[1].id).toBe('product-2');
            expect(products[1].name).toBe('Mouse Logitech');
            expect(products[1].price.amount).toBe(50000);

            expect(products[2].id).toBe('product-3');
            expect(products[2].name).toBe('Keyboard Mechanical');
            expect(products[2].price.amount).toBe(350000);
        });

        it('should call repository without any parameters', async () => {
            const successResult = Result.ok(mockProducts);
            productRepository.findAll.mockResolvedValue(successResult);

            await useCase.execute();

            expect(productRepository.findAll).toHaveBeenCalledWith();
        });

        it('should return single product when only one exists', async () => {
            const singleProduct = [mockProducts[0]];
            const successResult = Result.ok(singleProduct);
            productRepository.findAll.mockResolvedValue(successResult);

            const result = await useCase.execute();

            expect(result.getValue()).toHaveLength(1);
            expect(result.getValue()[0].id).toBe('product-1');
        });

        it('should return large list of products', async () => {
            const manyProducts = Array.from({ length: 100 }, (_, i) =>
                new Product(
                    `product-${i}`,
                    `Product ${i}`,
                    new Money(100000 + i * 1000, 'COP'),
                    10 + i,
                )
            );
            const successResult = Result.ok(manyProducts);
            productRepository.findAll.mockResolvedValue(successResult);

            const result = await useCase.execute();

            expect(result.getValue()).toHaveLength(100);
            expect(result.getValue()[0].id).toBe('product-0');
            expect(result.getValue()[99].id).toBe('product-99');
        });
    });

    describe('Product variations', () => {
        it('should handle products with different stock levels', async () => {
            const products = [
                new Product('p1', 'In Stock', new Money(100000, 'COP'), 10),
                new Product('p2', 'Out of Stock', new Money(200000, 'COP'), 0),
                new Product('p3', 'High Stock', new Money(150000, 'COP'), 1000),
            ];
            productRepository.findAll.mockResolvedValue(Result.ok(products));

            const result = await useCase.execute();
            const retrievedProducts = result.getValue();

            expect(retrievedProducts[0].isAvailable()).toBe(true);
            expect(retrievedProducts[1].isAvailable()).toBe(false);
            expect(retrievedProducts[2].isAvailable()).toBe(true);
        });

        it('should handle products from different categories', async () => {
            const products = [
                new Product('p1', 'Laptop', new Money(2500000, 'COP'), 5, 'Electronics'),
                new Product('p2', 'T-Shirt', new Money(80000, 'COP'), 50, 'Clothing'),
                new Product('p3', 'Book', new Money(120000, 'COP'), 30, 'Books'),
                new Product('p4', 'Coffee Mug', new Money(25000, 'COP'), 100, 'Home'),
            ];
            productRepository.findAll.mockResolvedValue(Result.ok(products));

            const result = await useCase.execute();
            const retrievedProducts = result.getValue();

            expect(retrievedProducts[0].category).toBe('Electronics');
            expect(retrievedProducts[1].category).toBe('Clothing');
            expect(retrievedProducts[2].category).toBe('Books');
            expect(retrievedProducts[3].category).toBe('Home');
        });

        it('should handle products with and without optional fields', async () => {
            const products = [
                new Product(
                    'p1',
                    'Full Product',
                    new Money(100000, 'COP'),
                    10,
                    'Category',
                    'Description',
                    'https://example.com/image.jpg',
                ),
                new Product(
                    'p2',
                    'Minimal Product',
                    new Money(200000, 'COP'),
                    5,
                ),
            ];
            productRepository.findAll.mockResolvedValue(Result.ok(products));

            const result = await useCase.execute();
            const retrievedProducts = result.getValue();

            expect(retrievedProducts[0].category).toBe('Category');
            expect(retrievedProducts[0].description).toBe('Description');
            expect(retrievedProducts[0].imageUrl).toBe('https://example.com/image.jpg');

            expect(retrievedProducts[1].category).toBeUndefined();
            expect(retrievedProducts[1].description).toBeUndefined();
            expect(retrievedProducts[1].imageUrl).toBeUndefined();
        });

        it('should handle products with different price ranges', async () => {
            const products = [
                new Product('cheap', 'Cheap Item', new Money(10000, 'COP'), 100),
                new Product('medium', 'Medium Item', new Money(500000, 'COP'), 50),
                new Product('expensive', 'Expensive Item', new Money(5000000, 'COP'), 10),
            ];
            productRepository.findAll.mockResolvedValue(Result.ok(products));

            const result = await useCase.execute();
            const retrievedProducts = result.getValue();

            expect(retrievedProducts[0].price.amount).toBe(10000);
            expect(retrievedProducts[1].price.amount).toBe(500000);
            expect(retrievedProducts[2].price.amount).toBe(5000000);
        });
    });

    describe('Integration scenarios', () => {
        it('should work in a typical successful retrieval flow', async () => {
            // Arrange: Setup repository to return products
            productRepository.findAll.mockResolvedValue(Result.ok(mockProducts));

            // Act: Execute the use case
            const result = await useCase.execute();

            // Assert: Verify the result
            expect(result.isSuccess()).toBe(true);
            expect(result.getValue()).toHaveLength(3);
            expect(result.getValue()[0].name).toBe('Laptop HP');
        });

        it('should work when database is empty', async () => {
            // Arrange: Setup repository to return empty array
            productRepository.findAll.mockResolvedValue(Result.ok([]));

            // Act: Execute the use case
            const result = await useCase.execute();

            // Assert: Verify empty result
            expect(result.isSuccess()).toBe(true);
            expect(result.getValue()).toEqual([]);
        });

        it('should work in a typical failure flow', async () => {
            // Arrange: Setup repository to return error
            const error = new Error('Failed to fetch products from database');
            productRepository.findAll.mockResolvedValue(Result.fail(error));

            // Act: Execute the use case
            const result = await useCase.execute();

            // Assert: Verify the error
            expect(result.isFailure()).toBe(true);
            expect(result.getError().message).toContain('Failed to fetch');
        });

        it('should retrieve products and verify business logic', async () => {
            const products = [
                new Product('p1', 'Product 1', new Money(100000, 'COP'), 10),
                new Product('p2', 'Product 2', new Money(200000, 'COP'), 5),
            ];
            productRepository.findAll.mockResolvedValue(Result.ok(products));

            const result = await useCase.execute();
            const retrievedProducts = result.getValue();

            // Verify business rules work on retrieved products
            expect(retrievedProducts[0].hasStock(5)).toBe(true);
            expect(retrievedProducts[0].hasStock(15)).toBe(false);
            expect(retrievedProducts[1].calculateTotalPrice(2).amount).toBe(400000);
        });
    });

    describe('Error handling', () => {
        it('should handle database connection errors', async () => {
            const error = new Error('Database connection failed');
            productRepository.findAll.mockResolvedValue(Result.fail(error));

            const result = await useCase.execute();

            expect(result.isFailure()).toBe(true);
            expect(result.getError().message).toBe('Database connection failed');
        });

        it('should handle timeout errors', async () => {
            const error = new Error('Query timeout exceeded');
            productRepository.findAll.mockResolvedValue(Result.fail(error));

            const result = await useCase.execute();

            expect(result.isFailure()).toBe(true);
            expect(result.getError().message).toBe('Query timeout exceeded');
        });

        it('should handle query errors', async () => {
            const error = new Error('Invalid query syntax');
            productRepository.findAll.mockResolvedValue(Result.fail(error));

            const result = await useCase.execute();

            expect(result.isFailure()).toBe(true);
            expect(result.getError().message).toBe('Invalid query syntax');
        });

        it('should handle generic repository errors', async () => {
            const error = new Error('Unexpected error occurred');
            productRepository.findAll.mockResolvedValue(Result.fail(error));

            const result = await useCase.execute();

            expect(result.isFailure()).toBe(true);
            expect(result.getError().message).toBe('Unexpected error occurred');
        });
    });

    describe('Dependency injection', () => {
        it('should inject IProductRepository correctly', () => {
            expect(productRepository).toBeDefined();
            expect(productRepository.findAll).toBeDefined();
        });

        it('should use the injected repository instance', async () => {
            productRepository.findAll.mockResolvedValue(Result.ok(mockProducts));

            await useCase.execute();

            expect(productRepository.findAll).toHaveBeenCalled();
        });
    });

    describe('Performance scenarios', () => {
        it('should handle retrieving products multiple times', async () => {
            productRepository.findAll.mockResolvedValue(Result.ok(mockProducts));

            await useCase.execute();
            await useCase.execute();
            await useCase.execute();

            expect(productRepository.findAll).toHaveBeenCalledTimes(3);
        });

        it('should handle concurrent execution', async () => {
            productRepository.findAll.mockResolvedValue(Result.ok(mockProducts));

            const results = await Promise.all([
                useCase.execute(),
                useCase.execute(),
                useCase.execute(),
            ]);

            expect(results).toHaveLength(3);
            results.forEach(result => {
                expect(result.isSuccess()).toBe(true);
                expect(result.getValue()).toHaveLength(3);
            });
            expect(productRepository.findAll).toHaveBeenCalledTimes(3);
        });
    });

    describe('Data integrity', () => {
        it('should return immutable product references', async () => {
            productRepository.findAll.mockResolvedValue(Result.ok(mockProducts));

            const result1 = await useCase.execute();
            const result2 = await useCase.execute();

            // Each call should return the same mock data
            expect(result1.getValue()).toBe(result2.getValue());
        });

        it('should preserve product creation timestamps', async () => {
            const productsWithDates = mockProducts.map(p => p);
            productRepository.findAll.mockResolvedValue(Result.ok(productsWithDates));

            const result = await useCase.execute();
            const products = result.getValue();

            products.forEach(product => {
                expect(product.createdAt).toBeInstanceOf(Date);
            });
        });
    });
});
