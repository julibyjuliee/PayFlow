import { HttpExceptionFilter } from '../http-exception.filter';
import { HttpException, HttpStatus, ArgumentsHost } from '@nestjs/common';
import { Response } from 'express';

describe('HttpExceptionFilter', () => {
  let filter: HttpExceptionFilter;
  let mockResponse: Partial<Response>;
  let mockArgumentsHost: ArgumentsHost;

  beforeEach(() => {
    filter = new HttpExceptionFilter();

    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };

    mockArgumentsHost = {
      switchToHttp: jest.fn().mockReturnValue({
        getResponse: jest.fn().mockReturnValue(mockResponse),
      }),
    } as any;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('catch', () => {
    it('should handle HttpException with string response', () => {
      const exception = new HttpException('Not found', HttpStatus.NOT_FOUND);

      filter.catch(exception, mockArgumentsHost);

      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          statusCode: 404,
          message: 'Not found',
          error: 'Internal Server Error',
          timestamp: expect.any(String),
        }),
      );
    });

    it('should handle HttpException with object response', () => {
      const exceptionResponse = {
        message: 'Validation failed',
        error: 'Bad Request',
      };
      const exception = new HttpException(exceptionResponse, HttpStatus.BAD_REQUEST);

      filter.catch(exception, mockArgumentsHost);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          statusCode: 400,
          message: 'Validation failed',
          error: 'Bad Request',
          timestamp: expect.any(String),
        }),
      );
    });

    it('should handle HttpException with object response without message field', () => {
      const exception = new HttpException(
        { error: 'Custom Error' } as any,
        HttpStatus.FORBIDDEN,
      );

      filter.catch(exception, mockArgumentsHost);

      expect(mockResponse.status).toHaveBeenCalledWith(403);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          statusCode: 403,
          message: exception.message,
          error: 'Custom Error',
          timestamp: expect.any(String),
        }),
      );
    });

    it('should handle HttpException with object response without error field', () => {
      const exception = new HttpException(
        { message: 'Unauthorized access' } as any,
        HttpStatus.UNAUTHORIZED,
      );

      filter.catch(exception, mockArgumentsHost);

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          statusCode: 401,
          message: 'Unauthorized access',
          error: 'Internal Server Error',
          timestamp: expect.any(String),
        }),
      );
    });

    it('should handle regular Error instance', () => {
      const exception = new Error('Something went wrong');

      filter.catch(exception, mockArgumentsHost);

      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          statusCode: 500,
          message: 'Something went wrong',
          error: 'Internal Server Error',
          timestamp: expect.any(String),
        }),
      );
    });

    it('should handle unknown exception type', () => {
      const exception = 'Unknown error';

      filter.catch(exception, mockArgumentsHost);

      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          statusCode: 500,
          message: 'Internal server error',
          error: 'Internal Server Error',
          timestamp: expect.any(String),
        }),
      );
    });

    it('should handle HttpException with INTERNAL_SERVER_ERROR status', () => {
      const exception = new HttpException(
        'Internal error occurred',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );

      filter.catch(exception, mockArgumentsHost);

      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          statusCode: 500,
          message: 'Internal error occurred',
          timestamp: expect.any(String),
        }),
      );
    });

    it('should include proper ISO timestamp', () => {
      const exception = new HttpException('Test', HttpStatus.BAD_REQUEST);
      const beforeCall = new Date();

      filter.catch(exception, mockArgumentsHost);

      const afterCall = new Date();
      const callArgs = (mockResponse.json as jest.Mock).mock.calls[0][0];
      const timestamp = new Date(callArgs.timestamp);

      expect(timestamp.getTime()).toBeGreaterThanOrEqual(beforeCall.getTime());
      expect(timestamp.getTime()).toBeLessThanOrEqual(afterCall.getTime());
    });

    it('should handle different HTTP status codes', () => {
      const testCases = [
        { status: HttpStatus.OK, code: 200 },
        { status: HttpStatus.CREATED, code: 201 },
        { status: HttpStatus.BAD_REQUEST, code: 400 },
        { status: HttpStatus.NOT_FOUND, code: 404 },
        { status: HttpStatus.CONFLICT, code: 409 },
        { status: HttpStatus.INTERNAL_SERVER_ERROR, code: 500 },
      ];

      testCases.forEach(({ status, code }) => {
        jest.clearAllMocks();
        const exception = new HttpException('Test', status);

        filter.catch(exception, mockArgumentsHost);

        expect(mockResponse.status).toHaveBeenCalledWith(code);
        expect(mockResponse.json).toHaveBeenCalledWith(
          expect.objectContaining({
            statusCode: code,
          }),
        );
      });
    });

    it('should handle nested exception response objects', () => {
      const nestedResponse = {
        message: 'Nested validation error',
        error: 'Validation Error',
        details: {
          field: 'email',
          constraint: 'must be valid',
        },
      };
      const exception = new HttpException(nestedResponse, HttpStatus.BAD_REQUEST);

      filter.catch(exception, mockArgumentsHost);

      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          statusCode: 400,
          message: 'Nested validation error',
          error: 'Validation Error',
        }),
      );
    });

    it('should properly format response structure', () => {
      const exception = new HttpException('Test error', HttpStatus.BAD_REQUEST);

      filter.catch(exception, mockArgumentsHost);

      const callArgs = (mockResponse.json as jest.Mock).mock.calls[0][0];
      expect(callArgs).toHaveProperty('statusCode');
      expect(callArgs).toHaveProperty('error');
      expect(callArgs).toHaveProperty('message');
      expect(callArgs).toHaveProperty('timestamp');
      expect(Object.keys(callArgs)).toEqual(['statusCode', 'error', 'message', 'timestamp']);
    });
  });
});
