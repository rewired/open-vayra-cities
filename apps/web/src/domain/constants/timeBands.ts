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
