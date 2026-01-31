import { ProductMapper } from '../product.mapper';
import { Product } from '../../../../domain/entities';
import { Money } from '../../../../domain/value-objects';
import { ProductEntity } from '../../entities/product.entity';

describe('ProductMapper', () => {
  describe('toDomain', () => {
    it('should convert ProductEntity to Product with all required fields', () => {
      const productEntity = new ProductEntity();
      productEntity.id = 'product-123';
      productEntity.name = 'Laptop HP';
      productEntity.price = 2500000;
      productEntity.stock = 10;
      productEntity.createdAt = new Date('2024-01-01');

      const domainProduct = ProductMapper.toDomain(productEntity);

      expect(domainProduct).toBeInstanceOf(Product);
      expect(domainProduct.id).toBe('product-123');
      expect(domainProduct.name).toBe('Laptop HP');
      expect(domainProduct.price).toBeInstanceOf(Money);
      expect(domainProduct.price.amount).toBe(2500000);
      expect(domainProduct.price.currency).toBe('COP');
      expect(domainProduct.getStock()).toBe(10);
      expect(domainProduct.createdAt).toEqual(new Date('2024-01-01'));
    });

    it('should convert ProductEntity to Product with all optional fields', () => {
      const productEntity = new ProductEntity();
      productEntity.id = 'product-456';
      productEntity.name = 'Mouse Logitech';
      productEntity.price = 50000;
      productEntity.stock = 25;
      productEntity.category = 'Electronics';
      productEntity.description = 'Wireless mouse with ergonomic design';
      productEntity.imageUrl = 'https://example.com/mouse.jpg';
      productEntity.createdAt = new Date('2024-02-15');

      const domainProduct = ProductMapper.toDomain(productEntity);

      expect(domainProduct.category).toBe('Electronics');
      expect(domainProduct.description).toBe('Wireless mouse with ergonomic design');
      expect(domainProduct.imageUrl).toBe('https://example.com/mouse.jpg');
    });

    it('should handle undefined optional fields', () => {
      const productEntity = new ProductEntity();
      productEntity.id = 'product-789';
      productEntity.name = 'Keyboard';
      productEntity.price = 80000;
      productEntity.stock = 15;
      productEntity.category = undefined;
      productEntity.description = undefined;
      productEntity.imageUrl = undefined;
      productEntity.createdAt = new Date();

      const domainProduct = ProductMapper.toDomain(productEntity);

      expect(domainProduct.category).toBeUndefined();
      expect(domainProduct.description).toBeUndefined();
      expect(domainProduct.imageUrl).toBeUndefined();
    });

    it('should handle undefined optional fields', () => {
      const productEntity = new ProductEntity();
      productEntity.id = 'product-null';
      productEntity.name = 'Test Product';
      productEntity.price = 10000;
      productEntity.stock = 5;
      productEntity.category = undefined;
      productEntity.description = undefined;
      productEntity.imageUrl = '';
      productEntity.createdAt = new Date();

      const domainProduct = ProductMapper.toDomain(productEntity);

      expect(domainProduct.category).toBeUndefined();
      expect(domainProduct.description).toBeUndefined();
      expect(domainProduct.imageUrl).toBe("");
    });

    it('should convert price to Money object with COP currency', () => {
      const productEntity = new ProductEntity();
      productEntity.id = 'product-money';
      productEntity.name = 'Product';
      productEntity.price = 150000.5;
      productEntity.stock = 10;
      productEntity.createdAt = new Date();

      const domainProduct = ProductMapper.toDomain(productEntity);

      expect(domainProduct.price).toBeInstanceOf(Money);
      expect(domainProduct.price.amount).toBe(150000.5);
      expect(domainProduct.price.currency).toBe('COP');
    });

    it('should handle zero stock', () => {
      const productEntity = new ProductEntity();
      productEntity.id = 'product-zero';
      productEntity.name = 'Out of Stock';
      productEntity.price = 50000;
      productEntity.stock = 0;
      productEntity.createdAt = new Date();

      const domainProduct = ProductMapper.toDomain(productEntity);

      expect(domainProduct.getStock()).toBe(0);
    });

    it('should handle large stock numbers', () => {
      const productEntity = new ProductEntity();
      productEntity.id = 'product-large';
      productEntity.name = 'Bulk Item';
      productEntity.price = 1000;
      productEntity.stock = 999999;
      productEntity.createdAt = new Date();

      const domainProduct = ProductMapper.toDomain(productEntity);

      expect(domainProduct.getStock()).toBe(999999);
    });

    it('should handle decimal prices', () => {
      const productEntity = new ProductEntity();
      productEntity.id = 'product-decimal';
      productEntity.name = 'Decimal Price Product';
      productEntity.price = 99.99;
      productEntity.stock = 10;
      productEntity.createdAt = new Date();

      const domainProduct = ProductMapper.toDomain(productEntity);

      expect(domainProduct.price.amount).toBe(99.99);
    });

    it('should preserve timestamp', () => {
      const testDate = new Date('2024-03-20T10:30:00Z');
      const productEntity = new ProductEntity();
      productEntity.id = 'product-date';
      productEntity.name = 'Product';
      productEntity.price = 10000;
      productEntity.stock = 5;
      productEntity.createdAt = testDate;

      const domainProduct = ProductMapper.toDomain(productEntity);

      expect(domainProduct.createdAt).toEqual(testDate);
    });

    it('should handle special characters in name and description', () => {
      const productEntity = new ProductEntity();
      productEntity.id = 'product-special';
      productEntity.name = 'Laptop HP™ 15.6" (2024)';
      productEntity.price = 2000000;
      productEntity.stock = 5;
      productEntity.description = "High-performance laptop with 16GB RAM & 512GB SSD";
      productEntity.createdAt = new Date();

      const domainProduct = ProductMapper.toDomain(productEntity);

      expect(domainProduct.name).toBe('Laptop HP™ 15.6" (2024)');
      expect(domainProduct.description).toBe("High-performance laptop with 16GB RAM & 512GB SSD");
    });
  });

  describe('toEntity', () => {
    it('should convert Product to ProductEntity with all required fields', () => {
      const domainProduct = new Product(
        'product-123',
        'Monitor Samsung',
        new Money(800000, 'COP'),
        15,
      );

      const productEntity = ProductMapper.toEntity(domainProduct);

      expect(productEntity).toBeInstanceOf(ProductEntity);
      expect(productEntity.id).toBe('product-123');
      expect(productEntity.name).toBe('Monitor Samsung');
      expect(productEntity.price).toBe(800000);
      expect(productEntity.stock).toBe(15);
    });

    it('should convert Product to ProductEntity with all optional fields', () => {
      const domainProduct = new Product(
        'product-456',
        'Mouse Logitech',
        new Money(50000, 'COP'),
        25,
        'Peripherals',
        'Wireless mouse',
        'https://example.com/mouse.jpg',
      );

      const productEntity = ProductMapper.toEntity(domainProduct);

      expect(productEntity.category).toBe('Peripherals');
      expect(productEntity.description).toBe('Wireless mouse');
      expect(productEntity.imageUrl).toBe('https://example.com/mouse.jpg');
    });

    it('should extract amount from Money object', () => {
      const domainProduct = new Product(
        'product-money',
        'Product',
        new Money(123456.78, 'COP'),
        10,
      );

      const productEntity = ProductMapper.toEntity(domainProduct);

      expect(productEntity.price).toBe(123456.78);
      expect(typeof productEntity.price).toBe('number');
    });

    it('should get stock using getStock method', () => {
      const domainProduct = new Product(
        'product-stock',
        'Product',
        new Money(10000, 'COP'),
        42,
      );

      const productEntity = ProductMapper.toEntity(domainProduct);

      expect(productEntity.stock).toBe(42);
    });

    it('should handle undefined optional fields', () => {
      const domainProduct = new Product(
        'product-minimal',
        'Minimal Product',
        new Money(5000, 'COP'),
        3,
        undefined,
        undefined,
        undefined,
      );

      const productEntity = ProductMapper.toEntity(domainProduct);

      expect(productEntity.category).toBeUndefined();
      expect(productEntity.description).toBeUndefined();
      expect(productEntity.imageUrl).toBeUndefined();
    });

    it('should preserve createdAt timestamp', () => {
      const testDate = new Date('2024-04-10T14:20:00Z');
      const domainProduct = new Product(
        'product-date',
        'Product',
        new Money(10000, 'COP'),
        5,
        undefined,
        undefined,
        undefined,
        testDate,
      );

      const productEntity = ProductMapper.toEntity(domainProduct);

      expect(productEntity.createdAt).toEqual(testDate);
    });

    it('should handle zero stock', () => {
      const domainProduct = new Product(
        'product-zero',
        'No Stock',
        new Money(10000, 'COP'),
        0,
      );

      const productEntity = ProductMapper.toEntity(domainProduct);

      expect(productEntity.stock).toBe(0);
    });

    it('should handle large stock values', () => {
      const domainProduct = new Product(
        'product-bulk',
        'Bulk Item',
        new Money(100, 'COP'),
        1000000,
      );

      const productEntity = ProductMapper.toEntity(domainProduct);

      expect(productEntity.stock).toBe(1000000);
    });

    it('should handle very long product names', () => {
      const longName = 'A'.repeat(500);
      const domainProduct = new Product(
        'product-long',
        longName,
        new Money(10000, 'COP'),
        5,
      );

      const productEntity = ProductMapper.toEntity(domainProduct);

      expect(productEntity.name).toBe(longName);
      expect(productEntity.name.length).toBe(500);
    });

    it('should handle complex image URLs', () => {
      const complexUrl = 'https://cdn.example.com/products/images/laptop-hp-2024.jpg?v=1.2.3&size=large&format=webp';
      const domainProduct = new Product(
        'product-url',
        'Product',
        new Money(10000, 'COP'),
        5,
        'Electronics',
        'Description',
        complexUrl,
      );

      const productEntity = ProductMapper.toEntity(domainProduct);

      expect(productEntity.imageUrl).toBe(complexUrl);
    });
  });

  describe('Bidirectional mapping', () => {
    it('should maintain data integrity when converting domain -> entity -> domain', () => {
      const originalProduct = new Product(
        'product-123',
        'Laptop Dell',
        new Money(3500000, 'COP'),
        8,
        'Computers',
        'High-performance laptop for professionals',
        'https://example.com/dell-laptop.jpg',
        new Date('2024-05-01T09:00:00Z'),
      );

      const entity = ProductMapper.toEntity(originalProduct);
      const convertedProduct = ProductMapper.toDomain(entity);

      expect(convertedProduct.id).toBe(originalProduct.id);
      expect(convertedProduct.name).toBe(originalProduct.name);
      expect(convertedProduct.price.amount).toBe(originalProduct.price.amount);
      expect(convertedProduct.price.currency).toBe(originalProduct.price.currency);
      expect(convertedProduct.getStock()).toBe(originalProduct.getStock());
      expect(convertedProduct.category).toBe(originalProduct.category);
      expect(convertedProduct.description).toBe(originalProduct.description);
      expect(convertedProduct.imageUrl).toBe(originalProduct.imageUrl);
      expect(convertedProduct.createdAt).toEqual(originalProduct.createdAt);
    });

    it('should maintain data integrity when converting entity -> domain -> entity', () => {
      const originalEntity = new ProductEntity();
      originalEntity.id = 'product-456';
      originalEntity.name = 'Mouse Razer';
      originalEntity.price = 150000;
      originalEntity.stock = 20;
      originalEntity.category = 'Gaming';
      originalEntity.description = 'RGB gaming mouse';
      originalEntity.imageUrl = 'https://example.com/razer-mouse.jpg';
      originalEntity.createdAt = new Date('2024-06-10T16:45:00Z');

      const domain = ProductMapper.toDomain(originalEntity);
      const convertedEntity = ProductMapper.toEntity(domain);

      expect(convertedEntity.id).toBe(originalEntity.id);
      expect(convertedEntity.name).toBe(originalEntity.name);
      expect(convertedEntity.price).toBe(originalEntity.price);
      expect(convertedEntity.stock).toBe(originalEntity.stock);
      expect(convertedEntity.category).toBe(originalEntity.category);
      expect(convertedEntity.description).toBe(originalEntity.description);
      expect(convertedEntity.imageUrl).toBe(originalEntity.imageUrl);
      expect(convertedEntity.createdAt).toEqual(originalEntity.createdAt);
    });

    it('should handle minimal product in bidirectional conversion', () => {
      const minimalProduct = new Product(
        'product-minimal',
        'Basic Product',
        new Money(1000, 'COP'),
        1,
      );

      const entity = ProductMapper.toEntity(minimalProduct);
      const convertedProduct = ProductMapper.toDomain(entity);

      expect(convertedProduct.id).toBe(minimalProduct.id);
      expect(convertedProduct.name).toBe(minimalProduct.name);
      expect(convertedProduct.price.amount).toBe(minimalProduct.price.amount);
      expect(convertedProduct.getStock()).toBe(minimalProduct.getStock());
    });

    it('should preserve decimal precision in bidirectional conversion', () => {
      const productEntity = new ProductEntity();
      productEntity.id = 'product-decimal';
      productEntity.name = 'Decimal Test';
      productEntity.price = 12345.67;
      productEntity.stock = 10;
      productEntity.createdAt = new Date();

      const domain = ProductMapper.toDomain(productEntity);
      const backToEntity = ProductMapper.toEntity(domain);

      expect(backToEntity.price).toBe(12345.67);
    });
  });

  describe('Edge cases', () => {
    it('should handle empty strings in optional fields', () => {
      const productEntity = new ProductEntity();
      productEntity.id = 'product-empty';
      productEntity.name = 'Product';
      productEntity.price = 10000;
      productEntity.stock = 5;
      productEntity.category = '';
      productEntity.description = '';
      productEntity.imageUrl = '';
      productEntity.createdAt = new Date();

      const domainProduct = ProductMapper.toDomain(productEntity);

      expect(domainProduct.category).toBe('');
      expect(domainProduct.description).toBe('');
      expect(domainProduct.imageUrl).toBe('');
    });

    it('should handle very small prices', () => {
      const productEntity = new ProductEntity();
      productEntity.id = 'product-cheap';
      productEntity.name = 'Cheap Item';
      productEntity.price = 0.01;
      productEntity.stock = 100;
      productEntity.createdAt = new Date();

      const domainProduct = ProductMapper.toDomain(productEntity);
      const backToEntity = ProductMapper.toEntity(domainProduct);

      expect(backToEntity.price).toBe(0.01);
    });

    it('should handle very large prices', () => {
      const productEntity = new ProductEntity();
      productEntity.id = 'product-expensive';
      productEntity.name = 'Luxury Item';
      productEntity.price = 999999999.99;
      productEntity.stock = 1;
      productEntity.createdAt = new Date();

      const domainProduct = ProductMapper.toDomain(productEntity);
      const backToEntity = ProductMapper.toEntity(domainProduct);

      expect(backToEntity.price).toBe(999999999.99);
    });

    it('should handle Unicode characters in text fields', () => {
      const productEntity = new ProductEntity();
      productEntity.id = 'product-unicode';
      productEntity.name = '商品名稱 🎮💻📱';
      productEntity.price = 50000;
      productEntity.stock = 5;
      productEntity.description = 'Descripción en español con ñ, á, é, í, ó, ú';
      productEntity.category = 'Categoría';
      productEntity.createdAt = new Date();

      const domainProduct = ProductMapper.toDomain(productEntity);
      const backToEntity = ProductMapper.toEntity(domainProduct);

      expect(backToEntity.name).toBe('商品名稱 🎮💻📱');
      expect(backToEntity.description).toBe('Descripción en español con ñ, á, é, í, ó, ú');
      expect(backToEntity.category).toBe('Categoría');
    });

    it('should handle stock after increase operations', () => {
      const domainProduct = new Product(
        'product-stock-ops',
        'Product',
        new Money(10000, 'COP'),
        10,
      );

      domainProduct.increaseStock(5);
      const entity = ProductMapper.toEntity(domainProduct);

      expect(entity.stock).toBe(15);
    });

    it('should handle stock after decrease operations', () => {
      const domainProduct = new Product(
        'product-stock-ops2',
        'Product',
        new Money(10000, 'COP'),
        20,
      );

      domainProduct.decreaseStock(7);
      const entity = ProductMapper.toEntity(domainProduct);

      expect(entity.stock).toBe(13);
    });

    it('should handle URL with special characters', () => {
      const urlWithParams = 'https://example.com/image.jpg?id=123&category=electronics&discount=20%';
      const domainProduct = new Product(
        'product-url-params',
        'Product',
        new Money(10000, 'COP'),
        5,
        'Electronics',
        'Description',
        urlWithParams,
      );

      const entity = ProductMapper.toEntity(domainProduct);
      const backToDomain = ProductMapper.toDomain(entity);

      expect(backToDomain.imageUrl).toBe(urlWithParams);
    });
  });

  describe('Type conversions', () => {
    it('should convert numeric price to Money', () => {
      const productEntity = new ProductEntity();
      productEntity.id = 'product-conv1';
      productEntity.name = 'Product';
      productEntity.price = 100000;
      productEntity.stock = 10;
      productEntity.createdAt = new Date();

      const domainProduct = ProductMapper.toDomain(productEntity);

      expect(typeof productEntity.price).toBe('number');
      expect(domainProduct.price).toBeInstanceOf(Money);
      expect(domainProduct.price.amount).toBe(100000);
      expect(domainProduct.price.currency).toBe('COP');
    });

    it('should convert Money to numeric price', () => {
      const domainProduct = new Product(
        'product-conv2',
        'Product',
        new Money(250000, 'COP'),
        15,
      );

      const productEntity = ProductMapper.toEntity(domainProduct);

      expect(domainProduct.price).toBeInstanceOf(Money);
      expect(typeof productEntity.price).toBe('number');
      expect(productEntity.price).toBe(250000);
    });

    it('should always use COP currency when converting to domain', () => {
      const productEntity = new ProductEntity();
      productEntity.id = 'product-currency';
      productEntity.name = 'Product';
      productEntity.price = 50000;
      productEntity.stock = 5;
      productEntity.createdAt = new Date();

      const domainProduct = ProductMapper.toDomain(productEntity);

      expect(domainProduct.price.currency).toBe('COP');
    });

    it('should handle Money with non-COP currency in domain to entity conversion', () => {
      // Even though domain has USD, entity just stores the amount
      const domainProduct = new Product(
        'product-usd',
        'Product',
        new Money(100, 'USD'),
        5,
      );

      const productEntity = ProductMapper.toEntity(domainProduct);

      expect(productEntity.price).toBe(100);
      // Currency info is lost in entity (DB only stores number)
    });

    it('should preserve stock value type', () => {
      const productEntity = new ProductEntity();
      productEntity.id = 'product-stock-type';
      productEntity.name = 'Product';
      productEntity.price = 10000;
      productEntity.stock = 42;
      productEntity.createdAt = new Date();

      const domainProduct = ProductMapper.toDomain(productEntity);
      const backToEntity = ProductMapper.toEntity(domainProduct);

      expect(typeof productEntity.stock).toBe('number');
      expect(typeof domainProduct.getStock()).toBe('number');
      expect(typeof backToEntity.stock).toBe('number');
      expect(backToEntity.stock).toBe(42);
    });
  });

  describe('Integration scenarios', () => {
    it('should map complete product lifecycle', () => {
      // Create from entity (load from DB)
      const entityFromDB = new ProductEntity();
      entityFromDB.id = 'product-lifecycle';
      entityFromDB.name = 'Gaming Laptop';
      entityFromDB.price = 4500000;
      entityFromDB.stock = 5;
      entityFromDB.category = 'Gaming';
      entityFromDB.description = 'High-end gaming laptop';
      entityFromDB.imageUrl = 'https://example.com/gaming-laptop.jpg';
      entityFromDB.createdAt = new Date('2024-01-01');

      // Convert to domain
      const domainProduct = ProductMapper.toDomain(entityFromDB);

      // Perform domain operations
      domainProduct.decreaseStock(2);

      // Convert back to entity (save to DB)
      const entityToSave = ProductMapper.toEntity(domainProduct);

      expect(entityToSave.id).toBe('product-lifecycle');
      expect(entityToSave.stock).toBe(3); // 5 - 2
      expect(entityToSave.name).toBe('Gaming Laptop');
      expect(entityToSave.price).toBe(4500000);
    });

    it('should handle product with all fields populated', () => {
      const fullProduct = new Product(
        'product-full',
        'Complete Product',
        new Money(199999.99, 'COP'),
        100,
        'Full Category',
        'This is a complete product with all fields populated including a very long description that spans multiple lines and contains all sorts of information about the product',
        'https://cdn.example.com/products/complete-product-image.jpg?version=2024&quality=high&format=webp',
        new Date('2024-07-15T12:00:00Z'),
      );

      const entity = ProductMapper.toEntity(fullProduct);
      const convertedProduct = ProductMapper.toDomain(entity);

      expect(convertedProduct.id).toBe(fullProduct.id);
      expect(convertedProduct.name).toBe(fullProduct.name);
      expect(convertedProduct.price.amount).toBe(fullProduct.price.amount);
      expect(convertedProduct.getStock()).toBe(fullProduct.getStock());
      expect(convertedProduct.category).toBe(fullProduct.category);
      expect(convertedProduct.description).toBe(fullProduct.description);
      expect(convertedProduct.imageUrl).toBe(fullProduct.imageUrl);
      expect(convertedProduct.createdAt).toEqual(fullProduct.createdAt);
    });
  });
});
