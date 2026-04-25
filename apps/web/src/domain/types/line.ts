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
 * Discriminated service-plan state for one canonical time band.
 */
export type LineServiceBandPlan =
  | { readonly kind: 'unset' }
  | { readonly kind: 'frequency'; readonly headwayMinutes: LineFrequencyMinutes }
  | { readonly kind: 'no-service' };

/**
 * Canonical per-time-band service-plan map keyed by all canonical time-band ids.
 */
export type LineServiceByTimeBand = Readonly<Record<TimeBandId, LineServiceBandPlan>>;

/**
 * Minimal canonical transit line model for ordered stop sequences in the bus-first MVP.
 */
export interface Line {
  readonly id: LineId;
  readonly label: string;
  readonly stopIds: readonly StopId[];
  readonly routeSegments: readonly LineRouteSegment[];
  readonly frequencyByTimeBand: LineServiceByTimeBand;
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
export const createUnsetLineServiceByTimeBand = (): LineServiceByTimeBand =>
  Object.fromEntries(MVP_TIME_BAND_IDS.map((timeBandId) => [timeBandId, { kind: 'unset' }])) as LineServiceByTimeBand;

/**
 * Resolves a numeric headway from one time-band plan when the plan kind is `frequency`.
 */
export const resolveLineServiceBandHeadwayMinutes = (bandPlan: LineServiceBandPlan): LineFrequencyMinutes | null =>
  bandPlan.kind === 'frequency' ? bandPlan.headwayMinutes : null;
