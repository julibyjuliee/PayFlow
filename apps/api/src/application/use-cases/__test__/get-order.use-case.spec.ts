import { Test, TestingModule } from '@nestjs/testing';
import { GetOrderUseCase } from '../get-order.use-case';
import { IOrderRepository } from '../../../domain/repositories';
import { Order } from '../../../domain/entities';
import { Result } from '../../../shared/result';
import { Money } from '../../../domain/value-objects/money';
import { TransactionStatusVO, TransactionStatus } from '../../../domain/value-objects/transaction-status';

describe('GetOrderUseCase', () => {
    let useCase: GetOrderUseCase;
    let orderRepository: jest.Mocked<IOrderRepository>;

    const mockOrder = new Order(
        'order-123',
        'product-456',
        2,
        new Money(100000, 'COP'),
        TransactionStatusVO.pending(),
        'John',
        'Doe',
        'Calle 123',
        'Bogotá',
        '110111',
        'john.doe@example.com',
    );

    beforeEach(async () => {
        // Create mock repository
        const mockOrderRepository: Partial<IOrderRepository> = {
            findById: jest.fn(),
        };

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                GetOrderUseCase,
                {
                    provide: 'IOrderRepository',
                    useValue: mockOrderRepository,
                },
            ],
        }).compile();

        useCase = module.get<GetOrderUseCase>(GetOrderUseCase);
        orderRepository = module.get('IOrderRepository');
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('execute', () => {
        it('should be defined', () => {
            expect(useCase).toBeDefined();
        });

        it('should return success result with order when order is found', async () => {
            const orderId = 'order-123';
            const successResult = Result.ok(mockOrder);
            orderRepository.findById.mockResolvedValue(successResult);

            const result = await useCase.execute(orderId);

            expect(orderRepository.findById).toHaveBeenCalledWith(orderId);
            expect(orderRepository.findById).toHaveBeenCalledTimes(1);
            expect(result.isSuccess()).toBe(true);
            expect(result.getValue()).toBe(mockOrder);
        });

        it('should return failure result when order is not found', async () => {
            const orderId = 'non-existent-order';
            const error = new Error('Order not found');
            const failureResult = Result.fail<Order, Error>(error);
            orderRepository.findById.mockResolvedValue(failureResult);

            const result = await useCase.execute(orderId);

            expect(orderRepository.findById).toHaveBeenCalledWith(orderId);
            expect(orderRepository.findById).toHaveBeenCalledTimes(1);
            expect(result.isFailure()).toBe(true);
            expect(result.getError()).toBe(error);
            expect(result.getError().message).toBe('Order not found');
        });

        it('should return failure result when repository throws error', async () => {
            const orderId = 'order-123';
            const error = new Error('Database connection error');
            const failureResult = Result.fail<Order, Error>(error);
            orderRepository.findById.mockResolvedValue(failureResult);

            const result = await useCase.execute(orderId);

            expect(orderRepository.findById).toHaveBeenCalledWith(orderId);
            expect(result.isFailure()).toBe(true);
            expect(result.getError().message).toBe('Database connection error');
        });

        it('should call repository with the correct order ID', async () => {
            const orderId = 'specific-order-id-999';
            const successResult = Result.ok(mockOrder);
            orderRepository.findById.mockResolvedValue(successResult);

            await useCase.execute(orderId);

            expect(orderRepository.findById).toHaveBeenCalledWith(orderId);
            expect(orderRepository.findById).toHaveBeenCalledWith('specific-order-id-999');
        });

        it('should return order with all its properties intact', async () => {
            const orderId = 'order-123';
            const successResult = Result.ok(mockOrder);
            orderRepository.findById.mockResolvedValue(successResult);

            const result = await useCase.execute(orderId);
            const order = result.getValue();

            expect(order.id).toBe('order-123');
            expect(order.productId).toBe('product-456');
            expect(order.quantity).toBe(2);
            expect(order.totalPrice.amount).toBe(100000);
            expect(order.totalPrice.currency).toBe('COP');
            expect(order.firstName).toBe('John');
            expect(order.lastName).toBe('Doe');
            expect(order.address).toBe('Calle 123');
            expect(order.city).toBe('Bogotá');
            expect(order.postalCode).toBe('110111');
            expect(order.customerEmail).toBe('john.doe@example.com');
            expect(order.getStatusValue()).toBe(TransactionStatus.PENDING);
        });

        it('should handle order with different statuses', async () => {
            const approvedOrder = new Order(
                'order-456',
                'product-789',
                1,
                new Money(50000, 'COP'),
                new TransactionStatusVO(TransactionStatus.APPROVED),
                'Jane',
                'Smith',
                'Carrera 45',
                'Medellín',
                '050001',
                'jane.smith@example.com',
                'wp-transaction-123',
                'wp-ref-123',
                'CARD',
            );

            const successResult = Result.ok(approvedOrder);
            orderRepository.findById.mockResolvedValue(successResult);

            const result = await useCase.execute('order-456');
            const order = result.getValue();

            expect(order.getStatusValue()).toBe(TransactionStatus.APPROVED);
            expect(order.wpTransactionId).toBe('wp-transaction-123');
            expect(order.wpReference).toBe('wp-ref-123');
            expect(order.paymentMethod).toBe('CARD');
        });

        it('should handle order with error status and error message', async () => {
            const errorOrder = new Order(
                'order-789',
                'product-999',
                3,
                new Money(150000, 'COP'),
                new TransactionStatusVO(TransactionStatus.ERROR),
                'Bob',
                'Johnson',
                'Avenida 100',
                'Cali',
                '760001',
                'bob.johnson@example.com',
                undefined,
                undefined,
                undefined,
                'Payment processing failed',
            );

            const successResult = Result.ok(errorOrder);
            orderRepository.findById.mockResolvedValue(successResult);

            const result = await useCase.execute('order-789');
            const order = result.getValue();

            expect(order.getStatusValue()).toBe(TransactionStatus.ERROR);
            expect(order.errorMessage).toBe('Payment processing failed');
        });

        it('should handle empty string order ID', async () => {
            const orderId = '';
            const error = new Error('Invalid order ID');
            const failureResult = Result.fail<Order, Error>(error);
            orderRepository.findById.mockResolvedValue(failureResult);

            const result = await useCase.execute(orderId);

            expect(orderRepository.findById).toHaveBeenCalledWith('');
            expect(result.isFailure()).toBe(true);
        });

        it('should handle special characters in order ID', async () => {
            const orderId = 'order-123-special-!@#$%';
            const successResult = Result.ok(mockOrder);
            orderRepository.findById.mockResolvedValue(successResult);

            await useCase.execute(orderId);

            expect(orderRepository.findById).toHaveBeenCalledWith(orderId);
        });
    });

    describe('Integration scenarios', () => {
        it('should work in a typical successful retrieval flow', async () => {
            // Arrange: Setup repository to return a valid order
            const orderId = 'order-integration-test';
            const order = new Order(
                orderId,
                'product-integration',
                5,
                new Money(250000, 'COP'),
                TransactionStatusVO.pending(),
                'Alice',
                'Wonder',
                'Test Street 123',
                'Test City',
                '123456',
                'alice@test.com',
            );
            orderRepository.findById.mockResolvedValue(Result.ok(order));

            // Act: Execute the use case
            const result = await useCase.execute(orderId);

            // Assert: Verify the result
            expect(result.isSuccess()).toBe(true);
            expect(result.getValue().id).toBe(orderId);
            expect(result.getValue().customerEmail).toBe('alice@test.com');
        });

        it('should work in a typical failure flow', async () => {
            // Arrange: Setup repository to return error
            const orderId = 'non-existent';
            const error = new Error(`Order with id ${orderId} not found`);
            orderRepository.findById.mockResolvedValue(Result.fail(error));

            // Act: Execute the use case
            const result = await useCase.execute(orderId);

            // Assert: Verify the error
            expect(result.isFailure()).toBe(true);
            expect(result.getError().message).toContain('not found');
        });
    });

    describe('Dependency injection', () => {
        it('should inject IOrderRepository correctly', () => {
            expect(orderRepository).toBeDefined();
            expect(orderRepository.findById).toBeDefined();
        });

        it('should use the injected repository instance', async () => {
            const orderId = 'test-injection';
            orderRepository.findById.mockResolvedValue(Result.ok(mockOrder));

            await useCase.execute(orderId);

            expect(orderRepository.findById).toHaveBeenCalled();
        });
    });
});
