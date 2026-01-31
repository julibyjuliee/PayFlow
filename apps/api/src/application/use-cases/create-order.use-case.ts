import { Injectable, Inject } from '@nestjs/common';
import type {
  IProductRepository,
  IOrderRepository,
} from '../../domain/repositories';
import { Order } from '../../domain/entities';
import { Result } from '../../shared/result';
import { v4 as uuidv4 } from 'uuid';

/**
 * Create Order Use Case
 */
@Injectable()
export class CreateOrderUseCase {
  constructor(
    @Inject('IProductRepository')
    private readonly productRepository: IProductRepository,
    @Inject('IOrderRepository')
    private readonly orderRepository: IOrderRepository,
  ) { }

  async execute(input: {
    productId: string;
    quantity: number;
    shippingAddress: {
      firstName: string;
      lastName: string;
      address: string;
      city: string;
      postalCode: string;
    };
    customerEmail: string;
  }): Promise<Result<Order, Error>> {
    const productResult = await this.productRepository.findById(
      input.productId,
    );
    if (productResult.isFailure()) {
      return Result.fail(productResult.getError());
    }

    const product = productResult.getValue();

    if (!product.hasStock(input.quantity)) {
      return Result.fail(
        new Error(
          `Insufficient stock. Available: ${product.getStock()}, Requested: ${input.quantity}`,
        ),
      );
    }

    const totalAmount = product.calculateTotalPrice(input.quantity);

    const orderId = uuidv4();
    const order = Order.create(
      orderId,
      input.productId,
      input.quantity,
      totalAmount,
      input.shippingAddress,
      input.customerEmail,
    );

    return this.orderRepository.save(order);
  }
}
