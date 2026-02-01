import { Money } from '../value-objects';
import {
  TransactionStatus,
  TransactionStatusVO,
} from '../value-objects/transaction-status';
import { InvalidTransactionStateException } from '../../shared/exceptions';

export interface TransactionProps {
  id: string;
  productId: string;
  quantity: number;
  amount: Money;
  customerEmail: string;
  firstName: string;
  lastName: string;
  address: string;
  city: string;
  postalCode: string;
}

export class Transaction {
  constructor(
    public readonly id: string,
    public readonly productId: string,
    public readonly quantity: number,
    public readonly amount: Money,
    private status: TransactionStatusVO,
    public readonly customerEmail: string,
    public readonly firstName: string,
    public readonly lastName: string,
    public readonly address: string,
    public readonly city: string,
    public readonly postalCode: string,
    public wpTransactionId?: string,
    public wpReference?: string,
    public paymentMethod?: string,
    public errorMessage?: string,
    public readonly createdAt: Date = new Date(),
    public updatedAt: Date = new Date(),
  ) { }

  public static create(props: TransactionProps): Transaction {
    return new Transaction(
      props.id,
      props.productId,
      props.quantity,
      props.amount,
      TransactionStatusVO.pending(),
      props.customerEmail,
      props.firstName,
      props.lastName,
      props.address,
      props.city,
      props.postalCode
    );
  }

  // --- MÉTODOS DE ESTADO (Los que pide el Use Case) ---

  public getStatusValue(): TransactionStatus {
    return this.status.value;
  }

  public isPending(): boolean {
    return this.status.isPending();
  }

public updateStatus(
    newStatus: TransactionStatus,
    wpData?: {
      transactionId?: string;
      reference?: string;
      paymentMethod?: string;
      errorMessage?: string;
    },
  ): void {
    // 1. SI EL ESTADO ES EL MISMO, NO HACEMOS NADA (IDEMPOTENCIA)
    if (this.status.value === newStatus) {
      return; 
    }

    // 2. SI ES DIFERENTE, VALIDAMOS LA TRANSICIÓN
    if (!this.status.canTransitionTo(newStatus)) {
      throw new InvalidTransactionStateException(this.status.value, `transition to ${newStatus}`);
    }

    this.status = new TransactionStatusVO(newStatus);
    this.updatedAt = new Date();

    if (wpData) {
      this.wpTransactionId = wpData.transactionId || this.wpTransactionId;
      this.wpReference = wpData.reference || this.wpReference;
      this.paymentMethod = wpData.paymentMethod || this.paymentMethod;
      this.errorMessage = wpData.errorMessage || this.errorMessage;
    }
  }

  public approve(wpId: string, reference: string): void {
    this.updateStatus(TransactionStatus.APPROVED, { transactionId: wpId, reference });
  }

  public decline(reason: string): void {
    this.updateStatus(TransactionStatus.DECLINED, { errorMessage: reason });
  }

  public markAsError(message: string): void {
    this.updateStatus(TransactionStatus.ERROR, { errorMessage: message });
  }

  public toJSON() {
    return {
      id: this.id,
      productId: this.productId,
      quantity: this.quantity,
      amount: this.amount.amount,
      currency: this.amount.currency,
      status: this.status.value,
      customerEmail: this.customerEmail,
      firstName: this.firstName,
      lastName: this.lastName,
      address: this.address,
      city: this.city,
      postalCode: this.postalCode,
      wpTransactionId: this.wpTransactionId,
      wpReference: this.wpReference,
      paymentMethod: this.paymentMethod,
      errorMessage: this.errorMessage,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }
}