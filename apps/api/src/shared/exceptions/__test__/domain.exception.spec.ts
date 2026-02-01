import {
  DomainException,
  ProductNotFoundException,
  InsufficientStockException,
  TransactionNotFoundException,
  InvalidTransactionStateException,
  PaymentProcessingException,
} from '../domain.exception';

describe('DomainException', () => {
  describe('DomainException', () => {
    it('should create exception with message and code', () => {
      const exception = new DomainException('Test error', 'TEST_CODE');

      expect(exception.message).toBe('Test error');
      expect(exception.code).toBe('TEST_CODE');
      expect(exception.name).toBe('DomainException');
    });

    it('should extend Error', () => {
      const exception = new DomainException('Test', 'CODE');

      expect(exception).toBeInstanceOf(Error);
      expect(exception).toBeInstanceOf(DomainException);
    });
  });

  describe('ProductNotFoundException', () => {
    it('should create exception with product id', () => {
      const productId = 'prod-123';
      const exception = new ProductNotFoundException(productId);

      expect(exception.message).toBe('Product with id prod-123 not found');
      expect(exception.code).toBe('PRODUCT_NOT_FOUND');
      expect(exception.name).toBe('ProductNotFoundException');
    });

    it('should extend DomainException', () => {
      const exception = new ProductNotFoundException('prod-456');

      expect(exception).toBeInstanceOf(DomainException);
      expect(exception).toBeInstanceOf(ProductNotFoundException);
    });

    it('should handle different product id formats', () => {
      const uuidProductId = '550e8400-e29b-41d4-a716-446655440000';
      const exception = new ProductNotFoundException(uuidProductId);

      expect(exception.message).toContain(uuidProductId);
    });
  });

  describe('InsufficientStockException', () => {
    it('should create exception with product id, requested and available amounts', () => {
      const exception = new InsufficientStockException('prod-123', 10, 5);

      expect(exception.message).toBe(
        'Insufficient stock for product prod-123. Requested: 10, Available: 5',
      );
      expect(exception.code).toBe('INSUFFICIENT_STOCK');
      expect(exception.name).toBe('InsufficientStockException');
    });

    it('should extend DomainException', () => {
      const exception = new InsufficientStockException('prod-456', 20, 10);

      expect(exception).toBeInstanceOf(DomainException);
      expect(exception).toBeInstanceOf(InsufficientStockException);
    });

    it('should handle zero stock scenario', () => {
      const exception = new InsufficientStockException('prod-789', 1, 0);

      expect(exception.message).toContain('Requested: 1, Available: 0');
    });

    it('should handle large quantities', () => {
      const exception = new InsufficientStockException('prod-999', 1000, 500);

      expect(exception.message).toContain('Requested: 1000, Available: 500');
    });
  });

  describe('TransactionNotFoundException', () => {
    it('should create exception with transaction id', () => {
      const transactionId = 'tx-123';
      const exception = new TransactionNotFoundException(transactionId);

      expect(exception.message).toBe('Transaction with id tx-123 not found');
      expect(exception.code).toBe('TRANSACTION_NOT_FOUND');
      expect(exception.name).toBe('TransactionNotFoundException');
    });

    it('should extend DomainException', () => {
      const exception = new TransactionNotFoundException('tx-456');

      expect(exception).toBeInstanceOf(DomainException);
      expect(exception).toBeInstanceOf(TransactionNotFoundException);
    });

    it('should handle UUID transaction ids', () => {
      const uuidTxId = '123e4567-e89b-12d3-a456-426614174000';
      const exception = new TransactionNotFoundException(uuidTxId);

      expect(exception.message).toContain(uuidTxId);
    });
  });

  describe('InvalidTransactionStateException', () => {
    it('should create exception with current state and attempted action', () => {
      const exception = new InvalidTransactionStateException('approved', 'cancel');

      expect(exception.message).toBe('Cannot cancel transaction in approved state');
      expect(exception.code).toBe('INVALID_TRANSACTION_STATE');
      expect(exception.name).toBe('InvalidTransactionStateException');
    });

    it('should extend DomainException', () => {
      const exception = new InvalidTransactionStateException('pending', 'approve');

      expect(exception).toBeInstanceOf(DomainException);
      expect(exception).toBeInstanceOf(InvalidTransactionStateException);
    });

    it('should handle different state and action combinations', () => {
      const testCases = [
        { state: 'declined', action: 'approve' },
        { state: 'approved', action: 'decline' },
        { state: 'pending', action: 'refund' },
        { state: 'error', action: 'process' },
      ];

      testCases.forEach(({ state, action }) => {
        const exception = new InvalidTransactionStateException(state, action);
        expect(exception.message).toBe(`Cannot ${action} transaction in ${state} state`);
      });
    });

    it('should handle transition to specific state', () => {
      const exception = new InvalidTransactionStateException(
        'approved',
        'transition to pending',
      );

      expect(exception.message).toBe(
        'Cannot transition to pending transaction in approved state',
      );
    });
  });

  describe('PaymentProcessingException', () => {
    it('should create exception with message', () => {
      const exception = new PaymentProcessingException('Payment failed');

      expect(exception.message).toBe('Payment failed');
      expect(exception.code).toBe('PAYMENT_PROCESSING_ERROR');
      expect(exception.name).toBe('PaymentProcessingException');
      expect(exception.wpError).toBeUndefined();
    });

    it('should create exception with WP error details', () => {
      const wpError = {
        code: 'CARD_DECLINED',
        message: 'Insufficient funds',
        details: { balance: 0 },
      };
      const exception = new PaymentProcessingException('Payment failed', wpError);

      expect(exception.message).toBe('Payment failed');
      expect(exception.wpError).toEqual(wpError);
    });

    it('should extend DomainException', () => {
      const exception = new PaymentProcessingException('Payment failed');

      expect(exception).toBeInstanceOf(DomainException);
      expect(exception).toBeInstanceOf(PaymentProcessingException);
    });

    it('should handle WP API error responses', () => {
      const wpApiError = {
        status: 400,
        error: {
          type: 'VALIDATION_ERROR',
          messages: {
            card_number: ['Invalid card number'],
            cvv: ['CVV is required'],
          },
        },
      };
      const exception = new PaymentProcessingException(
        'Validation failed',
        wpApiError,
      );

      expect(exception.wpError).toEqual(wpApiError);
      expect(exception.message).toBe('Validation failed');
    });

    it('should handle network timeout errors', () => {
      const timeoutError = {
        code: 'ECONNABORTED',
        message: 'timeout of 5000ms exceeded',
      };
      const exception = new PaymentProcessingException(
        'Payment gateway timeout',
        timeoutError,
      );

      expect(exception.wpError).toEqual(timeoutError);
    });

    it('should handle null wpError', () => {
      const exception = new PaymentProcessingException('Payment failed', null as any);

      expect(exception.wpError).toBeNull();
    });

    it('should handle string wpError', () => {
      const exception = new PaymentProcessingException(
        'Payment failed',
        'Card declined' as any,
      );

      expect(exception.wpError).toBe('Card declined');
    });
  });

  describe('Exception inheritance chain', () => {
    it('should maintain proper inheritance chain for all exceptions', () => {
      const exceptions = [
        new ProductNotFoundException('1'),
        new InsufficientStockException('1', 10, 5),
        new TransactionNotFoundException('1'),
        new InvalidTransactionStateException('pending', 'action'),
        new PaymentProcessingException('error'),
      ];

      exceptions.forEach((exception) => {
        expect(exception).toBeInstanceOf(Error);
        expect(exception).toBeInstanceOf(DomainException);
      });
    });

    it('should have unique exception names', () => {
      const exceptions = [
        new DomainException('test', 'TEST'),
        new ProductNotFoundException('1'),
        new InsufficientStockException('1', 10, 5),
        new TransactionNotFoundException('1'),
        new InvalidTransactionStateException('pending', 'action'),
        new PaymentProcessingException('error'),
      ];

      const names = exceptions.map((e) => e.name);
      const uniqueNames = new Set(names);

      expect(uniqueNames.size).toBe(names.length);
    });
  });
});
