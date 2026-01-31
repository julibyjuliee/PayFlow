import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { databaseConfig } from './config/database.config';
import { ProductEntity, OrderEntity } from './infrastructure/database/entities';
import {
  ProductRepository,
  TransactionRepository,
  OrderRepository,
} from './infrastructure/database/repositories';
import { WompiClient } from './infrastructure/wompi';
import {
  GetProductsUseCase,
  GetProductByIdUseCase,
  CreateTransactionUseCase,
  ProcessPaymentUseCase,
  GetTransactionUseCase,
  CreateOrderUseCase,
  ProcessOrderPaymentUseCase,
  GetOrderUseCase,
} from './application/use-cases';
import {
  ProductsController,
  TransactionsController,
  OrdersController,
} from './presentation/controllers';

const productRepositoryProvider = {
  provide: 'IProductRepository',
  useClass: ProductRepository,
};

const transactionRepositoryProvider = {
  provide: 'ITransactionRepository',
  useClass: TransactionRepository,
};

const orderRepositoryProvider = {
  provide: 'IOrderRepository',
  useClass: OrderRepository,
};

const paymentGatewayProvider = {
  provide: 'IPaymentGateway',
  useClass: WompiClient,
};

@Module({
  imports: [
    ConfigModule.forRoot(),
    TypeOrmModule.forRoot(databaseConfig()),
    TypeOrmModule.forFeature([ProductEntity, OrderEntity]),
  ],
  controllers: [ProductsController, TransactionsController, OrdersController],
  providers: [
    // Repositories
    productRepositoryProvider,
    transactionRepositoryProvider,
    orderRepositoryProvider,
    paymentGatewayProvider,
    ProductRepository,
    TransactionRepository,
    OrderRepository,
    WompiClient,

    // Use Cases
    GetProductsUseCase,
    GetProductByIdUseCase,
    CreateTransactionUseCase,
    ProcessPaymentUseCase,
    GetTransactionUseCase,
    CreateOrderUseCase,
    ProcessOrderPaymentUseCase,
    GetOrderUseCase,
  ],
})
export class AppModule {}
