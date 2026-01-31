import { Money } from '../value-objects';
import {
  TransactionStatus,
  TransactionStatusVO,
} from '../value-objects/transaction-status';
import { InvalidTransactionStateException } from '../../shared/exceptions';

/**
 * Order Domain Entity
 * Contains business logic and rules for orders and payments
 * Includes shipping address information
 */
export class Order {
  constructor(
    public readonly id: string,
    public readonly productId: string,
    public readonly quantity: number,
    public readonly totalPrice: Money,
    private status: TransactionStatusVO,
    public readonly firstName: string,
    public readonly lastName: string,
    public readonly address: string,
    public readonly city: string,
    public readonly postalCode: string,
    public readonly customerEmail: string,
    public wompiTransactionId?: string,
    public wompiReference?: string,
    public paymentMethod?: string,
    public errorMessage?: string,
    public readonly createdAt: Date = new Date(),
  ) {}

  public getStatus(): TransactionStatusVO {
    return this.status;
  }

  public getStatusValue(): TransactionStatus {
    return this.status.value;
  }

  public updateStatus(
    newStatus: TransactionStatus,
    wompiData?: {
      transactionId?: string;
      reference?: string;
      paymentMethod?: string;
      errorMessage?: string;
    },
  ): void {
    if (!this.status.canTransitionTo(newStatus)) {
      throw new InvalidTransactionStateException(
        this.status.value,
        `transition to ${newStatus}`,
      );
    }

    this.status = new TransactionStatusVO(newStatus);

    if (wompiData) {
      if (wompiData.transactionId) {
        this.wompiTransactionId = wompiData.transactionId;
      }
      if (wompiData.reference) {
        this.wompiReference = wompiData.reference;
      }
      if (wompiData.paymentMethod) {
        this.paymentMethod = wompiData.paymentMethod;
      }
      if (wompiData.errorMessage) {
        this.errorMessage = wompiData.errorMessage;
      }
    }
  }

  public approve(wompiTransactionId: string, wompiReference: string): void {
    this.updateStatus(TransactionStatus.APPROVED, {
      transactionId: wompiTransactionId,
      reference: wompiReference,
    });
  }

  public decline(reason: string): void {
    this.updateStatus(TransactionStatus.DECLINED, {
      errorMessage: reason,
    });
  }

  public markAsError(errorMessage: string): void {
    this.updateStatus(TransactionStatus.ERROR, {
      errorMessage,
    });
  }

  public isPending(): boolean {
    return this.status.isPending();
  }

  public isApproved(): boolean {
    return this.status.isApproved();
  }

  public isFinal(): boolean {
    return this.status.isFinal();
  }

  public static create(
    id: string,
    productId: string,
    quantity: number,
    totalPrice: Money,
    shippingAddress: {
      firstName: string;
      lastName: string;
      address: string;
      city: string;
      postalCode: string;
    },
    customerEmail: string,
  ): Order {
    return new Order(
      id,
      productId,
      quantity,
      totalPrice,
      TransactionStatusVO.pending(),
      shippingAddress.firstName,
      shippingAddress.lastName,
      shippingAddress.address,
      shippingAddress.city,
      shippingAddress.postalCode,
      customerEmail,
    );
  }

  public toJSON() {
    return {
      id: this.id,
      productId: this.productId,
      quantity: this.quantity,
      totalPrice: this.totalPrice.amount,
      status: this.status.value,
      firstName: this.firstName,
      lastName: this.lastName,
      address: this.address,
      city: this.city,
      postalCode: this.postalCode,
      customerEmail: this.customerEmail,
      wompiTransactionId: this.wompiTransactionId,
      wompiReference: this.wompiReference,
      paymentMethod: this.paymentMethod,
      errorMessage: this.errorMessage,
      createdAt: this.createdAt,
    };
  }
}
