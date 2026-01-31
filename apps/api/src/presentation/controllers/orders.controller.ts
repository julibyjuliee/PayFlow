import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  HttpException,
  HttpStatus,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import {
  CreateOrderUseCase,
  GetOrderUseCase,
  ProcessOrderPaymentUseCase,
} from '../../application/use-cases';
import {
  CreateOrderDto,
  ProcessPaymentDto,
  OrderDto,
} from '../../application/dtos';

/**
 * Orders Controller
 * Handles order and payment-related HTTP requests
 */
@Controller('orders')
export class OrdersController {
  constructor(
    private readonly createOrderUseCase: CreateOrderUseCase,
    private readonly getOrderUseCase: GetOrderUseCase,
    private readonly processOrderPaymentUseCase: ProcessOrderPaymentUseCase,
  ) { }

  @Post()
  @UsePipes(new ValidationPipe({ transform: true }))
  async createOrder(@Body() createOrderDto: CreateOrderDto): Promise<OrderDto> {
    const result = await this.createOrderUseCase.execute({
      productId: createOrderDto.productId,
      quantity: createOrderDto.quantity,
      shippingAddress: {
        firstName: createOrderDto.firstName,
        lastName: createOrderDto.lastName,
        address: createOrderDto.address,
        city: createOrderDto.city,
        postalCode: createOrderDto.postalCode,
      },
      customerEmail: createOrderDto.customerEmail,
    });

    if (result.isFailure()) {
      throw new HttpException(
        result.getError().message,
        HttpStatus.BAD_REQUEST,
      );
    }

    return result.getValue().toJSON();
  }

  @Get(':id')
  async getOrder(@Param('id') id: string): Promise<OrderDto> {
    const result = await this.getOrderUseCase.execute(id);

    if (result.isFailure()) {
      throw new HttpException(
        result.getError().message,
        HttpStatus.NOT_FOUND,
      );
    }

    return result.getValue().toJSON();
  }

  @Post('process-payment')
  @UsePipes(new ValidationPipe({ transform: true }))
  async processPayment(
    @Body() processPaymentDto: ProcessPaymentDto,
  ): Promise<OrderDto> {
    const result = await this.processOrderPaymentUseCase.execute({
      orderId: processPaymentDto.orderId,
      paymentMethod: processPaymentDto.paymentMethod,
    });

    if (result.isFailure()) {
      throw new HttpException(
        result.getError().message,
        HttpStatus.BAD_REQUEST,
      );
    }

    return result.getValue().toJSON();
  }
}
