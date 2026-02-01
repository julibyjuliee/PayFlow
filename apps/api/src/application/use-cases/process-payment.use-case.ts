import { Injectable, Inject } from '@nestjs/common';
import type {
  IProductRepository,
  ITransactionRepository,
  IPaymentGateway,
} from '../../domain/repositories';
import { Transaction } from '../../domain/entities';
import { Result } from '../../shared/result';
import { TransactionStatus } from '../../domain/value-objects';

/**
 * Process Payment Use Case
 * Processes payment through WP and updates transaction status
 * Following Railway Oriented Programming pattern
 */
@Injectable()
export class ProcessPaymentUseCase {
  constructor(
    @Inject('ITransactionRepository')
    private readonly transactionRepository: ITransactionRepository,
    @Inject('IProductRepository')
    private readonly productRepository: IProductRepository,
    @Inject('IPaymentGateway')
    private readonly paymentGateway: IPaymentGateway,
  ) { }

  async execute(input: {
    transactionId: string;
    paymentMethod: {
      type: string;
      token?: string;
      installments?: number;
    };
  }): Promise<Result<Transaction, Error>> {
    const transactionResult =
      await this.transactionRepository.findById(input.transactionId);

    if (transactionResult.isFailure()) {
      return Result.fail(transactionResult.getError());
    }

    const transaction = transactionResult.getValue();

    if (!transaction.isPending()) {
      return Result.fail(
        new Error(
          `Transaction ${input.transactionId} is not in PENDING state`,
        ),
      );
    }

    const paymentResult = await this.paymentGateway.processPayment({
      amount: transaction.amount.amount,
      currency: transaction.amount.currency,
      customerEmail: transaction.customerEmail,
      reference: transaction.id,
      paymentMethod: input.paymentMethod,
    });

    if (paymentResult.isFailure()) {
      transaction.markAsError(paymentResult.getError().message);
      await this.transactionRepository.update(transaction);
      return Result.fail(paymentResult.getError());
    }

    const paymentResponse = paymentResult.getValue();

    if (paymentResponse.status === 'APPROVED' || paymentResponse.status === 'PENDING') {
      return await this.handleApprovedPayment(transaction, paymentResponse);
    } else if (paymentResponse.status === 'DECLINED') {
      transaction.decline('Payment was declined by WP');
      await this.transactionRepository.update(transaction);
      return Result.ok(transaction);
    } else {
      transaction.updateStatus(TransactionStatus.PENDING, {
        transactionId: paymentResponse.id,
        reference: paymentResponse.reference,
      });
      await this.transactionRepository.update(transaction);
      return Result.ok(transaction);
    }
  }

  private async handleApprovedPayment(
    transaction: Transaction,
    paymentResponse: any,
  ): Promise<Result<Transaction, Error>> {
    const productResult = await this.productRepository.findById(
      transaction.productId,
    );

    if (productResult.isFailure()) {
      transaction.markAsError('Product not found after payment approval');
      await this.transactionRepository.update(transaction);
      return Result.fail(productResult.getError());
    }

    const product = productResult.getValue();

    try {
      product.decreaseStock(transaction.quantity);
    } catch (error) {
      transaction.markAsError('Insufficient stock for transaction');
      await this.transactionRepository.update(transaction);
      return Result.fail(error as Error);
    }

    const updateProductResult = await this.productRepository.update(product);
    if (updateProductResult.isFailure()) {
      transaction.markAsError(
        'Failed to update product stock in database',
      );
      await this.transactionRepository.update(transaction);
      return Result.fail(updateProductResult.getError());
    }

    transaction.approve(paymentResponse.id, paymentResponse.reference);
    const updateResult = await this.transactionRepository.update(transaction);

    return updateResult;
  }
}
