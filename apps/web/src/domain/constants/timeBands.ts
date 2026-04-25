import {
  createMinuteOfDay,
  type MinuteOfDay,
  type TimeBandDefinition,
  type TimeBandId
} from '../types/timeBand';

/**
 * Canonical ordered time-band definitions used by the MVP service planner and simulation clock.
 */
export const TIME_BAND_DEFINITIONS: readonly TimeBandDefinition[] = [
  {
    id: 'morning-rush',
    label: 'Morning rush',
    startMinuteOfDay: createMinuteOfDay(6 * 60),
    endMinuteOfDay: createMinuteOfDay(9 * 60)
  },
  {
    id: 'late-morning',
    label: 'Late morning',
    startMinuteOfDay: createMinuteOfDay(9 * 60),
    endMinuteOfDay: createMinuteOfDay(11 * 60)
  },
  {
    id: 'midday',
    label: 'Midday',
    startMinuteOfDay: createMinuteOfDay(11 * 60),
    endMinuteOfDay: createMinuteOfDay(14 * 60)
  },
  {
    id: 'afternoon',
    label: 'Afternoon',
    startMinuteOfDay: createMinuteOfDay(14 * 60),
    endMinuteOfDay: createMinuteOfDay(16 * 60)
  },
  {
    id: 'evening-rush',
    label: 'Evening rush',
    startMinuteOfDay: createMinuteOfDay(16 * 60),
    endMinuteOfDay: createMinuteOfDay(19 * 60)
  },
  {
    id: 'evening',
    label: 'Evening',
    startMinuteOfDay: createMinuteOfDay(19 * 60),
    endMinuteOfDay: createMinuteOfDay(23 * 60)
  },
  {
    id: 'night',
    label: 'Night',
    startMinuteOfDay: createMinuteOfDay(23 * 60),
    endMinuteOfDay: createMinuteOfDay(6 * 60)
  }
] as const;

/**
 * Canonical ordered time-band identifiers derived from the central definition list.
 */
export const MVP_TIME_BAND_IDS: readonly TimeBandId[] = TIME_BAND_DEFINITIONS.map((definition) => definition.id);

/**
 * Inspector-safe display labels derived from canonical time-band definitions.
 */
export const TIME_BAND_DISPLAY_LABELS: Readonly<Record<TimeBandId, string>> = Object.fromEntries(
  TIME_BAND_DEFINITIONS.map((definition) => [definition.id, definition.label])
) as Readonly<Record<TimeBandId, string>>;

/**
 * Formats a canonical minute-of-day into a stable `HH:MM` clock label.
 */
export const formatMinuteOfDayToClock = (minute: MinuteOfDay): string => {
  const hours = Math.floor(minute / 60);
  const minutes = minute % 60;

  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
};

/**
 * Formats one time-band definition into a compact `HH:MM–HH:MM` window label.
 */
export const formatTimeBandWindow = (definition: TimeBandDefinition): string =>
  `${formatMinuteOfDayToClock(definition.startMinuteOfDay)}–${formatMinuteOfDayToClock(definition.endMinuteOfDay)}`;

/**
 * Resolves the active canonical time-band id for one minute using explicit midnight-wrap handling.
 */
export const resolveTimeBandIdForMinuteOfDay = (
  minute: MinuteOfDay,
  definitions: readonly TimeBandDefinition[]
): TimeBandId => {
  const matchingDefinition = definitions.find((definition) => {
    const startMinute = definition.startMinuteOfDay;
    const endMinute = definition.endMinuteOfDay;

    if (startMinute < endMinute) {
      return minute >= startMinute && minute < endMinute;
    }

    return minute >= startMinute || minute < endMinute;
  });

  if (!matchingDefinition) {
    throw new Error(`No canonical time-band mapping found for minute ${minute}.`);
  }

  return matchingDefinition.id;
};
