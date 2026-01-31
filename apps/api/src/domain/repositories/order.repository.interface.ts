import { Order } from '../entities';
import { Result } from '../../shared/result';
import { TransactionStatus } from '../value-objects';

/**
 * Order Repository Port (Interface)
 * Defines the contract for order persistence
 */
export interface IOrderRepository {
  findAll(): Promise<Result<Order[], Error>>;

  findById(id: string): Promise<Result<Order, Error>>;

  findByStatus(status: TransactionStatus): Promise<Result<Order[], Error>>;

  save(order: Order): Promise<Result<Order, Error>>;

  update(order: Order): Promise<Result<Order, Error>>;
}
