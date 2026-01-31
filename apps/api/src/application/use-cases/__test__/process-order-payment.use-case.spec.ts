import { ProcessOrderPaymentUseCase } from '../process-order-payment.use-case';
import type {
    IOrderRepository,
    IProductRepository,
    IPaymentGateway,
} from '../../../domain/repositories';
import { Order, Product } from '../../../domain/entities';
import { Money } from '../../../domain/value-objects';
import { Result } from '../../../shared/result';

describe('ProcessOrderPaymentUseCase', () => {
    let useCase: ProcessOrderPaymentUseCase;
    let orderRepository: jest.Mocked<IOrderRepository>;
    let productRepository: jest.Mocked<IProductRepository>;
    let paymentGateway: jest.Mocked<IPaymentGateway>;

    const createMockProduct = () =>
        new Product(
            'product-123',
            'Test Product',
            new Money(100000, 'COP'),
            10,
            'Electronics',
        );

    const createMockOrder = () =>
        Order.create(
            'order-123',
            'product-123',
            2,
            new Money(200000, 'COP'),
            {
                firstName: 'John',
                lastName: 'Doe',
                address: '123 Main St',
                city: 'Bogotá',
                postalCode: '110111',
            },
            'john@example.com',
        );

    const mockPaymentInput = {
        orderId: 'order-123',
        paymentMethod: { type: 'CARD', token: 'tok_test_12345' },
    };

    const mockApprovedPaymentResponse = {
        id: 'wompi-trans-123',
        reference: 'ref-123',
        status: 'APPROVED',
        amount: 200000,
        currency: 'COP',
        paymentMethod: 'CARD',
        createdAt: new Date(),
    };

    beforeEach(() => {
        orderRepository = {
            findById: jest.fn(),
            save: jest.fn(),
            update: jest.fn(),
        } as any;

        productRepository = {
            findById: jest.fn(),
            findAll: jest.fn(),
            save: jest.fn(),
            update: jest.fn(),
            delete: jest.fn(),
            updateStock: jest.fn(),
        } as any;

        paymentGateway = {
            processPayment: jest.fn(),
            getTransactionStatus: jest.fn(),
        } as any;

        useCase = new ProcessOrderPaymentUseCase(
            orderRepository,
            productRepository,
            paymentGateway,
        );
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('constructor', () => {
        it('should create ProcessOrderPaymentUseCase instance', () => {
            expect(useCase).toBeDefined();
            expect(useCase).toBeInstanceOf(ProcessOrderPaymentUseCase);
        });

        it('should inject all dependencies', () => {
            expect(useCase['orderRepository']).toBe(orderRepository);
            expect(useCase['productRepository']).toBe(productRepository);
            expect(useCase['paymentGateway']).toBe(paymentGateway);
        });
    });

    describe('execute - Order Validation', () => {
        it('should fail when order is not found', async () => {
            const error = new Error('Order not found');
            orderRepository.findById.mockResolvedValue(Result.fail(error));

            const result = await useCase.execute(mockPaymentInput);

            expect(result.isFailure()).toBe(true);
            expect(result.getError().message).toBe('Order not found');
            expect(orderRepository.findById).toHaveBeenCalledWith('order-123');
            expect(paymentGateway.processPayment).not.toHaveBeenCalled();
        });

        it('should fail when order is not in PENDING state', async () => {
            const approvedOrder = Order.create(
                'order-123',
                'product-123',
                2,
                new Money(200000, 'COP'),
                {
                    firstName: 'John',
                    lastName: 'Doe',
                    address: '123 Main St',
                    city: 'Bogotá',
                    postalCode: '110111',
                },
                'john@example.com',
            );
            approvedOrder.approve('wompi-old', 'ref-old');

            orderRepository.findById.mockResolvedValue(Result.ok(approvedOrder));

            const result = await useCase.execute(mockPaymentInput);

            expect(result.isFailure()).toBe(true);
            expect(result.getError().message).toBe('Order is not in PENDING state');
            expect(paymentGateway.processPayment).not.toHaveBeenCalled();
        });

        it('should process payment for pending order', async () => {
            const mockOrder = createMockOrder();
            const mockProduct = createMockProduct();

            orderRepository.findById.mockResolvedValue(Result.ok(mockOrder));
            paymentGateway.processPayment.mockResolvedValue(
                Result.ok(mockApprovedPaymentResponse),
            );
            productRepository.findById.mockResolvedValue(Result.ok(mockProduct));
            productRepository.update.mockResolvedValue(Result.ok(mockProduct));
            orderRepository.update.mockResolvedValue(Result.ok(mockOrder));

            const result = await useCase.execute(mockPaymentInput);

            expect(result.isSuccess()).toBe(true);
            expect(orderRepository.findById).toHaveBeenCalledWith('order-123');
            expect(paymentGateway.processPayment).toHaveBeenCalled();
        });
    });

    describe('execute - Payment Processing', () => {
        it('should process approved payment successfully', async () => {
            const mockOrder = createMockOrder();
            const mockProduct = createMockProduct();

            orderRepository.findById.mockResolvedValue(Result.ok(mockOrder));
            paymentGateway.processPayment.mockResolvedValue(
                Result.ok(mockApprovedPaymentResponse),
            );
            productRepository.findById.mockResolvedValue(Result.ok(mockProduct));
            productRepository.update.mockResolvedValue(Result.ok(mockProduct));
            orderRepository.update.mockResolvedValue(Result.ok(mockOrder));

            const result = await useCase.execute(mockPaymentInput);

            expect(result.isSuccess()).toBe(true);
            expect(paymentGateway.processPayment).toHaveBeenCalledWith({
                amount: 200000,
                currency: 'COP',
                customerEmail: 'john@example.com',
                reference: 'order-123',
                paymentMethod: { type: 'CARD', token: 'tok_test_12345' },
            });
        });

        it('should approve order and decrease stock on approved payment', async () => {
            const testProduct = new Product(
                'product-123',
                'Test Product',
                new Money(100000, 'COP'),
                10,
                'Electronics',
            );
            const testOrder = createMockOrder();

            orderRepository.findById.mockResolvedValue(Result.ok(testOrder));
            paymentGateway.processPayment.mockResolvedValue(
                Result.ok(mockApprovedPaymentResponse),
            );
            productRepository.findById.mockResolvedValue(Result.ok(testProduct));
            productRepository.update.mockResolvedValue(Result.ok(testProduct));
            orderRepository.update.mockResolvedValue(Result.ok(testOrder));

            const result = await useCase.execute(mockPaymentInput);

            expect(result.isSuccess()).toBe(true);
            expect(testProduct.getStock()).toBe(8); // 10 - 2
            expect(productRepository.update).toHaveBeenCalledWith(testProduct);
            expect(orderRepository.update).toHaveBeenCalled();
        });

        it('should handle declined payment', async () => {
            const mockOrder = createMockOrder();

            const declinedResponse = {
                id: 'wompi-trans-declined',
                reference: 'ref-declined',
                status: 'DECLINED',
                amount: 200000,
                currency: 'COP',
                paymentMethod: 'CARD',
                createdAt: new Date(),
            };

            orderRepository.findById.mockResolvedValue(Result.ok(mockOrder));
            paymentGateway.processPayment.mockResolvedValue(
                Result.ok(declinedResponse),
            );
            orderRepository.update.mockResolvedValue(Result.ok(mockOrder));

            const result = await useCase.execute(mockPaymentInput);

            expect(result.isSuccess()).toBe(true);
            const order = result.getValue();
            expect(order.errorMessage).toBe('Payment was declined by Wompi');
            expect(orderRepository.update).toHaveBeenCalled();
            expect(productRepository.findById).not.toHaveBeenCalled();
        });

        it('should handle pending payment status', async () => {
            const mockOrder = createMockOrder();
            const mockProduct = createMockProduct();

            const pendingResponse = {
                id: 'wompi-trans-pending',
                reference: 'ref-pending',
                status: 'PENDING',
                amount: 200000,
                currency: 'COP',
                // Campos obligatorios faltantes:
                paymentMethod: 'CARD',
                createdAt: new Date(),
            };

            orderRepository.findById.mockResolvedValue(Result.ok(mockOrder));
            paymentGateway.processPayment.mockResolvedValue(
                Result.ok(pendingResponse),
            );
            productRepository.findById.mockResolvedValue(Result.ok(mockProduct));
            productRepository.update.mockResolvedValue(Result.ok(mockProduct));
            orderRepository.update.mockResolvedValue(Result.ok(mockOrder));

            const result = await useCase.execute(mockPaymentInput);

            expect(result.isSuccess()).toBe(true);
            expect(productRepository.findById).toHaveBeenCalled();
        });

        it('should mark order as error when payment gateway fails', async () => {
            const mockOrder = createMockOrder();

            const paymentError = new Error('Payment gateway timeout');
            orderRepository.findById.mockResolvedValue(Result.ok(mockOrder));
            paymentGateway.processPayment.mockResolvedValue(
                Result.fail(paymentError),
            );
            orderRepository.update.mockResolvedValue(Result.ok(mockOrder));

            const result = await useCase.execute(mockPaymentInput);

            expect(result.isFailure()).toBe(true);
            expect(result.getError().message).toBe('Payment gateway timeout');
            expect(orderRepository.update).toHaveBeenCalled();
        });
    });

    describe('execute - Stock Management', () => {
        it('should fail when product is not found during approval', async () => {
            const mockOrder = createMockOrder();

            const productError = new Error('Product not found');
            orderRepository.findById.mockResolvedValue(Result.ok(mockOrder));
            paymentGateway.processPayment.mockResolvedValue(
                Result.ok(mockApprovedPaymentResponse),
            );
            productRepository.findById.mockResolvedValue(Result.fail(productError));

            const result = await useCase.execute(mockPaymentInput);

            expect(result.isFailure()).toBe(true);
            expect(result.getError().message).toBe('Product not found');
        });

        it('should fail when product has insufficient stock', async () => {
            const mockOrder = createMockOrder();

            const lowStockProduct = new Product(
                'product-123',
                'Test Product',
                new Money(100000, 'COP'),
                1, // Only 1 in stock, but order needs 2
                'Electronics',
            );

            orderRepository.findById.mockResolvedValue(Result.ok(mockOrder));
            paymentGateway.processPayment.mockResolvedValue(
                Result.ok(mockApprovedPaymentResponse),
            );
            productRepository.findById.mockResolvedValue(Result.ok(lowStockProduct));
            orderRepository.update.mockResolvedValue(Result.ok(mockOrder));

            const result = await useCase.execute(mockPaymentInput);

            expect(result.isFailure()).toBe(true);
            expect(orderRepository.update).toHaveBeenCalled();
            expect(mockOrder.errorMessage).toContain('Insufficient stock');
        });

        it('should fail when product update fails', async () => {
            const mockOrder = createMockOrder();

            const updateError = new Error('Database error');
            const testProduct = new Product(
                'product-123',
                'Test Product',
                new Money(100000, 'COP'),
                10,
                'Electronics',
            );

            orderRepository.findById.mockResolvedValue(Result.ok(mockOrder));
            paymentGateway.processPayment.mockResolvedValue(
                Result.ok(mockApprovedPaymentResponse),
            );
            productRepository.findById.mockResolvedValue(Result.ok(testProduct));
            productRepository.update.mockResolvedValue(Result.fail(updateError));
            orderRepository.update.mockResolvedValue(Result.ok(mockOrder));

            const result = await useCase.execute(mockPaymentInput);

            expect(result.isFailure()).toBe(true);
            expect(result.getError().message).toBe('Database error');
            expect(orderRepository.update).toHaveBeenCalled();
        });

        it('should correctly decrease stock for multiple quantities', async () => {
            const testProduct = new Product(
                'product-123',
                'Test Product',
                new Money(100000, 'COP'),
                50,
                'Electronics',
            );

            const largeOrder = Order.create(
                'order-large',
                'product-123',
                25,
                new Money(2500000, 'COP'),
                {
                    firstName: 'John',
                    lastName: 'Doe',
                    address: '123 Main St',
                    city: 'Bogotá',
                    postalCode: '110111',
                },
                'john@example.com',
            );

            orderRepository.findById.mockResolvedValue(Result.ok(largeOrder));
            paymentGateway.processPayment.mockResolvedValue(
                Result.ok(mockApprovedPaymentResponse),
            );
            productRepository.findById.mockResolvedValue(Result.ok(testProduct));
            productRepository.update.mockResolvedValue(Result.ok(testProduct));
            orderRepository.update.mockResolvedValue(Result.ok(largeOrder));

            const result = await useCase.execute({
                orderId: 'order-large',
                paymentMethod: { type: 'CARD', token: 'tok_test' },
            });

            expect(result.isSuccess()).toBe(true);
            expect(testProduct.getStock()).toBe(25); // 50 - 25
        });
    });

    describe('execute - Different Payment Methods', () => {
        it('should process payment with CARD method', async () => {
            const mockOrder = createMockOrder();
            const mockProduct = createMockProduct();

            orderRepository.findById.mockResolvedValue(Result.ok(mockOrder));
            paymentGateway.processPayment.mockResolvedValue(
                Result.ok(mockApprovedPaymentResponse),
            );
            productRepository.findById.mockResolvedValue(Result.ok(mockProduct));
            productRepository.update.mockResolvedValue(Result.ok(mockProduct));
            orderRepository.update.mockResolvedValue(Result.ok(mockOrder));

            const result = await useCase.execute({
                orderId: 'order-123',
                paymentMethod: { type: 'CARD', token: 'tok_card_12345' },
            });

            expect(result.isSuccess()).toBe(true);
            expect(paymentGateway.processPayment).toHaveBeenCalledWith(
                expect.objectContaining({
                    paymentMethod: { type: 'CARD', token: 'tok_card_12345' },
                }),
            );
        });

        it('should process payment with NEQUI method', async () => {
            const mockOrder = createMockOrder();
            const mockProduct = createMockProduct();

            orderRepository.findById.mockResolvedValue(Result.ok(mockOrder));
            paymentGateway.processPayment.mockResolvedValue(
                Result.ok(mockApprovedPaymentResponse),
            );
            productRepository.findById.mockResolvedValue(Result.ok(mockProduct));
            productRepository.update.mockResolvedValue(Result.ok(mockProduct));
            orderRepository.update.mockResolvedValue(Result.ok(mockOrder));

            const result = await useCase.execute({
                orderId: 'order-123',
                paymentMethod: { type: 'NEQUI' },
            });

            expect(result.isSuccess()).toBe(true);
            expect(paymentGateway.processPayment).toHaveBeenCalledWith(
                expect.objectContaining({
                    paymentMethod: { type: 'NEQUI' },
                }),
            );
        });

        it('should process payment with BANCOLOMBIA_TRANSFER method', async () => {
            const mockOrder = createMockOrder();
            const mockProduct = createMockProduct();

            orderRepository.findById.mockResolvedValue(Result.ok(mockOrder));
            paymentGateway.processPayment.mockResolvedValue(
                Result.ok(mockApprovedPaymentResponse),
            );
            productRepository.findById.mockResolvedValue(Result.ok(mockProduct));
            productRepository.update.mockResolvedValue(Result.ok(mockProduct));
            orderRepository.update.mockResolvedValue(Result.ok(mockOrder));

            const result = await useCase.execute({
                orderId: 'order-123',
                paymentMethod: { type: 'BANCOLOMBIA_TRANSFER' },
            });

            expect(result.isSuccess()).toBe(true);
            expect(paymentGateway.processPayment).toHaveBeenCalledWith(
                expect.objectContaining({
                    paymentMethod: { type: 'BANCOLOMBIA_TRANSFER' },
                }),
            );
        });
    });

    describe('execute - Different Currencies', () => {
        it('should process payment in COP', async () => {
            const mockOrder = createMockOrder();
            const mockProduct = createMockProduct();

            orderRepository.findById.mockResolvedValue(Result.ok(mockOrder));
            paymentGateway.processPayment.mockResolvedValue(
                Result.ok(mockApprovedPaymentResponse),
            );
            productRepository.findById.mockResolvedValue(Result.ok(mockProduct));
            productRepository.update.mockResolvedValue(Result.ok(mockProduct));
            orderRepository.update.mockResolvedValue(Result.ok(mockOrder));

            const result = await useCase.execute(mockPaymentInput);

            expect(result.isSuccess()).toBe(true);
            expect(paymentGateway.processPayment).toHaveBeenCalledWith(
                expect.objectContaining({
                    currency: 'COP',
                }),
            );
        });

        it('should process payment in USD', async () => {
            const usdOrder = Order.create(
                'order-usd',
                'product-123',
                2,
                new Money(100, 'USD'),
                {
                    firstName: 'John',
                    lastName: 'Doe',
                    address: '123 Main St',
                    city: 'Bogotá',
                    postalCode: '110111',
                },
                'john@example.com',
            );

            const usdProduct = new Product(
                'product-123',
                'Test Product',
                new Money(50, 'USD'),
                10,
                'Electronics',
            );

            orderRepository.findById.mockResolvedValue(Result.ok(usdOrder));
            paymentGateway.processPayment.mockResolvedValue(
                Result.ok({ ...mockApprovedPaymentResponse, currency: 'USD' }),
            );
            productRepository.findById.mockResolvedValue(Result.ok(usdProduct));
            productRepository.update.mockResolvedValue(Result.ok(usdProduct));
            orderRepository.update.mockResolvedValue(Result.ok(usdOrder));

            const result = await useCase.execute({
                orderId: 'order-usd',
                paymentMethod: { type: 'CARD', token: 'tok_test' },
            });

            expect(result.isSuccess()).toBe(true);
            expect(paymentGateway.processPayment).toHaveBeenCalledWith(
                expect.objectContaining({
                    currency: 'USD',
                    amount: 100,
                }),
            );
        });
    });

    describe('execute - Edge Cases', () => {
        it('should handle order with special characters in customer data', async () => {
            const specialOrder = Order.create(
                'order-special',
                'product-123',
                2,
                new Money(200000, 'COP'),
                {
                    firstName: 'José María',
                    lastName: "O'Connor-García",
                    address: 'Calle #123-45 Apto. 8º',
                    city: 'Bogotá D.C.',
                    postalCode: '110111',
                },
                'josé.maría@example.com',
            );

            const mockProduct = createMockProduct();

            orderRepository.findById.mockResolvedValue(Result.ok(specialOrder));
            paymentGateway.processPayment.mockResolvedValue(
                Result.ok(mockApprovedPaymentResponse),
            );
            productRepository.findById.mockResolvedValue(Result.ok(mockProduct));
            productRepository.update.mockResolvedValue(Result.ok(mockProduct));
            orderRepository.update.mockResolvedValue(Result.ok(specialOrder));

            const result = await useCase.execute({
                orderId: 'order-special',
                paymentMethod: { type: 'CARD', token: 'tok_test' },
            });

            expect(result.isSuccess()).toBe(true);
            expect(paymentGateway.processPayment).toHaveBeenCalledWith(
                expect.objectContaining({
                    customerEmail: 'josé.maría@example.com',
                }),
            );
        });

        it('should handle large amounts', async () => {
            const expensiveOrder = Order.create(
                'order-expensive',
                'product-luxury',
                1,
                new Money(500000000, 'COP'), // 500 millones
                {
                    firstName: 'John',
                    lastName: 'Doe',
                    address: '123 Main St',
                    city: 'Bogotá',
                    postalCode: '110111',
                },
                'john@example.com',
            );

            const expensiveProduct = new Product(
                'product-luxury',
                'Luxury Item',
                new Money(500000000, 'COP'),
                5,
                'Luxury',
            );

            orderRepository.findById.mockResolvedValue(Result.ok(expensiveOrder));
            paymentGateway.processPayment.mockResolvedValue(
                Result.ok({ ...mockApprovedPaymentResponse, amount: 500000000 }),
            );
            productRepository.findById.mockResolvedValue(Result.ok(expensiveProduct));
            productRepository.update.mockResolvedValue(Result.ok(expensiveProduct));
            orderRepository.update.mockResolvedValue(Result.ok(expensiveOrder));

            const result = await useCase.execute({
                orderId: 'order-expensive',
                paymentMethod: { type: 'CARD', token: 'tok_test' },
            });

            expect(result.isSuccess()).toBe(true);
            expect(paymentGateway.processPayment).toHaveBeenCalledWith(
                expect.objectContaining({
                    amount: 500000000,
                }),
            );
        });

        it('should handle minimum amount', async () => {
            const minOrder = Order.create(
                'order-min',
                'product-cheap',
                1,
                new Money(1, 'COP'),
                {
                    firstName: 'John',
                    lastName: 'Doe',
                    address: '123 Main St',
                    city: 'Bogotá',
                    postalCode: '110111',
                },
                'john@example.com',
            );

            const cheapProduct = new Product(
                'product-cheap',
                'Cheap Item',
                new Money(1, 'COP'),
                100,
                'Budget',
            );

            orderRepository.findById.mockResolvedValue(Result.ok(minOrder));
            paymentGateway.processPayment.mockResolvedValue(
                Result.ok({ ...mockApprovedPaymentResponse, amount: 1 }),
            );
            productRepository.findById.mockResolvedValue(Result.ok(cheapProduct));
            productRepository.update.mockResolvedValue(Result.ok(cheapProduct));
            orderRepository.update.mockResolvedValue(Result.ok(minOrder));

            const result = await useCase.execute({
                orderId: 'order-min',
                paymentMethod: { type: 'CARD', token: 'tok_test' },
            });

            expect(result.isSuccess()).toBe(true);
        });

        it('should handle order with single unit depleting stock', async () => {
            const lastUnitProduct = new Product(
                'product-last',
                'Last Unit',
                new Money(100000, 'COP'),
                1,
                'Limited',
            );

            const singleUnitOrder = Order.create(
                'order-last',
                'product-last',
                1,
                new Money(100000, 'COP'),
                {
                    firstName: 'John',
                    lastName: 'Doe',
                    address: '123 Main St',
                    city: 'Bogotá',
                    postalCode: '110111',
                },
                'john@example.com',
            );

            orderRepository.findById.mockResolvedValue(Result.ok(singleUnitOrder));
            paymentGateway.processPayment.mockResolvedValue(
                Result.ok(mockApprovedPaymentResponse),
            );
            productRepository.findById.mockResolvedValue(Result.ok(lastUnitProduct));
            productRepository.update.mockResolvedValue(Result.ok(lastUnitProduct));
            orderRepository.update.mockResolvedValue(Result.ok(singleUnitOrder));

            const result = await useCase.execute({
                orderId: 'order-last',
                paymentMethod: { type: 'CARD', token: 'tok_test' },
            });

            expect(result.isSuccess()).toBe(true);
            expect(lastUnitProduct.getStock()).toBe(0);
            expect(lastUnitProduct.isAvailable()).toBe(false);
        });
    });

    describe('Integration', () => {
        it('should complete full payment flow successfully', async () => {
            const testProduct = new Product(
                'product-123',
                'Test Product',
                new Money(100000, 'COP'),
                10,
                'Electronics',
            );

            const testOrder = Order.create(
                'order-123',
                'product-123',
                2,
                new Money(200000, 'COP'),
                {
                    firstName: 'John',
                    lastName: 'Doe',
                    address: '123 Main St',
                    city: 'Bogotá',
                    postalCode: '110111',
                },
                'john@example.com',
            );

            orderRepository.findById.mockResolvedValue(Result.ok(testOrder));
            paymentGateway.processPayment.mockResolvedValue(
                Result.ok(mockApprovedPaymentResponse),
            );
            productRepository.findById.mockResolvedValue(Result.ok(testProduct));
            productRepository.update.mockResolvedValue(Result.ok(testProduct));
            orderRepository.update.mockResolvedValue(Result.ok(testOrder));

            const result = await useCase.execute(mockPaymentInput);

            expect(result.isSuccess()).toBe(true);

            // Verify complete flow
            expect(orderRepository.findById).toHaveBeenCalledWith('order-123');
            expect(paymentGateway.processPayment).toHaveBeenCalled();
            expect(productRepository.findById).toHaveBeenCalledWith('product-123');
            expect(testProduct.getStock()).toBe(8);
            expect(productRepository.update).toHaveBeenCalledWith(testProduct);
            expect(orderRepository.update).toHaveBeenCalled();
        });

        it('should maintain transactional integrity on failures', async () => {
            const testProduct = new Product(
                'product-123',
                'Test Product',
                new Money(100000, 'COP'),
                1, // Insufficient stock
                'Electronics',
            );

            const testOrder = createMockOrder();

            orderRepository.findById.mockResolvedValue(Result.ok(testOrder));
            paymentGateway.processPayment.mockResolvedValue(
                Result.ok(mockApprovedPaymentResponse),
            );
            productRepository.findById.mockResolvedValue(Result.ok(testProduct));
            orderRepository.update.mockResolvedValue(Result.ok(testOrder));

            const result = await useCase.execute(mockPaymentInput);

            expect(result.isFailure()).toBe(true);

            // Product stock should remain unchanged
            expect(testProduct.getStock()).toBe(1);

            // Order should be marked as error
            expect(orderRepository.update).toHaveBeenCalled();
            expect(testOrder.errorMessage).toContain('Insufficient stock');
        });
    });

    describe('Performance', () => {
        it('should handle multiple sequential payment processes', async () => {
            const testProduct = new Product(
                'product-123',
                'Test Product',
                new Money(100000, 'COP'),
                100,
                'Electronics',
            );

            for (let i = 0; i < 5; i++) {
                const order = Order.create(
                    `order-${i}`,
                    'product-123',
                    1,
                    new Money(100000, 'COP'),
                    {
                        firstName: 'John',
                        lastName: 'Doe',
                        address: '123 Main St',
                        city: 'Bogotá',
                        postalCode: '110111',
                    },
                    'john@example.com',
                );

                orderRepository.findById.mockResolvedValue(Result.ok(order));
                paymentGateway.processPayment.mockResolvedValue(
                    Result.ok(mockApprovedPaymentResponse),
                );
                productRepository.findById.mockResolvedValue(Result.ok(testProduct));
                productRepository.update.mockResolvedValue(Result.ok(testProduct));
                orderRepository.update.mockResolvedValue(Result.ok(order));

                const result = await useCase.execute({
                    orderId: `order-${i}`,
                    paymentMethod: { type: 'CARD', token: 'tok_test' },
                });

                expect(result.isSuccess()).toBe(true);
            }

            expect(paymentGateway.processPayment).toHaveBeenCalledTimes(5);
        });
    });
});
