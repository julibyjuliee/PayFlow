/**
 * Transaction Status Value Object
 */
export enum TransactionStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  DECLINED = 'DECLINED',
  ERROR = 'ERROR',
  VOIDED = 'VOIDED',
}

export class TransactionStatusVO {
  constructor(public readonly value: TransactionStatus) {}

  public isPending(): boolean {
    return this.value === TransactionStatus.PENDING;
  }

  public isApproved(): boolean {
    return this.value === TransactionStatus.APPROVED;
  }

  public isDeclined(): boolean {
    return this.value === TransactionStatus.DECLINED;
  }

  public isError(): boolean {
    return this.value === TransactionStatus.ERROR;
  }

  public isFinal(): boolean {
    return (
      this.value === TransactionStatus.APPROVED ||
      this.value === TransactionStatus.DECLINED ||
      this.value === TransactionStatus.VOIDED
    );
  }

  public canTransitionTo(newStatus: TransactionStatus): boolean {
    // PENDING can transition to any other status
    if (this.value === TransactionStatus.PENDING) {
      return true;
    }
    // Final states cannot transition
    return false;
  }

  public static pending(): TransactionStatusVO {
    return new TransactionStatusVO(TransactionStatus.PENDING);
  }

  public static approved(): TransactionStatusVO {
    return new TransactionStatusVO(TransactionStatus.APPROVED);
  }

  public static declined(): TransactionStatusVO {
    return new TransactionStatusVO(TransactionStatus.DECLINED);
  }

  public static error(): TransactionStatusVO {
    return new TransactionStatusVO(TransactionStatus.ERROR);
  }
}
