import { Injectable, Inject } from '@nestjs/common';
import type { IProductRepository } from '../../domain/repositories';
import { Product } from '../../domain/entities';
import { Result } from '../../shared/result';

/**
 * Get Product By ID Use Case
 * Retrieves a specific product by its ID
 */
@Injectable()
export class GetProductByIdUseCase {
  constructor(
    @Inject('IProductRepository')
    private readonly productRepository: IProductRepository,
  ) {}

  async execute(productId: string): Promise<Result<Product, Error>> {
    return this.productRepository.findById(productId);
  }
}
