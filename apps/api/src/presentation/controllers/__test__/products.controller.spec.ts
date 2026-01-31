import { HttpException, HttpStatus } from '@nestjs/common';
import { ProductsController } from '../products.controller';
import {
  GetProductsUseCase,
  GetProductByIdUseCase,
} from '../../../application/use-cases';
import { ProductDto } from '../../../application/dtos';
import { Result } from '../../../shared/result/result';

describe('ProductsController', () => {
  let controller: ProductsController;
  let getProductsUseCase: jest.Mocked<GetProductsUseCase>;
  let getProductByIdUseCase: jest.Mocked<GetProductByIdUseCase>;

  const mockProductDto: ProductDto = {
    id: 'product-123',
    name: 'Test Product',
    price: 100000,
    category: 'Electronics',
    description: 'A test product',
    stock: 10,
    imageUrl: 'https://example.com/image.jpg',
    createdAt: new Date('2024-01-01'),
  };

  beforeEach(() => {
    getProductsUseCase = {
      execute: jest.fn(),
    } as any;

    getProductByIdUseCase = {
      execute: jest.fn(),
    } as any;

    controller = new ProductsController(
      getProductsUseCase,
      getProductByIdUseCase,
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('constructor', () => {
    it('should create controller instance', () => {
      expect(controller).toBeDefined();
      expect(controller).toBeInstanceOf(ProductsController);
    });

    it('should inject all required use cases', () => {
      expect(controller['getProductsUseCase']).toBe(getProductsUseCase);
      expect(controller['getProductByIdUseCase']).toBe(getProductByIdUseCase);
    });
  });

  describe('getAllProducts', () => {
    it('should get all products successfully', async () => {
      const mockProducts = [
        {
          toJSON: jest.fn().mockReturnValue(mockProductDto),
        },
        {
          toJSON: jest.fn().mockReturnValue({
            ...mockProductDto,
            id: 'product-456',
            name: 'Another Product',
          }),
        },
      ] as any;

      getProductsUseCase.execute.mockResolvedValue(Result.ok(mockProducts));

      const result = await controller.getAllProducts();

      expect(result).toHaveLength(2);
      expect(result[0]).toEqual(mockProductDto);
      expect(getProductsUseCase.execute).toHaveBeenCalledTimes(1);
      expect(mockProducts[0].toJSON).toHaveBeenCalledTimes(1);
      expect(mockProducts[1].toJSON).toHaveBeenCalledTimes(1);
    });

    it('should call use case without parameters', async () => {
      const mockProducts = [
        {
          toJSON: jest.fn().mockReturnValue(mockProductDto),
        },
      ] as any;

      getProductsUseCase.execute.mockResolvedValue(Result.ok(mockProducts));

      await controller.getAllProducts();

      expect(getProductsUseCase.execute).toHaveBeenCalledWith();
      expect(getProductsUseCase.execute).toHaveBeenCalledTimes(1);
    });

    it('should return empty array when no products exist', async () => {
      getProductsUseCase.execute.mockResolvedValue(Result.ok([]));

      const result = await controller.getAllProducts();

      expect(result).toEqual([]);
      expect(result).toHaveLength(0);
    });

    it('should map multiple products using toJSON', async () => {
      const product1Dto: ProductDto = {
        id: 'product-1',
        name: 'Product 1',
        price: 50000,
        stock: 5,
        createdAt: new Date('2024-01-01'),
      };

      const product2Dto: ProductDto = {
        id: 'product-2',
        name: 'Product 2',
        price: 75000,
        stock: 8,
        createdAt: new Date('2024-01-02'),
      };

      const product3Dto: ProductDto = {
        id: 'product-3',
        name: 'Product 3',
        price: 100000,
        category: 'Books',
        stock: 12,
        createdAt: new Date('2024-01-03'),
      };

      const mockProducts = [
        { toJSON: jest.fn().mockReturnValue(product1Dto) },
        { toJSON: jest.fn().mockReturnValue(product2Dto) },
        { toJSON: jest.fn().mockReturnValue(product3Dto) },
      ] as any;

      getProductsUseCase.execute.mockResolvedValue(Result.ok(mockProducts));

      const result = await controller.getAllProducts();

      expect(result).toHaveLength(3);
      expect(result[0]).toEqual(product1Dto);
      expect(result[1]).toEqual(product2Dto);
      expect(result[2]).toEqual(product3Dto);
    });

    it('should throw HttpException with INTERNAL_SERVER_ERROR when use case fails', async () => {
      const error = new Error('Database connection failed');
      getProductsUseCase.execute.mockResolvedValue(Result.fail(error));

      await expect(controller.getAllProducts()).rejects.toThrow(
        new HttpException(
          'Database connection failed',
          HttpStatus.INTERNAL_SERVER_ERROR,
        ),
      );
    });

    it('should throw HttpException with error message from use case', async () => {
      const error = new Error('Failed to fetch products');
      getProductsUseCase.execute.mockResolvedValue(Result.fail(error));

      await expect(controller.getAllProducts()).rejects.toThrow(HttpException);
      await expect(controller.getAllProducts()).rejects.toThrow(
        'Failed to fetch products',
      );
    });

    it('should throw HttpException with INTERNAL_SERVER_ERROR status code', async () => {
      const error = new Error('Unexpected error');
      getProductsUseCase.execute.mockResolvedValue(Result.fail(error));

      try {
        await controller.getAllProducts();
        fail('Should have thrown HttpException');
      } catch (e) {
        expect(e).toBeInstanceOf(HttpException);
        expect((e as HttpException).getStatus()).toBe(
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }
    });

    it('should handle products with optional fields', async () => {
      const productWithOptionals: ProductDto = {
        id: 'product-opt',
        name: 'Product with optionals',
        price: 80000,
        category: 'Clothing',
        description: 'A product with all optional fields',
        stock: 15,
        imageUrl: 'https://example.com/optional.jpg',
        createdAt: new Date('2024-01-05'),
      };

      const mockProducts = [
        { toJSON: jest.fn().mockReturnValue(productWithOptionals) },
      ] as any;

      getProductsUseCase.execute.mockResolvedValue(Result.ok(mockProducts));

      const result = await controller.getAllProducts();

      expect(result[0]).toEqual(productWithOptionals);
      expect(result[0].category).toBe('Clothing');
      expect(result[0].description).toBe('A product with all optional fields');
      expect(result[0].imageUrl).toBe('https://example.com/optional.jpg');
    });

    it('should handle products without optional fields', async () => {
      const productWithoutOptionals: ProductDto = {
        id: 'product-min',
        name: 'Minimal Product',
        price: 25000,
        stock: 3,
        createdAt: new Date('2024-01-06'),
      };

      const mockProducts = [
        { toJSON: jest.fn().mockReturnValue(productWithoutOptionals) },
      ] as any;

      getProductsUseCase.execute.mockResolvedValue(Result.ok(mockProducts));

      const result = await controller.getAllProducts();

      expect(result[0]).toEqual(productWithoutOptionals);
      expect(result[0].category).toBeUndefined();
      expect(result[0].description).toBeUndefined();
      expect(result[0].imageUrl).toBeUndefined();
    });
  });

  describe('getProductById', () => {
    it('should get product by id successfully', async () => {
      const productId = 'product-123';
      const mockProduct = {
        toJSON: jest.fn().mockReturnValue(mockProductDto),
      } as any;

      getProductByIdUseCase.execute.mockResolvedValue(Result.ok(mockProduct));

      const result = await controller.getProductById(productId);

      expect(result).toEqual(mockProductDto);
      expect(getProductByIdUseCase.execute).toHaveBeenCalledWith(productId);
      expect(mockProduct.toJSON).toHaveBeenCalledTimes(1);
    });

    it('should call use case with product id', async () => {
      const productId = 'product-456';
      const mockProduct = {
        toJSON: jest.fn().mockReturnValue(mockProductDto),
      } as any;

      getProductByIdUseCase.execute.mockResolvedValue(Result.ok(mockProduct));

      await controller.getProductById(productId);

      expect(getProductByIdUseCase.execute).toHaveBeenCalledWith(productId);
      expect(getProductByIdUseCase.execute).toHaveBeenCalledTimes(1);
    });

    it('should throw HttpException with NOT_FOUND when use case fails', async () => {
      const error = new Error('Product not found');
      getProductByIdUseCase.execute.mockResolvedValue(Result.fail(error));

      await expect(controller.getProductById('product-123')).rejects.toThrow(
        new HttpException('Product not found', HttpStatus.NOT_FOUND),
      );
    });

    it('should throw HttpException with error message from use case', async () => {
      const error = new Error('Invalid product ID');
      getProductByIdUseCase.execute.mockResolvedValue(Result.fail(error));

      await expect(controller.getProductById('invalid-id')).rejects.toThrow(
        HttpException,
      );
      await expect(controller.getProductById('invalid-id')).rejects.toThrow(
        'Invalid product ID',
      );
    });

    it('should throw HttpException with NOT_FOUND status code', async () => {
      const error = new Error('Product does not exist');
      getProductByIdUseCase.execute.mockResolvedValue(Result.fail(error));

      try {
        await controller.getProductById('nonexistent-product');
        fail('Should have thrown HttpException');
      } catch (e) {
        expect(e).toBeInstanceOf(HttpException);
        expect((e as HttpException).getStatus()).toBe(HttpStatus.NOT_FOUND);
      }
    });

    it('should return ProductDto from toJSON method', async () => {
      const expectedDto: ProductDto = {
        id: 'product-789',
        name: 'Specific Product',
        price: 120000,
        category: 'Home',
        description: 'A specific product',
        stock: 20,
        imageUrl: 'https://example.com/specific.jpg',
        createdAt: new Date('2024-01-10'),
      };

      const mockProduct = {
        toJSON: jest.fn().mockReturnValue(expectedDto),
      } as any;

      getProductByIdUseCase.execute.mockResolvedValue(Result.ok(mockProduct));

      const result = await controller.getProductById('product-789');

      expect(result).toEqual(expectedDto);
      expect(result.id).toBe('product-789');
      expect(result.name).toBe('Specific Product');
      expect(result.price).toBe(120000);
    });

    it('should handle different product IDs', async () => {
      const mockProduct = {
        toJSON: jest.fn().mockReturnValue(mockProductDto),
      } as any;

      getProductByIdUseCase.execute.mockResolvedValue(Result.ok(mockProduct));

      await controller.getProductById('product-1');
      await controller.getProductById('product-2');
      await controller.getProductById('product-3');

      expect(getProductByIdUseCase.execute).toHaveBeenCalledTimes(3);
      expect(getProductByIdUseCase.execute).toHaveBeenCalledWith('product-1');
      expect(getProductByIdUseCase.execute).toHaveBeenCalledWith('product-2');
      expect(getProductByIdUseCase.execute).toHaveBeenCalledWith('product-3');
    });

    it('should return product with minimal fields', async () => {
      const minimalProductDto: ProductDto = {
        id: 'product-min',
        name: 'Minimal',
        price: 30000,
        stock: 5,
        createdAt: new Date('2024-01-15'),
      };

      const mockProduct = {
        toJSON: jest.fn().mockReturnValue(minimalProductDto),
      } as any;

      getProductByIdUseCase.execute.mockResolvedValue(Result.ok(mockProduct));

      const result = await controller.getProductById('product-min');

      expect(result).toEqual(minimalProductDto);
      expect(result.category).toBeUndefined();
      expect(result.description).toBeUndefined();
      expect(result.imageUrl).toBeUndefined();
    });

    it('should return product with all optional fields populated', async () => {
      const completeProductDto: ProductDto = {
        id: 'product-complete',
        name: 'Complete Product',
        price: 200000,
        category: 'Premium',
        description: 'A product with all fields',
        stock: 50,
        imageUrl: 'https://example.com/complete.jpg',
        createdAt: new Date('2024-01-20'),
      };

      const mockProduct = {
        toJSON: jest.fn().mockReturnValue(completeProductDto),
      } as any;

      getProductByIdUseCase.execute.mockResolvedValue(Result.ok(mockProduct));

      const result = await controller.getProductById('product-complete');

      expect(result).toEqual(completeProductDto);
      expect(result.category).toBe('Premium');
      expect(result.description).toBe('A product with all fields');
      expect(result.imageUrl).toBe('https://example.com/complete.jpg');
    });
  });

  describe('error handling', () => {
    it('should handle use case execution errors in getAllProducts', async () => {
      getProductsUseCase.execute.mockRejectedValue(
        new Error('Unexpected error'),
      );

      await expect(controller.getAllProducts()).rejects.toThrow(
        'Unexpected error',
      );
    });

    it('should handle use case execution errors in getProductById', async () => {
      getProductByIdUseCase.execute.mockRejectedValue(
        new Error('Database error'),
      );

      await expect(controller.getProductById('product-123')).rejects.toThrow(
        'Database error',
      );
    });

    it('should propagate errors from use case', async () => {
      const customError = new Error('Custom database error');
      getProductsUseCase.execute.mockRejectedValue(customError);

      await expect(controller.getAllProducts()).rejects.toBe(customError);
    });
  });

  describe('Result pattern integration', () => {
    it('should call getValue when result is success in getAllProducts', async () => {
      const mockProducts = [
        { toJSON: jest.fn().mockReturnValue(mockProductDto) },
      ] as any;

      const resultSpy = Result.ok(mockProducts);
      const getValueSpy = jest.spyOn(resultSpy, 'getValue');

      getProductsUseCase.execute.mockResolvedValue(resultSpy);

      await controller.getAllProducts();

      expect(getValueSpy).toHaveBeenCalled();
    });

    it('should call getValue when result is success in getProductById', async () => {
      const mockProduct = {
        toJSON: jest.fn().mockReturnValue(mockProductDto),
      } as any;

      const resultSpy = Result.ok(mockProduct);
      const getValueSpy = jest.spyOn(resultSpy, 'getValue');

      getProductByIdUseCase.execute.mockResolvedValue(resultSpy);

      await controller.getProductById('product-123');

      expect(getValueSpy).toHaveBeenCalled();
    });
  });

  describe('array mapping', () => {
    it('should correctly map array of products to DTOs', async () => {
      const mockProducts = [
        { toJSON: jest.fn().mockReturnValue({ id: '1', name: 'P1', price: 100, stock: 1, createdAt: new Date() }) },
        { toJSON: jest.fn().mockReturnValue({ id: '2', name: 'P2', price: 200, stock: 2, createdAt: new Date() }) },
        { toJSON: jest.fn().mockReturnValue({ id: '3', name: 'P3', price: 300, stock: 3, createdAt: new Date() }) },
      ] as any;

      getProductsUseCase.execute.mockResolvedValue(Result.ok(mockProducts));

      const result = await controller.getAllProducts();

      expect(result).toHaveLength(3);
      expect(result[0].id).toBe('1');
      expect(result[1].id).toBe('2');
      expect(result[2].id).toBe('3');
      expect(mockProducts[0].toJSON).toHaveBeenCalledTimes(1);
      expect(mockProducts[1].toJSON).toHaveBeenCalledTimes(1);
      expect(mockProducts[2].toJSON).toHaveBeenCalledTimes(1);
    });

    it('should handle single product in array', async () => {
      const singleProduct = [
        { toJSON: jest.fn().mockReturnValue(mockProductDto) },
      ] as any;

      getProductsUseCase.execute.mockResolvedValue(Result.ok(singleProduct));

      const result = await controller.getAllProducts();

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual(mockProductDto);
    });
  });
});
