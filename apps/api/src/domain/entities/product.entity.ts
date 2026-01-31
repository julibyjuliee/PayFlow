import { Money } from '../value-objects';
import { InsufficientStockException } from '../../shared/exceptions';

/**
 * Product Domain Entity
 * Contains business logic and rules for products
 */
export class Product {
  constructor(
    public readonly id: string,
    public readonly name: string,
    public readonly price: Money,
    private stock: number,
    public readonly category?: string,
    public readonly description?: string,
    public readonly imageUrl?: string,
    public readonly createdAt: Date = new Date(),
  ) {
    this.validateStock(stock);
  }

  private validateStock(stock: number): void {
    if (stock < 0) {
      throw new Error('Stock cannot be negative');
    }
  }

  public getStock(): number {
    return this.stock;
  }

  public isAvailable(): boolean {
    return this.stock > 0;
  }

  public hasStock(quantity: number): boolean {
    return this.stock >= quantity;
  }

  public decreaseStock(quantity: number): void {
    if (!this.hasStock(quantity)) {
      throw new InsufficientStockException(
        this.id,
        quantity,
        this.stock,
      );
    }
    this.stock -= quantity;
  }

  public increaseStock(quantity: number): void {
    if (quantity <= 0) {
      throw new Error('Quantity must be positive');
    }
    this.stock += quantity;
  }

  public calculateTotalPrice(quantity: number): Money {
    return this.price.multiply(quantity);
  }

  public toJSON() {
    return {
      id: this.id,
      name: this.name,
      price: this.price.amount,
      category: this.category,
      description: this.description,
      stock: this.stock,
      imageUrl: this.imageUrl,
      createdAt: this.createdAt,
    };
  }
}
