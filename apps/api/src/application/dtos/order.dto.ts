import { TransactionStatus } from '../../domain/value-objects';

/**
 * Order Response DTO
 */
export class OrderDto {
  id: string;
  productId: string;
  quantity: number;
  totalPrice: number;
  status: TransactionStatus;
  firstName: string;
  lastName: string;
  address: string;
  city: string;
  postalCode: string;
  customerEmail: string;
  wpTransactionId?: string;
  wpReference?: string;
  paymentMethod?: string;
  errorMessage?: string;
  createdAt: Date;
}
