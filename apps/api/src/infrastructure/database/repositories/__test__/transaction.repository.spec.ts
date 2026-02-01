import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TransactionRepository } from '../transaction.repository';
import { OrderEntity } from '../../entities/transaction.entity';
import { Transaction } from '../../../../domain/entities';
import { Money, TransactionStatusVO, TransactionStatus } from '../../../../domain/value-objects';

describe('TransactionRepository', () => {
  let transactionRepository: TransactionRepository;
  let mockRepository: jest.Mocked<Repository<OrderEntity>>;

  const mockOrderEntity: OrderEntity = {
    id: 'tx-1',
    productId: 'prod-1',
    quantity: 2,
    totalPrice: 200,
    status: 'pending',
    customerEmail: 'test@example.com',
    firstName: 'John',
    lastName: 'Doe',
    address: '123 Main St',
    city: 'Bogotá',
    postalCode: '110111',
    createdAt: new Date('2024-01-01'),
    wpTransactionId: undefined,
    wpReference: undefined,
    paymentMethod: undefined,
    errorMessage: undefined,
  };

  const mockTransaction = new Transaction(
    'tx-1',
    'prod-1',
    2,
    new Money(200, 'COP'),
    new TransactionStatusVO(TransactionStatus.PENDING),
    'test@example.com',
    'John',
    'Doe',
    '123 Main St',
    'Bogotá',
    '110111',
  );

  beforeEach(async () => {
    mockRepository = {
      find: jest.fn(),
      findOne: jest.fn(),
      save: jest.fn(),
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TransactionRepository,
        {
          provide: getRepositoryToken(OrderEntity),
          useValue: mockRepository,
        },
      ],
    }).compile();

    transactionRepository = module.get<TransactionRepository>(TransactionRepository);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('findAll', () => {
    it('should return all transactions successfully', async () => {
      const entities = [mockOrderEntity];
      mockRepository.find.mockResolvedValue(entities);

      const result = await transactionRepository.findAll();

      expect(result.isSuccess()).toBe(true);
      expect(mockRepository.find).toHaveBeenCalledTimes(1);
      const transactions = result.getValue();
      expect(transactions).toHaveLength(1);
      expect(transactions[0].id).toBe('tx-1');
      expect(transactions[0].customerEmail).toBe('test@example.com');
    });

    it('should return empty array when no transactions exist', async () => {
      mockRepository.find.mockResolvedValue([]);

      const result = await transactionRepository.findAll();

      expect(result.isSuccess()).toBe(true);
      expect(result.getValue()).toEqual([]);
    });

    it('should return failure result when database error occurs', async () => {
      const error = new Error('Database connection error');
      mockRepository.find.mockRejectedValue(error);

      const result = await transactionRepository.findAll();

      expect(result.isFailure()).toBe(true);
      expect(result.getError()).toBe(error);
    });
  });

  describe('findById', () => {
    it('should return transaction when found', async () => {
      mockRepository.findOne.mockResolvedValue(mockOrderEntity);

      const result = await transactionRepository.findById('tx-1');

      expect(result.isSuccess()).toBe(true);
      expect(mockRepository.findOne).toHaveBeenCalledWith({ where: { id: 'tx-1' } });
      const transaction = result.getValue();
      expect(transaction.id).toBe('tx-1');
      expect(transaction.customerEmail).toBe('test@example.com');
    });

    it('should return failure when transaction not found', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      const result = await transactionRepository.findById('non-existent');

      expect(result.isFailure()).toBe(true);
      expect(result.getError().message).toBe('Transaction with id non-existent not found');
    });

    it('should return failure result when database error occurs', async () => {
      const error = new Error('Database error');
      mockRepository.findOne.mockRejectedValue(error);

      const result = await transactionRepository.findById('tx-1');

      expect(result.isFailure()).toBe(true);
      expect(result.getError()).toBe(error);
    });
  });

  describe('findByStatus', () => {
    it('should return transactions with specific status', async () => {
      const approvedEntity = { ...mockOrderEntity, status: 'approved' };
      mockRepository.find.mockResolvedValue([approvedEntity]);

      const result = await transactionRepository.findByStatus(TransactionStatus.APPROVED);

      expect(result.isSuccess()).toBe(true);
      expect(mockRepository.find).toHaveBeenCalledWith({ where: { status: TransactionStatus.APPROVED } });
      const transactions = result.getValue();
      expect(transactions).toHaveLength(1);
    });

    it('should return empty array when no transactions match status', async () => {
      mockRepository.find.mockResolvedValue([]);

      const result = await transactionRepository.findByStatus(TransactionStatus.DECLINED);

      expect(result.isSuccess()).toBe(true);
      expect(result.getValue()).toEqual([]);
    });

    it('should return failure result when database error occurs', async () => {
      const error = new Error('Database error');
      mockRepository.find.mockRejectedValue(error);

      const result = await transactionRepository.findByStatus(TransactionStatus.PENDING);

      expect(result.isFailure()).toBe(true);
      expect(result.getError()).toBe(error);
    });
  });

  describe('save', () => {
    it('should save transaction successfully', async () => {
      mockRepository.save.mockResolvedValue(mockOrderEntity);

      const result = await transactionRepository.save(mockTransaction);

      expect(result.isSuccess()).toBe(true);
      expect(mockRepository.save).toHaveBeenCalledTimes(1);
      const savedTransaction = result.getValue();
      expect(savedTransaction.id).toBe('tx-1');
      expect(savedTransaction.customerEmail).toBe('test@example.com');
    });

    it('should return failure when save fails', async () => {
      const error = new Error('Save failed');
      mockRepository.save.mockRejectedValue(error);

      const result = await transactionRepository.save(mockTransaction);

      expect(result.isFailure()).toBe(true);
      expect(result.getError()).toBe(error);
    });
  });

  describe('update', () => {
    it('should update transaction successfully', async () => {
      const updatedEntity = {
        ...mockOrderEntity,
        status: 'approved',
        wpTransactionId: 'wp-tx-123',
      };
      mockRepository.save.mockResolvedValue(updatedEntity);

      const updatedTransaction = new Transaction(
        'tx-1',
        'prod-1',
        2,
        new Money(200, 'COP'),
        new TransactionStatusVO(TransactionStatus.APPROVED),
        'test@example.com',
        'John',
        'Doe',
        '123 Main St',
        'Bogotá',
        '110111',
        'wp-tx-123',
      );

      const result = await transactionRepository.update(updatedTransaction);

      expect(result.isSuccess()).toBe(true);
      expect(mockRepository.save).toHaveBeenCalledTimes(1);
      const transaction = result.getValue();
      expect(transaction.getStatusValue()).toBe('approved');
    });

    it('should return failure when update fails', async () => {
      const error = new Error('Update failed');
      mockRepository.save.mockRejectedValue(error);

      const result = await transactionRepository.update(mockTransaction);

      expect(result.isFailure()).toBe(true);
      expect(result.getError()).toBe(error);
    });
  });
});
