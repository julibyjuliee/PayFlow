import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { IProductRepository } from '../../../domain/repositories';
import { Product } from '../../../domain/entities';
import { Result } from '../../../shared/result';
import { ProductEntity } from '../entities/product.entity';
import { ProductMapper } from '../mappers/product.mapper';

/**
 * Product Repository Implementation (Adapter)
 * Implements the IProductRepository port using TypeORM
 */
@Injectable()
export class ProductRepository implements IProductRepository {
  constructor(
    @InjectRepository(ProductEntity)
    private readonly repository: Repository<ProductEntity>,
  ) {}

  async findAll(): Promise<Result<Product[], Error>> {
    try {
      const entities = await this.repository.find();
      const products = entities.map((entity) => ProductMapper.toDomain(entity));
      return Result.ok(products);
    } catch (error) {
      return Result.fail(error as Error);
    }
  }

  async findById(id: string): Promise<Result<Product, Error>> {
    try {
      const entity = await this.repository.findOne({ where: { id } });
      if (!entity) {
        return Result.fail(new Error(`Product with id ${id} not found`));
      }
      const product = ProductMapper.toDomain(entity);
      return Result.ok(product);
    } catch (error) {
      return Result.fail(error as Error);
    }
  }

  async save(product: Product): Promise<Result<Product, Error>> {
    try {
      const entity = ProductMapper.toEntity(product);
      const savedEntity = await this.repository.save(entity);
      const savedProduct = ProductMapper.toDomain(savedEntity);
      return Result.ok(savedProduct);
    } catch (error) {
      return Result.fail(error as Error);
    }
  }

  async update(product: Product): Promise<Result<Product, Error>> {
    try {
      const entity = ProductMapper.toEntity(product);
      const updatedEntity = await this.repository.save(entity);
      const updatedProduct = ProductMapper.toDomain(updatedEntity);
      return Result.ok(updatedProduct);
    } catch (error) {
      return Result.fail(error as Error);
    }
  }

  async delete(id: string): Promise<Result<void, Error>> {
    try {
      await this.repository.delete(id);
      return Result.ok(undefined);
    } catch (error) {
      return Result.fail(error as Error);
    }
  }
}
