import { Test, TestingModule } from '@nestjs/testing';
import { GetTransactionUseCase } from '../get-transaction.use-case';
import { ITransactionRepository } from '../../../domain/repositories';
import { Transaction } from '../../../domain/entities';
import { Result } from '../../../shared/result';
import { Money } from '../../../domain/value-objects/money';
import { TransactionStatus, TransactionStatusVO } from '../../../domain/value-objects/transaction-status';

describe('GetTransactionUseCase', () => {
    let useCase: GetTransactionUseCase;
    let transactionRepository: jest.Mocked<ITransactionRepository>;

    const mockTransactionProps = {
        id: 'transaction-123',
        productId: 'product-456',
        quantity: 2,
        amount: new Money(200000, 'COP'),
        customerEmail: 'john.doe@example.com',
        firstName: 'John',
        lastName: 'Doe',
        address: 'Calle 123',
        city: 'Bogotá',
        postalCode: '110111',
    };

    const mockTransaction = Transaction.create(mockTransactionProps);

    beforeEach(async () => {
        // Create mock repository
        const mockTransactionRepository: Partial<ITransactionRepository> = {
            findById: jest.fn(),
        };

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                GetTransactionUseCase,
                {
                    provide: 'ITransactionRepository',
                    useValue: mockTransactionRepository,
                },
            ],
        }).compile();

        useCase = module.get<GetTransactionUseCase>(GetTransactionUseCase);
        transactionRepository = module.get('ITransactionRepository');
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('execute', () => {
        it('should be defined', () => {
            expect(useCase).toBeDefined();
        });

        it('should return success result with transaction when transaction is found', async () => {
            const transactionId = 'transaction-123';
            const successResult = Result.ok(mockTransaction);
            transactionRepository.findById.mockResolvedValue(successResult);

            const result = await useCase.execute(transactionId);

            expect(transactionRepository.findById).toHaveBeenCalledWith(transactionId);
            expect(transactionRepository.findById).toHaveBeenCalledTimes(1);
            expect(result.isSuccess()).toBe(true);
            expect(result.getValue()).toBe(mockTransaction);
        });

        it('should return failure result when transaction is not found', async () => {
            const transactionId = 'non-existent-transaction';
            const error = new Error('Transaction not found');
            const failureResult = Result.fail<Transaction, Error>(error);
            transactionRepository.findById.mockResolvedValue(failureResult);

            const result = await useCase.execute(transactionId);

            expect(transactionRepository.findById).toHaveBeenCalledWith(transactionId);
            expect(transactionRepository.findById).toHaveBeenCalledTimes(1);
            expect(result.isFailure()).toBe(true);
            expect(result.getError()).toBe(error);
            expect(result.getError().message).toBe('Transaction not found');
        });

        it('should return failure result when repository throws error', async () => {
            const transactionId = 'transaction-123';
            const error = new Error('Database connection error');
            const failureResult = Result.fail<Transaction, Error>(error);
            transactionRepository.findById.mockResolvedValue(failureResult);

            const result = await useCase.execute(transactionId);

            expect(transactionRepository.findById).toHaveBeenCalledWith(transactionId);
            expect(result.isFailure()).toBe(true);
            expect(result.getError().message).toBe('Database connection error');
        });

        it('should call repository with the correct transaction ID', async () => {
            const transactionId = 'specific-transaction-id-999';
            const successResult = Result.ok(mockTransaction);
            transactionRepository.findById.mockResolvedValue(successResult);

            await useCase.execute(transactionId);

            expect(transactionRepository.findById).toHaveBeenCalledWith(transactionId);
            expect(transactionRepository.findById).toHaveBeenCalledWith('specific-transaction-id-999');
        });

        it('should return transaction with all its properties intact', async () => {
            const transactionId = 'transaction-123';
            const successResult = Result.ok(mockTransaction);
            transactionRepository.findById.mockResolvedValue(successResult);

            const result = await useCase.execute(transactionId);
            const transaction = result.getValue();

            expect(transaction.id).toBe('transaction-123');
            expect(transaction.productId).toBe('product-456');
            expect(transaction.quantity).toBe(2);
            expect(transaction.amount.amount).toBe(200000);
            expect(transaction.amount.currency).toBe('COP');
            expect(transaction.customerEmail).toBe('john.doe@example.com');
            expect(transaction.firstName).toBe('John');
            expect(transaction.lastName).toBe('Doe');
            expect(transaction.address).toBe('Calle 123');
            expect(transaction.city).toBe('Bogotá');
            expect(transaction.postalCode).toBe('110111');
            expect(transaction.getStatusValue()).toBe(TransactionStatus.PENDING);
        });

        it('should handle pending transaction status', async () => {
            const pendingTransaction = Transaction.create(mockTransactionProps);
            const successResult = Result.ok(pendingTransaction);
            transactionRepository.findById.mockResolvedValue(successResult);

            const result = await useCase.execute('transaction-pending');
            const transaction = result.getValue();

            expect(transaction.getStatusValue()).toBe(TransactionStatus.PENDING);
            expect(transaction.isPending()).toBe(true);
        });

        it('should handle approved transaction with wp data', async () => {
            const approvedTransaction = Transaction.create(mockTransactionProps);
            approvedTransaction.approve('wp-transaction-123', 'wp-ref-123');

            const successResult = Result.ok(approvedTransaction);
            transactionRepository.findById.mockResolvedValue(successResult);

            const result = await useCase.execute('transaction-approved');
            const transaction = result.getValue();

            expect(transaction.getStatusValue()).toBe(TransactionStatus.APPROVED);
            expect(transaction.isPending()).toBe(false);
            expect(transaction.wpTransactionId).toBe('wp-transaction-123');
            expect(transaction.wpReference).toBe('wp-ref-123');
        });

        it('should handle declined transaction with error message', async () => {
            const declinedTransaction = Transaction.create(mockTransactionProps);
            declinedTransaction.decline('Insufficient funds');

            const successResult = Result.ok(declinedTransaction);
            transactionRepository.findById.mockResolvedValue(successResult);

            const result = await useCase.execute('transaction-declined');
            const transaction = result.getValue();

            expect(transaction.getStatusValue()).toBe(TransactionStatus.DECLINED);
            expect(transaction.errorMessage).toBe('Insufficient funds');
        });

        it('should handle error transaction status', async () => {
            const errorTransaction = Transaction.create(mockTransactionProps);
            errorTransaction.markAsError('Payment gateway timeout');

            const successResult = Result.ok(errorTransaction);
            transactionRepository.findById.mockResolvedValue(successResult);

            const result = await useCase.execute('transaction-error');
            const transaction = result.getValue();

            expect(transaction.getStatusValue()).toBe(TransactionStatus.ERROR);
            expect(transaction.errorMessage).toBe('Payment gateway timeout');
        });

        it('should handle empty string transaction ID', async () => {
            const transactionId = '';
            const error = new Error('Invalid transaction ID');
            const failureResult = Result.fail<Transaction, Error>(error);
            transactionRepository.findById.mockResolvedValue(failureResult);

            const result = await useCase.execute(transactionId);

            expect(transactionRepository.findById).toHaveBeenCalledWith('');
            expect(result.isFailure()).toBe(true);
        });

        it('should handle special characters in transaction ID', async () => {
            const transactionId = 'transaction-123-special-!@#$%';
            const successResult = Result.ok(mockTransaction);
            transactionRepository.findById.mockResolvedValue(successResult);

            await useCase.execute(transactionId);

            expect(transactionRepository.findById).toHaveBeenCalledWith(transactionId);
        });

        it('should handle UUID format transaction ID', async () => {
            const transactionId = '550e8400-e29b-41d4-a716-446655440000';
            const successResult = Result.ok(mockTransaction);
            transactionRepository.findById.mockResolvedValue(successResult);

            await useCase.execute(transactionId);

            expect(transactionRepository.findById).toHaveBeenCalledWith(transactionId);
        });
    });

    describe('Transaction variations', () => {
        it('should handle transaction with different quantities', async () => {
            const largeQuantityProps = { ...mockTransactionProps, quantity: 100 };
            const largeQuantityTransaction = Transaction.create(largeQuantityProps);

            transactionRepository.findById.mockResolvedValue(Result.ok(largeQuantityTransaction));

            const result = await useCase.execute('transaction-large');

            expect(result.getValue().quantity).toBe(100);
        });

        it('should handle transaction with different amounts', async () => {
            const largeAmountProps = {
                ...mockTransactionProps,
                amount: new Money(10000000, 'COP')
            };
            const largeAmountTransaction = Transaction.create(largeAmountProps);

            transactionRepository.findById.mockResolvedValue(Result.ok(largeAmountTransaction));

            const result = await useCase.execute('transaction-expensive');

            expect(result.getValue().amount.amount).toBe(10000000);
        });

        it('should handle transaction with different customer data', async () => {
            const differentCustomerProps = {
                ...mockTransactionProps,
                customerEmail: 'jane.smith@example.com',
                firstName: 'Jane',
                lastName: 'Smith',
                city: 'Medellín',
            };
            const differentCustomerTransaction = Transaction.create(differentCustomerProps);

            transactionRepository.findById.mockResolvedValue(Result.ok(differentCustomerTransaction));

            const result = await useCase.execute('transaction-different-customer');
            const transaction = result.getValue();

            expect(transaction.customerEmail).toBe('jane.smith@example.com');
            expect(transaction.firstName).toBe('Jane');
            expect(transaction.lastName).toBe('Smith');
            expect(transaction.city).toBe('Medellín');
        });

        it('should handle transaction with payment method information', async () => {
            const transactionWithPayment = Transaction.create(mockTransactionProps);
            transactionWithPayment.updateStatus(TransactionStatus.APPROVED, {
                transactionId: 'wp-123',
                reference: 'ref-123',
                paymentMethod: 'CARD',
            });

            transactionRepository.findById.mockResolvedValue(Result.ok(transactionWithPayment));

            const result = await useCase.execute('transaction-payment');
            const transaction = result.getValue();

            expect(transaction.paymentMethod).toBe('CARD');
            expect(transaction.wpTransactionId).toBe('wp-123');
            expect(transaction.wpReference).toBe('ref-123');
        });
    });

    describe('Integration scenarios', () => {
        it('should work in a typical successful retrieval flow', async () => {
            // Arrange: Setup repository to return a valid transaction
            const transactionId = 'transaction-integration-test';
            const transaction = Transaction.create({
                ...mockTransactionProps,
                id: transactionId,
            });
            transactionRepository.findById.mockResolvedValue(Result.ok(transaction));

            // Act: Execute the use case
            const result = await useCase.execute(transactionId);

            // Assert: Verify the result
            expect(result.isSuccess()).toBe(true);
            expect(result.getValue().id).toBe(transactionId);
            expect(result.getValue().customerEmail).toBe('john.doe@example.com');
            expect(result.getValue().isPending()).toBe(true);
        });

        it('should work in a typical failure flow', async () => {
            // Arrange: Setup repository to return error
            const transactionId = 'non-existent';
            const error = new Error(`Transaction with id ${transactionId} not found`);
            transactionRepository.findById.mockResolvedValue(Result.fail(error));

            // Act: Execute the use case
            const result = await useCase.execute(transactionId);

            // Assert: Verify the error
            expect(result.isFailure()).toBe(true);
            expect(result.getError().message).toContain('not found');
        });

        it('should retrieve transaction and verify its state', async () => {
            const transaction = Transaction.create(mockTransactionProps);
            transaction.approve('wp-final-123', 'ref-final-123');

            transactionRepository.findById.mockResolvedValue(Result.ok(transaction));

            const result = await useCase.execute('transaction-state-check');
            const retrievedTransaction = result.getValue();

            // Verify transaction state
            expect(retrievedTransaction.getStatusValue()).toBe(TransactionStatus.APPROVED);
            expect(retrievedTransaction.isPending()).toBe(false);
            expect(retrievedTransaction.wpTransactionId).toBe('wp-final-123');
        });

        it('should retrieve transaction and verify immutability', async () => {
            const transaction = Transaction.create(mockTransactionProps);
            transactionRepository.findById.mockResolvedValue(Result.ok(transaction));

            const result = await useCase.execute('transaction-immutable');
            const retrievedTransaction = result.getValue();

            // Verify immutable properties
            expect(retrievedTransaction.id).toBe(mockTransactionProps.id);
            expect(retrievedTransaction.productId).toBe(mockTransactionProps.productId);
            expect(retrievedTransaction.quantity).toBe(mockTransactionProps.quantity);
            expect(retrievedTransaction.amount).toBe(mockTransactionProps.amount);
        });
    });

    describe('Error handling', () => {
        it('should handle database connection errors', async () => {
            const error = new Error('Database connection failed');
            transactionRepository.findById.mockResolvedValue(Result.fail(error));

            const result = await useCase.execute('transaction-123');

            expect(result.isFailure()).toBe(true);
            expect(result.getError().message).toBe('Database connection failed');
        });

        it('should handle timeout errors', async () => {
            const error = new Error('Query timeout exceeded');
            transactionRepository.findById.mockResolvedValue(Result.fail(error));

            const result = await useCase.execute('transaction-123');

            expect(result.isFailure()).toBe(true);
            expect(result.getError().message).toBe('Query timeout exceeded');
        });

        it('should handle network errors', async () => {
            const error = new Error('Network connection failed');
            transactionRepository.findById.mockResolvedValue(Result.fail(error));

            const result = await useCase.execute('transaction-123');

            expect(result.isFailure()).toBe(true);
            expect(result.getError().message).toBe('Network connection failed');
        });

        it('should handle invalid ID format errors', async () => {
            const error = new Error('Invalid transaction ID format');
            transactionRepository.findById.mockResolvedValue(Result.fail(error));

            const result = await useCase.execute('invalid-format');

            expect(result.isFailure()).toBe(true);
            expect(result.getError().message).toBe('Invalid transaction ID format');
        });
    });

    describe('Dependency injection', () => {
        it('should inject ITransactionRepository correctly', () => {
            expect(transactionRepository).toBeDefined();
            expect(transactionRepository.findById).toBeDefined();
        });

        it('should use the injected repository instance', async () => {
            const transactionId = 'test-injection';
            transactionRepository.findById.mockResolvedValue(Result.ok(mockTransaction));

            await useCase.execute(transactionId);

            expect(transactionRepository.findById).toHaveBeenCalled();
        });
    });

    describe('Transaction lifecycle states', () => {
        it('should retrieve transaction in each possible state', async () => {
            const states = [
                TransactionStatus.PENDING,
                TransactionStatus.APPROVED,
                TransactionStatus.DECLINED,
                TransactionStatus.ERROR,
            ];

            for (const status of states) {
                const transaction = Transaction.create(mockTransactionProps);

                if (status === TransactionStatus.APPROVED) {
                    transaction.approve('wp-123', 'ref-123');
                } else if (status === TransactionStatus.DECLINED) {
                    transaction.decline('Test decline');
                } else if (status === TransactionStatus.ERROR) {
                    transaction.markAsError('Test error');
                }

                transactionRepository.findById.mockResolvedValue(Result.ok(transaction));
                const result = await useCase.execute(`transaction-${status}`);

                expect(result.getValue().getStatusValue()).toBe(status);
            }
        });
    });

    describe('Data serialization', () => {
        it('should retrieve transaction and verify JSON serialization', async () => {
            const transaction = Transaction.create(mockTransactionProps);
            transactionRepository.findById.mockResolvedValue(Result.ok(transaction));

            const result = await useCase.execute('transaction-json');
            const retrievedTransaction = result.getValue();
            const json = retrievedTransaction.toJSON();

            expect(json.id).toBe(mockTransactionProps.id);
            expect(json.productId).toBe(mockTransactionProps.productId);
            expect(json.quantity).toBe(mockTransactionProps.quantity);
            expect(json.amount).toBe(mockTransactionProps.amount.amount);
            expect(json.currency).toBe(mockTransactionProps.amount.currency);
            expect(json.status).toBe(TransactionStatus.PENDING);
        });

        it('should retrieve approved transaction with complete serialization', async () => {
            const transaction = Transaction.create(mockTransactionProps);
            transaction.approve('wp-serialization-123', 'ref-serialization-123');

            transactionRepository.findById.mockResolvedValue(Result.ok(transaction));

            const result = await useCase.execute('transaction-serialization');
            const json = result.getValue().toJSON();

            expect(json.status).toBe(TransactionStatus.APPROVED);
            expect(json.wpTransactionId).toBe('wp-serialization-123');
            expect(json.wpReference).toBe('ref-serialization-123');
        });
    });
});
