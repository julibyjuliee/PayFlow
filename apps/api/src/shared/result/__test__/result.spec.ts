import { Result } from '../result';

describe('Result', () => {
  describe('ok', () => {
    it('should create a successful result with a value', () => {
      const result = Result.ok(42);

      expect(result.isSuccess()).toBe(true);
      expect(result.isFailure()).toBe(false);
      expect(result.getValue()).toBe(42);
    });

    it('should create a successful result with an object', () => {
      const value = { id: '123', name: 'Test' };
      const result = Result.ok(value);

      expect(result.isSuccess()).toBe(true);
      expect(result.getValue()).toEqual(value);
    });

    it('should create a successful result with null', () => {
      const result = Result.ok(null);

      expect(result.isSuccess()).toBe(true);
      expect(result.getValue()).toBe(null);
    });

    it('should create a successful result with undefined', () => {
      const result = Result.ok(undefined);

      expect(result.isSuccess()).toBe(true);
      expect(result.getValue()).toBe(undefined);
    });
  });

  describe('fail', () => {
    it('should create a failed result with an error', () => {
      const error = new Error('Test error');
      const result = Result.fail(error);

      expect(result.isSuccess()).toBe(false);
      expect(result.isFailure()).toBe(true);
      expect(result.getError()).toBe(error);
    });

    it('should create a failed result with a custom error', () => {
      const customError = { code: 'ERR_001', message: 'Custom error' };
      const result = Result.fail(customError);

      expect(result.isFailure()).toBe(true);
      expect(result.getError()).toEqual(customError);
    });

    it('should create a failed result with a string error', () => {
      const result = Result.fail('Error message');

      expect(result.isFailure()).toBe(true);
      expect(result.getError()).toBe('Error message');
    });
  });

  describe('getValue', () => {
    it('should return value when result is successful', () => {
      const result = Result.ok('success');
      expect(result.getValue()).toBe('success');
    });

    it('should throw error when trying to get value from failed result', () => {
      const result = Result.fail(new Error('Failed'));

      expect(() => result.getValue()).toThrow('Cannot get value from a failed result');
    });
  });

  describe('getError', () => {
    it('should return error when result is failed', () => {
      const error = new Error('Test error');
      const result = Result.fail(error);

      expect(result.getError()).toBe(error);
    });

    it('should throw error when trying to get error from successful result', () => {
      const result = Result.ok('success');

      expect(() => result.getError()).toThrow('Cannot get error from a successful result');
    });
  });

  describe('map', () => {
    it('should map successful result value', () => {
      const result = Result.ok(5);
      const mapped = result.map((x) => x * 2);

      expect(mapped.isSuccess()).toBe(true);
      expect(mapped.getValue()).toBe(10);
    });

    it('should not map failed result', () => {
      const error = new Error('Test error');
      const result = Result.fail<number>(error);
      const mapped = result.map((x) => x * 2);

      expect(mapped.isFailure()).toBe(true);
      expect(mapped.getError()).toBe(error);
    });

    it('should transform value type', () => {
      const result = Result.ok(42);
      const mapped = result.map((x) => `Number: ${x}`);

      expect(mapped.isSuccess()).toBe(true);
      expect(mapped.getValue()).toBe('Number: 42');
    });

    it('should handle complex transformations', () => {
      const result = Result.ok({ value: 10 });
      const mapped = result.map((obj) => obj.value * 3);

      expect(mapped.getValue()).toBe(30);
    });
  });

  describe('andThen', () => {
    it('should chain successful results', () => {
      const result = Result.ok(5);
      const chained = result.andThen((x) => Result.ok(x * 2));

      expect(chained.isSuccess()).toBe(true);
      expect(chained.getValue()).toBe(10);
    });

    it('should not chain if initial result is failed', () => {
      const error = new Error('Initial error');
      const result = Result.fail<number>(error);
      const chained = result.andThen((x) => Result.ok(x * 2));

      expect(chained.isFailure()).toBe(true);
      expect(chained.getError()).toBe(error);
    });

    it('should propagate failure from chained operation', () => {
      const result = Result.ok(5);
      const error = new Error('Chained error');
      const chained = result.andThen((x) => Result.fail<number>(error));

      expect(chained.isFailure()).toBe(true);
      expect(chained.getError()).toBe(error);
    });

    it('should handle multiple chaining', () => {
      const result = Result.ok(2)
        .andThen((x) => Result.ok(x * 3))
        .andThen((x) => Result.ok(x + 4))
        .andThen((x) => Result.ok(x.toString()));

      expect(result.isSuccess()).toBe(true);
      expect(result.getValue()).toBe('10');
    });

    it('should stop chaining at first failure', () => {
      const error = new Error('Second operation failed');
      const result = Result.ok(2)
        .andThen((x) => Result.ok(x * 3))
        .andThen((x) => Result.fail<number>(error))
        .andThen((x) => Result.ok(x + 100));

      expect(result.isFailure()).toBe(true);
      expect(result.getError()).toBe(error);
    });
  });

  describe('mapError', () => {
    it('should map error to new error', () => {
      const originalError = new Error('Original error');
      const result = Result.fail<number>(originalError);
      const mapped = result.mapError((err) => new Error(`Wrapped: ${err.message}`));

      expect(mapped.isFailure()).toBe(true);
      expect(mapped.getError().message).toBe('Wrapped: Original error');
    });

    it('should not affect successful result', () => {
      const result = Result.ok(42);
      const mapped = result.mapError((err) => new Error('This should not happen'));

      expect(mapped.isSuccess()).toBe(true);
      expect(mapped.getValue()).toBe(42);
    });

    it('should transform error type', () => {
      const result = Result.fail<number, Error>(new Error('Test'));
      const mapped = result.mapError((err) => ({ code: 500, message: err.message }));

      expect(mapped.isFailure()).toBe(true);
      expect(mapped.getError()).toEqual({ code: 500, message: 'Test' });
    });
  });

  describe('unwrapOr', () => {
    it('should return value when result is successful', () => {
      const result = Result.ok(42);
      expect(result.unwrapOr(0)).toBe(42);
    });

    it('should return default value when result is failed', () => {
      const result = Result.fail<number>(new Error('Failed'));
      expect(result.unwrapOr(0)).toBe(0);
    });

    it('should handle object default values', () => {
      const defaultValue = { id: 'default', name: 'Default' };
      const result = Result.fail<{ id: string; name: string }>(new Error('Failed'));

      expect(result.unwrapOr(defaultValue)).toEqual(defaultValue);
    });

    it('should not use default value for successful result', () => {
      const result = Result.ok({ id: '123', name: 'Test' });
      const defaultValue = { id: 'default', name: 'Default' };

      expect(result.unwrapOr(defaultValue)).toEqual({ id: '123', name: 'Test' });
    });
  });

  describe('match', () => {
    it('should call ok pattern for successful result', () => {
      const result = Result.ok(42);
      const matched = result.match({
        ok: (value) => `Success: ${value}`,
        fail: (error) => `Error: ${error}`,
      });

      expect(matched).toBe('Success: 42');
    });

    it('should call fail pattern for failed result', () => {
      const error = new Error('Test error');
      const result = Result.fail<number>(error);
      const matched = result.match({
        ok: (value) => `Success: ${value}`,
        fail: (err) => `Error: ${err.message}`,
      });

      expect(matched).toBe('Error: Test error');
    });

    it('should return transformed type', () => {
      const result = Result.ok({ count: 5 });
      const matched = result.match({
        ok: (value) => value.count * 2,
        fail: () => 0,
      });

      expect(matched).toBe(10);
    });

    it('should handle complex pattern matching', () => {
      interface User { id: string; name: string; }
      const result: Result<User, Error> = Result.ok({ id: '1', name: 'John' });

      const matched = result.match({
        ok: (user) => ({ success: true, userName: user.name }),
        fail: (error) => ({ success: false, errorMessage: error.message }),
      });

      expect(matched).toEqual({ success: true, userName: 'John' });
    });
  });

  describe('integration scenarios', () => {
    it('should handle complex railway oriented programming flow', () => {
      const divide = (a: number, b: number): Result<number, string> => {
        if (b === 0) return Result.fail('Cannot divide by zero');
        return Result.ok(a / b);
      };

      const result = divide(10, 2)
        .map((x) => x * 3)
        .andThen((x) => Result.ok(x + 5));

      expect(result.isSuccess()).toBe(true);
      expect(result.getValue()).toBe(20);
    });

    it('should short-circuit on first error', () => {
      const divide = (a: number, b: number): Result<number, string> => {
        if (b === 0) return Result.fail('Cannot divide by zero');
        return Result.ok(a / b);
      };

      const result = divide(10, 0)
        .map((x) => x * 3)
        .andThen((x) => Result.ok(x + 5));

      expect(result.isFailure()).toBe(true);
      expect(result.getError()).toBe('Cannot divide by zero');
    });
  });
});
