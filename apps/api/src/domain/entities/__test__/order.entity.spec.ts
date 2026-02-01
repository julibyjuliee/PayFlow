import { Order } from '../order.entity';
import { Money } from '../../value-objects/money';
import {
  TransactionStatus,
  TransactionStatusVO,
} from '../../value-objects/transaction-status';
import { InvalidTransactionStateException } from '../../../shared/exceptions';

describe('Order Entity', () => {
  let order: Order;
  const testData = {
    id: 'order-123',
    productId: 'product-456',
    quantity: 2,
    totalPrice: new Money(100000, 'COP'),
    status: TransactionStatusVO.pending(),
    firstName: 'John',
    lastName: 'Doe',
    address: 'Calle 123 #45-67',
    city: 'Bogotá',
    postalCode: '110111',
    customerEmail: 'john.doe@example.com',
  };

  beforeEach(() => {
    order = new Order(
      testData.id,
      testData.productId,
      testData.quantity,
      testData.totalPrice,
      testData.status,
      testData.firstName,
      testData.lastName,
      testData.address,
      testData.city,
      testData.postalCode,
      testData.customerEmail,
    );
  });

  describe('Constructor', () => {
    it('should create an order with all required fields', () => {
      expect(order.id).toBe(testData.id);
      expect(order.productId).toBe(testData.productId);
      expect(order.quantity).toBe(testData.quantity);
      expect(order.totalPrice).toBe(testData.totalPrice);
      expect(order.firstName).toBe(testData.firstName);
      expect(order.lastName).toBe(testData.lastName);
      expect(order.address).toBe(testData.address);
      expect(order.city).toBe(testData.city);
      expect(order.postalCode).toBe(testData.postalCode);
      expect(order.customerEmail).toBe(testData.customerEmail);
    });

    it('should create an order with optional fields', () => {
      const orderWithOptionals = new Order(
        testData.id,
        testData.productId,
        testData.quantity,
        testData.totalPrice,
        testData.status,
        testData.firstName,
        testData.lastName,
        testData.address,
        testData.city,
        testData.postalCode,
        testData.customerEmail,
        'wp-tx-123',
        'wp-ref-456',
        'CARD',
        'Test error',
      );

      expect(orderWithOptionals.wpTransactionId).toBe('wp-tx-123');
      expect(orderWithOptionals.wpReference).toBe('wp-ref-456');
      expect(orderWithOptionals.paymentMethod).toBe('CARD');
      expect(orderWithOptionals.errorMessage).toBe('Test error');
    });

    it('should have a createdAt timestamp', () => {
      expect(order.createdAt).toBeInstanceOf(Date);
    });
  });

  describe('Static create method', () => {
    it('should create a new order with PENDING status', () => {
      const newOrder = Order.create(
        'order-789',
        'product-101',
        3,
        new Money(150000, 'COP'),
        {
          firstName: 'Jane',
          lastName: 'Smith',
          address: 'Carrera 50 #30-20',
          city: 'Medellín',
          postalCode: '050001',
        },
        'jane.smith@example.com',
      );

      expect(newOrder.id).toBe('order-789');
      expect(newOrder.productId).toBe('product-101');
      expect(newOrder.quantity).toBe(3);
      expect(newOrder.totalPrice.amount).toBe(150000);
      expect(newOrder.firstName).toBe('Jane');
      expect(newOrder.lastName).toBe('Smith');
      expect(newOrder.address).toBe('Carrera 50 #30-20');
      expect(newOrder.city).toBe('Medellín');
      expect(newOrder.postalCode).toBe('050001');
      expect(newOrder.customerEmail).toBe('jane.smith@example.com');
      expect(newOrder.getStatusValue()).toBe(TransactionStatus.PENDING);
    });
  });

  describe('Status getters', () => {
    it('should return status value object', () => {
      const status = order.getStatus();
      expect(status).toBeInstanceOf(TransactionStatusVO);
      expect(status.value).toBe(TransactionStatus.PENDING);
    });

    it('should return status value', () => {
      const statusValue = order.getStatusValue();
      expect(statusValue).toBe(TransactionStatus.PENDING);
    });
  });

  describe('Status checks', () => {
    it('should correctly identify pending status', () => {
      expect(order.isPending()).toBe(true);
      expect(order.isApproved()).toBe(false);
      expect(order.isFinal()).toBe(false);
    });

    it('should correctly identify approved status', () => {
      order.approve('wp-tx-123', 'wp-ref-456');
      expect(order.isPending()).toBe(false);
      expect(order.isApproved()).toBe(true);
      expect(order.isFinal()).toBe(true);
    });

    it('should correctly identify declined as final status', () => {
      order.decline('Insufficient funds');
      expect(order.isPending()).toBe(false);
      expect(order.isApproved()).toBe(false);
      expect(order.isFinal()).toBe(true);
    });
  });

  describe('updateStatus', () => {
    it('should update status from PENDING to APPROVED', () => {
      order.updateStatus(TransactionStatus.APPROVED, {
        transactionId: 'wp-tx-123',
        reference: 'wp-ref-456',
      });

      expect(order.getStatusValue()).toBe(TransactionStatus.APPROVED);
      expect(order.wpTransactionId).toBe('wp-tx-123');
      expect(order.wpReference).toBe('wp-ref-456');
    });

    it('should update status from PENDING to DECLINED', () => {
      order.updateStatus(TransactionStatus.DECLINED, {
        errorMessage: 'Card declined',
      });

      expect(order.getStatusValue()).toBe(TransactionStatus.DECLINED);
      expect(order.errorMessage).toBe('Card declined');
    });

    it('should update status from PENDING to ERROR', () => {
      order.updateStatus(TransactionStatus.ERROR, {
        errorMessage: 'Network error',
      });

      expect(order.getStatusValue()).toBe(TransactionStatus.ERROR);
      expect(order.errorMessage).toBe('Network error');
    });

    it('should update status with payment method', () => {
      order.updateStatus(TransactionStatus.APPROVED, {
        transactionId: 'wp-tx-123',
        reference: 'wp-ref-456',
        paymentMethod: 'CARD',
      });

      expect(order.paymentMethod).toBe('CARD');
    });

    it('should update status with all wpData fields', () => {
      order.updateStatus(TransactionStatus.APPROVED, {
        transactionId: 'wp-tx-123',
        reference: 'wp-ref-456',
        paymentMethod: 'NEQUI',
        errorMessage: 'Test message',
      });

      expect(order.wpTransactionId).toBe('wp-tx-123');
      expect(order.wpReference).toBe('wp-ref-456');
      expect(order.paymentMethod).toBe('NEQUI');
      expect(order.errorMessage).toBe('Test message');
    });

    it('should throw InvalidTransactionStateException when transition is not allowed', () => {
      order.approve('wp-tx-123', 'wp-ref-456');

      expect(() => {
        order.updateStatus(TransactionStatus.DECLINED);
      }).toThrow(InvalidTransactionStateException);
    });

    it('should allow transition from PENDING to any status', () => {
      expect(() => {
        order.updateStatus(TransactionStatus.APPROVED);
      }).not.toThrow();

      const order2 = Order.create(
        'order-2',
        'product-2',
        1,
        new Money(50000, 'COP'),
        {
          firstName: 'Test',
          lastName: 'User',
          address: 'Test Address',
          city: 'Test City',
          postalCode: '12345',
        },
        'test@example.com',
      );

      expect(() => {
        order2.updateStatus(TransactionStatus.DECLINED);
      }).not.toThrow();
    });

    it('should not allow transition from final states', () => {
      order.approve('wp-tx-123', 'wp-ref-456');

      expect(() => {
        order.updateStatus(TransactionStatus.PENDING);
      }).toThrow(InvalidTransactionStateException);

      expect(() => {
        order.updateStatus(TransactionStatus.ERROR);
      }).toThrow(InvalidTransactionStateException);
    });
  });

  describe('approve', () => {
    it('should approve order with transaction details', () => {
      order.approve('wp-tx-789', 'wp-ref-abc');

      expect(order.getStatusValue()).toBe(TransactionStatus.APPROVED);
      expect(order.wpTransactionId).toBe('wp-tx-789');
      expect(order.wpReference).toBe('wp-ref-abc');
    });

    it('should throw error when trying to approve already approved order', () => {
      order.approve('wp-tx-123', 'wp-ref-456');

      expect(() => {
        order.approve('wp-tx-789', 'wp-ref-abc');
      }).toThrow(InvalidTransactionStateException);
    });

    it('should throw error when trying to approve declined order', () => {
      order.decline('Insufficient funds');

      expect(() => {
        order.approve('wp-tx-123', 'wp-ref-456');
      }).toThrow(InvalidTransactionStateException);
    });
  });

  describe('decline', () => {
    it('should decline order with reason', () => {
      order.decline('Insufficient funds');

      expect(order.getStatusValue()).toBe(TransactionStatus.DECLINED);
      expect(order.errorMessage).toBe('Insufficient funds');
    });

    it('should throw error when trying to decline already declined order', () => {
      order.decline('Insufficient funds');

      expect(() => {
        order.decline('Another reason');
      }).toThrow(InvalidTransactionStateException);
    });

    it('should throw error when trying to decline approved order', () => {
      order.approve('wp-tx-123', 'wp-ref-456');

      expect(() => {
        order.decline('Cannot decline approved order');
      }).toThrow(InvalidTransactionStateException);
    });
  });

  describe('markAsError', () => {
    it('should mark order as error with message', () => {
      order.markAsError('Connection timeout');

      expect(order.getStatusValue()).toBe(TransactionStatus.ERROR);
      expect(order.errorMessage).toBe('Connection timeout');
    });

    it('should allow marking pending order as error', () => {
      expect(() => {
        order.markAsError('Payment gateway error');
      }).not.toThrow();

      expect(order.getStatusValue()).toBe(TransactionStatus.ERROR);
    });

    it('should throw error when trying to mark final state as error', () => {
      order.approve('wp-tx-123', 'wp-ref-456');

      expect(() => {
        order.markAsError('Cannot mark as error');
      }).toThrow(InvalidTransactionStateException);
    });
  });

  describe('toJSON', () => {
    it('should serialize order to JSON with all fields', () => {
      order.updateStatus(TransactionStatus.APPROVED, {
        transactionId: 'wp-tx-123',
        reference: 'wp-ref-456',
        paymentMethod: 'CARD',
      });

      const json = order.toJSON();

      expect(json).toEqual({
        id: testData.id,
        productId: testData.productId,
        quantity: testData.quantity,
        totalPrice: testData.totalPrice.amount,
        status: TransactionStatus.APPROVED,
        firstName: testData.firstName,
        lastName: testData.lastName,
        address: testData.address,
        city: testData.city,
        postalCode: testData.postalCode,
        customerEmail: testData.customerEmail,
        wpTransactionId: 'wp-tx-123',
        wpReference: 'wp-ref-456',
        paymentMethod: 'CARD',
        errorMessage: undefined,
        createdAt: order.createdAt,
      });
    });

    it('should serialize pending order without optional fields', () => {
      const json = order.toJSON();

      expect(json).toEqual({
        id: testData.id,
        productId: testData.productId,
        quantity: testData.quantity,
        totalPrice: testData.totalPrice.amount,
        status: TransactionStatus.PENDING,
        firstName: testData.firstName,
        lastName: testData.lastName,
        address: testData.address,
        city: testData.city,
        postalCode: testData.postalCode,
        customerEmail: testData.customerEmail,
        wpTransactionId: undefined,
        wpReference: undefined,
        paymentMethod: undefined,
        errorMessage: undefined,
        createdAt: order.createdAt,
      });
    });

    it('should serialize declined order with error message', () => {
      order.decline('Card expired');

      const json = order.toJSON();

      expect(json.status).toBe(TransactionStatus.DECLINED);
      expect(json.errorMessage).toBe('Card expired');
      expect(json.wpTransactionId).toBeUndefined();
      expect(json.wpReference).toBeUndefined();
    });

    it('should convert totalPrice to amount number', () => {
      const json = order.toJSON();
      expect(typeof json.totalPrice).toBe('number');
      expect(json.totalPrice).toBe(100000);
    });
  });

  describe('Edge cases', () => {
    it('should handle order with zero quantity', () => {
      const orderZeroQty = new Order(
        'order-zero',
        'product-1',
        0,
        new Money(0, 'COP'),
        TransactionStatusVO.pending(),
        'Test',
        'User',
        'Address',
        'City',
        '12345',
        'test@example.com',
      );

      expect(orderZeroQty.quantity).toBe(0);
      expect(orderZeroQty.totalPrice.amount).toBe(0);
    });

    it('should handle order with large quantity', () => {
      const orderLargeQty = new Order(
        'order-large',
        'product-1',
        999999,
        new Money(999999000, 'COP'),
        TransactionStatusVO.pending(),
        'Test',
        'User',
        'Address',
        'City',
        '12345',
        'test@example.com',
      );

      expect(orderLargeQty.quantity).toBe(999999);
    });

    it('should handle special characters in address fields', () => {
      const orderSpecialChars = new Order(
        'order-special',
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

      expect(orderSpecialChars.firstName).toBe("Jean-François");
      expect(orderSpecialChars.lastName).toBe("O'Brien");
      expect(orderSpecialChars.address).toBe("Calle 123 #45-67 Apto 2B");
      expect(orderSpecialChars.city).toBe("Bogotá D.C.");
    });

    it('should handle empty error messages', () => {
      order.updateStatus(TransactionStatus.ERROR, {
        errorMessage: '',
      });

      expect(order.errorMessage).toBeUndefined();
    });

    it('should handle very long error messages', () => {
      const longMessage = 'Error: '.repeat(100);
      order.markAsError(longMessage);

      expect(order.errorMessage).toBe(longMessage);
      expect(order.getStatusValue()).toBe(TransactionStatus.ERROR);
    });
  });

  describe('State transition validation', () => {
    it('should validate PENDING can transition to all states', () => {
      const pendingOrder = Order.create(
        'test-1',
        'prod-1',
        1,
        new Money(1000, 'COP'),
        {
          firstName: 'Test',
          lastName: 'User',
          address: 'Address',
          city: 'City',
          postalCode: '12345',
        },
        'test@example.com',
      );

      expect(() =>
        pendingOrder.updateStatus(TransactionStatus.APPROVED),
      ).not.toThrow();

      const pendingOrder2 = Order.create(
        'test-2',
        'prod-1',
        1,
        new Money(1000, 'COP'),
        {
          firstName: 'Test',
          lastName: 'User',
          address: 'Address',
          city: 'City',
          postalCode: '12345',
        },
        'test@example.com',
      );

      expect(() =>
        pendingOrder2.updateStatus(TransactionStatus.DECLINED),
      ).not.toThrow();

      const pendingOrder3 = Order.create(
        'test-3',
        'prod-1',
        1,
        new Money(1000, 'COP'),
        {
          firstName: 'Test',
          lastName: 'User',
          address: 'Address',
          city: 'City',
          postalCode: '12345',
        },
        'test@example.com',
      );

      expect(() =>
        pendingOrder3.updateStatus(TransactionStatus.ERROR),
      ).not.toThrow();
    });

    it('should prevent all transitions from APPROVED', () => {
      order.approve('tx-1', 'ref-1');

      expect(() =>
        order.updateStatus(TransactionStatus.PENDING),
      ).toThrow(InvalidTransactionStateException);
      expect(() =>
        order.updateStatus(TransactionStatus.DECLINED),
      ).toThrow(InvalidTransactionStateException);
      expect(() =>
        order.updateStatus(TransactionStatus.ERROR),
      ).toThrow(InvalidTransactionStateException);
    });

    it('should prevent all transitions from DECLINED', () => {
      order.decline('Reason');

      expect(() =>
        order.updateStatus(TransactionStatus.PENDING),
      ).toThrow(InvalidTransactionStateException);
      expect(() =>
        order.updateStatus(TransactionStatus.APPROVED),
      ).toThrow(InvalidTransactionStateException);
      expect(() =>
        order.updateStatus(TransactionStatus.ERROR),
      ).toThrow(InvalidTransactionStateException);
    });
  });

  describe('Immutability checks', () => {
    it('should not allow modifying readonly fields', () => {
      // TypeScript compile-time check - these would cause compilation errors:
      // order.id = 'new-id';
      // order.productId = 'new-product';
      // order.quantity = 5;
      // order.totalPrice = new Money(200000, 'COP');

      expect(order.id).toBe(testData.id);
      expect(order.productId).toBe(testData.productId);
      expect(order.quantity).toBe(testData.quantity);
      expect(order.totalPrice).toBe(testData.totalPrice);
    });

    it('should preserve original createdAt timestamp', () => {
      const originalCreatedAt = order.createdAt;

      order.updateStatus(TransactionStatus.APPROVED, {
        transactionId: 'tx-1',
        reference: 'ref-1',
        paymentMethod: 'CARD',
      });

      expect(order.createdAt).toBe(originalCreatedAt);
    });
  });
});
