import { TransactionMapper } from '../transaction.mapper';
import { Transaction, TransactionProps } from '../../../../domain/entities/transaction.entity';
import { Money, TransactionStatus, TransactionStatusVO } from '../../../../domain/value-objects';
import { OrderEntity } from '../../entities/transaction.entity';

describe('TransactionMapper', () => {
  describe('toDomain', () => {
    it('should convert OrderEntity to Transaction with all required fields', () => {
      const orderEntity = new OrderEntity();
      orderEntity.id = 'tx-123';
      orderEntity.productId = 'product-456';
      orderEntity.quantity = 2;
      orderEntity.totalPrice = 100000;
      orderEntity.status = 'PENDING';
      orderEntity.customerEmail = 'john.doe@example.com';
      orderEntity.firstName = 'John';
      orderEntity.lastName = 'Doe';
      orderEntity.address = 'Calle 123 #45-67';
      orderEntity.city = 'Bogotá';
      orderEntity.postalCode = '110111';
      orderEntity.createdAt = new Date('2024-01-01');

      const domainTransaction = TransactionMapper.toDomain(orderEntity);

      expect(domainTransaction).toBeInstanceOf(Transaction);
      expect(domainTransaction.id).toBe('tx-123');
      expect(domainTransaction.productId).toBe('product-456');
      expect(domainTransaction.quantity).toBe(2);
      expect(domainTransaction.amount).toBeInstanceOf(Money);
      expect(domainTransaction.amount.amount).toBe(100000);
      expect(domainTransaction.amount.currency).toBe('COP');
      expect(domainTransaction.getStatusValue()).toBe(TransactionStatus.PENDING);
      expect(domainTransaction.customerEmail).toBe('john.doe@example.com');
      expect(domainTransaction.firstName).toBe('John');
      expect(domainTransaction.lastName).toBe('Doe');
      expect(domainTransaction.address).toBe('Calle 123 #45-67');
      expect(domainTransaction.city).toBe('Bogotá');
      expect(domainTransaction.postalCode).toBe('110111');
      expect(domainTransaction.createdAt).toEqual(new Date('2024-01-01'));
    });

    it('should convert OrderEntity to Transaction with all optional fields', () => {
      const orderEntity = new OrderEntity();
      orderEntity.id = 'tx-456';
      orderEntity.productId = 'product-789';
      orderEntity.quantity = 3;
      orderEntity.totalPrice = 150000;
      orderEntity.status = 'APPROVED';
      orderEntity.customerEmail = 'jane@example.com';
      orderEntity.firstName = 'Jane';
      orderEntity.lastName = 'Smith';
      orderEntity.address = 'Carrera 50';
      orderEntity.city = 'Medellín';
      orderEntity.postalCode = '050001';
      orderEntity.wompiTransactionId = 'wompi-tx-123';
      orderEntity.wompiReference = 'wompi-ref-456';
      orderEntity.paymentMethod = 'CARD';
      orderEntity.errorMessage = 'Test error';
      orderEntity.createdAt = new Date('2024-02-15');

      const domainTransaction = TransactionMapper.toDomain(orderEntity);

      expect(domainTransaction.wompiTransactionId).toBe('wompi-tx-123');
      expect(domainTransaction.wompiReference).toBe('wompi-ref-456');
      expect(domainTransaction.paymentMethod).toBe('CARD');
      expect(domainTransaction.errorMessage).toBe('Test error');
    });

    it('should handle undefined productId by converting to empty string', () => {
      const orderEntity = new OrderEntity();
      orderEntity.id = 'tx-null';
      orderEntity.productId = "";
      orderEntity.quantity = 1;
      orderEntity.totalPrice = 50000;
      orderEntity.status = 'PENDING';
      orderEntity.customerEmail = undefined;
      orderEntity.firstName = 'Test';
      orderEntity.lastName = 'User';
      orderEntity.address = 'Address';
      orderEntity.city = 'City';
      orderEntity.postalCode = '12345';
      orderEntity.createdAt = new Date();

      const domainTransaction = TransactionMapper.toDomain(orderEntity);

      expect(domainTransaction.productId).toBe("");
    });

    it('should handle undefined productId by converting to empty string', () => {
      const orderEntity = new OrderEntity();
      orderEntity.id = 'tx-undefined';
      orderEntity.productId = undefined;
      orderEntity.quantity = 1;
      orderEntity.totalPrice = 50000;
      orderEntity.status = 'PENDING';
      orderEntity.customerEmail = 'test@example.com';
      orderEntity.firstName = 'Test';
      orderEntity.lastName = 'User';
      orderEntity.address = 'Address';
      orderEntity.city = 'City';
      orderEntity.postalCode = '12345';
      orderEntity.createdAt = new Date();

      const domainTransaction = TransactionMapper.toDomain(orderEntity);

      expect(domainTransaction.productId).toBe('');
    });

it('should handle undefined customerEmail by converting to empty string', () => {
        const orderEntity = new OrderEntity();
      orderEntity.id = 'tx-null-email';
      orderEntity.productId = 'product-1';
      orderEntity.quantity = 1;
      orderEntity.totalPrice = 50000;
      orderEntity.status = 'PENDING';
      orderEntity.customerEmail = '';
      orderEntity.firstName = 'Test';
      orderEntity.lastName = 'User';
      orderEntity.address = 'Address';
      orderEntity.city = 'City';
      orderEntity.postalCode = '12345';
      orderEntity.createdAt = new Date();

      const domainTransaction = TransactionMapper.toDomain(orderEntity);

expect(domainTransaction.customerEmail).toBe("");
    });

    it('should handle null optional fields using nullish coalescing', () => {
      const orderEntity = new OrderEntity();
      orderEntity.id = 'tx-nullish';
      orderEntity.productId = 'product-1';
      orderEntity.quantity = 1;
      orderEntity.totalPrice = 50000;
      orderEntity.status = 'PENDING';
      orderEntity.customerEmail = 'test@example.com';
      orderEntity.firstName = 'Test';
      orderEntity.lastName = 'User';
      orderEntity.address = 'Address';
      orderEntity.city = 'City';
      orderEntity.postalCode = '12345';
      orderEntity.wompiTransactionId = undefined;
      orderEntity.wompiReference = undefined;
      orderEntity.paymentMethod = undefined;
      orderEntity.errorMessage = undefined;
      orderEntity.createdAt = new Date();

      const domainTransaction = TransactionMapper.toDomain(orderEntity);

      expect(domainTransaction.wompiTransactionId).toBeUndefined();
      expect(domainTransaction.wompiReference).toBeUndefined();
      expect(domainTransaction.paymentMethod).toBeUndefined();
      expect(domainTransaction.errorMessage).toBeUndefined();
    });

    it('should handle undefined optional fields using nullish coalescing', () => {
      const orderEntity = new OrderEntity();
      orderEntity.id = 'tx-undefined-opts';
      orderEntity.productId = 'product-1';
      orderEntity.quantity = 1;
      orderEntity.totalPrice = 50000;
      orderEntity.status = 'PENDING';
      orderEntity.customerEmail = 'test@example.com';
      orderEntity.firstName = 'Test';
      orderEntity.lastName = 'User';
      orderEntity.address = 'Address';
      orderEntity.city = 'City';
      orderEntity.postalCode = '12345';
      orderEntity.wompiTransactionId = undefined;
      orderEntity.wompiReference = undefined;
      orderEntity.paymentMethod = undefined;
      orderEntity.errorMessage = undefined;
      orderEntity.createdAt = new Date();

      const domainTransaction = TransactionMapper.toDomain(orderEntity);

      expect(domainTransaction.wompiTransactionId).toBeUndefined();
      expect(domainTransaction.wompiReference).toBeUndefined();
      expect(domainTransaction.paymentMethod).toBeUndefined();
      expect(domainTransaction.errorMessage).toBeUndefined();
    });

    it('should convert totalPrice to Money object with COP currency', () => {
      const orderEntity = new OrderEntity();
      orderEntity.id = 'tx-money';
      orderEntity.productId = 'product-1';
      orderEntity.quantity = 1;
      orderEntity.totalPrice = 250000.69;
      orderEntity.status = 'PENDING';
      orderEntity.customerEmail = 'test@example.com';
      orderEntity.firstName = 'Test';
      orderEntity.lastName = 'User';
      orderEntity.address = 'Address';
      orderEntity.city = 'City';
      orderEntity.postalCode = '12345';
      orderEntity.createdAt = new Date();

      const domainTransaction = TransactionMapper.toDomain(orderEntity);

      expect(domainTransaction.amount).toBeInstanceOf(Money);
      expect(domainTransaction.amount.amount).toBe(250000.69);
      expect(domainTransaction.amount.currency).toBe('COP');
    });

    it('should convert status string to TransactionStatusVO', () => {
      const statuses = ['PENDING', 'APPROVED', 'DECLINED', 'ERROR', 'VOIDED'];

      statuses.forEach((status) => {
        const orderEntity = new OrderEntity();
        orderEntity.id = `tx-${status}`;
        orderEntity.productId = 'product-1';
        orderEntity.quantity = 1;
        orderEntity.totalPrice = 50000;
        orderEntity.status = status;
        orderEntity.customerEmail = 'test@example.com';
        orderEntity.firstName = 'Test';
        orderEntity.lastName = 'User';
        orderEntity.address = 'Address';
        orderEntity.city = 'City';
        orderEntity.postalCode = '12345';
        orderEntity.createdAt = new Date();

        const domainTransaction = TransactionMapper.toDomain(orderEntity);

        expect(domainTransaction.getStatusValue()).toBe(status);
      });
    });

    it('should preserve all shipping address fields', () => {
      const orderEntity = new OrderEntity();
      orderEntity.id = 'tx-address';
      orderEntity.productId = 'product-1';
      orderEntity.quantity = 1;
      orderEntity.totalPrice = 50000;
      orderEntity.status = 'PENDING';
      orderEntity.customerEmail = 'maria@example.com';
      orderEntity.firstName = 'María';
      orderEntity.lastName = 'García';
      orderEntity.address = 'Carrera 7 #32-16 Apto 501';
      orderEntity.city = 'Medellín';
      orderEntity.postalCode = '050001';
      orderEntity.createdAt = new Date();

      const domainTransaction = TransactionMapper.toDomain(orderEntity);

      expect(domainTransaction.firstName).toBe('María');
      expect(domainTransaction.lastName).toBe('García');
      expect(domainTransaction.address).toBe('Carrera 7 #32-16 Apto 501');
      expect(domainTransaction.city).toBe('Medellín');
      expect(domainTransaction.postalCode).toBe('050001');
    });
  });

  describe('toEntity', () => {
    it('should convert Transaction to OrderEntity with all required fields', () => {
      const props: TransactionProps = {
        id: 'tx-123',
        productId: 'product-456',
        quantity: 2,
        amount: new Money(100000, 'COP'),
        customerEmail: 'john@example.com',
        firstName: 'John',
        lastName: 'Doe',
        address: 'Calle 123',
        city: 'Bogotá',
        postalCode: '110111',
      };
      const domainTransaction = Transaction.create(props);

      const orderEntity = TransactionMapper.toEntity(domainTransaction);

      expect(orderEntity).toBeInstanceOf(OrderEntity);
      expect(orderEntity.id).toBe('tx-123');
      expect(orderEntity.productId).toBe('product-456');
      expect(orderEntity.quantity).toBe(2);
      expect(orderEntity.totalPrice).toBe(100000);
      expect(orderEntity.status).toBe('PENDING');
      expect(orderEntity.customerEmail).toBe('john@example.com');
      expect(orderEntity.firstName).toBe('John');
      expect(orderEntity.lastName).toBe('Doe');
      expect(orderEntity.address).toBe('Calle 123');
      expect(orderEntity.city).toBe('Bogotá');
      expect(orderEntity.postalCode).toBe('110111');
    });

    it('should convert Transaction to OrderEntity with all optional fields', () => {
      const domainTransaction = new Transaction(
        'tx-456',
        'product-789',
        3,
        new Money(150000, 'COP'),
        TransactionStatusVO.approved(),
        'jane@example.com',
        'Jane',
        'Smith',
        'Carrera 50',
        'Medellín',
        '050001',
        'wompi-tx-123',
        'wompi-ref-456',
        'CARD',
        'Test error',
        new Date('2024-01-01'),
      );

      const orderEntity = TransactionMapper.toEntity(domainTransaction);

      expect(orderEntity.wompiTransactionId).toBe('wompi-tx-123');
      expect(orderEntity.wompiReference).toBe('wompi-ref-456');
      expect(orderEntity.paymentMethod).toBe('CARD');
      expect(orderEntity.errorMessage).toBe('Test error');
      expect(orderEntity.createdAt).toEqual(new Date('2024-01-01'));
    });

    it('should extract amount from Money object to totalPrice', () => {
      const props: TransactionProps = {
        id: 'tx-amount',
        productId: 'product-1',
        quantity: 1,
        amount: new Money(250000.69, 'COP'),
        customerEmail: 'test@example.com',
        firstName: 'Test',
        lastName: 'User',
        address: 'Address',
        city: 'City',
        postalCode: '12345',
      };
      const domainTransaction = Transaction.create(props);

      const orderEntity = TransactionMapper.toEntity(domainTransaction);

      expect(orderEntity.totalPrice).toBe(250000.69);
      expect(typeof orderEntity.totalPrice).toBe('number');
    });

    it('should extract status value from TransactionStatusVO', () => {
      const statuses = [
        { vo: TransactionStatusVO.pending(), value: 'PENDING' },
        { vo: TransactionStatusVO.approved(), value: 'APPROVED' },
        { vo: TransactionStatusVO.declined(), value: 'DECLINED' },
        { vo: TransactionStatusVO.error(), value: 'ERROR' },
      ];

      statuses.forEach(({ vo, value }) => {
        const domainTransaction = new Transaction(
          'tx-status',
          'product-1',
          1,
          new Money(50000, 'COP'),
          vo,
          'test@example.com',
          'Test',
          'User',
          'Address',
          'City',
          '12345',
        );

        const orderEntity = TransactionMapper.toEntity(domainTransaction);

        expect(orderEntity.status).toBe(value);
      });
    });

    it('should handle undefined optional fields', () => {
      const props: TransactionProps = {
        id: 'tx-minimal',
        productId: 'product-1',
        quantity: 1,
        amount: new Money(50000, 'COP'),
        customerEmail: 'test@example.com',
        firstName: 'Test',
        lastName: 'User',
        address: 'Address',
        city: 'City',
        postalCode: '12345',
      };
      const domainTransaction = Transaction.create(props);

      const orderEntity = TransactionMapper.toEntity(domainTransaction);

      expect(orderEntity.wompiTransactionId).toBeUndefined();
      expect(orderEntity.wompiReference).toBeUndefined();
      expect(orderEntity.paymentMethod).toBeUndefined();
      expect(orderEntity.errorMessage).toBeUndefined();
    });

    it('should preserve createdAt timestamp', () => {
      const testDate = new Date('2024-03-20T10:30:00Z');
      const domainTransaction = new Transaction(
        'tx-date',
        'product-1',
        1,
        new Money(50000, 'COP'),
        TransactionStatusVO.pending(),
        'test@example.com',
        'Test',
        'User',
        'Address',
        'City',
        '12345',
        undefined,
        undefined,
        undefined,
        undefined,
        testDate,
      );

      const orderEntity = TransactionMapper.toEntity(domainTransaction);

      expect(orderEntity.createdAt).toEqual(testDate);
    });

    it('should map all customer and shipping fields correctly', () => {
      const props: TransactionProps = {
        id: 'tx-customer',
        productId: 'product-1',
        quantity: 5,
        amount: new Money(500000, 'COP'),
        customerEmail: 'carlos@example.com',
        firstName: 'Carlos',
        lastName: 'Rodríguez',
        address: 'Avenida El Dorado #69-76',
        city: 'Bogotá',
        postalCode: '110911',
      };
      const domainTransaction = Transaction.create(props);

      const orderEntity = TransactionMapper.toEntity(domainTransaction);

      expect(orderEntity.customerEmail).toBe('carlos@example.com');
      expect(orderEntity.firstName).toBe('Carlos');
      expect(orderEntity.lastName).toBe('Rodríguez');
      expect(orderEntity.address).toBe('Avenida El Dorado #69-76');
      expect(orderEntity.city).toBe('Bogotá');
      expect(orderEntity.postalCode).toBe('110911');
    });

    it('should handle large quantities and amounts', () => {
      const props: TransactionProps = {
        id: 'tx-large',
        productId: 'product-1',
        quantity: 9999,
        amount: new Money(99999999.99, 'COP'),
        customerEmail: 'test@example.com',
        firstName: 'Test',
        lastName: 'User',
        address: 'Address',
        city: 'City',
        postalCode: '12345',
      };
      const domainTransaction = Transaction.create(props);

      const orderEntity = TransactionMapper.toEntity(domainTransaction);

      expect(orderEntity.quantity).toBe(9999);
      expect(orderEntity.totalPrice).toBe(99999999.99);
    });
  });

  describe('Bidirectional mapping', () => {
    it('should maintain data integrity when converting domain -> entity -> domain', () => {
      const originalTransaction = new Transaction(
        'tx-123',
        'product-456',
        3,
        new Money(150000, 'COP'),
        TransactionStatusVO.approved(),
        'ana@example.com',
        'Ana',
        'Martínez',
        'Calle 45 #12-34',
        'Cali',
        '760001',
        'wompi-tx-789',
        'wompi-ref-abc',
        'NEQUI',
        undefined,
        new Date('2024-01-15T08:00:00Z'),
      );

      const entity = TransactionMapper.toEntity(originalTransaction);
      const convertedTransaction = TransactionMapper.toDomain(entity);

      expect(convertedTransaction.id).toBe(originalTransaction.id);
      expect(convertedTransaction.productId).toBe(originalTransaction.productId);
      expect(convertedTransaction.quantity).toBe(originalTransaction.quantity);
      expect(convertedTransaction.amount.amount).toBe(originalTransaction.amount.amount);
      expect(convertedTransaction.amount.currency).toBe(originalTransaction.amount.currency);
      expect(convertedTransaction.getStatusValue()).toBe(originalTransaction.getStatusValue());
      expect(convertedTransaction.customerEmail).toBe(originalTransaction.customerEmail);
      expect(convertedTransaction.firstName).toBe(originalTransaction.firstName);
      expect(convertedTransaction.lastName).toBe(originalTransaction.lastName);
      expect(convertedTransaction.address).toBe(originalTransaction.address);
      expect(convertedTransaction.city).toBe(originalTransaction.city);
      expect(convertedTransaction.postalCode).toBe(originalTransaction.postalCode);
      expect(convertedTransaction.wompiTransactionId).toBe(originalTransaction.wompiTransactionId);
      expect(convertedTransaction.wompiReference).toBe(originalTransaction.wompiReference);
      expect(convertedTransaction.paymentMethod).toBe(originalTransaction.paymentMethod);
      expect(convertedTransaction.createdAt).toEqual(originalTransaction.createdAt);
    });

    it('should maintain data integrity when converting entity -> domain -> entity', () => {
      const originalEntity = new OrderEntity();
      originalEntity.id = 'tx-456';
      originalEntity.productId = 'product-789';
      originalEntity.quantity = 5;
      originalEntity.totalPrice = 500000;
      originalEntity.status = 'DECLINED';
      originalEntity.customerEmail = 'pedro@example.com';
      originalEntity.firstName = 'Pedro';
      originalEntity.lastName = 'López';
      originalEntity.address = 'Carrera 10 #20-30';
      originalEntity.city = 'Barranquilla';
      originalEntity.postalCode = '080001';
      originalEntity.wompiTransactionId = 'wompi-456';
      originalEntity.wompiReference = 'ref-789';
      originalEntity.paymentMethod = 'PSE';
      originalEntity.errorMessage = 'Payment declined';
      originalEntity.createdAt = new Date('2024-02-20T14:30:00Z');

      const domain = TransactionMapper.toDomain(originalEntity);
      const convertedEntity = TransactionMapper.toEntity(domain);

      expect(convertedEntity.id).toBe(originalEntity.id);
      expect(convertedEntity.productId).toBe(originalEntity.productId);
      expect(convertedEntity.quantity).toBe(originalEntity.quantity);
      expect(convertedEntity.totalPrice).toBe(originalEntity.totalPrice);
      expect(convertedEntity.status).toBe(originalEntity.status);
      expect(convertedEntity.customerEmail).toBe(originalEntity.customerEmail);
      expect(convertedEntity.firstName).toBe(originalEntity.firstName);
      expect(convertedEntity.lastName).toBe(originalEntity.lastName);
      expect(convertedEntity.address).toBe(originalEntity.address);
      expect(convertedEntity.city).toBe(originalEntity.city);
      expect(convertedEntity.postalCode).toBe(originalEntity.postalCode);
      expect(convertedEntity.wompiTransactionId).toBe(originalEntity.wompiTransactionId);
      expect(convertedEntity.wompiReference).toBe(originalEntity.wompiReference);
      expect(convertedEntity.paymentMethod).toBe(originalEntity.paymentMethod);
      expect(convertedEntity.errorMessage).toBe(originalEntity.errorMessage);
      expect(convertedEntity.createdAt).toEqual(originalEntity.createdAt);
    });

    it('should handle minimal transaction in bidirectional conversion', () => {
      const props: TransactionProps = {
        id: 'tx-minimal',
        productId: 'product-1',
        quantity: 1,
        amount: new Money(10000, 'COP'),
        customerEmail: 'min@example.com',
        firstName: 'Min',
        lastName: 'User',
        address: 'Address',
        city: 'City',
        postalCode: '00000',
      };
      const minimalTransaction = Transaction.create(props);

      const entity = TransactionMapper.toEntity(minimalTransaction);
      const convertedTransaction = TransactionMapper.toDomain(entity);

      expect(convertedTransaction.id).toBe(minimalTransaction.id);
      expect(convertedTransaction.productId).toBe(minimalTransaction.productId);
      expect(convertedTransaction.quantity).toBe(minimalTransaction.quantity);
      expect(convertedTransaction.getStatusValue()).toBe(minimalTransaction.getStatusValue());
    });

    it('should preserve decimal precision in bidirectional conversion', () => {
      const orderEntity = new OrderEntity();
      orderEntity.id = 'tx-decimal';
      orderEntity.productId = 'product-1';
      orderEntity.quantity = 1;
      orderEntity.totalPrice = 12345.67;
      orderEntity.status = 'PENDING';
      orderEntity.customerEmail = 'test@example.com';
      orderEntity.firstName = 'Test';
      orderEntity.lastName = 'User';
      orderEntity.address = 'Address';
      orderEntity.city = 'City';
      orderEntity.postalCode = '12345';
      orderEntity.createdAt = new Date();

      const domain = TransactionMapper.toDomain(orderEntity);
      const backToEntity = TransactionMapper.toEntity(domain);

      expect(backToEntity.totalPrice).toBe(12345.67);
    });
  });

  describe('Edge cases', () => {
    it('should handle special characters in text fields', () => {
      const orderEntity = new OrderEntity();
      orderEntity.id = 'tx-special';
      orderEntity.productId = 'product-1';
      orderEntity.quantity = 1;
      orderEntity.totalPrice = 50000;
      orderEntity.status = 'PENDING';
      orderEntity.customerEmail = 'jean.obrien+test@example.com';
      orderEntity.firstName = "Jean-François";
      orderEntity.lastName = "O'Brien";
      orderEntity.address = "Calle 123 #45-67 Apto 2B";
      orderEntity.city = "Bogotá D.C.";
      orderEntity.postalCode = '110111-001';
      orderEntity.createdAt = new Date();

      const domainTransaction = TransactionMapper.toDomain(orderEntity);
      const backToEntity = TransactionMapper.toEntity(domainTransaction);

      expect(backToEntity.firstName).toBe("Jean-François");
      expect(backToEntity.lastName).toBe("O'Brien");
      expect(backToEntity.customerEmail).toBe('jean.obrien+test@example.com');
    });

    it('should handle empty string optional fields', () => {
      const orderEntity = new OrderEntity();
      orderEntity.id = 'tx-empty';
      orderEntity.productId = 'product-1';
      orderEntity.quantity = 1;
      orderEntity.totalPrice = 50000;
      orderEntity.status = 'PENDING';
      orderEntity.customerEmail = 'test@example.com';
      orderEntity.firstName = 'Test';
      orderEntity.lastName = 'User';
      orderEntity.address = 'Address';
      orderEntity.city = 'City';
      orderEntity.postalCode = '12345';
      orderEntity.wompiTransactionId = '';
      orderEntity.wompiReference = '';
      orderEntity.paymentMethod = '';
      orderEntity.errorMessage = '';
      orderEntity.createdAt = new Date();

      const domainTransaction = TransactionMapper.toDomain(orderEntity);

      // Empty strings are NOT null/undefined, so they pass through
      expect(domainTransaction.wompiTransactionId).toBe('');
      expect(domainTransaction.wompiReference).toBe('');
      expect(domainTransaction.paymentMethod).toBe('');
      expect(domainTransaction.errorMessage).toBe('');
    });

    it('should handle zero quantity and amount', () => {
      const orderEntity = new OrderEntity();
      orderEntity.id = 'tx-zero';
      orderEntity.productId = 'product-1';
      orderEntity.quantity = 0;
      orderEntity.totalPrice = 0;
      orderEntity.status = 'PENDING';
      orderEntity.customerEmail = 'test@example.com';
      orderEntity.firstName = 'Test';
      orderEntity.lastName = 'User';
      orderEntity.address = 'Address';
      orderEntity.city = 'City';
      orderEntity.postalCode = '12345';
      orderEntity.createdAt = new Date();

      const domainTransaction = TransactionMapper.toDomain(orderEntity);

      expect(domainTransaction.quantity).toBe(0);
      expect(domainTransaction.amount.amount).toBe(0);
    });

    it('should handle very long text in address fields', () => {
      const longAddress = 'A'.repeat(500);
      const props: TransactionProps = {
        id: 'tx-long',
        productId: 'product-1',
        quantity: 1,
        amount: new Money(50000, 'COP'),
        customerEmail: 'test@example.com',
        firstName: 'Test',
        lastName: 'User',
        address: longAddress,
        city: 'City',
        postalCode: '12345',
      };
      const domainTransaction = Transaction.create(props);

      const entity = TransactionMapper.toEntity(domainTransaction);
      const backToDomain = TransactionMapper.toDomain(entity);

      expect(backToDomain.address).toBe(longAddress);
      expect(backToDomain.address.length).toBe(500);
    });
  });

  describe('Type conversions', () => {
    it('should convert numeric totalPrice to Money amount', () => {
      const orderEntity = new OrderEntity();
      orderEntity.id = 'tx-conv1';
      orderEntity.productId = 'product-1';
      orderEntity.quantity = 1;
      orderEntity.totalPrice = 100000;
      orderEntity.status = 'PENDING';
      orderEntity.customerEmail = 'test@example.com';
      orderEntity.firstName = 'Test';
      orderEntity.lastName = 'User';
      orderEntity.address = 'Address';
      orderEntity.city = 'City';
      orderEntity.postalCode = '12345';
      orderEntity.createdAt = new Date();

      const domainTransaction = TransactionMapper.toDomain(orderEntity);

      expect(typeof orderEntity.totalPrice).toBe('number');
      expect(domainTransaction.amount).toBeInstanceOf(Money);
      expect(domainTransaction.amount.amount).toBe(100000);
      expect(domainTransaction.amount.currency).toBe('COP');
    });

    it('should convert Money amount to numeric totalPrice', () => {
      const props: TransactionProps = {
        id: 'tx-conv2',
        productId: 'product-1',
        quantity: 1,
        amount: new Money(250000, 'COP'),
        customerEmail: 'test@example.com',
        firstName: 'Test',
        lastName: 'User',
        address: 'Address',
        city: 'City',
        postalCode: '12345',
      };
      const domainTransaction = Transaction.create(props);

      const orderEntity = TransactionMapper.toEntity(domainTransaction);

      expect(domainTransaction.amount).toBeInstanceOf(Money);
      expect(typeof orderEntity.totalPrice).toBe('number');
      expect(orderEntity.totalPrice).toBe(250000);
    });

    it('should convert string status to TransactionStatusVO', () => {
      const orderEntity = new OrderEntity();
      orderEntity.id = 'tx-status-conv';
      orderEntity.productId = 'product-1';
      orderEntity.quantity = 1;
      orderEntity.totalPrice = 50000;
      orderEntity.status = 'APPROVED';
      orderEntity.customerEmail = 'test@example.com';
      orderEntity.firstName = 'Test';
      orderEntity.lastName = 'User';
      orderEntity.address = 'Address';
      orderEntity.city = 'City';
      orderEntity.postalCode = '12345';
      orderEntity.createdAt = new Date();

      const domainTransaction = TransactionMapper.toDomain(orderEntity);

      expect(typeof orderEntity.status).toBe('string');
      expect(domainTransaction.getStatusValue()).toBe('APPROVED');
    });

    it('should convert TransactionStatusVO to string status', () => {
      const domainTransaction = new Transaction(
        'tx-vo-conv',
        'product-1',
        1,
        new Money(50000, 'COP'),
        TransactionStatusVO.declined(),
        'test@example.com',
        'Test',
        'User',
        'Address',
        'City',
        '12345',
      );

      const orderEntity = TransactionMapper.toEntity(domainTransaction);

      expect(domainTransaction.getStatusValue()).toBe('DECLINED');
      expect(typeof orderEntity.status).toBe('string');
      expect(orderEntity.status).toBe('DECLINED');
    });

    it('should always use COP currency when converting to domain', () => {
      const orderEntity = new OrderEntity();
      orderEntity.id = 'tx-currency';
      orderEntity.productId = 'product-1';
      orderEntity.quantity = 1;
      orderEntity.totalPrice = 50000;
      orderEntity.status = 'PENDING';
      orderEntity.customerEmail = 'test@example.com';
      orderEntity.firstName = 'Test';
      orderEntity.lastName = 'User';
      orderEntity.address = 'Address';
      orderEntity.city = 'City';
      orderEntity.postalCode = '12345';
      orderEntity.createdAt = new Date();

      const domainTransaction = TransactionMapper.toDomain(orderEntity);

      expect(domainTransaction.amount.currency).toBe('COP');
    });
  });

  describe('Nullish coalescing operator behavior', () => {
    it('should convert null to undefined for optional fields', () => {
      const orderEntity = new OrderEntity();
      orderEntity.id = 'tx-nullish-test';
      orderEntity.productId = 'product-1';
      orderEntity.quantity = 1;
      orderEntity.totalPrice = 50000;
      orderEntity.status = 'PENDING';
      orderEntity.customerEmail = 'test@example.com';
      orderEntity.firstName = 'Test';
      orderEntity.lastName = 'User';
      orderEntity.address = 'Address';
      orderEntity.city = 'City';
      orderEntity.postalCode = '12345';
      orderEntity.wompiTransactionId = undefined;
      orderEntity.createdAt = new Date();

      const domainTransaction = TransactionMapper.toDomain(orderEntity);

      // ?? converts null to undefined
      expect(domainTransaction.wompiTransactionId).toBeUndefined();
    });

    it('should preserve empty string (not null/undefined)', () => {
      const orderEntity = new OrderEntity();
      orderEntity.id = 'tx-empty-string';
      orderEntity.productId = 'product-1';
      orderEntity.quantity = 1;
      orderEntity.totalPrice = 50000;
      orderEntity.status = 'PENDING';
      orderEntity.customerEmail = 'test@example.com';
      orderEntity.firstName = 'Test';
      orderEntity.lastName = 'User';
      orderEntity.address = 'Address';
      orderEntity.city = 'City';
      orderEntity.postalCode = '12345';
      orderEntity.wompiTransactionId = '';
      orderEntity.createdAt = new Date();

      const domainTransaction = TransactionMapper.toDomain(orderEntity);

      expect(domainTransaction.wompiTransactionId).toBe('');
    });
  });
});
