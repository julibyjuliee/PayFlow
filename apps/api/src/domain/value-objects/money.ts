/**
 * Money Value Object
 * Represents a monetary value with currency
 */
export class Money {
  constructor(
    public readonly amount: number,
    public readonly currency: string = 'COP',
  ) {
    if (amount < 0) {
      throw new Error('Money amount cannot be negative');
    }
  }

  public static fromCents(cents: number, currency: string = 'COP'): Money {
    return new Money(cents / 100, currency);
  }

  public toCents(): number {
    return Math.round(this.amount * 100);
  }

  public add(other: Money): Money {
    if (this.currency !== other.currency) {
      throw new Error('Cannot add money with different currencies');
    }
    return new Money(this.amount + other.amount, this.currency);
  }

  public multiply(factor: number): Money {
    return new Money(this.amount * factor, this.currency);
  }

  public equals(other: Money): boolean {
    return this.amount === other.amount && this.currency === other.currency;
  }
}
