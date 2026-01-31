import { Product } from '../entities';
import { Result } from '../../shared/result';

/**
 * Product Repository Port (Interface)
 * Defines the contract for product persistence
 */
export interface IProductRepository {
  findAll(): Promise<Result<Product[], Error>>;

  findById(id: string): Promise<Result<Product, Error>>;

  save(product: Product): Promise<Result<Product, Error>>;

  update(product: Product): Promise<Result<Product, Error>>;

  delete(id: string): Promise<Result<void, Error>>;
}
