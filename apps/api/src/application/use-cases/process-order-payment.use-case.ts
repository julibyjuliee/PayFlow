import { Injectable, Inject } from '@nestjs/common';
import type {
  IProductRepository,
  IOrderRepository,
  IPaymentGateway,
} from '../../domain/repositories';
import { Order } from '../../domain/entities';
import { Result } from '../../shared/result';

/**
 * Process Order Payment Use Case
 * Processes payment through Wompi and updates order status
 * Following Railway Oriented Programming pattern
 */
@Injectable()
export class ProcessOrderPaymentUseCase {
  constructor(
    @Inject('IOrderRepository')
    private readonly orderRepository: IOrderRepository,
    @Inject('IProductRepository')
    private readonly productRepository: IProductRepository,
    @Inject('IPaymentGateway')
    private readonly paymentGateway: IPaymentGateway,
  ) { }

  async execute(input: {
    orderId: string;
    paymentMethod: { type: string; token?: string };
  }): Promise<Result<Order, Error>> {
    const orderResult = await this.orderRepository.findById(input.orderId);
    if (orderResult.isFailure()) {
      return Result.fail(orderResult.getError());
    }

    const order = orderResult.getValue();

    if (!order.isPending()) {
      return Result.fail(new Error('Order is not in PENDING state'));
    }

    const paymentResult = await this.paymentGateway.processPayment({
      amount: order.totalPrice.amount,
      currency: order.totalPrice.currency,
      customerEmail: order.customerEmail,
      reference: order.id,
      paymentMethod: input.paymentMethod,
    });

    if (paymentResult.isFailure()) {
      order.markAsError(paymentResult.getError().message);
      await this.orderRepository.update(order);
      return Result.fail(paymentResult.getError());
    }

    const paymentResponse = paymentResult.getValue();

    if (paymentResponse.status === 'APPROVED' || paymentResponse.status === 'PENDING') {
      return await this.handleApprovedPayment(order, paymentResponse);
    } else if (paymentResponse.status === 'DECLINED') {
      order.decline('Payment was declined by Wompi');
      await this.orderRepository.update(order);
      return Result.ok(order);
    }

    return Result.ok(order);
  }

  private async handleApprovedPayment(
    order: Order,
    paymentResponse: any,
  ): Promise<Result<Order, Error>> {
    const productResult = await this.productRepository.findById(
      order.productId,
    );
    if (productResult.isFailure()) {
      return Result.fail(productResult.getError());
    }

    const product = productResult.getValue();

    try {
      product.decreaseStock(order.quantity);
    } catch (error) {
      order.markAsError('Insufficient stock for order');
      await this.orderRepository.update(order);
      return Result.fail(error as Error);
    }

    const updateProductResult = await this.productRepository.update(product);
    if (updateProductResult.isFailure()) {
      order.markAsError('Failed to update product stock in database');
      await this.orderRepository.update(order);
      return Result.fail(updateProductResult.getError());
    }

    order.approve(paymentResponse.id, paymentResponse.reference);
    return this.orderRepository.update(order);
  }
}
