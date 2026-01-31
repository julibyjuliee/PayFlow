/**
 * Base exception for domain errors
 */
export class DomainException extends Error {
  constructor(
    message: string,
    public readonly code: string,
  ) {
    super(message);
    this.name = 'DomainException';
  }
}

export class ProductNotFoundException extends DomainException {
  constructor(productId: string) {
    super(`Product with id ${productId} not found`, 'PRODUCT_NOT_FOUND');
    this.name = 'ProductNotFoundException';
  }
}

export class InsufficientStockException extends DomainException {
  constructor(productId: string, requested: number, available: number) {
    super(
      `Insufficient stock for product ${productId}. Requested: ${requested}, Available: ${available}`,
      'INSUFFICIENT_STOCK',
    );
    this.name = 'InsufficientStockException';
  }
}

export class TransactionNotFoundException extends DomainException {
  constructor(transactionId: string) {
    super(
      `Transaction with id ${transactionId} not found`,
      'TRANSACTION_NOT_FOUND',
    );
    this.name = 'TransactionNotFoundException';
  }
}

export class InvalidTransactionStateException extends DomainException {
  constructor(currentState: string, attemptedAction: string) {
    super(
      `Cannot ${attemptedAction} transaction in ${currentState} state`,
      'INVALID_TRANSACTION_STATE',
    );
    this.name = 'InvalidTransactionStateException';
  }
}

export class PaymentProcessingException extends DomainException {
  constructor(message: string, public readonly wompiError?: any) {
    super(message, 'PAYMENT_PROCESSING_ERROR');
    this.name = 'PaymentProcessingException';
  }
}
