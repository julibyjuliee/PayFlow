import { CreateOrderUseCase } from '../create-order.use-case';
import type {
    IProductRepository,
    IOrderRepository,
} from '../../../domain/repositories';
import { Product, Order } from '../../../domain/entities';
import { Money, TransactionStatus } from '../../../domain/value-objects';
import { Result } from '../../../shared/result';

describe('CreateOrderUseCase', () => {
    let useCase: CreateOrderUseCase;
    let productRepository: jest.Mocked<IProductRepository>;
    let orderRepository: jest.Mocked<IOrderRepository>;

    const mockProduct = new Product(
        'product-123',
        'Test Product',
        new Money(100000, 'COP'),
        50, // stock
        'Electronics',
        'Test description',
        'https://example.com/image.jpg',
    );

    const mockInput = {
        productId: 'product-123',
        quantity: 2,
        shippingAddress: {
            firstName: 'John',
            lastName: 'Doe',
            address: '123 Main St',
            city: 'Bogotá',
            postalCode: '110111',
        },
        customerEmail: 'john@example.com',
    };

    beforeEach(() => {
        productRepository = {
            findById: jest.fn(),
            findAll: jest.fn(),
            save: jest.fn(),
        } as any;

        orderRepository = {
            findById: jest.fn(),
            save: jest.fn(),
        } as any;

        useCase = new CreateOrderUseCase(productRepository, orderRepository);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('constructor', () => {
        it('should create CreateOrderUseCase instance', () => {
            expect(useCase).toBeDefined();
            expect(useCase).toBeInstanceOf(CreateOrderUseCase);
        });

        it('should inject required repositories', () => {
            expect(useCase['productRepository']).toBe(productRepository);
            expect(useCase['orderRepository']).toBe(orderRepository);
        });
    });

    describe('execute', () => {
        it('should create an order successfully', async () => {
            const mockOrder = Order.create(
                'order-123',
                'product-123',
                2,
                new Money(200000, 'COP'),
                mockInput.shippingAddress,
                mockInput.customerEmail,
            );

            productRepository.findById.mockResolvedValue(Result.ok(mockProduct));
            orderRepository.save.mockResolvedValue(Result.ok(mockOrder));

            const result = await useCase.execute(mockInput);

            expect(result.isSuccess()).toBe(true);
            expect(productRepository.findById).toHaveBeenCalledWith('product-123');
            expect(orderRepository.save).toHaveBeenCalledWith(
                expect.objectContaining({
                    productId: 'product-123',
                    quantity: 2,
                    customerEmail: 'john@example.com',
                }),
            );

            const order = result.getValue();
            expect(order.productId).toBe('product-123');
            expect(order.quantity).toBe(2);
            expect(order.firstName).toBe('John');
            expect(order.lastName).toBe('Doe');
            expect(order.customerEmail).toBe('john@example.com');
        });

        it('should calculate total price correctly', async () => {
            const mockOrder = Order.create(
                'order-123',
                'product-123',
                3,
                new Money(300000, 'COP'),
                mockInput.shippingAddress,
                mockInput.customerEmail,
            );

            productRepository.findById.mockResolvedValue(Result.ok(mockProduct));
            orderRepository.save.mockResolvedValue(Result.ok(mockOrder));

            const result = await useCase.execute({
                ...mockInput,
                quantity: 3,
            });

            expect(result.isSuccess()).toBe(true);
            expect(orderRepository.save).toHaveBeenCalledWith(
                expect.objectContaining({
                    totalPrice: expect.objectContaining({
                        amount: 300000,
                        currency: 'COP',
                    }),
                }),
            );
        });

        it('should fail when product is not found', async () => {
            const error = new Error('Product not found');
            productRepository.findById.mockResolvedValue(Result.fail(error));

            const result = await useCase.execute(mockInput);

            expect(result.isFailure()).toBe(true);
            expect(result.getError().message).toBe('Product not found');
            expect(orderRepository.save).not.toHaveBeenCalled();
        });

        it('should fail when product has insufficient stock', async () => {
            const lowStockProduct = new Product(
                'product-123',
                'Test Product',
                new Money(100000, 'COP'),
                1, // Solo 1 en stock
                'Electronics',
                'Test description',
                'https://example.com/image.jpg',
            );

            productRepository.findById.mockResolvedValue(Result.ok(lowStockProduct));

            const result = await useCase.execute({
                ...mockInput,
                quantity: 5, // Solicitando 5 pero solo hay 1
            });

            expect(result.isFailure()).toBe(true);
            expect(result.getError().message).toContain('Insufficient stock');
            expect(orderRepository.save).not.toHaveBeenCalled();
        });

        it('should fail when product has zero stock', async () => {
            const outOfStockProduct = new Product(
                'product-123',
                'Test Product',
                new Money(100000, 'COP'),
                0, // Sin stock
                'Electronics',
                'Test description',
                'https://example.com/image.jpg',
            );

            productRepository.findById.mockResolvedValue(Result.ok(outOfStockProduct));

            const result = await useCase.execute(mockInput);

            expect(result.isFailure()).toBe(true);
            expect(result.getError().message).toContain('Insufficient stock');
            expect(orderRepository.save).not.toHaveBeenCalled();
        });

        it('should generate unique order ID', async () => {
            const mockOrder = Order.create(
                'order-123',
                'product-123',
                2,
                new Money(200000, 'COP'),
                mockInput.shippingAddress,
                mockInput.customerEmail,
            );

            productRepository.findById.mockResolvedValue(Result.ok(mockProduct));
            orderRepository.save.mockResolvedValue(Result.ok(mockOrder));

            await useCase.execute(mockInput);

            expect(orderRepository.save).toHaveBeenCalledWith(
                expect.objectContaining({
                    id: expect.any(String),
                }),
            );

            const savedOrder = orderRepository.save.mock.calls[0][0];
            expect(savedOrder.id).toMatch(
                /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
            );
        });

        it('should create order with PENDING status', async () => {
            const mockOrder = Order.create(
                'order-123',
                'product-123',
                2,
                new Money(200000, 'COP'),
                mockInput.shippingAddress,
                mockInput.customerEmail,
            );

            productRepository.findById.mockResolvedValue(Result.ok(mockProduct));
            orderRepository.save.mockResolvedValue(Result.ok(mockOrder));

            const result = await useCase.execute(mockInput);

            expect(result.isSuccess()).toBe(true);
            const order = result.getValue();
            expect(order.getStatusValue()).toBe(TransactionStatus.PENDING);
            expect(order.isPending()).toBe(true);
        });

        it('should include all shipping address fields', async () => {
            const mockOrder = Order.create(
                'order-123',
                'product-123',
                2,
                new Money(200000, 'COP'),
                mockInput.shippingAddress,
                mockInput.customerEmail,
            );

            productRepository.findById.mockResolvedValue(Result.ok(mockProduct));
            orderRepository.save.mockResolvedValue(Result.ok(mockOrder));

            const result = await useCase.execute(mockInput);

            expect(result.isSuccess()).toBe(true);
            const order = result.getValue();
            expect(order.firstName).toBe('John');
            expect(order.lastName).toBe('Doe');
            expect(order.address).toBe('123 Main St');
            expect(order.city).toBe('Bogotá');
            expect(order.postalCode).toBe('110111');
        });

        it('should handle repository save errors', async () => {
            const saveError = new Error('Database connection error');
            productRepository.findById.mockResolvedValue(Result.ok(mockProduct));
            orderRepository.save.mockResolvedValue(Result.fail(saveError));

            const result = await useCase.execute(mockInput);

            expect(result.isFailure()).toBe(true);
            expect(result.getError().message).toBe('Database connection error');
        });

        it('should work with minimum quantity of 1', async () => {
            const mockOrder = Order.create(
                'order-123',
                'product-123',
                1,
                new Money(100000, 'COP'),
                mockInput.shippingAddress,
                mockInput.customerEmail,
            );

            productRepository.findById.mockResolvedValue(Result.ok(mockProduct));
            orderRepository.save.mockResolvedValue(Result.ok(mockOrder));

            const result = await useCase.execute({
                ...mockInput,
                quantity: 1,
            });

            expect(result.isSuccess()).toBe(true);
            expect(result.getValue().quantity).toBe(1);
        });

        it('should work with maximum available stock', async () => {
            const productWith10Stock = new Product(
                'product-123',
                'Test Product',
                new Money(100000, 'COP'),
                10, // stock
                'Electronics',
                'Test description',
                'https://example.com/image.jpg',
            );

            const mockOrder = Order.create(
                'order-123',
                'product-123',
                10,
                new Money(1000000, 'COP'),
                mockInput.shippingAddress,
                mockInput.customerEmail,
            );

            productRepository.findById.mockResolvedValue(Result.ok(productWith10Stock));
            orderRepository.save.mockResolvedValue(Result.ok(mockOrder));

            const result = await useCase.execute({
                ...mockInput,
                quantity: 10,
            });

            expect(result.isSuccess()).toBe(true);
            expect(result.getValue().quantity).toBe(10);
        });

        it('should preserve currency from product', async () => {
            const usdProduct = new Product(
                'product-456',
                'USD Product',
                new Money(100, 'USD'),
                50, // stock
                'Electronics',
                'Test description',
                'https://example.com/image.jpg',
            );

            const mockOrder = Order.create(
                'order-123',
                'product-456',
                2,
                new Money(200, 'USD'),
                mockInput.shippingAddress,
                mockInput.customerEmail,
            );

            productRepository.findById.mockResolvedValue(Result.ok(usdProduct));
            orderRepository.save.mockResolvedValue(Result.ok(mockOrder));

            const result = await useCase.execute({
                ...mockInput,
                productId: 'product-456',
            });

            expect(result.isSuccess()).toBe(true);
            expect(orderRepository.save).toHaveBeenCalledWith(
                expect.objectContaining({
                    totalPrice: expect.objectContaining({
                        currency: 'USD',
                    }),
                }),
            );
        });
    });

    describe('Edge Cases', () => {
        it('should handle products with special characters in names', async () => {
            const specialProduct = new Product(
                'product-123',
                'Product with émojis 🎉 and spëcial chars',
                new Money(100000, 'COP'),
                50, // stock
                'Electronics',
                'Test description',
                'https://example.com/image.jpg',
            );

            const mockOrder = Order.create(
                'order-123',
                'product-123',
                2,
                new Money(200000, 'COP'),
                mockInput.shippingAddress,
                mockInput.customerEmail,
            );

            productRepository.findById.mockResolvedValue(Result.ok(specialProduct));
            orderRepository.save.mockResolvedValue(Result.ok(mockOrder));

            const result = await useCase.execute(mockInput);

            expect(result.isSuccess()).toBe(true);
        });

        it('should handle shipping addresses with special characters', async () => {
            const mockOrder = Order.create(
                'order-123',
                'product-123',
                2,
                new Money(200000, 'COP'),
                {
                    firstName: 'José',
                    lastName: "O'Brien-García",
                    address: 'Calle 123 #45-67 Apto. 801',
                    city: 'Bogotá D.C.',
                    postalCode: '110111',
                },
                'josé@example.com',
            );

            productRepository.findById.mockResolvedValue(Result.ok(mockProduct));
            orderRepository.save.mockResolvedValue(Result.ok(mockOrder));

            const result = await useCase.execute({
                ...mockInput,
                shippingAddress: {
                    firstName: 'José',
                    lastName: "O'Brien-García",
                    address: 'Calle 123 #45-67 Apto. 801',
                    city: 'Bogotá D.C.',
                    postalCode: '110111',
                },
                customerEmail: 'josé@example.com',
            });

            expect(result.isSuccess()).toBe(true);
            const order = result.getValue();
            expect(order.firstName).toBe('José');
            expect(order.lastName).toBe("O'Brien-García");
        });

        it('should handle large quantities within stock limits', async () => {
            const bulkProduct = new Product(
                'product-123',
                'Bulk Product',
                new Money(1000, 'COP'),
                10000, // stock
                'Wholesale',
                'Test description',
                'https://example.com/image.jpg',
            );

            const mockOrder = Order.create(
                'order-123',
                'product-123',
                5000,
                new Money(5000000, 'COP'),
                mockInput.shippingAddress,
                mockInput.customerEmail,
            );

            productRepository.findById.mockResolvedValue(Result.ok(bulkProduct));
            orderRepository.save.mockResolvedValue(Result.ok(mockOrder));

            const result = await useCase.execute({
                ...mockInput,
                quantity: 5000,
            });

            expect(result.isSuccess()).toBe(true);
            expect(result.getValue().quantity).toBe(5000);
        });

        it('should handle expensive products with large amounts', async () => {
            const expensiveProduct = new Product(
                'product-luxury',
                'Luxury Item',
                new Money(50000000, 'COP'), // 50 millones
                5, // stock
                'Luxury',
                'Expensive item',
                'https://example.com/luxury.jpg',
            );

            const mockOrder = Order.create(
                'order-123',
                'product-luxury',
                2,
                new Money(100000000, 'COP'),
                mockInput.shippingAddress,
                mockInput.customerEmail,
            );

            productRepository.findById.mockResolvedValue(Result.ok(expensiveProduct));
            orderRepository.save.mockResolvedValue(Result.ok(mockOrder));

            const result = await useCase.execute({
                ...mockInput,
                productId: 'product-luxury',
                quantity: 2,
            });

            expect(result.isSuccess()).toBe(true);
            expect(result.getValue().totalPrice.amount).toBe(100000000);
        });

        it('should handle concurrent order creation attempts', async () => {
            const mockOrder1 = Order.create(
                'order-1',
                'product-123',
                2,
                new Money(200000, 'COP'),
                mockInput.shippingAddress,
                mockInput.customerEmail,
            );

            const mockOrder2 = Order.create(
                'order-2',
                'product-123',
                3,
                new Money(300000, 'COP'),
                mockInput.shippingAddress,
                'another@example.com',
            );

            productRepository.findById.mockResolvedValue(Result.ok(mockProduct));
            orderRepository.save
                .mockResolvedValueOnce(Result.ok(mockOrder1))
                .mockResolvedValueOnce(Result.ok(mockOrder2));

            const result1 = await useCase.execute(mockInput);
            const result2 = await useCase.execute({
                ...mockInput,
                quantity: 3,
                customerEmail: 'another@example.com',
            });

            expect(result1.isSuccess()).toBe(true);
            expect(result2.isSuccess()).toBe(true);
            expect(result1.getValue().id).not.toBe(result2.getValue().id);
        });
    });

    describe('Integration with Domain Entities', () => {
        it('should create order that can be approved later', async () => {
            const mockOrder = Order.create(
                'order-123',
                'product-123',
                2,
                new Money(200000, 'COP'),
                mockInput.shippingAddress,
                mockInput.customerEmail,
            );

            productRepository.findById.mockResolvedValue(Result.ok(mockProduct));
            orderRepository.save.mockResolvedValue(Result.ok(mockOrder));

            const result = await useCase.execute(mockInput);

            expect(result.isSuccess()).toBe(true);
            const order = result.getValue();
            expect(order.isPending()).toBe(true);
            expect(order.isApproved()).toBe(false);
            expect(order.isFinal()).toBe(false);
        });

        it('should create order with correct Money value object', async () => {
            const mockOrder = Order.create(
                'order-123',
                'product-123',
                2,
                new Money(200000, 'COP'),
                mockInput.shippingAddress,
                mockInput.customerEmail,
            );

            productRepository.findById.mockResolvedValue(Result.ok(mockProduct));
            orderRepository.save.mockResolvedValue(Result.ok(mockOrder));

            const result = await useCase.execute(mockInput);

            expect(result.isSuccess()).toBe(true);
            const order = result.getValue();
            expect(order.totalPrice).toBeInstanceOf(Money);
            expect(order.totalPrice.amount).toBe(200000);
            expect(order.totalPrice.currency).toBe('COP');
        });

        it('should verify product stock check is called', async () => {
            const productSpy = jest.spyOn(mockProduct, 'hasStock');

            const mockOrder = Order.create(
                'order-123',
                'product-123',
                2,
                new Money(200000, 'COP'),
                mockInput.shippingAddress,
                mockInput.customerEmail,
            );

            productRepository.findById.mockResolvedValue(Result.ok(mockProduct));
            orderRepository.save.mockResolvedValue(Result.ok(mockOrder));

            await useCase.execute(mockInput);

            expect(productSpy).toHaveBeenCalledWith(2);

            productSpy.mockRestore();
        });

        it('should verify product price calculation is called', async () => {
            const productSpy = jest.spyOn(mockProduct, 'calculateTotalPrice');

            const mockOrder = Order.create(
                'order-123',
                'product-123',
                2,
                new Money(200000, 'COP'),
                mockInput.shippingAddress,
                mockInput.customerEmail,
            );

            productRepository.findById.mockResolvedValue(Result.ok(mockProduct));
            orderRepository.save.mockResolvedValue(Result.ok(mockOrder));

            await useCase.execute(mockInput);

            expect(productSpy).toHaveBeenCalledWith(2);

            productSpy.mockRestore();
        });
    });
});
