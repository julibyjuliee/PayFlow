import { Injectable, Inject } from '@nestjs/common';
import type {
  IProductRepository,
  ITransactionRepository,
} from '../../domain/repositories';
import { Transaction } from '../../domain/entities';
import { Result } from '../../shared/result';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class CreateTransactionUseCase {
  constructor(
    @Inject('IProductRepository')
    private readonly productRepository: IProductRepository,
    @Inject('ITransactionRepository')
    private readonly transactionRepository: ITransactionRepository,
  ) { }

  async execute(input: {
    productId: string;
    quantity: number;
    customerEmail: string;
    firstName: string;
    lastName: string;
    address: string;
    city: string;
    postalCode: string;
  }): Promise<Result<Transaction, Error>> {
    const productResult = await this.productRepository.findById(input.productId);
    if (productResult.isFailure()) {
      return Result.fail(productResult.getError());
    }

    const product = productResult.getValue();

    if (!product.hasStock(input.quantity)) {
      return Result.fail(
        new Error(`Insufficient stock. Available: ${product.getStock()}, Requested: ${input.quantity}`)
      );
    }

    const totalAmount = product.calculateTotalPrice(input.quantity);

    const transaction = Transaction.create({
      id: uuidv4(),
      productId: input.productId,
      quantity: input.quantity,
      amount: totalAmount,
      customerEmail: input.customerEmail,
      firstName: input.firstName,
      lastName: input.lastName,
      address: input.address,
      city: input.city,
      postalCode: input.postalCode,
    });

    return this.transactionRepository.save(transaction);
  }
}