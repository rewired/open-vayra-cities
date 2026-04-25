import { describe, expect, test } from 'vitest';

import { createDemandNodeId, createDemandWeight } from './demandNode';

describe('demandNode types', () => {
  describe('createDemandNodeId', () => {
    test('creates branded demand node id', () => {
      const id = createDemandNodeId('res-1');
      expect(id).toBe('res-1');
    });
  });

  describe('createDemandWeight', () => {
    test('creates valid demand weight for zero', () => {
      const weight = createDemandWeight(0);
      expect(weight).toBe(0);
    });

    test('creates valid demand weight for positive float', () => {
      const weight = createDemandWeight(10.5);
      expect(weight).toBe(10.5);
    });

    test('throws error for negative value', () => {
      expect(() => createDemandWeight(-1)).toThrow('Demand weight must be a non-negative finite number.');
    });

    test('throws error for Infinity', () => {
      expect(() => createDemandWeight(Infinity)).toThrow('Demand weight must be a non-negative finite number.');
    });

    test('throws error for NaN', () => {
      expect(() => createDemandWeight(NaN)).toThrow('Demand weight must be a non-negative finite number.');
    });

    test('throws error for non-number input', () => {
      // @ts-expect-error Intentionally passing invalid type for validation check
      expect(() => createDemandWeight('10')).toThrow('Demand weight must be a non-negative finite number.');
    });
  });
});
