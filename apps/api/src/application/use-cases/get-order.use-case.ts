import { Injectable, Inject } from '@nestjs/common';
import type { IOrderRepository } from '../../domain/repositories';
import { Order } from '../../domain/entities';
import { Result } from '../../shared/result';

/**
 * Get Order Use Case
 * Retrieves a specific order by ID
 */
@Injectable()
export class GetOrderUseCase {
  constructor(
    @Inject('IOrderRepository')
    private readonly orderRepository: IOrderRepository,
  ) {}

  async execute(orderId: string): Promise<Result<Order, Error>> {
    return this.orderRepository.findById(orderId);
  }
}
