import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ProductRepository } from '../product.repository';
import { ProductEntity } from '../../entities/product.entity';
import { Product } from '../../../../domain/entities';
import { Money } from '../../../../domain/value-objects';

describe('ProductRepository', () => {
  let productRepository: ProductRepository;
  let mockRepository: jest.Mocked<Repository<ProductEntity>>;

  const mockProductEntity: ProductEntity = {
    id: '1',
    name: 'Test Product',
    description: 'Test Description',
    price: 100,
    stock: 10,
    imageUrl: 'http://example.com/image.jpg',
  };

  const mockProduct = new Product(
    '1',
    'Test Product',
    'Test Description',
    new Money(100, 'COP'),
    10,
    'http://example.com/image.jpg',
  );

  beforeEach(async () => {
    mockRepository = {
      find: jest.fn(),
      findOne: jest.fn(),
      save: jest.fn(),
      delete: jest.fn(),
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProductRepository,
        {
          provide: getRepositoryToken(ProductEntity),
          useValue: mockRepository,
        },
      ],
    }).compile();

    productRepository = module.get<ProductRepository>(ProductRepository);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('findAll', () => {
    it('should return all products successfully', async () => {
      const entities = [mockProductEntity];
      mockRepository.find.mockResolvedValue(entities);

      const result = await productRepository.findAll();

      expect(result.isSuccess()).toBe(true);
      expect(mockRepository.find).toHaveBeenCalledTimes(1);
      const products = result.getValue();
      expect(products).toHaveLength(1);
      expect(products[0].id).toBe('1');
      expect(products[0].name).toBe('Test Product');
    });

    it('should return empty array when no products exist', async () => {
      mockRepository.find.mockResolvedValue([]);

      const result = await productRepository.findAll();

      expect(result.isSuccess()).toBe(true);
      expect(result.getValue()).toEqual([]);
    });

    it('should return failure result when database error occurs', async () => {
      const error = new Error('Database connection error');
      mockRepository.find.mockRejectedValue(error);

      const result = await productRepository.findAll();

      expect(result.isFailure()).toBe(true);
      expect(result.getError()).toBe(error);
    });
  });

  describe('findById', () => {
    it('should return product when found', async () => {
      mockRepository.findOne.mockResolvedValue(mockProductEntity);

      const result = await productRepository.findById('1');

      expect(result.isSuccess()).toBe(true);
      expect(mockRepository.findOne).toHaveBeenCalledWith({ where: { id: '1' } });
      const product = result.getValue();
      expect(product.id).toBe('1');
      expect(product.name).toBe('Test Product');
    });

    it('should return failure when product not found', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      const result = await productRepository.findById('non-existent');

      expect(result.isFailure()).toBe(true);
      expect(result.getError().message).toBe('Product with id non-existent not found');
    });

    it('should return failure result when database error occurs', async () => {
      const error = new Error('Database error');
      mockRepository.findOne.mockRejectedValue(error);

      const result = await productRepository.findById('1');

      expect(result.isFailure()).toBe(true);
      expect(result.getError()).toBe(error);
    });
  });

  describe('save', () => {
    it('should save product successfully', async () => {
      mockRepository.save.mockResolvedValue(mockProductEntity);

      const result = await productRepository.save(mockProduct);

      expect(result.isSuccess()).toBe(true);
      expect(mockRepository.save).toHaveBeenCalledTimes(1);
      const savedProduct = result.getValue();
      expect(savedProduct.id).toBe('1');
      expect(savedProduct.name).toBe('Test Product');
    });

    it('should return failure when save fails', async () => {
      const error = new Error('Save failed');
      mockRepository.save.mockRejectedValue(error);

      const result = await productRepository.save(mockProduct);

      expect(result.isFailure()).toBe(true);
      expect(result.getError()).toBe(error);
    });
  });

  describe('update', () => {
    it('should update product successfully', async () => {
      const updatedEntity = { ...mockProductEntity, name: 'Updated Product' };
      mockRepository.save.mockResolvedValue(updatedEntity);

      const updatedProduct = new Product(
        '1',
        'Updated Product',
        'Test Description',
        new Money(100, 'COP'),
        10,
        'http://example.com/image.jpg',
      );

      const result = await productRepository.update(updatedProduct);

      expect(result.isSuccess()).toBe(true);
      expect(mockRepository.save).toHaveBeenCalledTimes(1);
      const product = result.getValue();
      expect(product.name).toBe('Updated Product');
    });

    it('should return failure when update fails', async () => {
      const error = new Error('Update failed');
      mockRepository.save.mockRejectedValue(error);

      const result = await productRepository.update(mockProduct);

      expect(result.isFailure()).toBe(true);
      expect(result.getError()).toBe(error);
    });
  });

  describe('delete', () => {
    it('should delete product successfully', async () => {
      mockRepository.delete.mockResolvedValue({ affected: 1, raw: {} } as any);

      const result = await productRepository.delete('1');

      expect(result.isSuccess()).toBe(true);
      expect(mockRepository.delete).toHaveBeenCalledWith('1');
      expect(result.getValue()).toBeUndefined();
    });

    it('should return failure when delete fails', async () => {
      const error = new Error('Delete failed');
      mockRepository.delete.mockRejectedValue(error);

      const result = await productRepository.delete('1');

      expect(result.isFailure()).toBe(true);
      expect(result.getError()).toBe(error);
    });
  });
});
