import { TransactionStatus } from '../../domain/value-objects';

/**
 * Transaction Response DTO
 */
export class TransactionDto {
  id: string;
  productId: string;
  quantity: number;
  amount: number;
  currency: string;
  status: TransactionStatus;
  customerEmail: string;
  wpTransactionId?: string;
  wpReference?: string;
  paymentMethod?: string;
  errorMessage?: string;
  createdAt: Date;
  updatedAt: Date;
}
