import { Injectable, Inject } from '@nestjs/common';
import type { IProductRepository } from '../../domain/repositories';
import { Product } from '../../domain/entities';
import { Result } from '../../shared/result';

/**
 * Get Products Use Case
 * Retrieves all available products
 */
@Injectable()
export class GetProductsUseCase {
  constructor(
    @Inject('IProductRepository')
    private readonly productRepository: IProductRepository,
  ) {}

  async execute(): Promise<Result<Product[], Error>> {
    return this.productRepository.findAll();
  }
}
