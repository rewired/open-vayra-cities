/**
 * Identifies a canonical service-planning time band for the bus-first MVP.
 */
export type TimeBandId =
  | 'morning-rush'
  | 'late-morning'
  | 'midday'
  | 'afternoon'
  | 'evening-rush'
  | 'evening'
  | 'night';

/**
 * Branded minute index within a canonical 24-hour day (`0..1439`).
 */
export type MinuteOfDay = number & { readonly __brand: 'MinuteOfDay' };

/**
 * Creates a branded minute-of-day from an integer input within `0..1439`.
 */
export const createMinuteOfDay = (rawMinuteOfDay: number): MinuteOfDay => {
  if (!Number.isInteger(rawMinuteOfDay)) {
    throw new Error('Minute of day must be an integer.');
  }

  if (rawMinuteOfDay < 0 || rawMinuteOfDay > 1439) {
    throw new Error('Minute of day must be within 0..1439.');
  }

  return rawMinuteOfDay as MinuteOfDay;
};

/**
 * Defines one canonical time-band window using start-inclusive and end-exclusive minute bounds.
 */
export interface TimeBandDefinition {
  readonly id: TimeBandId;
  readonly label: string;
  readonly startMinuteOfDay: MinuteOfDay;
  readonly endMinuteOfDay: MinuteOfDay;
}
