// src/transactions/dto/create-transaction.dto.ts
import { IsString, IsNumber, IsEmail, IsOptional } from 'class-validator';

export class CreateTransactionDto {
  @IsString()
  productId: string;

  @IsNumber()
  quantity: number;

  @IsEmail()
  customerEmail: string;

  @IsString()
  firstName: string;

  @IsString()
  lastName: string;

  @IsString()
  address: string;

  @IsString()
  city: string;

  @IsString()
  postalCode: string;

  // Token de pago de Wompi (opcional)
  // Si se proporciona, el pago se procesará automáticamente
  @IsOptional()
  @IsString()
  paymentToken?: string;
}