import { Product } from '../../../domain/entities';
import { Money } from '../../../domain/value-objects';
import { ProductEntity } from '../entities/product.entity';

/**
 * Product Mapper
 * Converts between domain Product and database ProductEntity
 */
export class ProductMapper {
  public static toDomain(entity: ProductEntity): Product {
    return new Product(
      entity.id,
      entity.name,
      new Money(entity.price, 'COP'),
      entity.stock,
      entity.category,
      entity.description,
      entity.imageUrl,
      entity.createdAt,
    );
  }

  public static toEntity(domain: Product): ProductEntity {
    const entity = new ProductEntity();
    entity.id = domain.id;
    entity.name = domain.name;
    entity.price = domain.price.amount;
    entity.category = domain.category;
    entity.description = domain.description;
    entity.stock = domain.getStock();
    entity.imageUrl = domain.imageUrl;
    entity.createdAt = domain.createdAt;
    return entity;
  }
}
