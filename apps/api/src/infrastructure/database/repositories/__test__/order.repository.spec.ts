import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { OrderRepository } from '../order.repository';
import { OrderEntity } from '../../entities/transaction.entity';
import { Order } from '../../../../domain/entities';
import { Money, TransactionStatusVO, TransactionStatus } from '../../../../domain/value-objects';

describe('OrderRepository', () => {
  let orderRepository: OrderRepository;
  let mockRepository: jest.Mocked<Repository<OrderEntity>>;

  const mockOrderEntity: OrderEntity = {
    id: 'order-1',
    productId: 'prod-1',
    quantity: 3,
    totalPrice: 300,
    status: 'pending',
    customerEmail: 'customer@example.com',
    firstName: 'Jane',
    lastName: 'Smith',
    address: '456 Oak Ave',
    city: 'Medellín',
    postalCode: '050001',
    createdAt: new Date('2024-01-01'),
    wpTransactionId: undefined,
    wpReference: undefined,
    paymentMethod: undefined,
    errorMessage: undefined,
  };

  const mockOrder = new Order(
    'order-1',
    'prod-1',
    3,
    new Money(300, 'COP'),
    new TransactionStatusVO(TransactionStatus.PENDING),
    'Jane',
    'Smith',
    '456 Oak Ave',
    'Medellín',
    '050001',
    'customer@example.com',
  );

  beforeEach(async () => {
    mockRepository = {
      find: jest.fn(),
      findOne: jest.fn(),
      save: jest.fn(),
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OrderRepository,
        {
          provide: getRepositoryToken(OrderEntity),
          useValue: mockRepository,
        },
      ],
    }).compile();

    orderRepository = module.get<OrderRepository>(OrderRepository);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('findAll', () => {
    it('should return all orders successfully', async () => {
      const entities = [mockOrderEntity];
      mockRepository.find.mockResolvedValue(entities);

      const result = await orderRepository.findAll();

      expect(result.isSuccess()).toBe(true);
      expect(mockRepository.find).toHaveBeenCalledTimes(1);
      const orders = result.getValue();
      expect(orders).toHaveLength(1);
      expect(orders[0].id).toBe('order-1');
      expect(orders[0].customerEmail).toBe('customer@example.com');
    });

    it('should return empty array when no orders exist', async () => {
      mockRepository.find.mockResolvedValue([]);

      const result = await orderRepository.findAll();

      expect(result.isSuccess()).toBe(true);
      expect(result.getValue()).toEqual([]);
    });

    it('should return failure result when database error occurs', async () => {
      const error = new Error('Database connection error');
      mockRepository.find.mockRejectedValue(error);

      const result = await orderRepository.findAll();

      expect(result.isFailure()).toBe(true);
      expect(result.getError()).toBe(error);
    });

    it('should map multiple orders correctly', async () => {
      const entities = [
        mockOrderEntity,
        { ...mockOrderEntity, id: 'order-2', customerEmail: 'customer2@example.com' },
      ];
      mockRepository.find.mockResolvedValue(entities);

      const result = await orderRepository.findAll();

      expect(result.isSuccess()).toBe(true);
      const orders = result.getValue();
      expect(orders).toHaveLength(2);
      expect(orders[0].id).toBe('order-1');
      expect(orders[1].id).toBe('order-2');
    });
  });

  describe('findById', () => {
    it('should return order when found', async () => {
      mockRepository.findOne.mockResolvedValue(mockOrderEntity);

      const result = await orderRepository.findById('order-1');

      expect(result.isSuccess()).toBe(true);
      expect(mockRepository.findOne).toHaveBeenCalledWith({ where: { id: 'order-1' } });
      const order = result.getValue();
      expect(order.id).toBe('order-1');
      expect(order.customerEmail).toBe('customer@example.com');
      expect(order.firstName).toBe('Jane');
      expect(order.lastName).toBe('Smith');
    });

    it('should return failure when order not found', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      const result = await orderRepository.findById('non-existent');

      expect(result.isFailure()).toBe(true);
      expect(result.getError().message).toBe('Order with id non-existent not found');
    });

    it('should return failure result when database error occurs', async () => {
      const error = new Error('Database error');
      mockRepository.findOne.mockRejectedValue(error);

      const result = await orderRepository.findById('order-1');

      expect(result.isFailure()).toBe(true);
      expect(result.getError()).toBe(error);
    });
  });

  describe('findByStatus', () => {
    it('should return orders with pending status', async () => {
      const pendingOrders = [mockOrderEntity];
      mockRepository.find.mockResolvedValue(pendingOrders);

      const result = await orderRepository.findByStatus(TransactionStatus.PENDING);

      expect(result.isSuccess()).toBe(true);
      expect(mockRepository.find).toHaveBeenCalledWith({ where: { status: TransactionStatus.PENDING } });
      const orders = result.getValue();
      expect(orders).toHaveLength(1);
      expect(orders[0].getStatusValue()).toBe('pending');
    });

    it('should return orders with approved status', async () => {
      const approvedEntity = { ...mockOrderEntity, status: 'approved' };
      mockRepository.find.mockResolvedValue([approvedEntity]);

      const result = await orderRepository.findByStatus(TransactionStatus.APPROVED);

      expect(result.isSuccess()).toBe(true);
      expect(mockRepository.find).toHaveBeenCalledWith({ where: { status: TransactionStatus.APPROVED } });
      const orders = result.getValue();
      expect(orders).toHaveLength(1);
    });

    it('should return empty array when no orders match status', async () => {
      mockRepository.find.mockResolvedValue([]);

      const result = await orderRepository.findByStatus(TransactionStatus.DECLINED);

      expect(result.isSuccess()).toBe(true);
      expect(result.getValue()).toEqual([]);
    });

    it('should return failure result when database error occurs', async () => {
      const error = new Error('Database error');
      mockRepository.find.mockRejectedValue(error);

      const result = await orderRepository.findByStatus(TransactionStatus.PENDING);

      expect(result.isFailure()).toBe(true);
      expect(result.getError()).toBe(error);
    });
  });

  describe('save', () => {
    it('should save order successfully', async () => {
      mockRepository.save.mockResolvedValue(mockOrderEntity);

      const result = await orderRepository.save(mockOrder);

      expect(result.isSuccess()).toBe(true);
      expect(mockRepository.save).toHaveBeenCalledTimes(1);
      const savedOrder = result.getValue();
      expect(savedOrder.id).toBe('order-1');
      expect(savedOrder.customerEmail).toBe('customer@example.com');
    });

    it('should handle saving new order', async () => {
      const newOrderEntity = { ...mockOrderEntity, id: 'new-order' };
      mockRepository.save.mockResolvedValue(newOrderEntity);

      const newOrder = new Order(
        'new-order',
        'prod-2',
        1,
        new Money(100, 'COP'),
        new TransactionStatusVO(TransactionStatus.PENDING),
        'John',
        'Doe',
        '789 Pine St',
        'Cali',
        '760001',
        'john@example.com',
      );

      const result = await orderRepository.save(newOrder);

      expect(result.isSuccess()).toBe(true);
      const savedOrder = result.getValue();
      expect(savedOrder.id).toBe('new-order');
    });

    it('should return failure when save fails', async () => {
      const error = new Error('Save failed');
      mockRepository.save.mockRejectedValue(error);

      const result = await orderRepository.save(mockOrder);

      expect(result.isFailure()).toBe(true);
      expect(result.getError()).toBe(error);
    });
  });

  describe('update', () => {
    it('should update order successfully', async () => {
      const updatedEntity = {
        ...mockOrderEntity,
        status: 'approved',
        wpTransactionId: 'wp-order-123',
        wpReference: 'ref-123',
      };
      mockRepository.save.mockResolvedValue(updatedEntity);

      const updatedOrder = new Order(
        'order-1',
        'prod-1',
        3,
        new Money(300, 'COP'),
        new TransactionStatusVO(TransactionStatus.APPROVED),
        'Jane',
        'Smith',
        '456 Oak Ave',
        'Medellín',
        '050001',
        'customer@example.com',
        'wp-order-123',
        'ref-123',
      );

      const result = await orderRepository.update(updatedOrder);

      expect(result.isSuccess()).toBe(true);
      expect(mockRepository.save).toHaveBeenCalledTimes(1);
      const order = result.getValue();
      expect(order.getStatusValue()).toBe('approved');
      expect(order.wpTransactionId).toBe('wp-order-123');
    });

    it('should update order status to declined', async () => {
      const declinedEntity = {
        ...mockOrderEntity,
        status: 'declined',
        errorMessage: 'Payment declined',
      };
      mockRepository.save.mockResolvedValue(declinedEntity);

      const declinedOrder = new Order(
        'order-1',
        'prod-1',
        3,
        new Money(300, 'COP'),
        new TransactionStatusVO(TransactionStatus.DECLINED),
        'Jane',
        'Smith',
        '456 Oak Ave',
        'Medellín',
        '050001',
        'customer@example.com',
        undefined,
        undefined,
        undefined,
        'Payment declined',
      );

      const result = await orderRepository.update(declinedOrder);

      expect(result.isSuccess()).toBe(true);
      const order = result.getValue();
      expect(order.getStatusValue()).toBe('declined');
    });

    it('should return failure when update fails', async () => {
      const error = new Error('Update failed');
      mockRepository.save.mockRejectedValue(error);

      const result = await orderRepository.update(mockOrder);

      expect(result.isFailure()).toBe(true);
      expect(result.getError()).toBe(error);
    });
  });
});
