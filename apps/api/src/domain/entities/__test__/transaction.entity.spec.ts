import { Transaction, TransactionProps } from '../transaction.entity';
import { Money } from '../../value-objects/money';
import { TransactionStatus } from '../../value-objects/transaction-status';
import { InvalidTransactionStateException } from '../../../shared/exceptions/domain.exception';

describe('Transaction Entity', () => {
  const mockProps: TransactionProps = {
    id: 'test-transaction-id',
    productId: 'product-123',
    quantity: 2,
    amount: new Money(100000, 'COP'),
    customerEmail: 'test@example.com',
    firstName: 'John',
    lastName: 'Doe',
    address: 'Calle 123',
    city: 'Bogotá',
    postalCode: '110111',
  };

  describe('create', () => {
    it('should create a new transaction with pending status', () => {
      const transaction = Transaction.create(mockProps);

      expect(transaction.id).toBe(mockProps.id);
      expect(transaction.productId).toBe(mockProps.productId);
      expect(transaction.quantity).toBe(mockProps.quantity);
      expect(transaction.amount).toBe(mockProps.amount);
      expect(transaction.customerEmail).toBe(mockProps.customerEmail);
      expect(transaction.firstName).toBe(mockProps.firstName);
      expect(transaction.lastName).toBe(mockProps.lastName);
      expect(transaction.address).toBe(mockProps.address);
      expect(transaction.city).toBe(mockProps.city);
      expect(transaction.postalCode).toBe(mockProps.postalCode);
      expect(transaction.getStatusValue()).toBe(TransactionStatus.PENDING);
      expect(transaction.isPending()).toBe(true);
    });

    it('should initialize without wp data', () => {
      const transaction = Transaction.create(mockProps);

      expect(transaction.wpTransactionId).toBeUndefined();
      expect(transaction.wpReference).toBeUndefined();
      expect(transaction.paymentMethod).toBeUndefined();
      expect(transaction.errorMessage).toBeUndefined();
    });

    it('should set createdAt and updatedAt dates', () => {
      const transaction = Transaction.create(mockProps);

      expect(transaction.createdAt).toBeInstanceOf(Date);
      expect(transaction.updatedAt).toBeInstanceOf(Date);
    });
  });

  describe('getStatusValue', () => {
    it('should return the current status value', () => {
      const transaction = Transaction.create(mockProps);

      expect(transaction.getStatusValue()).toBe(TransactionStatus.PENDING);
    });
  });

  describe('isPending', () => {
    it('should return true when status is PENDING', () => {
      const transaction = Transaction.create(mockProps);

      expect(transaction.isPending()).toBe(true);
    });

    it('should return false when status is not PENDING', () => {
      const transaction = Transaction.create(mockProps);
      transaction.approve('wp-123', 'ref-123');

      expect(transaction.isPending()).toBe(false);
    });
  });

  describe('updateStatus', () => {
    it('should update status from PENDING to APPROVED', () => {
      const transaction = Transaction.create(mockProps);
      const wpData = {
        transactionId: 'wp-123',
        reference: 'ref-123',
        paymentMethod: 'CARD',
      };

      transaction.updateStatus(TransactionStatus.APPROVED, wpData);

      expect(transaction.getStatusValue()).toBe(TransactionStatus.APPROVED);
      expect(transaction.wpTransactionId).toBe('wp-123');
      expect(transaction.wpReference).toBe('ref-123');
      expect(transaction.paymentMethod).toBe('CARD');
    });

    it('should update status from PENDING to DECLINED', () => {
      const transaction = Transaction.create(mockProps);
      const wpData = {
        errorMessage: 'Insufficient funds',
      };

      transaction.updateStatus(TransactionStatus.DECLINED, wpData);

      expect(transaction.getStatusValue()).toBe(TransactionStatus.DECLINED);
      expect(transaction.errorMessage).toBe('Insufficient funds');
    });

    it('should update status from PENDING to ERROR', () => {
      const transaction = Transaction.create(mockProps);
      const wpData = {
        errorMessage: 'Connection timeout',
      };

      transaction.updateStatus(TransactionStatus.ERROR, wpData);

      expect(transaction.getStatusValue()).toBe(TransactionStatus.ERROR);
      expect(transaction.errorMessage).toBe('Connection timeout');
    });

    it('should not update when new status is the same (idempotency)', () => {
      const transaction = Transaction.create(mockProps);
      const originalUpdatedAt = transaction.updatedAt;

      // Wait a bit to ensure dates would be different if updated
      jest.useFakeTimers();
      jest.advanceTimersByTime(1000);

      transaction.updateStatus(TransactionStatus.PENDING);

      expect(transaction.getStatusValue()).toBe(TransactionStatus.PENDING);
      expect(transaction.updatedAt).toBe(originalUpdatedAt);

      jest.useRealTimers();
    });

    it('should throw error when trying invalid transition', () => {
      const transaction = Transaction.create(mockProps);
      transaction.approve('wp-123', 'ref-123');

      expect(() => {
        transaction.updateStatus(TransactionStatus.PENDING);
      }).toThrow(InvalidTransactionStateException);
    });

    it('should update updatedAt timestamp', () => {
      const transaction = Transaction.create(mockProps);
      const originalUpdatedAt = transaction.updatedAt;

      jest.useFakeTimers();
      jest.advanceTimersByTime(1000);

      transaction.updateStatus(TransactionStatus.APPROVED, {
        transactionId: 'wp-123',
        reference: 'ref-123',
      });

      expect(transaction.updatedAt.getTime()).toBeGreaterThan(originalUpdatedAt.getTime());

      jest.useRealTimers();
    });

    it('should preserve existing wp data when not provided', () => {
      const transaction = Transaction.create(mockProps);

      // First update with wp data
      transaction.updateStatus(TransactionStatus.ERROR, {
        transactionId: 'wp-123',
        reference: 'ref-123',
      });

      const originalWpId = transaction.wpTransactionId;
      const originalReference = transaction.wpReference;

      const json = transaction.toJSON();

      expect(json.wpTransactionId).toBe(originalWpId);
      expect(json.wpReference).toBe(originalReference);
    });

    it('should update with partial wp data fields', () => {
      const transaction = Transaction.create(mockProps);

      transaction.updateStatus(TransactionStatus.APPROVED, {
        transactionId: 'wp-123',
        reference: 'ref-123',
        paymentMethod: 'CARD',
      });

      expect(transaction.wpTransactionId).toBe('wp-123');
      expect(transaction.wpReference).toBe('ref-123');
      expect(transaction.paymentMethod).toBe('CARD');
      expect(transaction.errorMessage).toBeUndefined();
    });
  });

  describe('approve', () => {
    it('should approve transaction with wp data', () => {
      const transaction = Transaction.create(mockProps);

      transaction.approve('wp-123', 'ref-123');

      expect(transaction.getStatusValue()).toBe(TransactionStatus.APPROVED);
      expect(transaction.wpTransactionId).toBe('wp-123');
      expect(transaction.wpReference).toBe('ref-123');
    });

    it('should not allow duplicate approval (idempotency check)', () => {
      const transaction = Transaction.create(mockProps);
      transaction.approve('wp-123', 'ref-123');

      transaction.approve('wp-123', 'ref-123');

      expect(transaction.getStatusValue()).toBe(TransactionStatus.APPROVED);
      expect(transaction.wpTransactionId).toBe('wp-123');
      expect(transaction.wpReference).toBe('ref-123');
    });
  });

  describe('decline', () => {
    it('should decline transaction with error message', () => {
      const transaction = Transaction.create(mockProps);

      transaction.decline('Insufficient funds');

      expect(transaction.getStatusValue()).toBe(TransactionStatus.DECLINED);
      expect(transaction.errorMessage).toBe('Insufficient funds');
    });

    it('should throw error when trying to decline already approved transaction', () => {
      const transaction = Transaction.create(mockProps);
      transaction.approve('wp-123', 'ref-123');

      expect(() => {
        transaction.decline('Some reason');
      }).toThrow(InvalidTransactionStateException);
    });
  });

  describe('markAsError', () => {
    it('should mark transaction as error with message', () => {
      const transaction = Transaction.create(mockProps);

      transaction.markAsError('Connection timeout');

      expect(transaction.getStatusValue()).toBe(TransactionStatus.ERROR);
      expect(transaction.errorMessage).toBe('Connection timeout');
    });

    it('should throw error when trying to mark error on approved transaction', () => {
      const transaction = Transaction.create(mockProps);
      transaction.approve('wp-123', 'ref-123');

      expect(() => {
        transaction.markAsError('Some error');
      }).toThrow(InvalidTransactionStateException);
    });
  });

  describe('toJSON', () => {
    it('should serialize transaction to JSON', () => {
      const transaction = Transaction.create(mockProps);

      const json = transaction.toJSON();

      expect(json).toEqual({
        id: mockProps.id,
        productId: mockProps.productId,
        quantity: mockProps.quantity,
        amount: mockProps.amount.amount,
        currency: mockProps.amount.currency,
        status: TransactionStatus.PENDING,
        customerEmail: mockProps.customerEmail,
        firstName: mockProps.firstName,
        lastName: mockProps.lastName,
        address: mockProps.address,
        city: mockProps.city,
        postalCode: mockProps.postalCode,
        wpTransactionId: undefined,
        wpReference: undefined,
        paymentMethod: undefined,
        errorMessage: undefined,
        createdAt: transaction.createdAt,
        updatedAt: transaction.updatedAt,
      });
    });

    it('should include wp data in JSON when present', () => {
      const transaction = Transaction.create(mockProps);
      transaction.approve('wp-123', 'ref-123');

      const json = transaction.toJSON();

      expect(json.wpTransactionId).toBe('wp-123');
      expect(json.wpReference).toBe('ref-123');
      expect(json.status).toBe(TransactionStatus.APPROVED);
    });

    it('should include error message in JSON when present', () => {
      const transaction = Transaction.create(mockProps);
      transaction.decline('Payment rejected');

      const json = transaction.toJSON();

      expect(json.errorMessage).toBe('Payment rejected');
      expect(json.status).toBe(TransactionStatus.DECLINED);
    });
  });

  describe('Integration scenarios', () => {
    it('should handle complete successful payment flow', () => {
      const transaction = Transaction.create(mockProps);

      expect(transaction.isPending()).toBe(true);

      transaction.approve('wp-final-123', 'ref-final-123');

      expect(transaction.getStatusValue()).toBe(TransactionStatus.APPROVED);
      expect(transaction.isPending()).toBe(false);
      expect(transaction.wpTransactionId).toBe('wp-final-123');
      expect(transaction.wpReference).toBe('ref-final-123');
    });

    it('should handle failed payment flow', () => {
      const transaction = Transaction.create(mockProps);

      expect(transaction.isPending()).toBe(true);

      transaction.decline('Card declined by bank');

      expect(transaction.getStatusValue()).toBe(TransactionStatus.DECLINED);
      expect(transaction.isPending()).toBe(false);
      expect(transaction.errorMessage).toBe('Card declined by bank');
    });

    it('should handle error flow', () => {
      const transaction = Transaction.create(mockProps);

      expect(transaction.isPending()).toBe(true);

      transaction.markAsError('WP API timeout');

      expect(transaction.getStatusValue()).toBe(TransactionStatus.ERROR);
      expect(transaction.isPending()).toBe(false);
      expect(transaction.errorMessage).toBe('WP API timeout');
    });

    it('should maintain data integrity through multiple operations', () => {
      const transaction = Transaction.create(mockProps);

      expect(transaction.id).toBe(mockProps.id);
      expect(transaction.productId).toBe(mockProps.productId);
      expect(transaction.quantity).toBe(mockProps.quantity);
      expect(transaction.amount).toBe(mockProps.amount);

      transaction.approve('wp-123', 'ref-123');

      expect(transaction.id).toBe(mockProps.id);
      expect(transaction.productId).toBe(mockProps.productId);
      expect(transaction.quantity).toBe(mockProps.quantity);
      expect(transaction.amount).toBe(mockProps.amount);
    });
  });
});
