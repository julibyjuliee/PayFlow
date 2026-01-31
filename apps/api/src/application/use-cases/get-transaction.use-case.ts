import { Injectable, Inject } from '@nestjs/common';
import type { ITransactionRepository } from '../../domain/repositories';
import { Transaction } from '../../domain/entities';
import { Result } from '../../shared/result';

/**
 * Get Transaction Use Case
 * Retrieves a specific transaction by ID
 */
@Injectable()
export class GetTransactionUseCase {
  constructor(
    @Inject('ITransactionRepository')
    private readonly transactionRepository: ITransactionRepository,
  ) {}

  async execute(transactionId: string): Promise<Result<Transaction, Error>> {
    return this.transactionRepository.findById(transactionId);
  }
}
