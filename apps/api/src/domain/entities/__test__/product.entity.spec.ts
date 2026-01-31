import { Product } from '../product.entity';
import { Money } from '../../value-objects/money';
import { InsufficientStockException } from '../../../shared/exceptions';

describe('Product Entity', () => {
  let product: Product;
  const testData = {
    id: 'product-123',
    name: 'Laptop HP',
    price: new Money(2500000, 'COP'),
    stock: 10,
    category: 'Electronics',
    description: 'High performance laptop',
    imageUrl: 'https://example.com/laptop.jpg',
  };

  beforeEach(() => {
    product = new Product(
      testData.id,
      testData.name,
      testData.price,
      testData.stock,
      testData.category,
      testData.description,
      testData.imageUrl,
    );
  });

  describe('Constructor', () => {
    it('should create a product with all required fields', () => {
      expect(product.id).toBe(testData.id);
      expect(product.name).toBe(testData.name);
      expect(product.price).toBe(testData.price);
      expect(product.getStock()).toBe(testData.stock);
    });

    it('should create a product with optional fields', () => {
      expect(product.category).toBe(testData.category);
      expect(product.description).toBe(testData.description);
      expect(product.imageUrl).toBe(testData.imageUrl);
    });

    it('should create a product without optional fields', () => {
      const minimalProduct = new Product(
        'product-456',
        'Mouse',
        new Money(50000, 'COP'),
        5,
      );

      expect(minimalProduct.id).toBe('product-456');
      expect(minimalProduct.name).toBe('Mouse');
      expect(minimalProduct.price.amount).toBe(50000);
      expect(minimalProduct.getStock()).toBe(5);
      expect(minimalProduct.category).toBeUndefined();
      expect(minimalProduct.description).toBeUndefined();
      expect(minimalProduct.imageUrl).toBeUndefined();
    });

    it('should have a createdAt timestamp', () => {
      expect(product.createdAt).toBeInstanceOf(Date);
    });

    it('should accept zero stock', () => {
      const zeroStockProduct = new Product(
        'product-zero',
        'Out of Stock Item',
        new Money(100000, 'COP'),
        0,
      );

      expect(zeroStockProduct.getStock()).toBe(0);
    });
  });

  describe('getStock', () => {
    it('should return current stock', () => {
      expect(product.getStock()).toBe(10);
    });

    it('should return updated stock after decrease', () => {
      product.decreaseStock(3);
      expect(product.getStock()).toBe(7);
    });

    it('should return updated stock after increase', () => {
      product.increaseStock(5);
      expect(product.getStock()).toBe(15);
    });
  });

  describe('isAvailable', () => {
    it('should return true when stock is greater than zero', () => {
      expect(product.isAvailable()).toBe(true);
    });

    it('should return false when stock is zero', () => {
      product.decreaseStock(10);
      expect(product.isAvailable()).toBe(false);
    });

    it('should return true for product with stock 1', () => {
      const lowStockProduct = new Product(
        'product-low',
        'Low Stock Item',
        new Money(50000, 'COP'),
        1,
      );

      expect(lowStockProduct.isAvailable()).toBe(true);
    });

    it('should return false for product created with zero stock', () => {
      const noStockProduct = new Product(
        'product-none',
        'No Stock Item',
        new Money(50000, 'COP'),
        0,
      );

      expect(noStockProduct.isAvailable()).toBe(false);
    });
  });

  describe('hasStock', () => {
    it('should return true when requested quantity is available', () => {
      expect(product.hasStock(5)).toBe(true);
    });

    it('should return true when requested quantity equals stock', () => {
      expect(product.hasStock(10)).toBe(true);
    });

    it('should return false when requested quantity exceeds stock', () => {
      expect(product.hasStock(11)).toBe(false);
    });

    it('should return true when requested quantity is zero', () => {
      expect(product.hasStock(0)).toBe(true);
    });

    it('should return false for any quantity when stock is zero', () => {
      product.decreaseStock(10);
      expect(product.hasStock(1)).toBe(false);
    });

    it('should handle large quantities', () => {
      expect(product.hasStock(1000)).toBe(false);
      expect(product.hasStock(10)).toBe(true);
    });
  });

  describe('decreaseStock', () => {
    it('should decrease stock by specified quantity', () => {
      product.decreaseStock(3);
      expect(product.getStock()).toBe(7);
    });

    it('should decrease stock to zero when all units are sold', () => {
      product.decreaseStock(10);
      expect(product.getStock()).toBe(0);
    });

    it('should allow multiple decreases', () => {
      product.decreaseStock(2);
      product.decreaseStock(3);
      product.decreaseStock(1);
      expect(product.getStock()).toBe(4);
    });

    it('should throw InsufficientStockException when quantity exceeds stock', () => {
      expect(() => {
        product.decreaseStock(11);
      }).toThrow(InsufficientStockException);
    });

    it('should throw InsufficientStockException with correct details', () => {
      try {
        product.decreaseStock(15);
        fail('Should have thrown InsufficientStockException');
      } catch (error) {
        expect(error).toBeInstanceOf(InsufficientStockException);
        expect((error as InsufficientStockException).code).toBe(
          'INSUFFICIENT_STOCK',
        );
      }
    });

    it('should throw error when trying to decrease from zero stock', () => {
      product.decreaseStock(10);
      expect(() => {
        product.decreaseStock(1);
      }).toThrow(InsufficientStockException);
    });

    it('should handle decreasing by 1', () => {
      product.decreaseStock(1);
      expect(product.getStock()).toBe(9);
    });
  });

  describe('increaseStock', () => {
    it('should increase stock by specified quantity', () => {
      product.increaseStock(5);
      expect(product.getStock()).toBe(15);
    });

    it('should allow multiple increases', () => {
      product.increaseStock(2);
      product.increaseStock(3);
      product.increaseStock(5);
      expect(product.getStock()).toBe(20);
    });

    it('should increase stock from zero', () => {
      product.decreaseStock(10);
      product.increaseStock(5);
      expect(product.getStock()).toBe(5);
    });

    it('should throw error when quantity is zero', () => {
      expect(() => {
        product.increaseStock(0);
      }).toThrow('Quantity must be positive');
    });

    it('should throw error when quantity is negative', () => {
      expect(() => {
        product.increaseStock(-5);
      }).toThrow('Quantity must be positive');
    });

    it('should handle large increases', () => {
      product.increaseStock(1000);
      expect(product.getStock()).toBe(1010);
    });

    it('should increase by 1', () => {
      product.increaseStock(1);
      expect(product.getStock()).toBe(11);
    });
  });

  describe('calculateTotalPrice', () => {
    it('should calculate total price for given quantity', () => {
      const totalPrice = product.calculateTotalPrice(2);
      expect(totalPrice.amount).toBe(5000000);
      expect(totalPrice.currency).toBe('COP');
    });

    it('should calculate total price for quantity of 1', () => {
      const totalPrice = product.calculateTotalPrice(1);
      expect(totalPrice.amount).toBe(2500000);
    });

    it('should calculate total price for large quantity', () => {
      const totalPrice = product.calculateTotalPrice(10);
      expect(totalPrice.amount).toBe(25000000);
    });

    it('should return Money instance', () => {
      const totalPrice = product.calculateTotalPrice(3);
      expect(totalPrice).toBeInstanceOf(Money);
    });

    it('should preserve currency', () => {
      const usdProduct = new Product(
        'product-usd',
        'International Product',
        new Money(100, 'USD'),
        5,
      );

      const totalPrice = usdProduct.calculateTotalPrice(3);
      expect(totalPrice.currency).toBe('USD');
    });

    it('should calculate correctly for decimal prices', () => {
      const decimalProduct = new Product(
        'product-decimal',
        'Decimal Product',
        new Money(99.99, 'COP'),
        10,
      );

      const totalPrice = decimalProduct.calculateTotalPrice(3);
      expect(totalPrice.amount).toBeCloseTo(299.97, 2);
    });

    it('should handle zero quantity', () => {
      const totalPrice = product.calculateTotalPrice(0);
      expect(totalPrice.amount).toBe(0);
    });

    it('should calculate for fractional quantity', () => {
      const totalPrice = product.calculateTotalPrice(0.5);
      expect(totalPrice.amount).toBe(1250000);
    });
  });

  describe('toJSON', () => {
    it('should serialize product with all fields', () => {
      const json = product.toJSON();

      expect(json).toEqual({
        id: testData.id,
        name: testData.name,
        price: testData.price.amount,
        category: testData.category,
        description: testData.description,
        stock: testData.stock,
        imageUrl: testData.imageUrl,
        createdAt: product.createdAt,
      });
    });

    it('should serialize product without optional fields', () => {
      const minimalProduct = new Product(
        'product-minimal',
        'Minimal Product',
        new Money(100000, 'COP'),
        5,
      );

      const json = minimalProduct.toJSON();

      expect(json).toEqual({
        id: 'product-minimal',
        name: 'Minimal Product',
        price: 100000,
        category: undefined,
        description: undefined,
        stock: 5,
        imageUrl: undefined,
        createdAt: minimalProduct.createdAt,
      });
    });

    it('should convert price to amount number', () => {
      const json = product.toJSON();
      expect(typeof json.price).toBe('number');
      expect(json.price).toBe(2500000);
    });

    it('should show current stock after modifications', () => {
      product.decreaseStock(3);
      product.increaseStock(5);

      const json = product.toJSON();
      expect(json.stock).toBe(12);
    });

    it('should include zero stock', () => {
      product.decreaseStock(10);
      const json = product.toJSON();
      expect(json.stock).toBe(0);
    });
  });

  describe('Stock operations integration', () => {
    it('should handle decrease and increase operations in sequence', () => {
      product.decreaseStock(5);
      expect(product.getStock()).toBe(5);

      product.increaseStock(10);
      expect(product.getStock()).toBe(15);

      product.decreaseStock(3);
      expect(product.getStock()).toBe(12);
    });

    it('should reflect availability after stock changes', () => {
      expect(product.isAvailable()).toBe(true);

      product.decreaseStock(10);
      expect(product.isAvailable()).toBe(false);

      product.increaseStock(5);
      expect(product.isAvailable()).toBe(true);
    });

    it('should update hasStock check after modifications', () => {
      expect(product.hasStock(10)).toBe(true);

      product.decreaseStock(5);
      expect(product.hasStock(10)).toBe(false);
      expect(product.hasStock(5)).toBe(true);

      product.increaseStock(10);
      expect(product.hasStock(10)).toBe(true);
      expect(product.hasStock(15)).toBe(true);
    });
  });

  describe('Edge cases', () => {
    it('should handle product with very long name', () => {
      const longName = 'A'.repeat(500);
      const longNameProduct = new Product(
        'product-long',
        longName,
        new Money(100000, 'COP'),
        5,
      );

      expect(longNameProduct.name).toBe(longName);
      expect(longNameProduct.name.length).toBe(500);
    });

    it('should handle product with special characters in name', () => {
      const specialProduct = new Product(
        'product-special',
        'Laptop HP™ 15.6" (2024) - €1,200 💻',
        new Money(100000, 'COP'),
        5,
      );

      expect(specialProduct.name).toBe('Laptop HP™ 15.6" (2024) - €1,200 💻');
    });

    it('should handle empty description', () => {
      const emptyDescProduct = new Product(
        'product-empty-desc',
        'Product',
        new Money(100000, 'COP'),
        5,
        'Category',
        '',
      );

      expect(emptyDescProduct.description).toBe('');
    });

    it('should handle very large stock numbers', () => {
      const largeStockProduct = new Product(
        'product-large',
        'Bulk Item',
        new Money(1000, 'COP'),
        1000000,
      );

      expect(largeStockProduct.getStock()).toBe(1000000);
      expect(largeStockProduct.hasStock(999999)).toBe(true);
    });

    it('should handle very small prices', () => {
      const cheapProduct = new Product(
        'product-cheap',
        'Cheap Item',
        new Money(0.01, 'COP'),
        100,
      );

      const totalPrice = cheapProduct.calculateTotalPrice(100);
      expect(totalPrice.amount).toBeCloseTo(1, 2);
    });

    it('should handle very large prices', () => {
      const expensiveProduct = new Product(
        'product-expensive',
        'Luxury Item',
        new Money(999999999, 'COP'),
        1,
      );

      expect(expensiveProduct.price.amount).toBe(999999999);
    });

    it('should handle products with URL containing query params', () => {
      const productWithComplexUrl = new Product(
        'product-url',
        'Product',
        new Money(100000, 'COP'),
        5,
        'Category',
        'Description',
        'https://example.com/image.jpg?size=large&format=webp&v=1.2.3',
      );

      expect(productWithComplexUrl.imageUrl).toBe(
        'https://example.com/image.jpg?size=large&format=webp&v=1.2.3',
      );
    });
  });

  describe('Immutability checks', () => {
    it('should not allow modifying readonly fields', () => {
      // TypeScript compile-time check - these would cause compilation errors:
      // product.id = 'new-id';
      // product.name = 'new-name';
      // product.price = new Money(1000, 'COP');
      // product.category = 'new-category';

      expect(product.id).toBe(testData.id);
      expect(product.name).toBe(testData.name);
      expect(product.price).toBe(testData.price);
      expect(product.category).toBe(testData.category);
    });

    it('should preserve original createdAt timestamp', () => {
      const originalCreatedAt = product.createdAt;

      product.decreaseStock(5);
      product.increaseStock(3);

      expect(product.createdAt).toBe(originalCreatedAt);
    });

    it('should not mutate price when calculating total', () => {
      const originalPrice = product.price.amount;

      product.calculateTotalPrice(10);
      product.calculateTotalPrice(100);

      expect(product.price.amount).toBe(originalPrice);
    });
  });

  describe('Business rules validation', () => {
    it('should enforce positive stock increase rule', () => {
      expect(() => product.increaseStock(0)).toThrow();
      expect(() => product.increaseStock(-1)).toThrow();
      expect(() => product.increaseStock(-100)).toThrow();
    });

    it('should enforce sufficient stock rule for decrease', () => {
      expect(() => product.decreaseStock(11)).toThrow(
        InsufficientStockException,
      );
      expect(() => product.decreaseStock(100)).toThrow(
        InsufficientStockException,
      );
    });

    it('should allow selling last unit', () => {
      const singleItemProduct = new Product(
        'product-single',
        'Last One',
        new Money(100000, 'COP'),
        1,
      );

      expect(() => singleItemProduct.decreaseStock(1)).not.toThrow();
      expect(singleItemProduct.getStock()).toBe(0);
      expect(singleItemProduct.isAvailable()).toBe(false);
    });

    it('should calculate price correctly regardless of stock', () => {
      product.decreaseStock(10);
      expect(product.getStock()).toBe(0);

      const totalPrice = product.calculateTotalPrice(5);
      expect(totalPrice.amount).toBe(12500000);
    });
  });
});
