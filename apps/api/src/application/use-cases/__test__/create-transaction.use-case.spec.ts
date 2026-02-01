import { CreateTransactionUseCase } from '../create-transaction.use-case';
import type {
    IProductRepository,
    ITransactionRepository,
} from '../../../domain/repositories';
import { Product, Transaction } from '../../../domain/entities';
import { Money, TransactionStatus } from '../../../domain/value-objects';
import { Result } from '../../../shared/result';

describe('CreateTransactionUseCase', () => {
    let useCase: CreateTransactionUseCase;
    let productRepository: jest.Mocked<IProductRepository>;
    let transactionRepository: jest.Mocked<ITransactionRepository>;

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
        customerEmail: 'john@example.com',
        firstName: 'John',
        lastName: 'Doe',
        address: '123 Main St',
        city: 'Bogotá',
        postalCode: '110111',
    };

    beforeEach(() => {
        productRepository = {
            findById: jest.fn(),
            findAll: jest.fn(),
            save: jest.fn(),
        } as any;

        transactionRepository = {
            findById: jest.fn(),
            save: jest.fn(),
        } as any;

        useCase = new CreateTransactionUseCase(
            productRepository,
            transactionRepository,
        );
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('constructor', () => {
        it('should create CreateTransactionUseCase instance', () => {
            expect(useCase).toBeDefined();
            expect(useCase).toBeInstanceOf(CreateTransactionUseCase);
        });

        it('should inject required repositories', () => {
            expect(useCase['productRepository']).toBe(productRepository);
            expect(useCase['transactionRepository']).toBe(transactionRepository);
        });
    });

    describe('execute', () => {
        it('should create a transaction successfully', async () => {
            const mockTransaction = Transaction.create({
                id: 'transaction-123',
                productId: 'product-123',
                quantity: 2,
                amount: new Money(200000, 'COP'),
                customerEmail: 'john@example.com',
                firstName: 'John',
                lastName: 'Doe',
                address: '123 Main St',
                city: 'Bogotá',
                postalCode: '110111',
            });

            productRepository.findById.mockResolvedValue(Result.ok(mockProduct));
            transactionRepository.save.mockResolvedValue(Result.ok(mockTransaction));

            const result = await useCase.execute(mockInput);

            expect(result.isSuccess()).toBe(true);
            expect(productRepository.findById).toHaveBeenCalledWith('product-123');
            expect(transactionRepository.save).toHaveBeenCalledWith(
                expect.objectContaining({
                    productId: 'product-123',
                    quantity: 2,
                    customerEmail: 'john@example.com',
                    firstName: 'John',
                    lastName: 'Doe',
                }),
            );

            const transaction = result.getValue();
            expect(transaction.productId).toBe('product-123');
            expect(transaction.quantity).toBe(2);
            expect(transaction.customerEmail).toBe('john@example.com');
        });

        it('should calculate total amount correctly', async () => {
            const mockTransaction = Transaction.create({
                id: 'transaction-123',
                productId: 'product-123',
                quantity: 3,
                amount: new Money(300000, 'COP'),
                customerEmail: 'john@example.com',
                firstName: 'John',
                lastName: 'Doe',
                address: '123 Main St',
                city: 'Bogotá',
                postalCode: '110111',
            });

            productRepository.findById.mockResolvedValue(Result.ok(mockProduct));
            transactionRepository.save.mockResolvedValue(Result.ok(mockTransaction));

            const result = await useCase.execute({
                ...mockInput,
                quantity: 3,
            });

            expect(result.isSuccess()).toBe(true);
            expect(transactionRepository.save).toHaveBeenCalledWith(
                expect.objectContaining({
                    amount: expect.objectContaining({
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
            expect(transactionRepository.save).not.toHaveBeenCalled();
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
            expect(result.getError().message).toContain('Available: 1');
            expect(result.getError().message).toContain('Requested: 5');
            expect(transactionRepository.save).not.toHaveBeenCalled();
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
            expect(transactionRepository.save).not.toHaveBeenCalled();
        });

        it('should generate unique transaction ID', async () => {
            const mockTransaction = Transaction.create({
                id: 'transaction-123',
                productId: 'product-123',
                quantity: 2,
                amount: new Money(200000, 'COP'),
                customerEmail: 'john@example.com',
                firstName: 'John',
                lastName: 'Doe',
                address: '123 Main St',
                city: 'Bogotá',
                postalCode: '110111',
            });

            productRepository.findById.mockResolvedValue(Result.ok(mockProduct));
            transactionRepository.save.mockResolvedValue(Result.ok(mockTransaction));

            await useCase.execute(mockInput);

            expect(transactionRepository.save).toHaveBeenCalledWith(
                expect.objectContaining({
                    id: expect.any(String),
                }),
            );

            const savedTransaction = transactionRepository.save.mock.calls[0][0];
            expect(savedTransaction.id).toMatch(
                /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
            );
        });

        it('should create transaction with PENDING status', async () => {
            const mockTransaction = Transaction.create({
                id: 'transaction-123',
                productId: 'product-123',
                quantity: 2,
                amount: new Money(200000, 'COP'),
                customerEmail: 'john@example.com',
                firstName: 'John',
                lastName: 'Doe',
                address: '123 Main St',
                city: 'Bogotá',
                postalCode: '110111',
            });

            productRepository.findById.mockResolvedValue(Result.ok(mockProduct));
            transactionRepository.save.mockResolvedValue(Result.ok(mockTransaction));

            const result = await useCase.execute(mockInput);

            expect(result.isSuccess()).toBe(true);
            const transaction = result.getValue();
            expect(transaction.getStatusValue()).toBe(TransactionStatus.PENDING);
            expect(transaction.isPending()).toBe(true);
        });

        it('should include all customer information fields', async () => {
            const mockTransaction = Transaction.create({
                id: 'transaction-123',
                productId: 'product-123',
                quantity: 2,
                amount: new Money(200000, 'COP'),
                customerEmail: 'john@example.com',
                firstName: 'John',
                lastName: 'Doe',
                address: '123 Main St',
                city: 'Bogotá',
                postalCode: '110111',
            });

            productRepository.findById.mockResolvedValue(Result.ok(mockProduct));
            transactionRepository.save.mockResolvedValue(Result.ok(mockTransaction));

            const result = await useCase.execute(mockInput);

            expect(result.isSuccess()).toBe(true);
            const transaction = result.getValue();
            expect(transaction.firstName).toBe('John');
            expect(transaction.lastName).toBe('Doe');
            expect(transaction.address).toBe('123 Main St');
            expect(transaction.city).toBe('Bogotá');
            expect(transaction.postalCode).toBe('110111');
            expect(transaction.customerEmail).toBe('john@example.com');
        });

        it('should handle repository save errors', async () => {
            const saveError = new Error('Database connection error');
            productRepository.findById.mockResolvedValue(Result.ok(mockProduct));
            transactionRepository.save.mockResolvedValue(Result.fail(saveError));

            const result = await useCase.execute(mockInput);

            expect(result.isFailure()).toBe(true);
            expect(result.getError().message).toBe('Database connection error');
        });

        it('should work with minimum quantity of 1', async () => {
            const mockTransaction = Transaction.create({
                id: 'transaction-123',
                productId: 'product-123',
                quantity: 1,
                amount: new Money(100000, 'COP'),
                customerEmail: 'john@example.com',
                firstName: 'John',
                lastName: 'Doe',
                address: '123 Main St',
                city: 'Bogotá',
                postalCode: '110111',
            });

            productRepository.findById.mockResolvedValue(Result.ok(mockProduct));
            transactionRepository.save.mockResolvedValue(Result.ok(mockTransaction));

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

            const mockTransaction = Transaction.create({
                id: 'transaction-123',
                productId: 'product-123',
                quantity: 10,
                amount: new Money(1000000, 'COP'),
                customerEmail: 'john@example.com',
                firstName: 'John',
                lastName: 'Doe',
                address: '123 Main St',
                city: 'Bogotá',
                postalCode: '110111',
            });

            productRepository.findById.mockResolvedValue(Result.ok(productWith10Stock));
            transactionRepository.save.mockResolvedValue(Result.ok(mockTransaction));

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

            const mockTransaction = Transaction.create({
                id: 'transaction-123',
                productId: 'product-456',
                quantity: 2,
                amount: new Money(200, 'USD'),
                customerEmail: 'john@example.com',
                firstName: 'John',
                lastName: 'Doe',
                address: '123 Main St',
                city: 'Bogotá',
                postalCode: '110111',
            });

            productRepository.findById.mockResolvedValue(Result.ok(usdProduct));
            transactionRepository.save.mockResolvedValue(Result.ok(mockTransaction));

            const result = await useCase.execute({
                ...mockInput,
                productId: 'product-456',
            });

            expect(result.isSuccess()).toBe(true);
            expect(transactionRepository.save).toHaveBeenCalledWith(
                expect.objectContaining({
                    amount: expect.objectContaining({
                        currency: 'USD',
                    }),
                }),
            );
        });
    });

    describe('Edge Cases', () => {
        it('should handle customer info with special characters', async () => {
            const mockTransaction = Transaction.create({
                id: 'transaction-123',
                productId: 'product-123',
                quantity: 2,
                amount: new Money(200000, 'COP'),
                customerEmail: 'josé@example.com',
                firstName: 'José',
                lastName: "O'Brien-García",
                address: 'Calle 123 #45-67 Apto. 801',
                city: 'Bogotá D.C.',
                postalCode: '110111',
            });

            productRepository.findById.mockResolvedValue(Result.ok(mockProduct));
            transactionRepository.save.mockResolvedValue(Result.ok(mockTransaction));

            const result = await useCase.execute({
                ...mockInput,
                firstName: 'José',
                lastName: "O'Brien-García",
                address: 'Calle 123 #45-67 Apto. 801',
                city: 'Bogotá D.C.',
                customerEmail: 'josé@example.com',
            });

            expect(result.isSuccess()).toBe(true);
            const transaction = result.getValue();
            expect(transaction.firstName).toBe('José');
            expect(transaction.lastName).toBe("O'Brien-García");
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

            const mockTransaction = Transaction.create({
                id: 'transaction-123',
                productId: 'product-123',
                quantity: 5000,
                amount: new Money(5000000, 'COP'),
                customerEmail: 'john@example.com',
                firstName: 'John',
                lastName: 'Doe',
                address: '123 Main St',
                city: 'Bogotá',
                postalCode: '110111',
            });

            productRepository.findById.mockResolvedValue(Result.ok(bulkProduct));
            transactionRepository.save.mockResolvedValue(Result.ok(mockTransaction));

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

            const mockTransaction = Transaction.create({
                id: 'transaction-123',
                productId: 'product-luxury',
                quantity: 2,
                amount: new Money(100000000, 'COP'),
                customerEmail: 'john@example.com',
                firstName: 'John',
                lastName: 'Doe',
                address: '123 Main St',
                city: 'Bogotá',
                postalCode: '110111',
            });

            productRepository.findById.mockResolvedValue(Result.ok(expensiveProduct));
            transactionRepository.save.mockResolvedValue(Result.ok(mockTransaction));

            const result = await useCase.execute({
                ...mockInput,
                productId: 'product-luxury',
                quantity: 2,
            });

            expect(result.isSuccess()).toBe(true);
            expect(result.getValue().amount.amount).toBe(100000000);
        });

        it('should handle concurrent transaction creation attempts', async () => {
            const mockTransaction1 = Transaction.create({
                id: 'transaction-1',
                productId: 'product-123',
                quantity: 2,
                amount: new Money(200000, 'COP'),
                customerEmail: 'john@example.com',
                firstName: 'John',
                lastName: 'Doe',
                address: '123 Main St',
                city: 'Bogotá',
                postalCode: '110111',
            });

            const mockTransaction2 = Transaction.create({
                id: 'transaction-2',
                productId: 'product-123',
                quantity: 3,
                amount: new Money(300000, 'COP'),
                customerEmail: 'another@example.com',
                firstName: 'Jane',
                lastName: 'Smith',
                address: '456 Elm St',
                city: 'Medellín',
                postalCode: '050001',
            });

            productRepository.findById.mockResolvedValue(Result.ok(mockProduct));
            transactionRepository.save
                .mockResolvedValueOnce(Result.ok(mockTransaction1))
                .mockResolvedValueOnce(Result.ok(mockTransaction2));

            const result1 = await useCase.execute(mockInput);
            const result2 = await useCase.execute({
                ...mockInput,
                quantity: 3,
                customerEmail: 'another@example.com',
                firstName: 'Jane',
                lastName: 'Smith',
                address: '456 Elm St',
                city: 'Medellín',
                postalCode: '050001',
            });

            expect(result1.isSuccess()).toBe(true);
            expect(result2.isSuccess()).toBe(true);
            expect(result1.getValue().id).not.toBe(result2.getValue().id);
        });

        it('should handle invalid email formats gracefully', async () => {
            const mockTransaction = Transaction.create({
                id: 'transaction-123',
                productId: 'product-123',
                quantity: 2,
                amount: new Money(200000, 'COP'),
                customerEmail: 'invalid-email',
                firstName: 'John',
                lastName: 'Doe',
                address: '123 Main St',
                city: 'Bogotá',
                postalCode: '110111',
            });

            productRepository.findById.mockResolvedValue(Result.ok(mockProduct));
            transactionRepository.save.mockResolvedValue(Result.ok(mockTransaction));

            const result = await useCase.execute({
                ...mockInput,
                customerEmail: 'invalid-email',
            });

            // El use case no valida el formato del email, solo lo guarda
            expect(result.isSuccess()).toBe(true);
        });
    });

    describe('Integration with Domain Entities', () => {
        it('should create transaction with correct Money value object', async () => {
            const mockTransaction = Transaction.create({
                id: 'transaction-123',
                productId: 'product-123',
                quantity: 2,
                amount: new Money(200000, 'COP'),
                customerEmail: 'john@example.com',
                firstName: 'John',
                lastName: 'Doe',
                address: '123 Main St',
                city: 'Bogotá',
                postalCode: '110111',
            });

            productRepository.findById.mockResolvedValue(Result.ok(mockProduct));
            transactionRepository.save.mockResolvedValue(Result.ok(mockTransaction));

            const result = await useCase.execute(mockInput);

            expect(result.isSuccess()).toBe(true);
            const transaction = result.getValue();
            expect(transaction.amount).toBeInstanceOf(Money);
            expect(transaction.amount.amount).toBe(200000);
            expect(transaction.amount.currency).toBe('COP');
        });

        it('should verify product stock check is called', async () => {
            const productSpy = jest.spyOn(mockProduct, 'hasStock');

            const mockTransaction = Transaction.create({
                id: 'transaction-123',
                productId: 'product-123',
                quantity: 2,
                amount: new Money(200000, 'COP'),
                customerEmail: 'john@example.com',
                firstName: 'John',
                lastName: 'Doe',
                address: '123 Main St',
                city: 'Bogotá',
                postalCode: '110111',
            });

            productRepository.findById.mockResolvedValue(Result.ok(mockProduct));
            transactionRepository.save.mockResolvedValue(Result.ok(mockTransaction));

            await useCase.execute(mockInput);

            expect(productSpy).toHaveBeenCalledWith(2);

            productSpy.mockRestore();
        });

        it('should verify product price calculation is called', async () => {
            const productSpy = jest.spyOn(mockProduct, 'calculateTotalPrice');

            const mockTransaction = Transaction.create({
                id: 'transaction-123',
                productId: 'product-123',
                quantity: 2,
                amount: new Money(200000, 'COP'),
                customerEmail: 'john@example.com',
                firstName: 'John',
                lastName: 'Doe',
                address: '123 Main St',
                city: 'Bogotá',
                postalCode: '110111',
            });

            productRepository.findById.mockResolvedValue(Result.ok(mockProduct));
            transactionRepository.save.mockResolvedValue(Result.ok(mockTransaction));

            await useCase.execute(mockInput);

            expect(productSpy).toHaveBeenCalledWith(2);

            productSpy.mockRestore();
        });

        it('should create transaction that can be processed later', async () => {
            const mockTransaction = Transaction.create({
                id: 'transaction-123',
                productId: 'product-123',
                quantity: 2,
                amount: new Money(200000, 'COP'),
                customerEmail: 'john@example.com',
                firstName: 'John',
                lastName: 'Doe',
                address: '123 Main St',
                city: 'Bogotá',
                postalCode: '110111',
            });

            productRepository.findById.mockResolvedValue(Result.ok(mockProduct));
            transactionRepository.save.mockResolvedValue(Result.ok(mockTransaction));

            const result = await useCase.execute(mockInput);

            expect(result.isSuccess()).toBe(true);
            const transaction = result.getValue();
            expect(transaction.isPending()).toBe(true);
            expect(transaction.wpTransactionId).toBeUndefined();
            expect(transaction.wpReference).toBeUndefined();
        });

        it('should create transaction with timestamps', async () => {
            const mockTransaction = Transaction.create({
                id: 'transaction-123',
                productId: 'product-123',
                quantity: 2,
                amount: new Money(200000, 'COP'),
                customerEmail: 'john@example.com',
                firstName: 'John',
                lastName: 'Doe',
                address: '123 Main St',
                city: 'Bogotá',
                postalCode: '110111',
            });

            productRepository.findById.mockResolvedValue(Result.ok(mockProduct));
            transactionRepository.save.mockResolvedValue(Result.ok(mockTransaction));

            const result = await useCase.execute(mockInput);

            expect(result.isSuccess()).toBe(true);
            const transaction = result.getValue();
            expect(transaction.createdAt).toBeInstanceOf(Date);
            expect(transaction.updatedAt).toBeInstanceOf(Date);
        });
    });
});
