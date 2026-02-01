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
  CreateTransactionUseCase,
  GetTransactionUseCase,
  ProcessPaymentUseCase,
} from '../../application/use-cases';
import {
  CreateTransactionDto,
  ProcessPaymentDto,
  TransactionDto,
} from '../../application/dtos';

/**
 * Transactions Controller
 * Maneja el ciclo de vida de las transacciones y pagos con WP
 */
@Controller('transactions')
export class TransactionsController {
  constructor(
    private readonly createTransactionUseCase: CreateTransactionUseCase,
    private readonly getTransactionUseCase: GetTransactionUseCase,
    private readonly processPaymentUseCase: ProcessPaymentUseCase,
  ) { }


  @Post()
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  async createTransaction(
    @Body() createTransactionDto: CreateTransactionDto,
  ): Promise<TransactionDto> {
    const result = await this.createTransactionUseCase.execute({
      productId: createTransactionDto.productId,
      quantity: createTransactionDto.quantity,
      customerEmail: createTransactionDto.customerEmail,
      firstName: createTransactionDto.firstName,
      lastName: createTransactionDto.lastName,
      address: createTransactionDto.address,
      city: createTransactionDto.city,
      postalCode: createTransactionDto.postalCode,
    });

    if (result.isFailure()) {
      throw new HttpException(
        result.getError().message,
        HttpStatus.BAD_REQUEST,
      );
    }

    const transaction = result.getValue();

    if (createTransactionDto.paymentToken) {

      const paymentResult = await this.processPaymentUseCase.execute({
        transactionId: transaction.id,
        paymentMethod: {
          type: 'CARD',
          token: createTransactionDto.paymentToken,
        },
      });

      if (paymentResult.isFailure()) {

        const updatedTransactionResult = await this.getTransactionUseCase.execute(transaction.id);

        if (updatedTransactionResult.isSuccess()) {
          return updatedTransactionResult.getValue().toJSON();
        }

        throw new HttpException(
          paymentResult.getError().message,
          HttpStatus.BAD_REQUEST,
        );
      }

      return paymentResult.getValue().toJSON();
    }

    return transaction.toJSON();
  }

  @Get(':id')
  async getTransaction(@Param('id') id: string): Promise<TransactionDto> {
    const result = await this.getTransactionUseCase.execute(id);

    if (result.isFailure()) {
      throw new HttpException(
        result.getError().message,
        HttpStatus.NOT_FOUND,
      );
    }

    return result.getValue().toJSON();
  }

  @Post('webhook')
  async handleWpWebhook(@Body() payload: any): Promise<{ status: string }> {

    try {
      if (!payload.event || !payload.data?.transaction) {
        return { status: 'ignored' };
      }

      const transaction = payload.data.transaction;
      const reference = transaction.reference;
      const wpStatus = transaction.status;

      const orderResult = await this.getTransactionUseCase.execute(reference);

      if (orderResult.isFailure()) {
        return { status: 'order_not_found' };
      }

      const order = orderResult.getValue();

      if (wpStatus === 'APPROVED' && order.isPending()) {

        const processResult = await this.processPaymentUseCase.execute({
          transactionId: reference,
          paymentMethod: {
            type: 'CARD',
            token: transaction.payment_method?.token,
          },
        });

        if (processResult.isSuccess()) {
          return { status: 'processed' };
        }
      }

      return { status: 'ignored' };
    } catch (error) {
      console.error('❌ Error procesando webhook:', error);
      return { status: 'error' };
    }
  }

  @Post('process-payment')
  @UsePipes(new ValidationPipe({ transform: true }))
  async processPayment(
    @Body() processPaymentDto: ProcessPaymentDto,
  ): Promise<TransactionDto> {
    const result = await this.processPaymentUseCase.execute({
      transactionId: (processPaymentDto as any).transactionId || processPaymentDto.orderId,
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