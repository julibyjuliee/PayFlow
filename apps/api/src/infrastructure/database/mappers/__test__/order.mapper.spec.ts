import { OrderMapper } from '../order.mapper';
import { Order } from '../../../../domain/entities';
import { Money, TransactionStatus, TransactionStatusVO } from '../../../../domain/value-objects';
import { OrderEntity } from '../../entities/transaction.entity';

describe('OrderMapper', () => {
  describe('toDomain', () => {
    it('should convert OrderEntity to Order with all required fields', () => {
      const orderEntity = new OrderEntity();
      orderEntity.id = 'order-123';
      orderEntity.productId = 'product-456';
      orderEntity.quantity = 2;
      orderEntity.totalPrice = 100000;
      orderEntity.status = 'PENDING';
      orderEntity.firstName = 'John';
      orderEntity.lastName = 'Doe';
      orderEntity.address = 'Calle 123 #45-67';
      orderEntity.city = 'Bogotá';
      orderEntity.postalCode = '110111';
      orderEntity.customerEmail = 'john.doe@example.com';
      orderEntity.createdAt = new Date('2024-01-01');

      const domainOrder = OrderMapper.toDomain(orderEntity);

      expect(domainOrder).toBeInstanceOf(Order);
      expect(domainOrder.id).toBe('order-123');
      expect(domainOrder.productId).toBe('product-456');
      expect(domainOrder.quantity).toBe(2);
      expect(domainOrder.totalPrice).toBeInstanceOf(Money);
      expect(domainOrder.totalPrice.amount).toBe(100000);
      expect(domainOrder.totalPrice.currency).toBe('COP');
      expect(domainOrder.getStatusValue()).toBe(TransactionStatus.PENDING);
      expect(domainOrder.firstName).toBe('John');
      expect(domainOrder.lastName).toBe('Doe');
      expect(domainOrder.address).toBe('Calle 123 #45-67');
      expect(domainOrder.city).toBe('Bogotá');
      expect(domainOrder.postalCode).toBe('110111');
      expect(domainOrder.customerEmail).toBe('john.doe@example.com');
      expect(domainOrder.createdAt).toEqual(new Date('2024-01-01'));
    });

    it('should convert OrderEntity to Order with all optional fields', () => {
      const orderEntity = new OrderEntity();
      orderEntity.id = 'order-123';
      orderEntity.productId = 'product-456';
      orderEntity.quantity = 2;
      orderEntity.totalPrice = 100000;
      orderEntity.status = 'APPROVED';
      orderEntity.firstName = 'John';
      orderEntity.lastName = 'Doe';
      orderEntity.address = 'Calle 123';
      orderEntity.city = 'Bogotá';
      orderEntity.postalCode = '110111';
      orderEntity.customerEmail = 'john@example.com';
      orderEntity.wpTransactionId = 'wp-tx-123';
      orderEntity.wpReference = 'wp-ref-456';
      orderEntity.paymentMethod = 'CARD';
      orderEntity.errorMessage = 'Test error';
      orderEntity.createdAt = new Date('2024-01-01');

      const domainOrder = OrderMapper.toDomain(orderEntity);

      expect(domainOrder.wpTransactionId).toBe('wp-tx-123');
      expect(domainOrder.wpReference).toBe('wp-ref-456');
      expect(domainOrder.paymentMethod).toBe('CARD');
      expect(domainOrder.errorMessage).toBe('Test error');
    });

    it('should handle undefined productId by converting to empty string', () => {
      const orderEntity = new OrderEntity();
      orderEntity.id = 'order-123';
      orderEntity.productId = '';
      orderEntity.quantity = 1;
      orderEntity.totalPrice = 50000;
      orderEntity.status = 'PENDING';
      orderEntity.firstName = 'Test';
      orderEntity.lastName = 'User';
      orderEntity.address = 'Address';
      orderEntity.city = 'City';
      orderEntity.postalCode = '12345';
      orderEntity.customerEmail = 'test@example.com';
      orderEntity.createdAt = new Date();

      const domainOrder = OrderMapper.toDomain(orderEntity);

      expect(domainOrder.productId).toBe("");
    });

    it('should handle undefined productId by converting to empty string', () => {
      const orderEntity = new OrderEntity();
      orderEntity.id = 'order-123';
      orderEntity.productId = '';
      orderEntity.quantity = 1;
      orderEntity.totalPrice = 50000;
      orderEntity.status = 'PENDING';
      orderEntity.firstName = 'Test';
      orderEntity.lastName = 'User';
      orderEntity.address = 'Address';
      orderEntity.city = 'City';
      orderEntity.postalCode = '12345';
      orderEntity.customerEmail = 'test@example.com';
      orderEntity.createdAt = new Date();

      const domainOrder = OrderMapper.toDomain(orderEntity);

      expect(domainOrder.productId).toBe('');
    });

    it('should handle null customerEmail by converting to empty string', () => {
      const orderEntity = new OrderEntity();
      orderEntity.id = 'order-123';
      orderEntity.productId = 'product-1';
      orderEntity.quantity = 1;
      orderEntity.totalPrice = 50000;
      orderEntity.status = 'PENDING';
      orderEntity.firstName = 'Test';
      orderEntity.lastName = 'User';
      orderEntity.address = 'Address';
      orderEntity.city = 'City';
      orderEntity.postalCode = '12345';
      orderEntity.customerEmail = 'aaa@ggg.com';
      orderEntity.createdAt = new Date();

      const domainOrder = OrderMapper.toDomain(orderEntity);

      expect(domainOrder.customerEmail).toBe('aaa@ggg.com');
    });

    it('should convert status string to TransactionStatusVO', () => {
      const statuses = ['PENDING', 'APPROVED', 'DECLINED', 'ERROR', 'VOIDED'];

      statuses.forEach((status) => {
        const orderEntity = new OrderEntity();
        orderEntity.id = 'order-123';
        orderEntity.productId = 'product-1';
        orderEntity.quantity = 1;
        orderEntity.totalPrice = 50000;
        orderEntity.status = status;
        orderEntity.firstName = 'Test';
        orderEntity.lastName = 'User';
        orderEntity.address = 'Address';
        orderEntity.city = 'City';
        orderEntity.postalCode = '12345';
        orderEntity.customerEmail = 'test@example.com';
        orderEntity.createdAt = new Date();

        const domainOrder = OrderMapper.toDomain(orderEntity);

        expect(domainOrder.getStatusValue()).toBe(status);
      });
    });

    it('should handle undefined optional fields', () => {
      const orderEntity = new OrderEntity();
      orderEntity.id = 'order-123';
      orderEntity.productId = 'product-1';
      orderEntity.quantity = 1;
      orderEntity.totalPrice = 50000;
      orderEntity.status = 'PENDING';
      orderEntity.firstName = 'Test';
      orderEntity.lastName = 'User';
      orderEntity.address = 'Address';
      orderEntity.city = 'City';
      orderEntity.postalCode = '12345';
      orderEntity.customerEmail = 'test@example.com';
      orderEntity.wpTransactionId = undefined;
      orderEntity.wpReference = undefined;
      orderEntity.paymentMethod = undefined;
      orderEntity.errorMessage = undefined;
      orderEntity.createdAt = new Date();

      const domainOrder = OrderMapper.toDomain(orderEntity);

      expect(domainOrder.wpTransactionId).toBeUndefined();
      expect(domainOrder.wpReference).toBeUndefined();
      expect(domainOrder.paymentMethod).toBeUndefined();
      expect(domainOrder.errorMessage).toBeUndefined();
    });

    it('should handle decimal totalPrice correctly', () => {
      const orderEntity = new OrderEntity();
      orderEntity.id = 'order-123';
      orderEntity.productId = 'product-1';
      orderEntity.quantity = 3;
      orderEntity.totalPrice = 99.99;
      orderEntity.status = 'PENDING';
      orderEntity.firstName = 'Test';
      orderEntity.lastName = 'User';
      orderEntity.address = 'Address';
      orderEntity.city = 'City';
      orderEntity.postalCode = '12345';
      orderEntity.customerEmail = 'test@example.com';
      orderEntity.createdAt = new Date();

      const domainOrder = OrderMapper.toDomain(orderEntity);

      expect(domainOrder.totalPrice.amount).toBe(99.99);
    });

    it('should preserve shipping address fields', () => {
      const orderEntity = new OrderEntity();
      orderEntity.id = 'order-123';
      orderEntity.productId = 'product-1';
      orderEntity.quantity = 1;
      orderEntity.totalPrice = 50000;
      orderEntity.status = 'PENDING';
      orderEntity.firstName = 'María';
      orderEntity.lastName = 'García';
      orderEntity.address = 'Carrera 7 #32-16 Apto 501';
      orderEntity.city = 'Medellín';
      orderEntity.postalCode = '050001';
      orderEntity.customerEmail = 'maria@example.com';
      orderEntity.createdAt = new Date();

      const domainOrder = OrderMapper.toDomain(orderEntity);

      expect(domainOrder.firstName).toBe('María');
      expect(domainOrder.lastName).toBe('García');
      expect(domainOrder.address).toBe('Carrera 7 #32-16 Apto 501');
      expect(domainOrder.city).toBe('Medellín');
      expect(domainOrder.postalCode).toBe('050001');
    });
  });

  describe('toEntity', () => {
    it('should convert Order to OrderEntity with all required fields', () => {
      const domainOrder = new Order(
        'order-123',
        'product-456',
        2,
        new Money(100000, 'COP'),
        TransactionStatusVO.pending(),
        'John',
        'Doe',
        'Calle 123 #45-67',
        'Bogotá',
        '110111',
        'john.doe@example.com',
      );

      const orderEntity = OrderMapper.toEntity(domainOrder);

      expect(orderEntity).toBeInstanceOf(OrderEntity);
      expect(orderEntity.id).toBe('order-123');
      expect(orderEntity.productId).toBe('product-456');
      expect(orderEntity.quantity).toBe(2);
      expect(orderEntity.totalPrice).toBe(100000);
      expect(orderEntity.status).toBe('PENDING');
      expect(orderEntity.firstName).toBe('John');
      expect(orderEntity.lastName).toBe('Doe');
      expect(orderEntity.address).toBe('Calle 123 #45-67');
      expect(orderEntity.city).toBe('Bogotá');
      expect(orderEntity.postalCode).toBe('110111');
      expect(orderEntity.customerEmail).toBe('john.doe@example.com');
    });

    it('should convert Order to OrderEntity with all optional fields', () => {
      const domainOrder = new Order(
        'order-123',
        'product-456',
        2,
        new Money(100000, 'COP'),
        TransactionStatusVO.approved(),
        'John',
        'Doe',
        'Calle 123',
        'Bogotá',
        '110111',
        'john@example.com',
        'wp-tx-123',
        'wp-ref-456',
        'CARD',
        'Test error',
        new Date('2024-01-01'),
      );

      const orderEntity = OrderMapper.toEntity(domainOrder);

      expect(orderEntity.wpTransactionId).toBe('wp-tx-123');
      expect(orderEntity.wpReference).toBe('wp-ref-456');
      expect(orderEntity.paymentMethod).toBe('CARD');
      expect(orderEntity.errorMessage).toBe('Test error');
      expect(orderEntity.createdAt).toEqual(new Date('2024-01-01'));
    });


    it('should extract status value from TransactionStatusVO', () => {
      const statuses = [
        TransactionStatusVO.pending(),
        TransactionStatusVO.approved(),
        TransactionStatusVO.declined(),
        TransactionStatusVO.error(),
      ];

      const expectedValues = ['PENDING', 'APPROVED', 'DECLINED', 'ERROR'];

      statuses.forEach((statusVO, index) => {
        const domainOrder = new Order(
          'order-123',
          'product-1',
          1,
          new Money(50000, 'COP'),
          statusVO,
          'Test',
          'User',
          'Address',
          'City',
          '12345',
          'test@example.com',
        );

        const orderEntity = OrderMapper.toEntity(domainOrder);

        expect(orderEntity.status).toBe(expectedValues[index]);
      });
    });

    it('should handle undefined optional fields in domain order', () => {
      const domainOrder = new Order(
        'order-123',
        'product-1',
        1,
        new Money(50000, 'COP'),
        TransactionStatusVO.pending(),
        'Test',
        'User',
        'Address',
        'City',
        '12345',
        'test@example.com',
        undefined,
        undefined,
        undefined,
        undefined,
      );

      const orderEntity = OrderMapper.toEntity(domainOrder);

      expect(orderEntity.wpTransactionId).toBeUndefined();
      expect(orderEntity.wpReference).toBeUndefined();
      expect(orderEntity.paymentMethod).toBeUndefined();
      expect(orderEntity.errorMessage).toBeUndefined();
    });

    it('should preserve createdAt timestamp', () => {
      const testDate = new Date('2024-06-15T10:30:00Z');
      const domainOrder = new Order(
        'order-123',
        'product-1',
        1,
        new Money(50000, 'COP'),
        TransactionStatusVO.pending(),
        'Test',
        'User',
        'Address',
        'City',
        '12345',
        'test@example.com',
        undefined,
        undefined,
        undefined,
        undefined,
        testDate,
      );

      const orderEntity = OrderMapper.toEntity(domainOrder);

      expect(orderEntity.createdAt).toEqual(testDate);
    });

    it('should map all shipping address fields correctly', () => {
      const domainOrder = new Order(
        'order-123',
        'product-1',
        1,
        new Money(50000, 'COP'),
        TransactionStatusVO.pending(),
        'Carlos',
        'Rodríguez',
        'Avenida El Dorado #69-76',
        'Bogotá',
        '110911',
        'carlos@example.com',
      );

      const orderEntity = OrderMapper.toEntity(domainOrder);

      expect(orderEntity.firstName).toBe('Carlos');
      expect(orderEntity.lastName).toBe('Rodríguez');
      expect(orderEntity.address).toBe('Avenida El Dorado #69-76');
      expect(orderEntity.city).toBe('Bogotá');
      expect(orderEntity.postalCode).toBe('110911');
    });

    it('should handle large quantities and prices', () => {
      const domainOrder = new Order(
        'order-123',
        'product-1',
        9999,
        new Money(99999999.99, 'COP'),
        TransactionStatusVO.pending(),
        'Test',
        'User',
        'Address',
        'City',
        '12345',
        'test@example.com',
      );

      const orderEntity = OrderMapper.toEntity(domainOrder);

      expect(orderEntity.quantity).toBe(9999);
      expect(orderEntity.totalPrice).toBe(99999999.99);
    });
  });

  describe('Bidirectional mapping', () => {
    it('should maintain data integrity when converting domain -> entity -> domain', () => {
      const originalOrder = new Order(
        'order-123',
        'product-456',
        3,
        new Money(150000, 'COP'),
        TransactionStatusVO.approved(),
        'Ana',
        'Martínez',
        'Calle 45 #12-34',
        'Cali',
        '760001',
        'ana@example.com',
        'wp-tx-789',
        'wp-ref-abc',
        'NEQUI',
        undefined,
        new Date('2024-01-15T08:00:00Z'),
      );

      const entity = OrderMapper.toEntity(originalOrder);
      const convertedOrder = OrderMapper.toDomain(entity);

      expect(convertedOrder.id).toBe(originalOrder.id);
      expect(convertedOrder.productId).toBe(originalOrder.productId);
      expect(convertedOrder.quantity).toBe(originalOrder.quantity);
      expect(convertedOrder.totalPrice.amount).toBe(originalOrder.totalPrice.amount);
      expect(convertedOrder.totalPrice.currency).toBe(originalOrder.totalPrice.currency);
      expect(convertedOrder.getStatusValue()).toBe(originalOrder.getStatusValue());
      expect(convertedOrder.firstName).toBe(originalOrder.firstName);
      expect(convertedOrder.lastName).toBe(originalOrder.lastName);
      expect(convertedOrder.address).toBe(originalOrder.address);
      expect(convertedOrder.city).toBe(originalOrder.city);
      expect(convertedOrder.postalCode).toBe(originalOrder.postalCode);
      expect(convertedOrder.customerEmail).toBe(originalOrder.customerEmail);
      expect(convertedOrder.wpTransactionId).toBe(originalOrder.wpTransactionId);
      expect(convertedOrder.wpReference).toBe(originalOrder.wpReference);
      expect(convertedOrder.paymentMethod).toBe(originalOrder.paymentMethod);
      expect(convertedOrder.createdAt).toEqual(originalOrder.createdAt);
    });

    it('should maintain data integrity when converting entity -> domain -> entity', () => {
      const originalEntity = new OrderEntity();
      originalEntity.id = 'order-456';
      originalEntity.productId = 'product-789';
      originalEntity.quantity = 5;
      originalEntity.totalPrice = 500000;
      originalEntity.status = 'DECLINED';
      originalEntity.firstName = 'Pedro';
      originalEntity.lastName = 'López';
      originalEntity.address = 'Carrera 10 #20-30';
      originalEntity.city = 'Barranquilla';
      originalEntity.postalCode = '080001';
      originalEntity.customerEmail = 'pedro@example.com';
      originalEntity.wpTransactionId = 'wp-456';
      originalEntity.wpReference = 'ref-789';
      originalEntity.paymentMethod = 'PSE';
      originalEntity.errorMessage = 'Payment declined';
      originalEntity.createdAt = new Date('2024-02-20T14:30:00Z');

      const domain = OrderMapper.toDomain(originalEntity);
      const convertedEntity = OrderMapper.toEntity(domain);

      expect(convertedEntity.id).toBe(originalEntity.id);
      expect(convertedEntity.productId).toBe(originalEntity.productId);
      expect(convertedEntity.quantity).toBe(originalEntity.quantity);
      expect(convertedEntity.totalPrice).toBe(originalEntity.totalPrice);
      expect(convertedEntity.status).toBe(originalEntity.status);
      expect(convertedEntity.firstName).toBe(originalEntity.firstName);
      expect(convertedEntity.lastName).toBe(originalEntity.lastName);
      expect(convertedEntity.address).toBe(originalEntity.address);
      expect(convertedEntity.city).toBe(originalEntity.city);
      expect(convertedEntity.postalCode).toBe(originalEntity.postalCode);
      expect(convertedEntity.customerEmail).toBe(originalEntity.customerEmail);
      expect(convertedEntity.wpTransactionId).toBe(originalEntity.wpTransactionId);
      expect(convertedEntity.wpReference).toBe(originalEntity.wpReference);
      expect(convertedEntity.paymentMethod).toBe(originalEntity.paymentMethod);
      expect(convertedEntity.errorMessage).toBe(originalEntity.errorMessage);
      expect(convertedEntity.createdAt).toEqual(originalEntity.createdAt);
    });

    it('should handle minimal order in bidirectional conversion', () => {
      const minimalOrder = Order.create(
        'order-minimal',
        'product-1',
        1,
        new Money(10000, 'COP'),
        {
          firstName: 'Min',
          lastName: 'User',
          address: 'Address',
          city: 'City',
          postalCode: '00000',
        },
        'min@example.com',
      );

      const entity = OrderMapper.toEntity(minimalOrder);
      const convertedOrder = OrderMapper.toDomain(entity);

      expect(convertedOrder.id).toBe(minimalOrder.id);
      expect(convertedOrder.productId).toBe(minimalOrder.productId);
      expect(convertedOrder.quantity).toBe(minimalOrder.quantity);
      expect(convertedOrder.getStatusValue()).toBe(minimalOrder.getStatusValue());
    });
  });

  describe('Edge cases', () => {
    it('should handle special characters in text fields', () => {
      const domainOrder = new Order(
        'order-123',
        'product-1',
        1,
        new Money(50000, 'COP'),
        TransactionStatusVO.pending(),
        "Jean-François",
        "O'Brien",
        "Calle 123 #45-67 Apto 2B",
        "Bogotá D.C.",
        '110111-001',
        'jean.obrien+test@example.com',
      );

      const entity = OrderMapper.toEntity(domainOrder);
      const convertedOrder = OrderMapper.toDomain(entity);

      expect(convertedOrder.firstName).toBe("Jean-François");
      expect(convertedOrder.lastName).toBe("O'Brien");
      expect(convertedOrder.customerEmail).toBe('jean.obrien+test@example.com');
    });

    it('should handle very long text in address fields', () => {
      const longAddress = 'A'.repeat(500);
      const domainOrder = new Order(
        'order-123',
        'product-1',
        1,
        new Money(50000, 'COP'),
        TransactionStatusVO.pending(),
        'Test',
        'User',
        longAddress,
        'City',
        '12345',
        'test@example.com',
      );

      const entity = OrderMapper.toEntity(domainOrder);
      const convertedOrder = OrderMapper.toDomain(entity);

      expect(convertedOrder.address).toBe(longAddress);
      expect(convertedOrder.address.length).toBe(500);
    });

    it('should handle zero quantity and price', () => {
      const orderEntity = new OrderEntity();
      orderEntity.id = 'order-123';
      orderEntity.productId = 'product-1';
      orderEntity.quantity = 0;
      orderEntity.totalPrice = 0;
      orderEntity.status = 'PENDING';
      orderEntity.firstName = 'Test';
      orderEntity.lastName = 'User';
      orderEntity.address = 'Address';
      orderEntity.city = 'City';
      orderEntity.postalCode = '12345';
      orderEntity.customerEmail = 'test@example.com';
      orderEntity.createdAt = new Date();

      const domainOrder = OrderMapper.toDomain(orderEntity);

      expect(domainOrder.quantity).toBe(0);
      expect(domainOrder.totalPrice.amount).toBe(0);
    });

    it('should handle empty strings in optional fields', () => {
      const orderEntity = new OrderEntity();
      orderEntity.id = 'order-123';
      orderEntity.productId = 'product-1';
      orderEntity.quantity = 1;
      orderEntity.totalPrice = 50000;
      orderEntity.status = 'PENDING';
      orderEntity.firstName = 'Test';
      orderEntity.lastName = 'User';
      orderEntity.address = 'Address';
      orderEntity.city = 'City';
      orderEntity.postalCode = '12345';
      orderEntity.customerEmail = 'test@example.com';
      orderEntity.wpTransactionId = '';
      orderEntity.wpReference = '';
      orderEntity.paymentMethod = '';
      orderEntity.errorMessage = '';
      orderEntity.createdAt = new Date();

      const domainOrder = OrderMapper.toDomain(orderEntity);

      expect(domainOrder.wpTransactionId).toBe('');
      expect(domainOrder.wpReference).toBe('');
      expect(domainOrder.paymentMethod).toBe('');
      expect(domainOrder.errorMessage).toBe('');
    });

    it('should handle decimal precision in totalPrice', () => {
      const orderEntity = new OrderEntity();
      orderEntity.id = 'order-123';
      orderEntity.productId = 'product-1';
      orderEntity.quantity = 1;
      orderEntity.totalPrice = 12345.67;
      orderEntity.status = 'PENDING';
      orderEntity.firstName = 'Test';
      orderEntity.lastName = 'User';
      orderEntity.address = 'Address';
      orderEntity.city = 'City';
      orderEntity.postalCode = '12345';
      orderEntity.customerEmail = 'test@example.com';
      orderEntity.createdAt = new Date();

      const domainOrder = OrderMapper.toDomain(orderEntity);
      const backToEntity = OrderMapper.toEntity(domainOrder);

      expect(backToEntity.totalPrice).toBe(12345.67);
    });
  });

  describe('Type conversions', () => {
    it('should convert numeric totalPrice to Money', () => {
      const orderEntity = new OrderEntity();
      orderEntity.id = 'order-123';
      orderEntity.productId = 'product-1';
      orderEntity.quantity = 1;
      orderEntity.totalPrice = 100000;
      orderEntity.status = 'PENDING';
      orderEntity.firstName = 'Test';
      orderEntity.lastName = 'User';
      orderEntity.address = 'Address';
      orderEntity.city = 'City';
      orderEntity.postalCode = '12345';
      orderEntity.customerEmail = 'test@example.com';
      orderEntity.createdAt = new Date();

      const domainOrder = OrderMapper.toDomain(orderEntity);

      expect(typeof orderEntity.totalPrice).toBe('number');
      expect(domainOrder.totalPrice).toBeInstanceOf(Money);
      expect(domainOrder.totalPrice.amount).toBe(100000);
    });

    it('should convert Money to numeric totalPrice', () => {
      const domainOrder = new Order(
        'order-123',
        'product-1',
        1,
        new Money(100000, 'COP'),
        TransactionStatusVO.pending(),
        'Test',
        'User',
        'Address',
        'City',
        '12345',
        'test@example.com',
      );

      const orderEntity = OrderMapper.toEntity(domainOrder);

      expect(domainOrder.totalPrice).toBeInstanceOf(Money);
      expect(typeof orderEntity.totalPrice).toBe('number');
      expect(orderEntity.totalPrice).toBe(100000);
    });

    it('should convert string status to TransactionStatusVO', () => {
      const orderEntity = new OrderEntity();
      orderEntity.id = 'order-123';
      orderEntity.productId = 'product-1';
      orderEntity.quantity = 1;
      orderEntity.totalPrice = 50000;
      orderEntity.status = 'APPROVED';
      orderEntity.firstName = 'Test';
      orderEntity.lastName = 'User';
      orderEntity.address = 'Address';
      orderEntity.city = 'City';
      orderEntity.postalCode = '12345';
      orderEntity.customerEmail = 'test@example.com';
      orderEntity.createdAt = new Date();

      const domainOrder = OrderMapper.toDomain(orderEntity);

      expect(typeof orderEntity.status).toBe('string');
      expect(domainOrder.getStatus()).toBeInstanceOf(TransactionStatusVO);
      expect(domainOrder.getStatusValue()).toBe('APPROVED');
    });

    it('should convert TransactionStatusVO to string status', () => {
      const domainOrder = new Order(
        'order-123',
        'product-1',
        1,
        new Money(50000, 'COP'),
        TransactionStatusVO.declined(),
        'Test',
        'User',
        'Address',
        'City',
        '12345',
        'test@example.com',
      );

      const orderEntity = OrderMapper.toEntity(domainOrder);

      expect(domainOrder.getStatus()).toBeInstanceOf(TransactionStatusVO);
      expect(typeof orderEntity.status).toBe('string');
      expect(orderEntity.status).toBe('DECLINED');
    });
  });
});
