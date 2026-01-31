import { ProcessPaymentUseCase } from '../process-payment.use-case';
import type {
    ITransactionRepository,
    IProductRepository,
    IPaymentGateway,
} from '../../../domain/repositories';
import { Transaction, Product } from '../../../domain/entities';
import { Money, TransactionStatus } from '../../../domain/value-objects';
import { Result } from '../../../shared/result';

describe('ProcessPaymentUseCase', () => {
    let useCase: ProcessPaymentUseCase;
    let transactionRepository: jest.Mocked<ITransactionRepository>;
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

    const createMockTransaction = () =>
        Transaction.create({
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
    const mockPaymentInput = {
        transactionId: 'transaction-123',
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
        transactionRepository = {
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

        useCase = new ProcessPaymentUseCase(
            transactionRepository,
            productRepository,
            paymentGateway,
        );
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('constructor', () => {
        it('should create ProcessPaymentUseCase instance', () => {
            expect(useCase).toBeDefined();
            expect(useCase).toBeInstanceOf(ProcessPaymentUseCase);
        });

        it('should inject all dependencies', () => {
            expect(useCase['transactionRepository']).toBe(transactionRepository);
            expect(useCase['productRepository']).toBe(productRepository);
            expect(useCase['paymentGateway']).toBe(paymentGateway);
        });
    });

    describe('execute - Transaction Validation', () => {
        it('should fail when transaction is not found', async () => {
            const error = new Error('Transaction not found');
            transactionRepository.findById.mockResolvedValue(Result.fail(error));

            const result = await useCase.execute(mockPaymentInput);

            expect(result.isFailure()).toBe(true);
            expect(result.getError().message).toBe('Transaction not found');
            expect(transactionRepository.findById).toHaveBeenCalledWith('transaction-123');
            expect(paymentGateway.processPayment).not.toHaveBeenCalled();
        });

        it('should fail when transaction is not in PENDING state', async () => {
            const approvedTransaction = createMockTransaction();
            approvedTransaction.approve('wompi-old', 'ref-old');

            transactionRepository.findById.mockResolvedValue(Result.ok(approvedTransaction));

            const result = await useCase.execute(mockPaymentInput);

            expect(result.isFailure()).toBe(true);
            expect(result.getError().message).toContain('not in PENDING state');
            expect(paymentGateway.processPayment).not.toHaveBeenCalled();
        });

        it('should process payment for pending transaction', async () => {
            const mockTransaction = createMockTransaction();
            const mockProduct = createMockProduct();

            transactionRepository.findById.mockResolvedValue(Result.ok(mockTransaction));
            paymentGateway.processPayment.mockResolvedValue(
                Result.ok(mockApprovedPaymentResponse),
            );
            productRepository.findById.mockResolvedValue(Result.ok(mockProduct));
            productRepository.update.mockResolvedValue(Result.ok(mockProduct));
            transactionRepository.update.mockResolvedValue(Result.ok(mockTransaction));

            const result = await useCase.execute(mockPaymentInput);

            expect(result.isSuccess()).toBe(true);
            expect(transactionRepository.findById).toHaveBeenCalledWith('transaction-123');
            expect(paymentGateway.processPayment).toHaveBeenCalled();
        });
    });

    describe('execute - Payment Processing', () => {
        it('should process approved payment successfully', async () => {
            const mockTransaction = createMockTransaction();
            const mockProduct = createMockProduct();

            transactionRepository.findById.mockResolvedValue(Result.ok(mockTransaction));
            paymentGateway.processPayment.mockResolvedValue(
                Result.ok(mockApprovedPaymentResponse),
            );
            productRepository.findById.mockResolvedValue(Result.ok(mockProduct));
            productRepository.update.mockResolvedValue(Result.ok(mockProduct));
            transactionRepository.update.mockResolvedValue(Result.ok(mockTransaction));

            const result = await useCase.execute(mockPaymentInput);

            expect(result.isSuccess()).toBe(true);
            expect(paymentGateway.processPayment).toHaveBeenCalledWith({
                amount: 200000,
                currency: 'COP',
                customerEmail: 'john@example.com',
                reference: 'transaction-123',
                paymentMethod: { type: 'CARD', token: 'tok_test_12345' },
            });
        });

        it('should approve transaction and decrease stock on approved payment', async () => {
            const testProduct = new Product(
                'product-123',
                'Test Product',
                new Money(100000, 'COP'),
                10,
                'Electronics',
            );
            const testTransaction = createMockTransaction();

            transactionRepository.findById.mockResolvedValue(Result.ok(testTransaction));
            paymentGateway.processPayment.mockResolvedValue(
                Result.ok(mockApprovedPaymentResponse),
            );
            productRepository.findById.mockResolvedValue(Result.ok(testProduct));
            productRepository.update.mockResolvedValue(Result.ok(testProduct));
            transactionRepository.update.mockResolvedValue(Result.ok(testTransaction));

            const result = await useCase.execute(mockPaymentInput);

            expect(result.isSuccess()).toBe(true);
            expect(testProduct.getStock()).toBe(8); // 10 - 2
            expect(productRepository.update).toHaveBeenCalledWith(testProduct);
            expect(transactionRepository.update).toHaveBeenCalled();
        });

        it('should handle declined payment', async () => {
            const mockTransaction = createMockTransaction();

            const declinedResponse = {
                id: 'wompi-trans-declined',
                reference: 'ref-declined',
                status: 'DECLINED',
                amount: 200000,
                currency: 'COP',
                paymentMethod: 'CARD',
                createdAt: new Date(),
            };

            transactionRepository.findById.mockResolvedValue(Result.ok(mockTransaction));
            paymentGateway.processPayment.mockResolvedValue(
                Result.ok(declinedResponse),
            );
            transactionRepository.update.mockResolvedValue(Result.ok(mockTransaction));

            const result = await useCase.execute(mockPaymentInput);

            expect(result.isSuccess()).toBe(true);
            const transaction = result.getValue();
            expect(transaction.errorMessage).toBe('Payment was declined by Wompi');
            expect(transactionRepository.update).toHaveBeenCalled();
            expect(productRepository.findById).not.toHaveBeenCalled();
        });

        it('should handle pending payment status', async () => {
            const mockTransaction = createMockTransaction();
            const mockProduct = createMockProduct();

            const pendingResponse = {
                id: 'wompi-trans-pending',
                reference: 'ref-pending',
                status: 'PENDING',
                amount: 200000,
                currency: 'COP',
                paymentMethod: 'CARD',
                createdAt: new Date(),
            };

            transactionRepository.findById.mockResolvedValue(Result.ok(mockTransaction));
            paymentGateway.processPayment.mockResolvedValue(
                Result.ok(pendingResponse),
            );
            productRepository.findById.mockResolvedValue(Result.ok(mockProduct));
            productRepository.update.mockResolvedValue(Result.ok(mockProduct));
            transactionRepository.update.mockResolvedValue(Result.ok(mockTransaction));

            const result = await useCase.execute(mockPaymentInput);

            expect(result.isSuccess()).toBe(true);
            expect(productRepository.findById).toHaveBeenCalled();
        });

        it('should mark transaction as error when payment gateway fails', async () => {
            const mockTransaction = createMockTransaction();

            const paymentError = new Error('Payment gateway timeout');
            transactionRepository.findById.mockResolvedValue(Result.ok(mockTransaction));
            paymentGateway.processPayment.mockResolvedValue(
                Result.fail(paymentError),
            );
            transactionRepository.update.mockResolvedValue(Result.ok(mockTransaction));

            const result = await useCase.execute(mockPaymentInput);

            expect(result.isFailure()).toBe(true);
            expect(result.getError().message).toBe('Payment gateway timeout');
            expect(transactionRepository.update).toHaveBeenCalled();
        });

        it('should handle unknown payment status', async () => {
            const mockTransaction = createMockTransaction();

            const unknownResponse = {
                id: 'wompi-trans-unknown',
                reference: 'ref-unknown',
                status: 'VOIDED',
                amount: 200000,
                currency: 'COP',
                paymentMethod: 'CARD',
                createdAt: new Date(),
            };

            transactionRepository.findById.mockResolvedValue(Result.ok(mockTransaction));
            paymentGateway.processPayment.mockResolvedValue(
                Result.ok(unknownResponse),
            );
            transactionRepository.update.mockResolvedValue(Result.ok(mockTransaction));

            const result = await useCase.execute(mockPaymentInput);

            expect(result.isSuccess()).toBe(true);
            expect(transactionRepository.update).toHaveBeenCalled();
        });
    });

    describe('execute - Stock Management', () => {
        it('should fail when product is not found during approval', async () => {
            const mockTransaction = createMockTransaction();

            const productError = new Error('Product not found');
            transactionRepository.findById.mockResolvedValue(Result.ok(mockTransaction));
            paymentGateway.processPayment.mockResolvedValue(
                Result.ok(mockApprovedPaymentResponse),
            );
            productRepository.findById.mockResolvedValue(Result.fail(productError));
            transactionRepository.update.mockResolvedValue(Result.ok(mockTransaction));

            const result = await useCase.execute(mockPaymentInput);

            expect(result.isFailure()).toBe(true);
            expect(result.getError().message).toBe('Product not found');
            expect(transactionRepository.update).toHaveBeenCalled();
            expect(mockTransaction.errorMessage).toContain('Product not found after payment approval');
        });

        it('should fail when product has insufficient stock', async () => {
            const mockTransaction = createMockTransaction();

            const lowStockProduct = new Product(
                'product-123',
                'Test Product',
                new Money(100000, 'COP'),
                1, // Only 1 in stock, but transaction needs 2
                'Electronics',
            );

            transactionRepository.findById.mockResolvedValue(Result.ok(mockTransaction));
            paymentGateway.processPayment.mockResolvedValue(
                Result.ok(mockApprovedPaymentResponse),
            );
            productRepository.findById.mockResolvedValue(Result.ok(lowStockProduct));
            transactionRepository.update.mockResolvedValue(Result.ok(mockTransaction));

            const result = await useCase.execute(mockPaymentInput);

            expect(result.isFailure()).toBe(true);
            expect(transactionRepository.update).toHaveBeenCalled();
            expect(mockTransaction.errorMessage).toContain('Insufficient stock');
        });

        it('should fail when product update fails', async () => {
            const mockTransaction = createMockTransaction();

            const updateError = new Error('Database error');
            const testProduct = new Product(
                'product-123',
                'Test Product',
                new Money(100000, 'COP'),
                10,
                'Electronics',
            );

            transactionRepository.findById.mockResolvedValue(Result.ok(mockTransaction));
            paymentGateway.processPayment.mockResolvedValue(
                Result.ok(mockApprovedPaymentResponse),
            );
            productRepository.findById.mockResolvedValue(Result.ok(testProduct));
            productRepository.update.mockResolvedValue(Result.fail(updateError));
            transactionRepository.update.mockResolvedValue(Result.ok(mockTransaction));

            const result = await useCase.execute(mockPaymentInput);

            expect(result.isFailure()).toBe(true);
            expect(result.getError().message).toBe('Database error');
            expect(transactionRepository.update).toHaveBeenCalled();
            expect(mockTransaction.errorMessage).toContain('Failed to update product stock');
        });

        it('should correctly decrease stock for multiple quantities', async () => {
            const testProduct = new Product(
                'product-123',
                'Test Product',
                new Money(100000, 'COP'),
                50,
                'Electronics',
            );

            const largeTransaction = Transaction.create({
                id: 'transaction-large',
                productId: 'product-123',
                quantity: 25,
                amount: new Money(2500000, 'COP'),
                customerEmail: 'john@example.com',
                firstName: 'John',
                lastName: 'Doe',
                address: '123 Main St',
                city: 'Bogotá',
                postalCode: '110111',
            });

            transactionRepository.findById.mockResolvedValue(Result.ok(largeTransaction));
            paymentGateway.processPayment.mockResolvedValue(
                Result.ok(mockApprovedPaymentResponse),
            );
            productRepository.findById.mockResolvedValue(Result.ok(testProduct));
            productRepository.update.mockResolvedValue(Result.ok(testProduct));
            transactionRepository.update.mockResolvedValue(Result.ok(largeTransaction));

            const result = await useCase.execute({
                transactionId: 'transaction-large',
                paymentMethod: { type: 'CARD', token: 'tok_test' },
            });

            expect(result.isSuccess()).toBe(true);
            expect(testProduct.getStock()).toBe(25); // 50 - 25
        });
    });

    describe('execute - Different Payment Methods', () => {
        it('should process payment with CARD method', async () => {
            const mockTransaction = createMockTransaction();
            const mockProduct = createMockProduct();

            transactionRepository.findById.mockResolvedValue(Result.ok(mockTransaction));
            paymentGateway.processPayment.mockResolvedValue(
                Result.ok(mockApprovedPaymentResponse),
            );
            productRepository.findById.mockResolvedValue(Result.ok(mockProduct));
            productRepository.update.mockResolvedValue(Result.ok(mockProduct));
            transactionRepository.update.mockResolvedValue(Result.ok(mockTransaction));

            const result = await useCase.execute({
                transactionId: 'transaction-123',
                paymentMethod: { type: 'CARD', token: 'tok_card_12345', installments: 3 },
            });

            expect(result.isSuccess()).toBe(true);
            expect(paymentGateway.processPayment).toHaveBeenCalledWith(
                expect.objectContaining({
                    paymentMethod: { type: 'CARD', token: 'tok_card_12345', installments: 3 },
                }),
            );
        });

        it('should process payment with NEQUI method', async () => {
            const mockTransaction = createMockTransaction();
            const mockProduct = createMockProduct();

            transactionRepository.findById.mockResolvedValue(Result.ok(mockTransaction));
            paymentGateway.processPayment.mockResolvedValue(
                Result.ok(mockApprovedPaymentResponse),
            );
            productRepository.findById.mockResolvedValue(Result.ok(mockProduct));
            productRepository.update.mockResolvedValue(Result.ok(mockProduct));
            transactionRepository.update.mockResolvedValue(Result.ok(mockTransaction));

            const result = await useCase.execute({
                transactionId: 'transaction-123',
                paymentMethod: { type: 'NEQUI' },
            });

            expect(result.isSuccess()).toBe(true);
            expect(paymentGateway.processPayment).toHaveBeenCalledWith(
                expect.objectContaining({
                    paymentMethod: { type: 'NEQUI' },
                }),
            );
        });

        it('should process payment with PSE method', async () => {
            const mockTransaction = createMockTransaction();
            const mockProduct = createMockProduct();

            transactionRepository.findById.mockResolvedValue(Result.ok(mockTransaction));
            paymentGateway.processPayment.mockResolvedValue(
                Result.ok(mockApprovedPaymentResponse),
            );
            productRepository.findById.mockResolvedValue(Result.ok(mockProduct));
            productRepository.update.mockResolvedValue(Result.ok(mockProduct));
            transactionRepository.update.mockResolvedValue(Result.ok(mockTransaction));

            const result = await useCase.execute({
                transactionId: 'transaction-123',
                paymentMethod: { type: 'PSE' },
            });

            expect(result.isSuccess()).toBe(true);
            expect(paymentGateway.processPayment).toHaveBeenCalledWith(
                expect.objectContaining({
                    paymentMethod: { type: 'PSE' },
                }),
            );
        });
    });

    describe('execute - Different Currencies', () => {
        it('should process payment in COP', async () => {
            const mockTransaction = createMockTransaction();
            const mockProduct = createMockProduct();

            transactionRepository.findById.mockResolvedValue(Result.ok(mockTransaction));
            paymentGateway.processPayment.mockResolvedValue(
                Result.ok(mockApprovedPaymentResponse),
            );
            productRepository.findById.mockResolvedValue(Result.ok(mockProduct));
            productRepository.update.mockResolvedValue(Result.ok(mockProduct));
            transactionRepository.update.mockResolvedValue(Result.ok(mockTransaction));

            const result = await useCase.execute(mockPaymentInput);

            expect(result.isSuccess()).toBe(true);
            expect(paymentGateway.processPayment).toHaveBeenCalledWith(
                expect.objectContaining({
                    currency: 'COP',
                }),
            );
        });

        it('should process payment in USD', async () => {
            const usdTransaction = Transaction.create({
                id: 'transaction-usd',
                productId: 'product-123',
                quantity: 2,
                amount: new Money(100, 'USD'),
                customerEmail: 'john@example.com',
                firstName: 'John',
                lastName: 'Doe',
                address: '123 Main St',
                city: 'Bogotá',
                postalCode: '110111',
            });

            const usdProduct = new Product(
                'product-123',
                'Test Product',
                new Money(50, 'USD'),
                10,
                'Electronics',
            );

            transactionRepository.findById.mockResolvedValue(Result.ok(usdTransaction));
            paymentGateway.processPayment.mockResolvedValue(
                Result.ok({ ...mockApprovedPaymentResponse, currency: 'USD' }),
            );
            productRepository.findById.mockResolvedValue(Result.ok(usdProduct));
            productRepository.update.mockResolvedValue(Result.ok(usdProduct));
            transactionRepository.update.mockResolvedValue(Result.ok(usdTransaction));

            const result = await useCase.execute({
                transactionId: 'transaction-usd',
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
        it('should handle transaction with special characters in customer data', async () => {
            const specialTransaction = Transaction.create({
                id: 'transaction-special',
                productId: 'product-123',
                quantity: 2,
                amount: new Money(200000, 'COP'),
                customerEmail: 'josé.maría@example.com',
                firstName: 'José María',
                lastName: "O'Connor-García",
                address: 'Calle #123-45 Apto. 8º',
                city: 'Bogotá D.C.',
                postalCode: '110111',
            });

            const mockProduct = createMockProduct();

            transactionRepository.findById.mockResolvedValue(Result.ok(specialTransaction));
            paymentGateway.processPayment.mockResolvedValue(
                Result.ok(mockApprovedPaymentResponse),
            );
            productRepository.findById.mockResolvedValue(Result.ok(mockProduct));
            productRepository.update.mockResolvedValue(Result.ok(mockProduct));
            transactionRepository.update.mockResolvedValue(Result.ok(specialTransaction));

            const result = await useCase.execute({
                transactionId: 'transaction-special',
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
            const expensiveTransaction = Transaction.create({
                id: 'transaction-expensive',
                productId: 'product-luxury',
                quantity: 1,
                amount: new Money(500000000, 'COP'),
                customerEmail: 'john@example.com',
                firstName: 'John',
                lastName: 'Doe',
                address: '123 Main St',
                city: 'Bogotá',
                postalCode: '110111',
            });

            const expensiveProduct = new Product(
                'product-luxury',
                'Luxury Item',
                new Money(500000000, 'COP'),
                5,
                'Luxury',
            );

            transactionRepository.findById.mockResolvedValue(Result.ok(expensiveTransaction));
            paymentGateway.processPayment.mockResolvedValue(
                Result.ok({ ...mockApprovedPaymentResponse, amount: 500000000 }),
            );
            productRepository.findById.mockResolvedValue(Result.ok(expensiveProduct));
            productRepository.update.mockResolvedValue(Result.ok(expensiveProduct));
            transactionRepository.update.mockResolvedValue(Result.ok(expensiveTransaction));

            const result = await useCase.execute({
                transactionId: 'transaction-expensive',
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
            const minTransaction = Transaction.create({
                id: 'transaction-min',
                productId: 'product-cheap',
                quantity: 1,
                amount: new Money(1, 'COP'),
                customerEmail: 'john@example.com',
                firstName: 'John',
                lastName: 'Doe',
                address: '123 Main St',
                city: 'Bogotá',
                postalCode: '110111',
            });

            const cheapProduct = new Product(
                'product-cheap',
                'Cheap Item',
                new Money(1, 'COP'),
                100,
                'Budget',
            );

            transactionRepository.findById.mockResolvedValue(Result.ok(minTransaction));
            paymentGateway.processPayment.mockResolvedValue(
                Result.ok({ ...mockApprovedPaymentResponse, amount: 1 }),
            );
            productRepository.findById.mockResolvedValue(Result.ok(cheapProduct));
            productRepository.update.mockResolvedValue(Result.ok(cheapProduct));
            transactionRepository.update.mockResolvedValue(Result.ok(minTransaction));

            const result = await useCase.execute({
                transactionId: 'transaction-min',
                paymentMethod: { type: 'CARD', token: 'tok_test' },
            });

            expect(result.isSuccess()).toBe(true);
        });

        it('should handle transaction with single unit depleting stock', async () => {
            const lastUnitProduct = new Product(
                'product-last',
                'Last Unit',
                new Money(100000, 'COP'),
                1,
                'Limited',
            );

            const singleUnitTransaction = Transaction.create({
                id: 'transaction-last',
                productId: 'product-last',
                quantity: 1,
                amount: new Money(100000, 'COP'),
                customerEmail: 'john@example.com',
                firstName: 'John',
                lastName: 'Doe',
                address: '123 Main St',
                city: 'Bogotá',
                postalCode: '110111',
            });

            transactionRepository.findById.mockResolvedValue(Result.ok(singleUnitTransaction));
            paymentGateway.processPayment.mockResolvedValue(
                Result.ok(mockApprovedPaymentResponse),
            );
            productRepository.findById.mockResolvedValue(Result.ok(lastUnitProduct));
            productRepository.update.mockResolvedValue(Result.ok(lastUnitProduct));
            transactionRepository.update.mockResolvedValue(Result.ok(singleUnitTransaction));

            const result = await useCase.execute({
                transactionId: 'transaction-last',
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

            const testTransaction = Transaction.create({
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

            transactionRepository.findById.mockResolvedValue(Result.ok(testTransaction));
            paymentGateway.processPayment.mockResolvedValue(
                Result.ok(mockApprovedPaymentResponse),
            );
            productRepository.findById.mockResolvedValue(Result.ok(testProduct));
            productRepository.update.mockResolvedValue(Result.ok(testProduct));
            transactionRepository.update.mockResolvedValue(Result.ok(testTransaction));

            const result = await useCase.execute(mockPaymentInput);

            expect(result.isSuccess()).toBe(true);

            // Verify complete flow
            expect(transactionRepository.findById).toHaveBeenCalledWith('transaction-123');
            expect(paymentGateway.processPayment).toHaveBeenCalled();
            expect(productRepository.findById).toHaveBeenCalledWith('product-123');
            expect(testProduct.getStock()).toBe(8);
            expect(productRepository.update).toHaveBeenCalledWith(testProduct);
            expect(transactionRepository.update).toHaveBeenCalled();
        });

        it('should maintain transactional integrity on failures', async () => {
            const testProduct = new Product(
                'product-123',
                'Test Product',
                new Money(100000, 'COP'),
                1, // Insufficient stock
                'Electronics',
            );

            const testTransaction = createMockTransaction();

            transactionRepository.findById.mockResolvedValue(Result.ok(testTransaction));
            paymentGateway.processPayment.mockResolvedValue(
                Result.ok(mockApprovedPaymentResponse),
            );
            productRepository.findById.mockResolvedValue(Result.ok(testProduct));
            transactionRepository.update.mockResolvedValue(Result.ok(testTransaction));

            const result = await useCase.execute(mockPaymentInput);

            expect(result.isFailure()).toBe(true);

            // Product stock should remain unchanged
            expect(testProduct.getStock()).toBe(1);

            // Transaction should be marked as error
            expect(transactionRepository.update).toHaveBeenCalled();
            expect(testTransaction.errorMessage).toContain('Insufficient stock');
        });

        it('should verify transaction is approved after successful payment', async () => {
            const testProduct = createMockProduct();
            const testTransaction = createMockTransaction();

            transactionRepository.findById.mockResolvedValue(Result.ok(testTransaction));
            paymentGateway.processPayment.mockResolvedValue(
                Result.ok(mockApprovedPaymentResponse),
            );
            productRepository.findById.mockResolvedValue(Result.ok(testProduct));
            productRepository.update.mockResolvedValue(Result.ok(testProduct));
            transactionRepository.update.mockResolvedValue(Result.ok(testTransaction));

            const result = await useCase.execute(mockPaymentInput);

            expect(result.isSuccess()).toBe(true);
            const transaction = result.getValue();
            expect(transaction.getStatusValue()).toBe(TransactionStatus.APPROVED);
            expect(transaction.wompiTransactionId).toBe('wompi-trans-123');
            expect(transaction.wompiReference).toBe('ref-123');
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
                const transaction = Transaction.create({
                    id: `transaction-${i}`,
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

                transactionRepository.findById.mockResolvedValue(Result.ok(transaction));
                paymentGateway.processPayment.mockResolvedValue(
                    Result.ok(mockApprovedPaymentResponse),
                );
                productRepository.findById.mockResolvedValue(Result.ok(testProduct));
                productRepository.update.mockResolvedValue(Result.ok(testProduct));
                transactionRepository.update.mockResolvedValue(Result.ok(transaction));

                const result = await useCase.execute({
                    transactionId: `transaction-${i}`,
                    paymentMethod: { type: 'CARD', token: 'tok_test' },
                });

                expect(result.isSuccess()).toBe(true);
            }

            expect(paymentGateway.processPayment).toHaveBeenCalledTimes(5);
        });
    });
});
