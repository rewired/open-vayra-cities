import { MVP_TIME_BAND_IDS } from '../constants/timeBands';
import type { TimeBandId } from './timeBand';
import type { LineRouteSegment } from './lineRoute';
import type { StopId } from './stop';

/**
 * Branded line identifier used to keep line ids distinct from plain strings.
 */
export type LineId = string & { readonly __brand: 'LineId' };

/**
 * Branded line frequency value in minutes, constrained to positive finite numbers.
 */
export type LineFrequencyMinutes = number & { readonly __brand: 'LineFrequencyMinutes' };

/**
 * Per-time-band line frequency assignment keyed by canonical time-band ids.
 * `null` represents an explicitly unset band; omitted keys are also treated as unset.
 */
export type LineFrequencyByTimeBand = Readonly<Partial<Record<TimeBandId, LineFrequencyMinutes | null>>>;

/**
 * Minimal canonical transit line model for ordered stop sequences in the bus-first MVP.
 */
export interface Line {
  readonly id: LineId;
  readonly label: string;
  readonly stopIds: readonly StopId[];
  readonly routeSegments: readonly LineRouteSegment[];
  readonly frequencyByTimeBand: LineFrequencyByTimeBand;
}

/**
 * Creates a branded line identifier from a deterministic raw line key.
 */
export const createLineId = (rawLineId: string): LineId => rawLineId as LineId;

/**
 * Creates a branded line frequency value in minutes from a positive finite numeric input.
 */
export const createLineFrequencyMinutes = (rawFrequencyMinutes: number): LineFrequencyMinutes => {
  if (!Number.isFinite(rawFrequencyMinutes) || rawFrequencyMinutes <= 0) {
    throw new Error('Line frequency minutes must be a positive finite number.');
  }

  return rawFrequencyMinutes as LineFrequencyMinutes;
};

/**
 * Creates an initialized per-time-band frequency map with every canonical band explicitly unset.
 */
export const createUnsetLineFrequencyByTimeBand = (): LineFrequencyByTimeBand =>
  Object.fromEntries(MVP_TIME_BAND_IDS.map((timeBandId) => [timeBandId, null])) as LineFrequencyByTimeBand;
