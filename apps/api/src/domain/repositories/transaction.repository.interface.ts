import { Transaction } from '../entities';
import { Result } from '../../shared/result';
import { TransactionStatus } from '../value-objects';

/**
 * Transaction Repository Port (Interface)
 * Defines the contract for transaction persistence
 */
export interface ITransactionRepository {
  findAll(): Promise<Result<Transaction[], Error>>;

  findById(id: string): Promise<Result<Transaction, Error>>;

  findByStatus(status: TransactionStatus): Promise<Result<Transaction[], Error>>;

  save(transaction: Transaction): Promise<Result<Transaction, Error>>;

  update(transaction: Transaction): Promise<Result<Transaction, Error>>;
}
