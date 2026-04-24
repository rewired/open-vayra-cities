import type { TimeBandId } from '../types/timeBand';

/**
 * Defines the canonical ordered time-band sequence used by the MVP service planner.
 */
export const MVP_TIME_BAND_IDS = [
  'morning-rush',
  'late-morning',
  'midday',
  'afternoon',
  'evening-rush',
  'evening',
  'night'
] as const satisfies readonly TimeBandId[];

/**
 * Provides minimal inspector-safe display labels for each canonical time-band identifier.
 */
export const TIME_BAND_DISPLAY_LABELS: Readonly<Record<TimeBandId, string>> = {
  'morning-rush': 'Morning rush',
  'late-morning': 'Late morning',
  midday: 'Midday',
  afternoon: 'Afternoon',
  'evening-rush': 'Evening rush',
  evening: 'Evening',
  night: 'Night'
};

/**
 * Canonical inclusive minute-range mapping from simulation clock time to MVP time-band ids.
 */
export interface TimeBandMinuteRange {
  readonly timeBandId: TimeBandId;
  readonly startMinute: number;
  readonly endMinute: number;
}

/**
 * Full-day minute-range map used to resolve the active canonical MVP time band.
 */
export const TIME_BAND_MINUTE_RANGES: readonly TimeBandMinuteRange[] = [
  { timeBandId: 'night', startMinute: 0, endMinute: 359 },
  { timeBandId: 'morning-rush', startMinute: 360, endMinute: 539 },
  { timeBandId: 'late-morning', startMinute: 540, endMinute: 659 },
  { timeBandId: 'midday', startMinute: 660, endMinute: 839 },
  { timeBandId: 'afternoon', startMinute: 840, endMinute: 959 },
  { timeBandId: 'evening-rush', startMinute: 960, endMinute: 1139 },
  { timeBandId: 'evening', startMinute: 1140, endMinute: 1379 },
  { timeBandId: 'night', startMinute: 1380, endMinute: 1439 }
] as const satisfies readonly TimeBandMinuteRange[];
