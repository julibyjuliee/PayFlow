import { Test, TestingModule } from '@nestjs/testing';
import { GetProductByIdUseCase } from '../get-product-by-id.use-case';
import { IProductRepository } from '../../../domain/repositories';
import { Product } from '../../../domain/entities';
import { Result } from '../../../shared/result';
import { Money } from '../../../domain/value-objects/money';

describe('GetProductByIdUseCase', () => {
  let useCase: GetProductByIdUseCase;
  let productRepository: jest.Mocked<IProductRepository>;

  const mockProduct = new Product(
    'product-123',
    'Laptop HP',
    new Money(2500000, 'COP'),
    10,
    'Electronics',
    'High performance laptop',
    'https://example.com/laptop.jpg',
  );

  beforeEach(async () => {
    // Create mock repository
    const mockProductRepository: Partial<IProductRepository> = {
      findById: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GetProductByIdUseCase,
        {
          provide: 'IProductRepository',
          useValue: mockProductRepository,
        },
      ],
    }).compile();

    useCase = module.get<GetProductByIdUseCase>(GetProductByIdUseCase);
    productRepository = module.get('IProductRepository');
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('execute', () => {
    it('should be defined', () => {
      expect(useCase).toBeDefined();
    });

    it('should return success result with product when product is found', async () => {
      const productId = 'product-123';
      const successResult = Result.ok(mockProduct);
      productRepository.findById.mockResolvedValue(successResult);

      const result = await useCase.execute(productId);

      expect(productRepository.findById).toHaveBeenCalledWith(productId);
      expect(productRepository.findById).toHaveBeenCalledTimes(1);
      expect(result.isSuccess()).toBe(true);
      expect(result.getValue()).toBe(mockProduct);
    });

    it('should return failure result when product is not found', async () => {
      const productId = 'non-existent-product';
      const error = new Error('Product not found');
      const failureResult = Result.fail<Product, Error>(error);
      productRepository.findById.mockResolvedValue(failureResult);

      const result = await useCase.execute(productId);

      expect(productRepository.findById).toHaveBeenCalledWith(productId);
      expect(productRepository.findById).toHaveBeenCalledTimes(1);
      expect(result.isFailure()).toBe(true);
      expect(result.getError()).toBe(error);
      expect(result.getError().message).toBe('Product not found');
    });

    it('should return failure result when repository throws error', async () => {
      const productId = 'product-123';
      const error = new Error('Database connection error');
      const failureResult = Result.fail<Product, Error>(error);
      productRepository.findById.mockResolvedValue(failureResult);

      const result = await useCase.execute(productId);

      expect(productRepository.findById).toHaveBeenCalledWith(productId);
      expect(result.isFailure()).toBe(true);
      expect(result.getError().message).toBe('Database connection error');
    });

    it('should call repository with the correct product ID', async () => {
      const productId = 'specific-product-id-999';
      const successResult = Result.ok(mockProduct);
      productRepository.findById.mockResolvedValue(successResult);

      await useCase.execute(productId);

      expect(productRepository.findById).toHaveBeenCalledWith(productId);
      expect(productRepository.findById).toHaveBeenCalledWith('specific-product-id-999');
    });

    it('should return product with all its properties intact', async () => {
      const productId = 'product-123';
      const successResult = Result.ok(mockProduct);
      productRepository.findById.mockResolvedValue(successResult);

      const result = await useCase.execute(productId);
      const product = result.getValue();

      expect(product.id).toBe('product-123');
      expect(product.name).toBe('Laptop HP');
      expect(product.price.amount).toBe(2500000);
      expect(product.price.currency).toBe('COP');
      expect(product.getStock()).toBe(10);
      expect(product.category).toBe('Electronics');
      expect(product.description).toBe('High performance laptop');
      expect(product.imageUrl).toBe('https://example.com/laptop.jpg');
    });

    it('should handle product with different stock levels', async () => {
      const outOfStockProduct = new Product(
        'product-456',
        'Mouse Logitech',
        new Money(50000, 'COP'),
        0,
        'Accessories',
        'Wireless mouse',
        'https://example.com/mouse.jpg',
      );

      const successResult = Result.ok(outOfStockProduct);
      productRepository.findById.mockResolvedValue(successResult);

      const result = await useCase.execute('product-456');
      const product = result.getValue();

      expect(product.getStock()).toBe(0);
      expect(product.isAvailable()).toBe(false);
    });

    it('should handle product with high stock', async () => {
      const highStockProduct = new Product(
        'product-789',
        'Keyboard Mechanical',
        new Money(350000, 'COP'),
        1000,
        'Accessories',
        'RGB mechanical keyboard',
        'https://example.com/keyboard.jpg',
      );

      const successResult = Result.ok(highStockProduct);
      productRepository.findById.mockResolvedValue(successResult);

      const result = await useCase.execute('product-789');
      const product = result.getValue();

      expect(product.getStock()).toBe(1000);
      expect(product.isAvailable()).toBe(true);
      expect(product.hasStock(500)).toBe(true);
    });

    it('should handle product without optional fields', async () => {
      const minimalProduct = new Product(
        'product-minimal',
        'Basic Product',
        new Money(100000, 'COP'),
        5,
      );

      const successResult = Result.ok(minimalProduct);
      productRepository.findById.mockResolvedValue(successResult);

      const result = await useCase.execute('product-minimal');
      const product = result.getValue();

      expect(product.id).toBe('product-minimal');
      expect(product.name).toBe('Basic Product');
      expect(product.category).toBeUndefined();
      expect(product.description).toBeUndefined();
      expect(product.imageUrl).toBeUndefined();
    });

    it('should handle empty string product ID', async () => {
      const productId = '';
      const error = new Error('Invalid product ID');
      const failureResult = Result.fail<Product, Error>(error);
      productRepository.findById.mockResolvedValue(failureResult);

      const result = await useCase.execute(productId);

      expect(productRepository.findById).toHaveBeenCalledWith('');
      expect(result.isFailure()).toBe(true);
    });

    it('should handle special characters in product ID', async () => {
      const productId = 'product-123-special-!@#$%';
      const successResult = Result.ok(mockProduct);
      productRepository.findById.mockResolvedValue(successResult);

      await useCase.execute(productId);

      expect(productRepository.findById).toHaveBeenCalledWith(productId);
    });

    it('should handle UUID format product ID', async () => {
      const productId = '550e8400-e29b-41d4-a716-446655440000';
      const successResult = Result.ok(mockProduct);
      productRepository.findById.mockResolvedValue(successResult);

      await useCase.execute(productId);

      expect(productRepository.findById).toHaveBeenCalledWith(productId);
    });
  });

  describe('Integration scenarios', () => {
    it('should work in a typical successful retrieval flow', async () => {
      // Arrange: Setup repository to return a valid product
      const productId = 'product-integration-test';
      const product = new Product(
        productId,
        'Integration Test Product',
        new Money(150000, 'COP'),
        25,
        'Test Category',
        'Product for integration testing',
        'https://example.com/test-product.jpg',
      );
      productRepository.findById.mockResolvedValue(Result.ok(product));

      // Act: Execute the use case
      const result = await useCase.execute(productId);

      // Assert: Verify the result
      expect(result.isSuccess()).toBe(true);
      expect(result.getValue().id).toBe(productId);
      expect(result.getValue().name).toBe('Integration Test Product');
      expect(result.getValue().isAvailable()).toBe(true);
    });

    it('should work in a typical failure flow', async () => {
      // Arrange: Setup repository to return error
      const productId = 'non-existent';
      const error = new Error(`Product with id ${productId} not found`);
      productRepository.findById.mockResolvedValue(Result.fail(error));

      // Act: Execute the use case
      const result = await useCase.execute(productId);

      // Assert: Verify the error
      expect(result.isFailure()).toBe(true);
      expect(result.getError().message).toContain('not found');
    });

    it('should retrieve product and verify its business rules', async () => {
      const product = new Product(
        'product-business-rules',
        'Test Product',
        new Money(100000, 'COP'),
        10,
      );
      productRepository.findById.mockResolvedValue(Result.ok(product));

      const result = await useCase.execute('product-business-rules');
      const retrievedProduct = result.getValue();

      // Verify business rules
      expect(retrievedProduct.isAvailable()).toBe(true);
      expect(retrievedProduct.hasStock(5)).toBe(true);
      expect(retrievedProduct.hasStock(15)).toBe(false);
      expect(retrievedProduct.calculateTotalPrice(3).amount).toBe(300000);
    });
  });

  describe('Different product categories', () => {
    it('should handle Electronics category', async () => {
      const electronicsProduct = new Product(
        'electronics-1',
        'Smartphone',
        new Money(1500000, 'COP'),
        50,
        'Electronics',
      );
      productRepository.findById.mockResolvedValue(Result.ok(electronicsProduct));

      const result = await useCase.execute('electronics-1');
      
      expect(result.getValue().category).toBe('Electronics');
    });

    it('should handle Clothing category', async () => {
      const clothingProduct = new Product(
        'clothing-1',
        'T-Shirt',
        new Money(80000, 'COP'),
        100,
        'Clothing',
      );
      productRepository.findById.mockResolvedValue(Result.ok(clothingProduct));

      const result = await useCase.execute('clothing-1');
      
      expect(result.getValue().category).toBe('Clothing');
    });

    it('should handle Books category', async () => {
      const bookProduct = new Product(
        'book-1',
        'Clean Code',
        new Money(120000, 'COP'),
        30,
        'Books',
      );
      productRepository.findById.mockResolvedValue(Result.ok(bookProduct));

      const result = await useCase.execute('book-1');
      
      expect(result.getValue().category).toBe('Books');
    });
  });

  describe('Dependency injection', () => {
    it('should inject IProductRepository correctly', () => {
      expect(productRepository).toBeDefined();
      expect(productRepository.findById).toBeDefined();
    });

    it('should use the injected repository instance', async () => {
      const productId = 'test-injection';
      productRepository.findById.mockResolvedValue(Result.ok(mockProduct));

      await useCase.execute(productId);

      expect(productRepository.findById).toHaveBeenCalled();
    });
  });

  describe('Error handling', () => {
    it('should handle generic errors from repository', async () => {
      const productId = 'error-product';
      const error = new Error('Unexpected error occurred');
      productRepository.findById.mockResolvedValue(Result.fail(error));

      const result = await useCase.execute(productId);

      expect(result.isFailure()).toBe(true);
      expect(result.getError().message).toBe('Unexpected error occurred');
    });

    it('should handle timeout errors', async () => {
      const productId = 'timeout-product';
      const error = new Error('Request timeout');
      productRepository.findById.mockResolvedValue(Result.fail(error));

      const result = await useCase.execute(productId);

      expect(result.isFailure()).toBe(true);
      expect(result.getError().message).toBe('Request timeout');
    });

    it('should handle network errors', async () => {
      const productId = 'network-error-product';
      const error = new Error('Network connection failed');
      productRepository.findById.mockResolvedValue(Result.fail(error));

      const result = await useCase.execute(productId);

      expect(result.isFailure()).toBe(true);
      expect(result.getError().message).toBe('Network connection failed');
    });
  });
});
