import {
  IsString,
  IsOptional,
  IsNumber,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

/**
 * Payment Method DTO
 */
export class PaymentMethodDto {
  @IsString()
  type: string;

  @IsOptional()
  @IsString()
  token?: string;

  @IsOptional()
  @IsNumber()
  installments?: number;
}

/**
 * Process Payment DTO
 * Request payload for processing a payment
 */
export class ProcessPaymentDto {
  @IsString()
  orderId: string;

  @ValidateNested()
  @Type(() => PaymentMethodDto)
  paymentMethod: PaymentMethodDto;
}
