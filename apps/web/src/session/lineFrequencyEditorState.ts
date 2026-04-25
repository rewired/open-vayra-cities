import { DEFAULT_LINE_SERVICE_INTERVAL_MINUTES } from '../domain/constants/lineService';
import { createLineFrequencyMinutes, type LineServiceBandPlan } from '../domain/types/line';
import type { SelectedLineFrequencyUpdateAction, LineFrequencyControlState } from './useNetworkSessionState';

/** Maximum number of characters allowed in the service-interval editor input. */
export const LINE_FREQUENCY_EDITOR_MAX_LENGTH = 3;

/** Validation message shown when the service-interval input is not a whole minute value in the supported range. */
export const LINE_FREQUENCY_EDITOR_VALIDATION_MESSAGE = 'Enter an interval from 1 to 999 whole minutes.';

/** Deterministic reducer output for one selected-line service-band editor action. */
export interface LineFrequencyEditorActionResult {
  readonly controlState: LineFrequencyControlState;
  readonly normalizedInputValue: string;
  readonly validationMessage: string | null;
  readonly nextBandPlan: LineServiceBandPlan | null;
}

/**
 * Normalizes raw service-interval text to the compact editor length limit without coercing characters.
 */
export const normalizeLineFrequencyEditorInput = (rawInputValue: string): string =>
  rawInputValue.slice(0, LINE_FREQUENCY_EDITOR_MAX_LENGTH);

/**
 * Validates and parses service-interval input to an integer within the inclusive supported range.
 */
export const parseLineServiceIntervalInput = (rawInputValue: string): number | null => {
  const trimmedValue = rawInputValue.trim();
  if (trimmedValue.length === 0) {
    return null;
  }

  if (!/^[0-9]{1,3}$/.test(trimmedValue)) {
    return Number.NaN;
  }

  const parsedValue = Number(trimmedValue);
  if (!Number.isInteger(parsedValue) || parsedValue < 1 || parsedValue > 999) {
    return Number.NaN;
  }

  return parsedValue;
};

/**
 * Resolves the input value that should be used when activating interval mode from a non-frequency row state.
 */
export const resolveIntervalActivationInput = (rawInputValue: string): string => {
  const parsed = parseLineServiceIntervalInput(rawInputValue);
  if (typeof parsed === 'number' && Number.isFinite(parsed)) {
    return String(parsed);
  }

  return String(DEFAULT_LINE_SERVICE_INTERVAL_MINUTES);
};

/**
 * Applies one frequency-editor action to local row state and returns any canonical service-plan update.
 */
export const applyLineFrequencyEditorAction = (
  rawInputValue: string,
  action: SelectedLineFrequencyUpdateAction
): LineFrequencyEditorActionResult => {
  const normalizedInputValue = normalizeLineFrequencyEditorInput(rawInputValue);

  if (action === 'set-no-service') {
    return {
      controlState: 'no-service',
      normalizedInputValue,
      validationMessage: null,
      nextBandPlan: { kind: 'no-service' }
    };
  }

  if (action === 'activate-frequency') {
    const activationValue = resolveIntervalActivationInput(rawInputValue);
    return {
      controlState: 'frequency',
      normalizedInputValue: activationValue,
      validationMessage: null,
      nextBandPlan: {
        kind: 'frequency',
        headwayMinutes: createLineFrequencyMinutes(Number(activationValue))
      }
    };
  }

  const parsedValue = parseLineServiceIntervalInput(rawInputValue);
  if (parsedValue === null) {
    return {
      controlState: 'frequency',
      normalizedInputValue,
      validationMessage: null,
      nextBandPlan: null
    };
  }

  if (!Number.isFinite(parsedValue)) {
    return {
      controlState: 'frequency',
      normalizedInputValue,
      validationMessage: LINE_FREQUENCY_EDITOR_VALIDATION_MESSAGE,
      nextBandPlan: null
    };
  }

  return {
    controlState: 'frequency',
    normalizedInputValue,
    validationMessage: null,
    nextBandPlan: {
      kind: 'frequency',
      headwayMinutes: createLineFrequencyMinutes(parsedValue)
    }
  };
};
