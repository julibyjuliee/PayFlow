import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import type { IOrderRepository } from '../../../domain/repositories';
import { Order } from '../../../domain/entities';
import { TransactionStatus } from '../../../domain/value-objects';
import { Result } from '../../../shared/result';
import { OrderEntity } from '../entities/transaction.entity';
import { OrderMapper } from '../mappers/order.mapper';

/**
 * Order Repository Implementation (Adapter)
 * Implements the IOrderRepository port using TypeORM
 */
@Injectable()
export class OrderRepository implements IOrderRepository {
  constructor(
    @InjectRepository(OrderEntity)
    private readonly repository: Repository<OrderEntity>,
  ) {}

  async findAll(): Promise<Result<Order[], Error>> {
    try {
      const entities = await this.repository.find();
      const orders = entities.map((entity) => OrderMapper.toDomain(entity));
      return Result.ok(orders);
    } catch (error) {
      return Result.fail(error as Error);
    }
  }

  async findById(id: string): Promise<Result<Order, Error>> {
    try {
      const entity = await this.repository.findOne({ where: { id } });
      if (!entity) {
        return Result.fail(new Error(`Order with id ${id} not found`));
      }
      const order = OrderMapper.toDomain(entity);
      return Result.ok(order);
    } catch (error) {
      return Result.fail(error as Error);
    }
  }

  async findByStatus(
    status: TransactionStatus,
  ): Promise<Result<Order[], Error>> {
    try {
      const entities = await this.repository.find({ where: { status } });
      const orders = entities.map((entity) => OrderMapper.toDomain(entity));
      return Result.ok(orders);
    } catch (error) {
      return Result.fail(error as Error);
    }
  }

  async save(order: Order): Promise<Result<Order, Error>> {
    try {
      const entity = OrderMapper.toEntity(order);
      const savedEntity = await this.repository.save(entity);
      const savedOrder = OrderMapper.toDomain(savedEntity);
      return Result.ok(savedOrder);
    } catch (error) {
      return Result.fail(error as Error);
    }
  }

  async update(order: Order): Promise<Result<Order, Error>> {
    try {
      const entity = OrderMapper.toEntity(order);
      const updatedEntity = await this.repository.save(entity);
      const updatedOrder = OrderMapper.toDomain(updatedEntity);
      return Result.ok(updatedOrder);
    } catch (error) {
      return Result.fail(error as Error);
    }
  }
}
