import { IsString, IsNumber, IsEmail, Min, MaxLength } from 'class-validator';

/**
 * Create Order DTO
 * Request payload for creating a new order
 */
export class CreateOrderDto {
  @IsString()
  productId: string;

  @IsNumber()
  @Min(1)
  quantity: number;

  @IsString()
  @MaxLength(100)
  firstName: string;

  @IsString()
  @MaxLength(100)
  lastName: string;

  @IsString()
  @MaxLength(255)
  address: string;

  @IsString()
  @MaxLength(100)
  city: string;

  @IsString()
  @MaxLength(20)
  postalCode: string;

  @IsEmail()
  customerEmail: string;
}
