import { HttpException, HttpStatus } from '@nestjs/common';
import { OrdersController } from '../orders.controller';
import {
  CreateOrderUseCase,
  GetOrderUseCase,
  ProcessOrderPaymentUseCase,
} from '../../../application/use-cases';
import {
  CreateOrderDto,
  ProcessPaymentDto,
  OrderDto,
} from '../../../application/dtos';
import { Result } from '../../../shared/result/result';
import { TransactionStatus } from '../../../domain/value-objects';

describe('OrdersController', () => {
  let controller: OrdersController;
  let createOrderUseCase: jest.Mocked<CreateOrderUseCase>;
  let getOrderUseCase: jest.Mocked<GetOrderUseCase>;
  let processOrderPaymentUseCase: jest.Mocked<ProcessOrderPaymentUseCase>;

  const mockOrderDto: OrderDto = {
    id: 'order-123',
    productId: 'product-123',
    quantity: 2,
    totalPrice: 200000,
    status: TransactionStatus.PENDING,
    firstName: 'John',
    lastName: 'Doe',
    address: '123 Main St',
    city: 'Bogotá',
    postalCode: '110111',
    customerEmail: 'john@example.com',
    createdAt: new Date('2024-01-01'),
  };

  beforeEach(() => {
    createOrderUseCase = {
      execute: jest.fn(),
    } as any;

    getOrderUseCase = {
      execute: jest.fn(),
    } as any;

    processOrderPaymentUseCase = {
      execute: jest.fn(),
    } as any;

    controller = new OrdersController(
      createOrderUseCase,
      getOrderUseCase,
      processOrderPaymentUseCase,
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('constructor', () => {
    it('should create controller instance', () => {
      expect(controller).toBeDefined();
      expect(controller).toBeInstanceOf(OrdersController);
    });

    it('should inject all required use cases', () => {
      expect(controller['createOrderUseCase']).toBe(createOrderUseCase);
      expect(controller['getOrderUseCase']).toBe(getOrderUseCase);
      expect(controller['processOrderPaymentUseCase']).toBe(
        processOrderPaymentUseCase,
      );
    });
  });

  describe('createOrder', () => {
    const createOrderDto: CreateOrderDto = {
      productId: 'product-123',
      quantity: 2,
      firstName: 'John',
      lastName: 'Doe',
      address: '123 Main St',
      city: 'Bogotá',
      postalCode: '110111',
      customerEmail: 'john@example.com',
    };

    it('should create order successfully', async () => {
      const mockOrder = {
        toJSON: jest.fn().mockReturnValue(mockOrderDto),
      } as any;

      createOrderUseCase.execute.mockResolvedValue(Result.ok(mockOrder));

      const result = await controller.createOrder(createOrderDto);

      expect(result).toEqual(mockOrderDto);
      expect(createOrderUseCase.execute).toHaveBeenCalledWith({
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
      expect(mockOrder.toJSON).toHaveBeenCalledTimes(1);
    });

    it('should call use case with correct shipping address structure', async () => {
      const mockOrder = {
        toJSON: jest.fn().mockReturnValue(mockOrderDto),
      } as any;

      createOrderUseCase.execute.mockResolvedValue(Result.ok(mockOrder));

      await controller.createOrder(createOrderDto);

      const callArgs = createOrderUseCase.execute.mock.calls[0][0];
      expect(callArgs.shippingAddress).toEqual({
        firstName: 'John',
        lastName: 'Doe',
        address: '123 Main St',
        city: 'Bogotá',
        postalCode: '110111',
      });
    });

    it('should throw HttpException with BAD_REQUEST when use case fails', async () => {
      const error = new Error('Insufficient stock');
      createOrderUseCase.execute.mockResolvedValue(Result.fail(error));

      await expect(controller.createOrder(createOrderDto)).rejects.toThrow(
        new HttpException('Insufficient stock', HttpStatus.BAD_REQUEST),
      );
    });

    it('should throw HttpException with error message from use case', async () => {
      const error = new Error('Product not found');
      createOrderUseCase.execute.mockResolvedValue(Result.fail(error));

      await expect(controller.createOrder(createOrderDto)).rejects.toThrow(
        HttpException,
      );
      await expect(controller.createOrder(createOrderDto)).rejects.toThrow(
        'Product not found',
      );
    });

    it('should throw HttpException with BAD_REQUEST status code', async () => {
      const error = new Error('Invalid quantity');
      createOrderUseCase.execute.mockResolvedValue(Result.fail(error));

      try {
        await controller.createOrder(createOrderDto);
        fail('Should have thrown HttpException');
      } catch (e) {
        expect(e).toBeInstanceOf(HttpException);
        expect((e as HttpException).getStatus()).toBe(HttpStatus.BAD_REQUEST);
      }
    });

    it('should map DTO fields to use case command correctly', async () => {
      const dto: CreateOrderDto = {
        productId: 'prod-456',
        quantity: 5,
        firstName: 'Jane',
        lastName: 'Smith',
        address: '456 Oak Ave',
        city: 'Medellín',
        postalCode: '050001',
        customerEmail: 'jane@example.com',
      };

      const mockOrder = {
        toJSON: jest.fn().mockReturnValue(mockOrderDto),
      } as any;

      createOrderUseCase.execute.mockResolvedValue(Result.ok(mockOrder));

      await controller.createOrder(dto);

      expect(createOrderUseCase.execute).toHaveBeenCalledWith({
        productId: 'prod-456',
        quantity: 5,
        shippingAddress: {
          firstName: 'Jane',
          lastName: 'Smith',
          address: '456 Oak Ave',
          city: 'Medellín',
          postalCode: '050001',
        },
        customerEmail: 'jane@example.com',
      });
    });

    it('should return OrderDto from toJSON method', async () => {
      const expectedDto: OrderDto = {
        ...mockOrderDto,
        id: 'new-order-id',
      };

      const mockOrder = {
        toJSON: jest.fn().mockReturnValue(expectedDto),
      } as any;

      createOrderUseCase.execute.mockResolvedValue(Result.ok(mockOrder));

      const result = await controller.createOrder(createOrderDto);

      expect(result).toEqual(expectedDto);
      expect(result.id).toBe('new-order-id');
    });
  });

  describe('getOrder', () => {
    it('should get order successfully', async () => {
      const orderId = 'order-123';
      const mockOrder = {
        toJSON: jest.fn().mockReturnValue(mockOrderDto),
      } as any;

      getOrderUseCase.execute.mockResolvedValue(Result.ok(mockOrder));

      const result = await controller.getOrder(orderId);

      expect(result).toEqual(mockOrderDto);
      expect(getOrderUseCase.execute).toHaveBeenCalledWith(orderId);
      expect(mockOrder.toJSON).toHaveBeenCalledTimes(1);
    });

    it('should call use case with order id', async () => {
      const orderId = 'order-456';
      const mockOrder = {
        toJSON: jest.fn().mockReturnValue(mockOrderDto),
      } as any;

      getOrderUseCase.execute.mockResolvedValue(Result.ok(mockOrder));

      await controller.getOrder(orderId);

      expect(getOrderUseCase.execute).toHaveBeenCalledWith(orderId);
      expect(getOrderUseCase.execute).toHaveBeenCalledTimes(1);
    });

    it('should throw HttpException with NOT_FOUND when use case fails', async () => {
      const error = new Error('Order not found');
      getOrderUseCase.execute.mockResolvedValue(Result.fail(error));

      await expect(controller.getOrder('order-123')).rejects.toThrow(
        new HttpException('Order not found', HttpStatus.NOT_FOUND),
      );
    });

    it('should throw HttpException with error message from use case', async () => {
      const error = new Error('Invalid order ID');
      getOrderUseCase.execute.mockResolvedValue(Result.fail(error));

      await expect(controller.getOrder('invalid-id')).rejects.toThrow(
        HttpException,
      );
      await expect(controller.getOrder('invalid-id')).rejects.toThrow(
        'Invalid order ID',
      );
    });

    it('should throw HttpException with NOT_FOUND status code', async () => {
      const error = new Error('Order does not exist');
      getOrderUseCase.execute.mockResolvedValue(Result.fail(error));

      try {
        await controller.getOrder('nonexistent-order');
        fail('Should have thrown HttpException');
      } catch (e) {
        expect(e).toBeInstanceOf(HttpException);
        expect((e as HttpException).getStatus()).toBe(HttpStatus.NOT_FOUND);
      }
    });

    it('should return OrderDto from toJSON method', async () => {
      const expectedDto: OrderDto = {
        ...mockOrderDto,
        status: TransactionStatus.APPROVED,
        wompiTransactionId: 'wompi-tx-123',
      };

      const mockOrder = {
        toJSON: jest.fn().mockReturnValue(expectedDto),
      } as any;

      getOrderUseCase.execute.mockResolvedValue(Result.ok(mockOrder));

      const result = await controller.getOrder('order-123');

      expect(result).toEqual(expectedDto);
      expect(result.status).toBe(TransactionStatus.APPROVED);
      expect(result.wompiTransactionId).toBe('wompi-tx-123');
    });

    it('should handle different order IDs', async () => {
      const mockOrder = {
        toJSON: jest.fn().mockReturnValue(mockOrderDto),
      } as any;

      getOrderUseCase.execute.mockResolvedValue(Result.ok(mockOrder));

      await controller.getOrder('order-1');
      await controller.getOrder('order-2');
      await controller.getOrder('order-3');

      expect(getOrderUseCase.execute).toHaveBeenCalledTimes(3);
      expect(getOrderUseCase.execute).toHaveBeenCalledWith('order-1');
      expect(getOrderUseCase.execute).toHaveBeenCalledWith('order-2');
      expect(getOrderUseCase.execute).toHaveBeenCalledWith('order-3');
    });
  });

  describe('processPayment', () => {
    const processPaymentDto: ProcessPaymentDto = {
      orderId: 'order-123',
      paymentMethod: {
        type: 'CARD',
        token: 'tok_test_123',
        installments: 1,
      },
    };

    it('should process payment successfully', async () => {
      const approvedOrderDto = {
        ...mockOrderDto,
        status: TransactionStatus.APPROVED,
        wompiTransactionId: 'wompi-tx-123',
        wompiReference: 'wompi-ref-456',
        paymentMethod: 'CARD',
      };

      const mockOrder = {
        toJSON: jest.fn().mockReturnValue(approvedOrderDto),
      } as any;

      processOrderPaymentUseCase.execute.mockResolvedValue(
        Result.ok(mockOrder),
      );

      const result = await controller.processPayment(processPaymentDto);

      expect(result).toEqual(approvedOrderDto);
      expect(processOrderPaymentUseCase.execute).toHaveBeenCalledWith({
        orderId: processPaymentDto.orderId,
        paymentMethod: processPaymentDto.paymentMethod,
      });
      expect(mockOrder.toJSON).toHaveBeenCalledTimes(1);
    });

    it('should call use case with correct payment data', async () => {
      const mockOrder = {
        toJSON: jest.fn().mockReturnValue(mockOrderDto),
      } as any;

      processOrderPaymentUseCase.execute.mockResolvedValue(
        Result.ok(mockOrder),
      );

      await controller.processPayment(processPaymentDto);

      expect(processOrderPaymentUseCase.execute).toHaveBeenCalledWith({
        orderId: 'order-123',
        paymentMethod: {
          type: 'CARD',
          token: 'tok_test_123',
          installments: 1,
        },
      });
    });

    it('should throw HttpException with BAD_REQUEST when use case fails', async () => {
      const error = new Error('Payment declined');
      processOrderPaymentUseCase.execute.mockResolvedValue(Result.fail(error));

      await expect(
        controller.processPayment(processPaymentDto),
      ).rejects.toThrow(
        new HttpException('Payment declined', HttpStatus.BAD_REQUEST),
      );
    });

    it('should throw HttpException with error message from use case', async () => {
      const error = new Error('Invalid payment method');
      processOrderPaymentUseCase.execute.mockResolvedValue(Result.fail(error));

      await expect(
        controller.processPayment(processPaymentDto),
      ).rejects.toThrow(HttpException);
      await expect(
        controller.processPayment(processPaymentDto),
      ).rejects.toThrow('Invalid payment method');
    });

    it('should throw HttpException with BAD_REQUEST status code', async () => {
      const error = new Error('Wompi API error');
      processOrderPaymentUseCase.execute.mockResolvedValue(Result.fail(error));

      try {
        await controller.processPayment(processPaymentDto);
        fail('Should have thrown HttpException');
      } catch (e) {
        expect(e).toBeInstanceOf(HttpException);
        expect((e as HttpException).getStatus()).toBe(HttpStatus.BAD_REQUEST);
      }
    });

    it('should handle payment with different payment methods', async () => {
      const psePayment: ProcessPaymentDto = {
        orderId: 'order-456',
        paymentMethod: {
          type: 'PSE',
          token: 'tok_pse_123',
        },
      };

      const mockOrder = {
        toJSON: jest.fn().mockReturnValue(mockOrderDto),
      } as any;

      processOrderPaymentUseCase.execute.mockResolvedValue(
        Result.ok(mockOrder),
      );

      await controller.processPayment(psePayment);

      expect(processOrderPaymentUseCase.execute).toHaveBeenCalledWith({
        orderId: 'order-456',
        paymentMethod: {
          type: 'PSE',
          token: 'tok_pse_123',
        },
      });
    });


    it('should return approved OrderDto after successful payment', async () => {
      const approvedDto: OrderDto = {
        ...mockOrderDto,
        status: TransactionStatus.APPROVED,
        wompiTransactionId: 'wompi-tx-789',
        wompiReference: 'wompi-ref-789',
        paymentMethod: 'CARD',
      };

      const mockOrder = {
        toJSON: jest.fn().mockReturnValue(approvedDto),
      } as any;

      processOrderPaymentUseCase.execute.mockResolvedValue(
        Result.ok(mockOrder),
      );

      const result = await controller.processPayment(processPaymentDto);

      expect(result.status).toBe(TransactionStatus.APPROVED);
      expect(result.wompiTransactionId).toBe('wompi-tx-789');
      expect(result.wompiReference).toBe('wompi-ref-789');
      expect(result.paymentMethod).toBe('CARD');
    });

    it('should handle payment errors with error message in result', async () => {
      const error = new Error('Order already paid');
      processOrderPaymentUseCase.execute.mockResolvedValue(Result.fail(error));

      await expect(
        controller.processPayment(processPaymentDto),
      ).rejects.toThrow('Order already paid');
    });
  });

  describe('error handling', () => {
    it('should handle use case execution errors in createOrder', async () => {
      createOrderUseCase.execute.mockRejectedValue(
        new Error('Unexpected error'),
      );

      await expect(
        controller.createOrder({} as CreateOrderDto),
      ).rejects.toThrow('Unexpected error');
    });

    it('should handle use case execution errors in getOrder', async () => {
      getOrderUseCase.execute.mockRejectedValue(new Error('Database error'));

      await expect(controller.getOrder('order-123')).rejects.toThrow(
        'Database error',
      );
    });

    it('should handle use case execution errors in processPayment', async () => {
      processOrderPaymentUseCase.execute.mockRejectedValue(
        new Error('Network error'),
      );

      await expect(
        controller.processPayment({} as ProcessPaymentDto),
      ).rejects.toThrow('Network error');
    });
  });

  describe('Result pattern integration', () => {
    it('should call getValue when result is success in createOrder', async () => {
      const mockOrder = {
        toJSON: jest.fn().mockReturnValue(mockOrderDto),
      } as any;

      const resultSpy = Result.ok(mockOrder);
      const getValueSpy = jest.spyOn(resultSpy, 'getValue');

      createOrderUseCase.execute.mockResolvedValue(resultSpy);

      await controller.createOrder({} as CreateOrderDto);

      expect(getValueSpy).toHaveBeenCalled();
    });
  });
});
