import { Order } from '../../../domain/entities';
import { Money, TransactionStatusVO } from '../../../domain/value-objects';
import { OrderEntity } from '../entities/transaction.entity';

/**
 * Order Mapper
 * Converts between domain Order and database OrderEntity
 */
export class OrderMapper {
  public static toDomain(entity: OrderEntity): Order {
    return new Order(
      entity.id,
      entity.productId || '',
      entity.quantity,
      new Money(Number(entity.totalPrice), 'COP'),
      new TransactionStatusVO(entity.status as any),
      entity.firstName,
      entity.lastName,
      entity.address,
      entity.city,
      entity.postalCode,
      entity.customerEmail || '',
      entity.wpTransactionId,
      entity.wpReference,
      entity.paymentMethod,
      entity.errorMessage,
      entity.createdAt,
    );
  }

  public static toEntity(domain: Order): OrderEntity {
    const entity = new OrderEntity();
    entity.id = domain.id;
    entity.productId = domain.productId;
    entity.quantity = domain.quantity;
    entity.totalPrice = domain.totalPrice.amount;
    entity.status = domain.getStatusValue();
    entity.firstName = domain.firstName;
    entity.lastName = domain.lastName;
    entity.address = domain.address;
    entity.city = domain.city;
    entity.postalCode = domain.postalCode;
    entity.customerEmail = domain.customerEmail;
    entity.wpTransactionId = domain.wpTransactionId;
    entity.wpReference = domain.wpReference;
    entity.paymentMethod = domain.paymentMethod;
    entity.errorMessage = domain.errorMessage;
    entity.createdAt = domain.createdAt;
    return entity;
  }
}
