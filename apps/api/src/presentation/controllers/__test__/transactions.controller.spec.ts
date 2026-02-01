import { HttpException, HttpStatus } from '@nestjs/common';
import { TransactionsController } from '../transactions.controller';
import {
  CreateTransactionUseCase,
  GetTransactionUseCase,
  ProcessPaymentUseCase,
} from '../../../application/use-cases';
import {
  CreateTransactionDto,
  ProcessPaymentDto,
  TransactionDto,
} from '../../../application/dtos';
import { Result } from '../../../shared/result/result';
import { TransactionStatus } from '../../../domain/value-objects';

describe('TransactionsController', () => {
  let controller: TransactionsController;
  let createTransactionUseCase: jest.Mocked<CreateTransactionUseCase>;
  let getTransactionUseCase: jest.Mocked<GetTransactionUseCase>;
  let processPaymentUseCase: jest.Mocked<ProcessPaymentUseCase>;

  const mockTransactionDto: TransactionDto = {
    id: 'transaction-123',
    productId: 'product-123',
    quantity: 2,
    amount: 200000,
    currency: 'COP',
    status: TransactionStatus.PENDING,
    customerEmail: 'john@example.com',
    wpTransactionId: 'wp-123',
    wpReference: 'ref-123',
    paymentMethod: 'CARD',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  };

  beforeEach(() => {
    createTransactionUseCase = {
      execute: jest.fn(),
    } as any;

    getTransactionUseCase = {
      execute: jest.fn(),
    } as any;

    processPaymentUseCase = {
      execute: jest.fn(),
    } as any;

    controller = new TransactionsController(
      createTransactionUseCase,
      getTransactionUseCase,
      processPaymentUseCase,
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('constructor', () => {
    it('should create controller instance', () => {
      expect(controller).toBeDefined();
      expect(controller).toBeInstanceOf(TransactionsController);
    });

    it('should inject all required use cases', () => {
      expect(controller['createTransactionUseCase']).toBe(
        createTransactionUseCase,
      );
      expect(controller['getTransactionUseCase']).toBe(getTransactionUseCase);
      expect(controller['processPaymentUseCase']).toBe(processPaymentUseCase);
    });
  });

  describe('createTransaction', () => {
    const createTransactionDto: CreateTransactionDto = {
      productId: 'product-123',
      quantity: 2,
      customerEmail: 'john@example.com',
      firstName: 'John',
      lastName: 'Doe',
      address: '123 Main St',
      city: 'Bogotá',
      postalCode: '110111',
    };

    it('should create transaction successfully without payment token', async () => {
      const mockTransaction = {
        id: 'transaction-123',
        toJSON: jest.fn().mockReturnValue(mockTransactionDto),
      } as any;

      createTransactionUseCase.execute.mockResolvedValue(
        Result.ok(mockTransaction),
      );

      const result = await controller.createTransaction(createTransactionDto);

      expect(result).toEqual(mockTransactionDto);
      expect(createTransactionUseCase.execute).toHaveBeenCalledWith({
        productId: createTransactionDto.productId,
        quantity: createTransactionDto.quantity,
        customerEmail: createTransactionDto.customerEmail,
        firstName: createTransactionDto.firstName,
        lastName: createTransactionDto.lastName,
        address: createTransactionDto.address,
        city: createTransactionDto.city,
        postalCode: createTransactionDto.postalCode,
      });
      expect(processPaymentUseCase.execute).not.toHaveBeenCalled();
    });

    it('should create transaction and process payment when token is provided', async () => {
      const dtoWithToken = {
        ...createTransactionDto,
        paymentToken: 'tok_test_12345',
      };

      const mockTransaction = {
        id: 'transaction-123',
        toJSON: jest.fn().mockReturnValue(mockTransactionDto),
      } as any;

      const mockPaymentResult = {
        toJSON: jest
          .fn()
          .mockReturnValue({ ...mockTransactionDto, status: 'APPROVED' }),
      } as any;

      createTransactionUseCase.execute.mockResolvedValue(
        Result.ok(mockTransaction),
      );
      processPaymentUseCase.execute.mockResolvedValue(
        Result.ok(mockPaymentResult),
      );

      const result = await controller.createTransaction(dtoWithToken);

      expect(result).toEqual({
        ...mockTransactionDto,
        status: 'APPROVED',
      });
      expect(createTransactionUseCase.execute).toHaveBeenCalled();
      expect(processPaymentUseCase.execute).toHaveBeenCalledWith({
        transactionId: 'transaction-123',
        paymentMethod: {
          type: 'CARD',
          token: 'tok_test_12345',
        },
      });
    });

    it('should throw HttpException when transaction creation fails', async () => {
      const error = new Error('Product not found');
      createTransactionUseCase.execute.mockResolvedValue(
        Result.fail(error) as any,
      );

      await expect(
        controller.createTransaction(createTransactionDto),
      ).rejects.toThrow(HttpException);

      await expect(
        controller.createTransaction(createTransactionDto),
      ).rejects.toMatchObject({
        message: 'Product not found',
        status: HttpStatus.BAD_REQUEST,
      });
    });

    it('should return updated transaction when payment fails', async () => {
      const dtoWithToken = {
        ...createTransactionDto,
        paymentToken: 'tok_test_12345',
      };

      const mockTransaction = {
        id: 'transaction-123',
        toJSON: jest.fn().mockReturnValue(mockTransactionDto),
      } as any;

      const mockUpdatedTransaction = {
        toJSON: jest
          .fn()
          .mockReturnValue({ ...mockTransactionDto, status: 'DECLINED' }),
      } as any;

      createTransactionUseCase.execute.mockResolvedValue(
        Result.ok(mockTransaction),
      );
      processPaymentUseCase.execute.mockResolvedValue(
        Result.fail(new Error('Payment declined')) as any,
      );
      getTransactionUseCase.execute.mockResolvedValue(
        Result.ok(mockUpdatedTransaction),
      );

      const result = await controller.createTransaction(dtoWithToken);

      expect(result).toEqual({ ...mockTransactionDto, status: 'DECLINED' });
      expect(getTransactionUseCase.execute).toHaveBeenCalledWith(
        'transaction-123',
      );
    });

    it('should throw HttpException when payment fails and cannot get updated transaction', async () => {
      const dtoWithToken = {
        ...createTransactionDto,
        paymentToken: 'tok_test_12345',
      };

      const mockTransaction = {
        id: 'transaction-123',
        toJSON: jest.fn().mockReturnValue(mockTransactionDto),
      } as any;

      createTransactionUseCase.execute.mockResolvedValue(
        Result.ok(mockTransaction),
      );
      processPaymentUseCase.execute.mockResolvedValue(
        Result.fail(new Error('Payment declined')) as any,
      );
      getTransactionUseCase.execute.mockResolvedValue(
        Result.fail(new Error('Transaction not found')) as any,
      );

      await expect(
        controller.createTransaction(dtoWithToken),
      ).rejects.toThrow(HttpException);

      await expect(
        controller.createTransaction(dtoWithToken),
      ).rejects.toMatchObject({
        message: 'Payment declined',
        status: HttpStatus.BAD_REQUEST,
      });
    });
  });

  describe('getTransaction', () => {
    it('should get transaction successfully', async () => {
      const transactionId = 'transaction-123';
      const mockTransaction = {
        toJSON: jest.fn().mockReturnValue(mockTransactionDto),
      } as any;

      getTransactionUseCase.execute.mockResolvedValue(
        Result.ok(mockTransaction),
      );

      const result = await controller.getTransaction(transactionId);

      expect(result).toEqual(mockTransactionDto);
      expect(getTransactionUseCase.execute).toHaveBeenCalledWith(transactionId);
    });

    it('should throw HttpException when transaction not found', async () => {
      const transactionId = 'non-existent-transaction';
      const error = new Error('Transaction not found');

      getTransactionUseCase.execute.mockResolvedValue(
        Result.fail(error) as any,
      );

      await expect(
        controller.getTransaction(transactionId),
      ).rejects.toThrow(HttpException);

      await expect(
        controller.getTransaction(transactionId),
      ).rejects.toMatchObject({
        message: 'Transaction not found',
        status: HttpStatus.NOT_FOUND,
      });
    });
  });

  describe('handleWpWebhook', () => {
    const mockWebhookPayload = {
      event: 'transaction.updated',
      data: {
        transaction: {
          reference: 'transaction-123',
          status: 'APPROVED',
          payment_method: {
            token: 'tok_test_12345',
          },
        },
      },
    };

    it('should process approved webhook successfully', async () => {
      const mockTransaction = {
        isPending: jest.fn().mockReturnValue(true),
      } as any;

      const mockPaymentResult = {
        toJSON: jest.fn().mockReturnValue(mockTransactionDto),
      } as any;

      getTransactionUseCase.execute.mockResolvedValue(
        Result.ok(mockTransaction),
      );
      processPaymentUseCase.execute.mockResolvedValue(
        Result.ok(mockPaymentResult),
      );

      const result = await controller.handleWpWebhook(mockWebhookPayload);

      expect(result).toEqual({ status: 'processed' });
      expect(getTransactionUseCase.execute).toHaveBeenCalledWith(
        'transaction-123',
      );
      expect(processPaymentUseCase.execute).toHaveBeenCalledWith({
        transactionId: 'transaction-123',
        paymentMethod: {
          type: 'CARD',
          token: 'tok_test_12345',
        },
      });
    });

    it('should ignore webhook when event or transaction data is missing', async () => {
      const invalidPayload = { event: 'transaction.updated' };

      const result = await controller.handleWpWebhook(invalidPayload);

      expect(result).toEqual({ status: 'ignored' });
      expect(getTransactionUseCase.execute).not.toHaveBeenCalled();
    });

    it('should return order_not_found when transaction does not exist', async () => {
      getTransactionUseCase.execute.mockResolvedValue(
        Result.fail(new Error('Transaction not found')) as any,
      );

      const result = await controller.handleWpWebhook(mockWebhookPayload);

      expect(result).toEqual({ status: 'order_not_found' });
      expect(processPaymentUseCase.execute).not.toHaveBeenCalled();
    });

    it('should ignore webhook when transaction is not pending', async () => {
      const mockTransaction = {
        isPending: jest.fn().mockReturnValue(false),
      } as any;

      getTransactionUseCase.execute.mockResolvedValue(
        Result.ok(mockTransaction),
      );

      const result = await controller.handleWpWebhook(mockWebhookPayload);

      expect(result).toEqual({ status: 'ignored' });
      expect(processPaymentUseCase.execute).not.toHaveBeenCalled();
    });

    it('should ignore webhook when status is not APPROVED', async () => {
      const declinedPayload = {
        ...mockWebhookPayload,
        data: {
          transaction: {
            ...mockWebhookPayload.data.transaction,
            status: 'DECLINED',
          },
        },
      };

      const mockTransaction = {
        isPending: jest.fn().mockReturnValue(true),
      } as any;

      getTransactionUseCase.execute.mockResolvedValue(
        Result.ok(mockTransaction),
      );

      const result = await controller.handleWpWebhook(declinedPayload);

      expect(result).toEqual({ status: 'ignored' });
      expect(processPaymentUseCase.execute).not.toHaveBeenCalled();
    });

    it('should return ignored when payment processing fails', async () => {
      const mockTransaction = {
        isPending: jest.fn().mockReturnValue(true),
      } as any;

      getTransactionUseCase.execute.mockResolvedValue(
        Result.ok(mockTransaction),
      );
      processPaymentUseCase.execute.mockResolvedValue(
        Result.fail(new Error('Payment processing failed')) as any,
      );

      const result = await controller.handleWpWebhook(mockWebhookPayload);

      expect(result).toEqual({ status: 'ignored' });
    });

    it('should handle errors gracefully and return error status', async () => {
      getTransactionUseCase.execute.mockRejectedValue(
        new Error('Database error'),
      );

      const consoleSpy = jest
        .spyOn(console, 'error')
        .mockImplementation(() => { });

      const result = await controller.handleWpWebhook(mockWebhookPayload);

      expect(result).toEqual({ status: 'error' });
      expect(consoleSpy).toHaveBeenCalledWith(
        '❌ Error procesando webhook:',
        expect.any(Error),
      );

      consoleSpy.mockRestore();
    });
  });

  describe('processPayment', () => {
    const processPaymentDto: ProcessPaymentDto = {
      orderId: 'transaction-123',
      paymentMethod: {
        type: 'CARD',
        token: 'tok_test_12345',
      },
    };

    it('should process payment successfully using orderId', async () => {
      const mockPaymentResult = {
        toJSON: jest.fn().mockReturnValue(mockTransactionDto),
      } as any;

      processPaymentUseCase.execute.mockResolvedValue(
        Result.ok(mockPaymentResult),
      );

      const result = await controller.processPayment(processPaymentDto);

      expect(result).toEqual(mockTransactionDto);
      expect(processPaymentUseCase.execute).toHaveBeenCalledWith({
        transactionId: 'transaction-123',
        paymentMethod: {
          type: 'CARD',
          token: 'tok_test_12345',
        },
      });
    });

    it('should process payment successfully using transactionId', async () => {
      const dtoWithTransactionId = {
        transactionId: 'transaction-456',
        paymentMethod: {
          type: 'CARD',
          token: 'tok_test_67890',
        },
      } as any;

      const mockPaymentResult = {
        toJSON: jest.fn().mockReturnValue(mockTransactionDto),
      } as any;

      processPaymentUseCase.execute.mockResolvedValue(
        Result.ok(mockPaymentResult),
      );

      const result = await controller.processPayment(dtoWithTransactionId);

      expect(result).toEqual(mockTransactionDto);
      expect(processPaymentUseCase.execute).toHaveBeenCalledWith({
        transactionId: 'transaction-456',
        paymentMethod: {
          type: 'CARD',
          token: 'tok_test_67890',
        },
      });
    });

    it('should throw HttpException when payment processing fails', async () => {
      const error = new Error('Payment declined');
      processPaymentUseCase.execute.mockResolvedValue(
        Result.fail(error) as any,
      );

      await expect(
        controller.processPayment(processPaymentDto),
      ).rejects.toThrow(HttpException);

      await expect(
        controller.processPayment(processPaymentDto),
      ).rejects.toMatchObject({
        message: 'Payment declined',
        status: HttpStatus.BAD_REQUEST,
      });
    });

    it('should handle different payment methods', async () => {
      const nequiPaymentDto = {
        orderId: 'transaction-123',
        paymentMethod: {
          type: 'NEQUI',
          phoneNumber: '3001234567',
        },
      } as any;

      const mockPaymentResult = {
        toJSON: jest.fn().mockReturnValue(mockTransactionDto),
      } as any;

      processPaymentUseCase.execute.mockResolvedValue(
        Result.ok(mockPaymentResult),
      );

      const result = await controller.processPayment(nequiPaymentDto);

      expect(result).toEqual(mockTransactionDto);
      expect(processPaymentUseCase.execute).toHaveBeenCalledWith({
        transactionId: 'transaction-123',
        paymentMethod: {
          type: 'NEQUI',
          phoneNumber: '3001234567',
        },
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle unexpected errors in createTransaction', async () => {
      const createTransactionDto: CreateTransactionDto = {
        productId: 'product-123',
        quantity: 2,
        customerEmail: 'john@example.com',
        firstName: 'John',
        lastName: 'Doe',
        address: '123 Main St',
        city: 'Bogotá',
        postalCode: '110111',
      };

      createTransactionUseCase.execute.mockRejectedValue(
        new Error('Unexpected error'),
      );

      await expect(
        controller.createTransaction(createTransactionDto),
      ).rejects.toThrow('Unexpected error');
    });

    it('should handle unexpected errors in getTransaction', async () => {
      getTransactionUseCase.execute.mockRejectedValue(
        new Error('Database connection error'),
      );

      await expect(
        controller.getTransaction('transaction-123'),
      ).rejects.toThrow('Database connection error');
    });

    it('should handle unexpected errors in processPayment', async () => {
      const processPaymentDto: ProcessPaymentDto = {
        orderId: 'transaction-123',
        paymentMethod: {
          type: 'CARD',
          token: 'tok_test_12345',
        },
      };

      processPaymentUseCase.execute.mockRejectedValue(
        new Error('Payment gateway timeout'),
      );

      await expect(
        controller.processPayment(processPaymentDto),
      ).rejects.toThrow('Payment gateway timeout');
    });
  });

  describe('Integration Scenarios', () => {
    it('should handle complete payment flow: create transaction with token and process', async () => {
      const createTransactionDto: CreateTransactionDto = {
        productId: 'product-123',
        quantity: 2,
        customerEmail: 'john@example.com',
        firstName: 'John',
        lastName: 'Doe',
        address: '123 Main St',
        city: 'Bogotá',
        postalCode: '110111',
        paymentToken: 'tok_test_12345',
      };

      const mockTransaction = {
        id: 'transaction-123',
        toJSON: jest.fn().mockReturnValue(mockTransactionDto),
      } as any;

      const mockApprovedTransaction = {
        toJSON: jest.fn().mockReturnValue({
          ...mockTransactionDto,
          status: TransactionStatus.APPROVED,
          wpTransactionId: 'wp-456',
        }),
      } as any;

      createTransactionUseCase.execute.mockResolvedValue(
        Result.ok(mockTransaction),
      );
      processPaymentUseCase.execute.mockResolvedValue(
        Result.ok(mockApprovedTransaction),
      );

      const result = await controller.createTransaction(createTransactionDto);

      expect(result.status).toBe(TransactionStatus.APPROVED);
      expect(result.wpTransactionId).toBe('wp-456');
      expect(createTransactionUseCase.execute).toHaveBeenCalledTimes(1);
      expect(processPaymentUseCase.execute).toHaveBeenCalledTimes(1);
    });

    it('should handle webhook retry after failed first payment attempt', async () => {
      const mockWebhookPayload = {
        event: 'transaction.updated',
        data: {
          transaction: {
            reference: 'transaction-123',
            status: 'APPROVED',
            payment_method: {
              token: 'tok_test_12345',
            },
          },
        },
      };

      const mockTransaction = {
        isPending: jest.fn().mockReturnValue(true),
      } as any;

      const mockPaymentResult = {
        toJSON: jest.fn().mockReturnValue({
          ...mockTransactionDto,
          status: TransactionStatus.APPROVED,
        }),
      } as any;

      getTransactionUseCase.execute.mockResolvedValue(
        Result.ok(mockTransaction),
      );
      processPaymentUseCase.execute
        .mockResolvedValueOnce(
          Result.fail(new Error('Temporary error')) as any,
        )
        .mockResolvedValueOnce(Result.ok(mockPaymentResult));

      const firstResult = await controller.handleWpWebhook(
        mockWebhookPayload,
      );
      expect(firstResult).toEqual({ status: 'ignored' });

      const secondResult = await controller.handleWpWebhook(
        mockWebhookPayload,
      );
      expect(secondResult).toEqual({ status: 'processed' });
    });
  });
});
