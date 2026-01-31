import { Result } from '../../shared/result';

/**
 * Payment Gateway Port (Interface)
 * Defines the contract for payment processing
 */

export interface PaymentRequest {
  amount: number;
  currency: string;
  customerEmail: string;
  reference: string;
  paymentMethod: {
    type: string;
    token?: string;
    installments?: number;
  };
}

export interface PaymentResponse {
  id: string;
  status: string;
  reference: string;
  amount: number;
  currency: string;
  paymentMethod: string;
  createdAt: Date;
  finalizedAt?: Date;
}

export interface IPaymentGateway {
  processPayment(
    request: PaymentRequest,
  ): Promise<Result<PaymentResponse, Error>>;

  getTransactionStatus(
    transactionId: string,
  ): Promise<Result<PaymentResponse, Error>>;

  createPaymentSource(
    cardInfo: any,
  ): Promise<Result<{ id: string; type: string }, Error>>;
}