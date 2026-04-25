import { describe, expect, it } from 'vitest';

import {
  applyLineFrequencyEditorAction,
  normalizeLineFrequencyEditorInput,
  parseLineServiceIntervalInput
} from './lineFrequencyEditorState';

describe('lineFrequencyEditorState', () => {
  it('normalizes inputs to at most three characters', () => {
    expect(normalizeLineFrequencyEditorInput('12345')).toBe('123');
  });

  it('returns no-service plan when no-service is clicked', () => {
    const result = applyLineFrequencyEditorAction('12', 'set-no-service');

    expect(result.controlState).toBe('no-service');
    expect(result.nextBandPlan).toEqual({ kind: 'no-service' });
  });

  it('activates frequency mode with default when no valid prior value exists', () => {
    const result = applyLineFrequencyEditorAction('', 'activate-frequency');

    expect(result.controlState).toBe('frequency');
    expect(result.normalizedInputValue).toBe('10');
    expect(result.nextBandPlan).toEqual({ kind: 'frequency', headwayMinutes: 10 });
  });

  it('keeps temporary empty frequency input without converting to no-service', () => {
    const result = applyLineFrequencyEditorAction('', 'input-change');

    expect(result.controlState).toBe('frequency');
    expect(result.nextBandPlan).toBeNull();
    expect(result.validationMessage).toBeNull();
  });

  it('creates frequency plans for values 1 to 999', () => {
    const minResult = applyLineFrequencyEditorAction('1', 'input-change');
    const maxResult = applyLineFrequencyEditorAction('999', 'input-change');

    expect(minResult.nextBandPlan).toEqual({ kind: 'frequency', headwayMinutes: 1 });
    expect(maxResult.nextBandPlan).toEqual({ kind: 'frequency', headwayMinutes: 999 });
  });

  it('rejects 0, negatives, decimals, signs, non-numeric values, and more than three digits', () => {
    const invalidValues = ['0', '-1', '1.5', '+3', 'ab', '1000'];

    for (const invalidValue of invalidValues) {
      expect(Number.isFinite(parseLineServiceIntervalInput(invalidValue))).toBe(false);
      const result = applyLineFrequencyEditorAction(invalidValue, 'input-change');
      expect(result.controlState).toBe('frequency');
      expect(result.nextBandPlan).toBeNull();
      expect(result.validationMessage).not.toBeNull();
    }
  });
});
