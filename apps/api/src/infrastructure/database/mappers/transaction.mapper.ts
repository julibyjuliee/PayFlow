import { Transaction } from '../../../domain/entities';
import { Money, TransactionStatusVO } from '../../../domain/value-objects';
import { OrderEntity } from '../entities/transaction.entity';

export class TransactionMapper {
  public static toDomain(entity: OrderEntity): Transaction {
    return new Transaction(
      entity.id,
      entity.productId || '',
      entity.quantity,
      new Money(Number(entity.totalPrice), 'COP'),
      new TransactionStatusVO(entity.status as any),
      entity.customerEmail || '',
      entity.firstName,
      entity.lastName,
      entity.address,
      entity.city,
      entity.postalCode,
      entity.wpTransactionId ?? undefined,
      entity.wpReference ?? undefined,
      entity.paymentMethod ?? undefined,
      entity.errorMessage ?? undefined,
      entity.createdAt
    );
  }

  public static toEntity(domain: Transaction): OrderEntity {
    const entity = new OrderEntity();
    entity.id = domain.id;
    entity.productId = domain.productId;
    entity.firstName = domain.firstName;
    entity.lastName = domain.lastName;
    entity.address = domain.address;
    entity.city = domain.city;
    entity.postalCode = domain.postalCode;
    entity.quantity = domain.quantity;
    entity.totalPrice = domain.amount.amount;
    entity.status = domain.getStatusValue();
    entity.customerEmail = domain.customerEmail;
    entity.wpTransactionId = domain.wpTransactionId;
    entity.wpReference = domain.wpReference;
    entity.paymentMethod = domain.paymentMethod;
    entity.errorMessage = domain.errorMessage;
    entity.createdAt = domain.createdAt;
    return entity;
  }
}