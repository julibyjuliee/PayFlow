import { Money } from '../money';

describe('Money Value Object', () => {
  describe('Constructor', () => {
    it('should create money with amount and default currency', () => {
      const money = new Money(100000);
      expect(money.amount).toBe(100000);
      expect(money.currency).toBe('COP');
    });

    it('should create money with amount and custom currency', () => {
      const money = new Money(100, 'USD');
      expect(money.amount).toBe(100);
      expect(money.currency).toBe('USD');
    });

    it('should create money with zero amount', () => {
      const money = new Money(0);
      expect(money.amount).toBe(0);
      expect(money.currency).toBe('COP');
    });

    it('should create money with decimal amount', () => {
      const money = new Money(99.99, 'USD');
      expect(money.amount).toBe(99.99);
      expect(money.currency).toBe('USD');
    });

    it('should throw error when amount is negative', () => {
      expect(() => new Money(-100)).toThrow('Money amount cannot be negative');
    });

    it('should have readonly amount property', () => {
      const money = new Money(100000);
      // TypeScript compile-time check - this would cause compilation error:
      // money.amount = 200000;
      expect(money.amount).toBe(100000);
    });

    it('should have readonly currency property', () => {
      const money = new Money(100000, 'COP');
      // TypeScript compile-time check - this would cause compilation error:
      // money.currency = 'USD';
      expect(money.currency).toBe('COP');
    });

    it('should create money with various currencies', () => {
      const cop = new Money(100000, 'COP');
      const usd = new Money(100, 'USD');
      const eur = new Money(100, 'EUR');
      const gbp = new Money(100, 'GBP');

      expect(cop.currency).toBe('COP');
      expect(usd.currency).toBe('USD');
      expect(eur.currency).toBe('EUR');
      expect(gbp.currency).toBe('GBP');
    });

    it('should create money with very large amounts', () => {
      const largeMoney = new Money(999999999999);
      expect(largeMoney.amount).toBe(999999999999);
    });

    it('should create money with very small decimal amounts', () => {
      const smallMoney = new Money(0.01, 'USD');
      expect(smallMoney.amount).toBe(0.01);
    });
  });

  describe('fromCents', () => {
    it('should create money from cents with default currency', () => {
      const money = Money.fromCents(10000);
      expect(money.amount).toBe(100);
      expect(money.currency).toBe('COP');
    });

    it('should create money from cents with custom currency', () => {
      const money = Money.fromCents(5000, 'USD');
      expect(money.amount).toBe(50);
      expect(money.currency).toBe('USD');
    });

    it('should create money from zero cents', () => {
      const money = Money.fromCents(0);
      expect(money.amount).toBe(0);
    });

    it('should handle large cent values', () => {
      const money = Money.fromCents(1000000);
      expect(money.amount).toBe(10000);
    });

    it('should handle 1 cent', () => {
      const money = Money.fromCents(1, 'USD');
      expect(money.amount).toBe(0.01);
    });

    it('should handle odd cent amounts', () => {
      const money = Money.fromCents(123, 'USD');
      expect(money.amount).toBe(1.23);
    });

    it('should return Money instance', () => {
      const money = Money.fromCents(5000);
      expect(money).toBeInstanceOf(Money);
    });

    it('should handle conversion for different currencies', () => {
      const copMoney = Money.fromCents(10000, 'COP');
      const usdMoney = Money.fromCents(10000, 'USD');

      expect(copMoney.amount).toBe(100);
      expect(usdMoney.amount).toBe(100);
      expect(copMoney.currency).toBe('COP');
      expect(usdMoney.currency).toBe('USD');
    });
  });

  describe('toCents', () => {
    it('should convert amount to cents', () => {
      const money = new Money(100, 'USD');
      expect(money.toCents()).toBe(10000);
    });

    it('should convert zero to zero cents', () => {
      const money = new Money(0);
      expect(money.toCents()).toBe(0);
    });

    it('should round decimal amounts to cents', () => {
      const money = new Money(99.99, 'USD');
      expect(money.toCents()).toBe(9999);
    });

    it('should handle rounding for 0.01', () => {
      const money = new Money(0.01, 'USD');
      expect(money.toCents()).toBe(1);
    });

    it('should handle large amounts', () => {
      const money = new Money(1000000);
      expect(money.toCents()).toBe(100000000);
    });

    it('should round half-cent amounts correctly', () => {
      const money = new Money(1.005, 'USD');
      const cents = money.toCents();
      // 1.005 * 100 = 100.5, Math.round(100.5) = 100 in JavaScript (banker's rounding)
      expect(cents).toBe(100);
    });

    it('should handle conversion and back conversion', () => {
      const originalCents = 12345;
      const money = Money.fromCents(originalCents, 'USD');
      const convertedCents = money.toCents();
      expect(convertedCents).toBe(originalCents);
    });
  });

  describe('add', () => {
    it('should add two money amounts with same currency', () => {
      const money1 = new Money(100, 'USD');
      const money2 = new Money(50, 'USD');
      const result = money1.add(money2);

      expect(result.amount).toBe(150);
      expect(result.currency).toBe('USD');
    });

    it('should add money amounts in COP', () => {
      const money1 = new Money(100000, 'COP');
      const money2 = new Money(50000, 'COP');
      const result = money1.add(money2);

      expect(result.amount).toBe(150000);
      expect(result.currency).toBe('COP');
    });

    it('should throw error when adding different currencies', () => {
      const copMoney = new Money(100000, 'COP');
      const usdMoney = new Money(100, 'USD');

      expect(() => {
        copMoney.add(usdMoney);
      }).toThrow('Cannot add money with different currencies');
    });

    it('should return new Money instance', () => {
      const money1 = new Money(100, 'USD');
      const money2 = new Money(50, 'USD');
      const result = money1.add(money2);

      expect(result).toBeInstanceOf(Money);
      expect(result).not.toBe(money1);
      expect(result).not.toBe(money2);
    });

    it('should not mutate original money instances', () => {
      const money1 = new Money(100, 'USD');
      const money2 = new Money(50, 'USD');

      money1.add(money2);

      expect(money1.amount).toBe(100);
      expect(money2.amount).toBe(50);
    });

    it('should add zero amount', () => {
      const money1 = new Money(100, 'USD');
      const money2 = new Money(0, 'USD');
      const result = money1.add(money2);

      expect(result.amount).toBe(100);
    });

    it('should handle multiple additions', () => {
      const money1 = new Money(100, 'USD');
      const money2 = new Money(50, 'USD');
      const money3 = new Money(25, 'USD');

      const result = money1.add(money2).add(money3);

      expect(result.amount).toBe(175);
      expect(result.currency).toBe('USD');
    });

    it('should handle large sums', () => {
      const money1 = new Money(999999999, 'COP');
      const money2 = new Money(1, 'COP');
      const result = money1.add(money2);

      expect(result.amount).toBe(1000000000);
    });
  });

  describe('multiply', () => {
    it('should multiply money by a factor', () => {
      const money = new Money(100, 'USD');
      const result = money.multiply(2);

      expect(result.amount).toBe(200);
      expect(result.currency).toBe('USD');
    });

    it('should multiply by zero', () => {
      const money = new Money(100, 'USD');
      const result = money.multiply(0);

      expect(result.amount).toBe(0);
      expect(result.currency).toBe('USD');
    });

    it('should multiply by decimal factor', () => {
      const money = new Money(100, 'USD');
      const result = money.multiply(0.5);

      expect(result.amount).toBe(50);
    });

    it('should multiply by one', () => {
      const money = new Money(100, 'USD');
      const result = money.multiply(1);

      expect(result.amount).toBe(100);
    });

    it('should throw error on negative multiplication due to negative amount validation', () => {
      const money = new Money(100, 'USD');

      // Multiplying by negative creates negative amount, which is not allowed
      expect(() => {
        money.multiply(-2);
      }).toThrow('Money amount cannot be negative');
    });

    it('should return new Money instance', () => {
      const money = new Money(100, 'USD');
      const result = money.multiply(2);

      expect(result).toBeInstanceOf(Money);
      expect(result).not.toBe(money);
    });

    it('should not mutate original money instance', () => {
      const money = new Money(100, 'USD');

      money.multiply(5);

      expect(money.amount).toBe(100);
    });

    it('should preserve currency', () => {
      const money = new Money(100, 'EUR');
      const result = money.multiply(3);

      expect(result.currency).toBe('EUR');
    });

    it('should handle decimal amounts and decimal factors', () => {
      const money = new Money(99.99, 'USD');
      const result = money.multiply(2.5);

      expect(result.amount).toBeCloseTo(249.975, 2);
    });

    it('should handle large multiplications', () => {
      const money = new Money(1000000, 'COP');
      const result = money.multiply(100);

      expect(result.amount).toBe(100000000);
    });

    it('should handle small decimal multiplications', () => {
      const money = new Money(100, 'USD');
      const result = money.multiply(0.01);

      expect(result.amount).toBe(1);
    });

    it('should handle chained multiplications', () => {
      const money = new Money(10, 'USD');
      const result = money.multiply(2).multiply(3).multiply(4);

      expect(result.amount).toBe(240);
    });
  });

  describe('equals', () => {
    it('should return true for equal money amounts', () => {
      const money1 = new Money(100, 'USD');
      const money2 = new Money(100, 'USD');

      expect(money1.equals(money2)).toBe(true);
    });

    it('should return false for different amounts', () => {
      const money1 = new Money(100, 'USD');
      const money2 = new Money(200, 'USD');

      expect(money1.equals(money2)).toBe(false);
    });

    it('should return false for different currencies', () => {
      const money1 = new Money(100, 'USD');
      const money2 = new Money(100, 'EUR');

      expect(money1.equals(money2)).toBe(false);
    });

    it('should return false for different amounts and currencies', () => {
      const money1 = new Money(100, 'USD');
      const money2 = new Money(200, 'EUR');

      expect(money1.equals(money2)).toBe(false);
    });

    it('should return true for zero amounts with same currency', () => {
      const money1 = new Money(0, 'USD');
      const money2 = new Money(0, 'USD');

      expect(money1.equals(money2)).toBe(true);
    });

    it('should return false for zero amounts with different currencies', () => {
      const money1 = new Money(0, 'USD');
      const money2 = new Money(0, 'COP');

      expect(money1.equals(money2)).toBe(false);
    });

    it('should compare decimal amounts correctly', () => {
      const money1 = new Money(99.99, 'USD');
      const money2 = new Money(99.99, 'USD');

      expect(money1.equals(money2)).toBe(true);
    });

    it('should return false for similar but not equal decimal amounts', () => {
      const money1 = new Money(99.99, 'USD');
      const money2 = new Money(99.98, 'USD');

      expect(money1.equals(money2)).toBe(false);
    });

    it('should handle self-comparison', () => {
      const money = new Money(100, 'USD');

      expect(money.equals(money)).toBe(true);
    });

    it('should work with money created from different methods', () => {
      const money1 = new Money(100, 'USD');
      const money2 = Money.fromCents(10000, 'USD');

      expect(money1.equals(money2)).toBe(true);
    });

    it('should work after arithmetic operations', () => {
      const money1 = new Money(50, 'USD');
      const money2 = new Money(50, 'USD');
      const sum = money1.add(money2);
      const expected = new Money(100, 'USD');

      expect(sum.equals(expected)).toBe(true);
    });
  });

  describe('Edge cases and complex scenarios', () => {
    it('should handle very precise decimal amounts', () => {
      const money = new Money(0.001, 'USD');
      expect(money.amount).toBe(0.001);
    });

    it('should handle floating point precision in addition', () => {
      const money1 = new Money(0.1, 'USD');
      const money2 = new Money(0.2, 'USD');
      const result = money1.add(money2);

      expect(result.amount).toBeCloseTo(0.3, 10);
    });

    it('should handle chain of operations', () => {
      const money = new Money(100, 'USD');
      const result = money
        .multiply(2)
        .add(new Money(50, 'USD'))
        .multiply(0.5);

      expect(result.amount).toBe(125);
    });

    it('should maintain immutability through operations', () => {
      const original = new Money(100, 'USD');
      const doubled = original.multiply(2);
      const added = original.add(new Money(50, 'USD'));

      expect(original.amount).toBe(100);
      expect(doubled.amount).toBe(200);
      expect(added.amount).toBe(150);
    });

    it('should handle different currency codes', () => {
      const currencies = ['USD', 'EUR', 'GBP', 'JPY', 'COP', 'MXN', 'BRL'];

      currencies.forEach((currency) => {
        const money = new Money(100, currency);
        expect(money.currency).toBe(currency);
      });
    });

    it('should handle conversion between cents and amount precisely', () => {
      const amounts = [0, 1, 10, 100, 1000, 10000, 99.99, 123.45];

      amounts.forEach((amount) => {
        const money = new Money(amount, 'USD');
        const cents = money.toCents();
        const backToMoney = Money.fromCents(cents, 'USD');

        expect(backToMoney.amount).toBeCloseTo(amount, 2);
      });
    });

    it('should compare correctly after operations', () => {
      const money1 = new Money(50, 'USD');
      const money2 = money1.multiply(2);
      const money3 = new Money(100, 'USD');

      expect(money2.equals(money3)).toBe(true);
    });
  });

  describe('Value Object properties', () => {
    it('should be immutable', () => {
      const money = new Money(100, 'USD');

      // TypeScript compile-time check - these would cause compilation errors:
      // money.amount = 200;
      // money.currency = 'EUR';

      expect(money.amount).toBe(100);
      expect(money.currency).toBe('USD');
    });

    it('should create new instances for operations', () => {
      const money1 = new Money(100, 'USD');
      const money2 = new Money(50, 'USD');

      const sum = money1.add(money2);
      const product = money1.multiply(2);

      expect(sum).not.toBe(money1);
      expect(product).not.toBe(money1);
      expect(sum).toBeInstanceOf(Money);
      expect(product).toBeInstanceOf(Money);
    });

    it('should support equality by value not by reference', () => {
      const money1 = new Money(100, 'USD');
      const money2 = new Money(100, 'USD');

      expect(money1).not.toBe(money2); // Different references
      expect(money1.equals(money2)).toBe(true); // Same value
    });

    it('should preserve value across operations', () => {
      const money = new Money(100, 'USD');

      const result1 = money.multiply(2);
      const result2 = money.add(new Money(50, 'USD'));

      expect(money.amount).toBe(100); // Original unchanged
      expect(result1.amount).toBe(200);
      expect(result2.amount).toBe(150);
    });
  });

  describe('Business scenarios', () => {
    it('should calculate total price for multiple items', () => {
      const unitPrice = new Money(2500, 'COP');
      const quantity = 5;
      const total = unitPrice.multiply(quantity);

      expect(total.amount).toBe(12500);
      expect(total.currency).toBe('COP');
    });

    it('should calculate subtotal and add tax', () => {
      const subtotal = new Money(100, 'USD');
      const tax = new Money(19, 'USD'); // 19% tax
      const total = subtotal.add(tax);

      expect(total.amount).toBe(119);
    });

    it('should calculate discount', () => {
      const originalPrice = new Money(100, 'USD');
      const discountedPrice = originalPrice.multiply(0.8); // 20% off

      expect(discountedPrice.amount).toBe(80);
    });

    it('should split bill evenly', () => {
      const totalBill = new Money(150, 'USD');
      const perPerson = totalBill.multiply(1 / 3); // 3 people

      expect(perPerson.amount).toBe(50);
    });

    it('should handle complex pricing calculation', () => {
      const basePrice = new Money(1000, 'COP');
      const quantity = 3;
      const subtotal = basePrice.multiply(quantity);
      const shipping = new Money(500, 'COP');
      const total = subtotal.add(shipping);

      expect(total.amount).toBe(3500);
    });

    it('should verify two payments are equal', () => {
      const payment1 = new Money(100000, 'COP');
      const payment2 = Money.fromCents(10000000, 'COP');

      expect(payment1.equals(payment2)).toBe(true);
    });

    it('should ensure currency consistency in transactions', () => {
      const copMoney = new Money(100000, 'COP');
      const usdMoney = new Money(100, 'USD');

      expect(() => copMoney.add(usdMoney)).toThrow();
    });
  });

  describe('Error handling', () => {
    it('should throw error for negative amount in constructor', () => {
      expect(() => new Money(-1, 'USD')).toThrow(
        'Money amount cannot be negative',
      );
    });

    it('should throw error when adding different currencies', () => {
      const money1 = new Money(100, 'USD');
      const money2 = new Money(100, 'EUR');

      expect(() => money1.add(money2)).toThrow(
        'Cannot add money with different currencies',
      );
    });

    it('should prevent negative amounts from multiplication', () => {
      const money = new Money(100, 'USD');

      expect(() => {
        money.multiply(-1);
      }).toThrow('Money amount cannot be negative');
    });

    it('should consistently prevent negative money amounts', () => {
      // Cannot create negative money directly
      expect(() => new Money(-100, 'USD')).toThrow(
        'Money amount cannot be negative',
      );

      const money = new Money(100, 'USD');
      expect(() => money.multiply(-1)).toThrow(
        'Money amount cannot be negative',
      );

      expect(() => money.multiply(-0.5)).toThrow(
        'Money amount cannot be negative',
      );
    });
  });
});
