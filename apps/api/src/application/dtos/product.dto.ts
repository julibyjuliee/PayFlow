/**
 * Product Response DTO
 */
export class ProductDto {
  id: string;
  name: string;
  price: number;
  category?: string;
  description?: string;
  stock: number;
  imageUrl?: string;
  createdAt: Date;
}
