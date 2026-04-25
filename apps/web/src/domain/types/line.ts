import { MVP_TIME_BAND_IDS } from '../constants/timeBands';
import type { TimeBandId } from './timeBand';
import type { LineRouteSegment } from './lineRoute';
import type { StopId } from './stop';

/**
 * Explicit line topology determining how the stop sequence is traversed.
 * - `linear`: an open path from the first stop to the last stop.
 * - `loop`: a closed circuit where the last stop connects back to the first stop.
 */
export type LineTopology = 'linear' | 'loop';

/**
 * Explicit service direction pattern for the line.
 * - `one-way`: service runs only in the forward (ordered) stop direction.
 * - `bidirectional`: service runs in both forward and independently-routed reverse directions.
 */
export type LineServicePattern = 'one-way' | 'bidirectional';

/**
 * Directional discriminator for route segment lookups.
 */
export type LineTravelDirection = 'forward' | 'reverse';

/**
 * Canonical default topology for new lines.
 */
export const DEFAULT_LINE_TOPOLOGY: LineTopology = 'linear';

/**
 * Canonical default service pattern for new lines.
 */
export const DEFAULT_LINE_SERVICE_PATTERN: LineServicePattern = 'one-way';

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
  readonly topology: LineTopology;
  readonly servicePattern: LineServicePattern;
  readonly routeSegments: readonly LineRouteSegment[];
  readonly reverseRouteSegments?: readonly LineRouteSegment[] | undefined;
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
 * Creates an initialized per-time-band service map with every canonical band set to explicit no-service.
 */
export const createNoServiceLineServiceByTimeBand = (): LineServiceByTimeBand =>
  Object.fromEntries(MVP_TIME_BAND_IDS.map((timeBandId) => [timeBandId, { kind: 'no-service' }])) as LineServiceByTimeBand;

/**
 * Resolves a numeric headway from one time-band plan when the plan kind is `frequency`.
 */
export const resolveLineServiceBandHeadwayMinutes = (bandPlan: LineServiceBandPlan): LineFrequencyMinutes | null =>
  bandPlan.kind === 'frequency' ? bandPlan.headwayMinutes : null;
