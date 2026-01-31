import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import type { ITransactionRepository } from '../../../domain/repositories';
import { Transaction } from '../../../domain/entities';
import { TransactionStatus } from '../../../domain/value-objects';
import { Result } from '../../../shared/result';
import { OrderEntity } from '../entities/transaction.entity';
import { TransactionMapper } from '../mappers/transaction.mapper';

/**
 * Transaction Repository Implementation (Adapter)
 * Implements the ITransactionRepository port using TypeORM
 */
@Injectable()
export class TransactionRepository implements ITransactionRepository {
  constructor(
    @InjectRepository(OrderEntity)
    private readonly repository: Repository<OrderEntity>,
  ) {}

  async findAll(): Promise<Result<Transaction[], Error>> {
    try {
      const entities = await this.repository.find();
      const transactions = entities.map((entity) =>
        TransactionMapper.toDomain(entity),
      );
      return Result.ok(transactions);
    } catch (error) {
      return Result.fail(error as Error);
    }
  }

  async findById(id: string): Promise<Result<Transaction, Error>> {
    try {
      const entity = await this.repository.findOne({ where: { id } });
      if (!entity) {
        return Result.fail(new Error(`Transaction with id ${id} not found`));
      }
      const transaction = TransactionMapper.toDomain(entity);
      return Result.ok(transaction);
    } catch (error) {
      return Result.fail(error as Error);
    }
  }

  async findByStatus(
    status: TransactionStatus,
  ): Promise<Result<Transaction[], Error>> {
    try {
      const entities = await this.repository.find({ where: { status } });
      const transactions = entities.map((entity) =>
        TransactionMapper.toDomain(entity),
      );
      return Result.ok(transactions);
    } catch (error) {
      return Result.fail(error as Error);
    }
  }

  async save(transaction: Transaction): Promise<Result<Transaction, Error>> {
    try {
      const entity = TransactionMapper.toEntity(transaction);
      const savedEntity = await this.repository.save(entity);
      const savedTransaction = TransactionMapper.toDomain(savedEntity);
      return Result.ok(savedTransaction);
    } catch (error) {
      return Result.fail(error as Error);
    }
  }

  async update(
    transaction: Transaction,
  ): Promise<Result<Transaction, Error>> {
    try {
      const entity = TransactionMapper.toEntity(transaction);
      const updatedEntity = await this.repository.save(entity);
      const updatedTransaction = TransactionMapper.toDomain(updatedEntity);
      return Result.ok(updatedTransaction);
    } catch (error) {
      return Result.fail(error as Error);
    }
  }
}
