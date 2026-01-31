import {
  TransactionStatus,
  TransactionStatusVO,
} from '../transaction-status';

describe('TransactionStatusVO', () => {
  describe('Constructor', () => {
    it('should create a status with PENDING value', () => {
      const status = new TransactionStatusVO(TransactionStatus.PENDING);
      expect(status.value).toBe(TransactionStatus.PENDING);
    });

    it('should create a status with APPROVED value', () => {
      const status = new TransactionStatusVO(TransactionStatus.APPROVED);
      expect(status.value).toBe(TransactionStatus.APPROVED);
    });

    it('should create a status with DECLINED value', () => {
      const status = new TransactionStatusVO(TransactionStatus.DECLINED);
      expect(status.value).toBe(TransactionStatus.DECLINED);
    });

    it('should create a status with ERROR value', () => {
      const status = new TransactionStatusVO(TransactionStatus.ERROR);
      expect(status.value).toBe(TransactionStatus.ERROR);
    });

    it('should create a status with VOIDED value', () => {
      const status = new TransactionStatusVO(TransactionStatus.VOIDED);
      expect(status.value).toBe(TransactionStatus.VOIDED);
    });

    it('should have readonly value property', () => {
      const status = new TransactionStatusVO(TransactionStatus.PENDING);
      // TypeScript compile-time check - this would cause compilation error:
      // status.value = TransactionStatus.APPROVED;
      expect(status.value).toBe(TransactionStatus.PENDING);
    });
  });

  describe('Factory methods', () => {
    describe('pending()', () => {
      it('should create a PENDING status', () => {
        const status = TransactionStatusVO.pending();
        expect(status).toBeInstanceOf(TransactionStatusVO);
        expect(status.value).toBe(TransactionStatus.PENDING);
      });

      it('should create new instance each time', () => {
        const status1 = TransactionStatusVO.pending();
        const status2 = TransactionStatusVO.pending();
        expect(status1).not.toBe(status2);
        expect(status1.value).toBe(status2.value);
      });
    });

    describe('approved()', () => {
      it('should create an APPROVED status', () => {
        const status = TransactionStatusVO.approved();
        expect(status).toBeInstanceOf(TransactionStatusVO);
        expect(status.value).toBe(TransactionStatus.APPROVED);
      });

      it('should create new instance each time', () => {
        const status1 = TransactionStatusVO.approved();
        const status2 = TransactionStatusVO.approved();
        expect(status1).not.toBe(status2);
        expect(status1.value).toBe(status2.value);
      });
    });

    describe('declined()', () => {
      it('should create a DECLINED status', () => {
        const status = TransactionStatusVO.declined();
        expect(status).toBeInstanceOf(TransactionStatusVO);
        expect(status.value).toBe(TransactionStatus.DECLINED);
      });

      it('should create new instance each time', () => {
        const status1 = TransactionStatusVO.declined();
        const status2 = TransactionStatusVO.declined();
        expect(status1).not.toBe(status2);
        expect(status1.value).toBe(status2.value);
      });
    });

    describe('error()', () => {
      it('should create an ERROR status', () => {
        const status = TransactionStatusVO.error();
        expect(status).toBeInstanceOf(TransactionStatusVO);
        expect(status.value).toBe(TransactionStatus.ERROR);
      });

      it('should create new instance each time', () => {
        const status1 = TransactionStatusVO.error();
        const status2 = TransactionStatusVO.error();
        expect(status1).not.toBe(status2);
        expect(status1.value).toBe(status2.value);
      });
    });
  });

  describe('Status check methods', () => {
    describe('isPending()', () => {
      it('should return true for PENDING status', () => {
        const status = TransactionStatusVO.pending();
        expect(status.isPending()).toBe(true);
      });

      it('should return false for APPROVED status', () => {
        const status = TransactionStatusVO.approved();
        expect(status.isPending()).toBe(false);
      });

      it('should return false for DECLINED status', () => {
        const status = TransactionStatusVO.declined();
        expect(status.isPending()).toBe(false);
      });

      it('should return false for ERROR status', () => {
        const status = TransactionStatusVO.error();
        expect(status.isPending()).toBe(false);
      });

      it('should return false for VOIDED status', () => {
        const status = new TransactionStatusVO(TransactionStatus.VOIDED);
        expect(status.isPending()).toBe(false);
      });
    });

    describe('isApproved()', () => {
      it('should return true for APPROVED status', () => {
        const status = TransactionStatusVO.approved();
        expect(status.isApproved()).toBe(true);
      });

      it('should return false for PENDING status', () => {
        const status = TransactionStatusVO.pending();
        expect(status.isApproved()).toBe(false);
      });

      it('should return false for DECLINED status', () => {
        const status = TransactionStatusVO.declined();
        expect(status.isApproved()).toBe(false);
      });

      it('should return false for ERROR status', () => {
        const status = TransactionStatusVO.error();
        expect(status.isApproved()).toBe(false);
      });

      it('should return false for VOIDED status', () => {
        const status = new TransactionStatusVO(TransactionStatus.VOIDED);
        expect(status.isApproved()).toBe(false);
      });
    });

    describe('isDeclined()', () => {
      it('should return true for DECLINED status', () => {
        const status = TransactionStatusVO.declined();
        expect(status.isDeclined()).toBe(true);
      });

      it('should return false for PENDING status', () => {
        const status = TransactionStatusVO.pending();
        expect(status.isDeclined()).toBe(false);
      });

      it('should return false for APPROVED status', () => {
        const status = TransactionStatusVO.approved();
        expect(status.isDeclined()).toBe(false);
      });

      it('should return false for ERROR status', () => {
        const status = TransactionStatusVO.error();
        expect(status.isDeclined()).toBe(false);
      });

      it('should return false for VOIDED status', () => {
        const status = new TransactionStatusVO(TransactionStatus.VOIDED);
        expect(status.isDeclined()).toBe(false);
      });
    });

    describe('isError()', () => {
      it('should return true for ERROR status', () => {
        const status = TransactionStatusVO.error();
        expect(status.isError()).toBe(true);
      });

      it('should return false for PENDING status', () => {
        const status = TransactionStatusVO.pending();
        expect(status.isError()).toBe(false);
      });

      it('should return false for APPROVED status', () => {
        const status = TransactionStatusVO.approved();
        expect(status.isError()).toBe(false);
      });

      it('should return false for DECLINED status', () => {
        const status = TransactionStatusVO.declined();
        expect(status.isError()).toBe(false);
      });

      it('should return false for VOIDED status', () => {
        const status = new TransactionStatusVO(TransactionStatus.VOIDED);
        expect(status.isError()).toBe(false);
      });
    });

    describe('isFinal()', () => {
      it('should return true for APPROVED status', () => {
        const status = TransactionStatusVO.approved();
        expect(status.isFinal()).toBe(true);
      });

      it('should return true for DECLINED status', () => {
        const status = TransactionStatusVO.declined();
        expect(status.isFinal()).toBe(true);
      });

      it('should return true for VOIDED status', () => {
        const status = new TransactionStatusVO(TransactionStatus.VOIDED);
        expect(status.isFinal()).toBe(true);
      });

      it('should return false for PENDING status', () => {
        const status = TransactionStatusVO.pending();
        expect(status.isFinal()).toBe(false);
      });

      it('should return false for ERROR status', () => {
        const status = TransactionStatusVO.error();
        expect(status.isFinal()).toBe(false);
      });
    });
  });

  describe('TransactionStatusVO: canTransitionTo()', () => {

    // Caso 1: Transiciones desde PENDING (Estado inicial)
    test.each([
      TransactionStatus.APPROVED,
      TransactionStatus.DECLINED,
      TransactionStatus.ERROR,
      TransactionStatus.VOIDED,
      TransactionStatus.PENDING,
    ])('PENDING should allow transition to %s', (targetStatus) => {
      const status = TransactionStatusVO.pending();
      expect(status.canTransitionTo(targetStatus)).toBe(true);
    });

    // Caso 2: Transiciones desde estados finales (No permiten cambios)
    const finalStates = [
      { origin: TransactionStatusVO.approved(), name: 'APPROVED' },
      { origin: TransactionStatusVO.declined(), name: 'DECLINED' },
      { origin: new TransactionStatusVO(TransactionStatus.VOIDED), name: 'VOIDED' },
    ];

    test.each(finalStates)('$name (final state) should not allow any transition', ({ origin }) => {
      const allStatuses = Object.values(TransactionStatus);
      allStatuses.forEach((target) => {
        expect(origin.canTransitionTo(target)).toBe(false);
      });
    });

    // Caso 3: Transiciones desde ERROR
    test.each(Object.values(TransactionStatus))(
      'ERROR should not allow transition to %s',
      (targetStatus) => {
        const status = TransactionStatusVO.error();
        expect(status.canTransitionTo(targetStatus)).toBe(false);
      }
    );

    // Casos adicionales de lógica de estado
    it('should identify ERROR as a non-final state', () => {
      expect(TransactionStatusVO.error().isFinal()).toBe(false);
    });
  });

  describe('TransactionStatus Enum', () => {
    it('should have PENDING value', () => {
      expect(TransactionStatus.PENDING).toBe('PENDING');
    });

    it('should have APPROVED value', () => {
      expect(TransactionStatus.APPROVED).toBe('APPROVED');
    });

    it('should have DECLINED value', () => {
      expect(TransactionStatus.DECLINED).toBe('DECLINED');
    });

    it('should have ERROR value', () => {
      expect(TransactionStatus.ERROR).toBe('ERROR');
    });

    it('should have VOIDED value', () => {
      expect(TransactionStatus.VOIDED).toBe('VOIDED');
    });

    it('should have exactly 5 status values', () => {
      const values = Object.values(TransactionStatus);
      expect(values).toHaveLength(5);
    });
  });

  describe('Business logic integration', () => {
    it('should allow complete payment flow: PENDING -> APPROVED', () => {
      const status = TransactionStatusVO.pending();
      expect(status.canTransitionTo(TransactionStatus.APPROVED)).toBe(true);
      expect(status.isFinal()).toBe(false);

      const approvedStatus = TransactionStatusVO.approved();
      expect(approvedStatus.isFinal()).toBe(true);
    });

    it('should allow failed payment flow: PENDING -> DECLINED', () => {
      const status = TransactionStatusVO.pending();
      expect(status.canTransitionTo(TransactionStatus.DECLINED)).toBe(true);

      const declinedStatus = TransactionStatusVO.declined();
      expect(declinedStatus.isFinal()).toBe(true);
    });

    it('should allow error flow: PENDING -> ERROR', () => {
      const status = TransactionStatusVO.pending();
      expect(status.canTransitionTo(TransactionStatus.ERROR)).toBe(true);

      const errorStatus = TransactionStatusVO.error();
      expect(errorStatus.isFinal()).toBe(false);
    });

    it('should allow void flow: PENDING -> VOIDED', () => {
      const status = TransactionStatusVO.pending();
      expect(status.canTransitionTo(TransactionStatus.VOIDED)).toBe(true);

      const voidedStatus = new TransactionStatusVO(TransactionStatus.VOIDED);
      expect(voidedStatus.isFinal()).toBe(true);
    });

    it('should prevent modification of approved transactions', () => {
      const status = TransactionStatusVO.approved();
      expect(status.canTransitionTo(TransactionStatus.DECLINED)).toBe(false);
      expect(status.canTransitionTo(TransactionStatus.ERROR)).toBe(false);
      expect(status.canTransitionTo(TransactionStatus.VOIDED)).toBe(false);
    });

    it('should prevent modification of declined transactions', () => {
      const status = TransactionStatusVO.declined();
      expect(status.canTransitionTo(TransactionStatus.APPROVED)).toBe(false);
      expect(status.canTransitionTo(TransactionStatus.ERROR)).toBe(false);
      expect(status.canTransitionTo(TransactionStatus.VOIDED)).toBe(false);
    });

    it('should identify all final states correctly', () => {
      expect(TransactionStatusVO.approved().isFinal()).toBe(true);
      expect(TransactionStatusVO.declined().isFinal()).toBe(true);
      expect(
        new TransactionStatusVO(TransactionStatus.VOIDED).isFinal(),
      ).toBe(true);
      expect(TransactionStatusVO.pending().isFinal()).toBe(false);
      expect(TransactionStatusVO.error().isFinal()).toBe(false);
    });

    it('should identify all non-final states correctly', () => {
      expect(TransactionStatusVO.pending().isFinal()).toBe(false);
      expect(TransactionStatusVO.error().isFinal()).toBe(false);
      expect(TransactionStatusVO.approved().isFinal()).toBe(true);
      expect(TransactionStatusVO.declined().isFinal()).toBe(true);
    });
  });

  describe('Value Object properties', () => {
    it('should be immutable', () => {
      const status = TransactionStatusVO.pending();
      const originalValue = status.value;
      expect(status.value).toBe(originalValue);
    });

    it('should support equality comparison by value', () => {
      const status1 = new TransactionStatusVO(TransactionStatus.PENDING);
      const status2 = new TransactionStatusVO(TransactionStatus.PENDING);

      expect(status1.value).toBe(status2.value);
    });

    it('should distinguish different status values', () => {
      const pending = TransactionStatusVO.pending();
      const approved = TransactionStatusVO.approved();

      expect(pending.value).not.toBe(approved.value);
    });

    it('should maintain value integrity across method calls', () => {
      const status = TransactionStatusVO.approved();

      status.isApproved();
      status.isFinal();
      status.canTransitionTo(TransactionStatus.DECLINED);

      expect(status.value).toBe(TransactionStatus.APPROVED);
    });
  });

  describe('Edge cases and validation', () => {
    it('should handle checking same state transition', () => {
      const status = TransactionStatusVO.pending();
      expect(status.canTransitionTo(TransactionStatus.PENDING)).toBe(true);
    });

    it('should consistently return same result for status checks', () => {
      const status = TransactionStatusVO.approved();

      expect(status.isApproved()).toBe(true);
      expect(status.isApproved()).toBe(true);
      expect(status.isApproved()).toBe(true);
    });

    it('should consistently return same result for transition checks', () => {
      const status = TransactionStatusVO.approved();

      expect(status.canTransitionTo(TransactionStatus.DECLINED)).toBe(false);
      expect(status.canTransitionTo(TransactionStatus.DECLINED)).toBe(false);
      expect(status.canTransitionTo(TransactionStatus.DECLINED)).toBe(false);
    });

    it('should handle all factory methods consistently', () => {
      const pending = TransactionStatusVO.pending();
      const approved = TransactionStatusVO.approved();
      const declined = TransactionStatusVO.declined();
      const error = TransactionStatusVO.error();

      expect(pending).toBeInstanceOf(TransactionStatusVO);
      expect(approved).toBeInstanceOf(TransactionStatusVO);
      expect(declined).toBeInstanceOf(TransactionStatusVO);
      expect(error).toBeInstanceOf(TransactionStatusVO);
    });

    it('should maintain state transition rules consistently', () => {
      expect(TransactionStatusVO.pending().canTransitionTo(TransactionStatus.APPROVED)).toBe(true);
      expect(TransactionStatusVO.approved().canTransitionTo(TransactionStatus.DECLINED)).toBe(false);
      expect(TransactionStatusVO.declined().canTransitionTo(TransactionStatus.APPROVED)).toBe(false);
      expect(TransactionStatusVO.error().canTransitionTo(TransactionStatus.APPROVED)).toBe(false);
    });
  });
});
