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


  @IsOptional()
  @IsString()
  paymentToken?: string;
}