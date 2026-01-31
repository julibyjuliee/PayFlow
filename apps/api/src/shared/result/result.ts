/**
 * Railway Oriented Programming - Result Type
 * Represents the outcome of an operation that can either succeed or fail
 */

export class Result<T, E = Error> {
  private constructor(
    private readonly _isSuccess: boolean,
    private readonly _value?: T,
    private readonly _error?: E,
  ) {}

  public static ok<T, E = Error>(value: T): Result<T, E> {
    return new Result<T, E>(true, value, undefined);
  }

  public static fail<T, E = Error>(error: E): Result<T, E> {
    return new Result<T, E>(false, undefined, error);
  }

  public isSuccess(): boolean {
    return this._isSuccess;
  }

  public isFailure(): boolean {
    return !this._isSuccess;
  }

  public getValue(): T {
    if (!this._isSuccess) {
      throw new Error('Cannot get value from a failed result');
    }
    return this._value as T;
  }

  public getError(): E {
    if (this._isSuccess) {
      throw new Error('Cannot get error from a successful result');
    }
    return this._error as E;
  }

  /**
   * Maps the success value to a new value
   */
  public map<U>(fn: (value: T) => U): Result<U, E> {
    if (this._isSuccess) {
      return Result.ok(fn(this._value as T));
    }
    return Result.fail(this._error as E);
  }

  /**
   * Chains results together (flatMap/bind)
   */
  public andThen<U>(fn: (value: T) => Result<U, E>): Result<U, E> {
    if (this._isSuccess) {
      return fn(this._value as T);
    }
    return Result.fail(this._error as E);
  }

  /**
   * Maps the error to a new error
   */
  public mapError<F>(fn: (error: E) => F): Result<T, F> {
    if (this._isSuccess) {
      return Result.ok(this._value as T);
    }
    return Result.fail(fn(this._error as E));
  }

  /**
   * Unwraps the result or returns a default value
   */
  public unwrapOr(defaultValue: T): T {
    return this._isSuccess ? (this._value as T) : defaultValue;
  }

  /**
   * Match pattern for handling both success and failure cases
   */
  public match<U>(patterns: {
    ok: (value: T) => U;
    fail: (error: E) => U;
  }): U {
    return this._isSuccess
      ? patterns.ok(this._value as T)
      : patterns.fail(this._error as E);
  }
}
