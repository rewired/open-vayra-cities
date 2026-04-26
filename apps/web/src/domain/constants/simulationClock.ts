import type {
  SimulationDayIndex,
  SimulationMinuteOfDay,
  SimulationSpeedDefinition,
  SimulationSpeedId,
  SimulationWeekdayId
} from '../types/simulationClock';

/**
 * Lower inclusive bound for simulation minute-of-day values.
 */
export const MIN_SIMULATION_MINUTE_OF_DAY = 0 as SimulationMinuteOfDay;

/**
 * Upper inclusive bound for simulation minute-of-day values.
 */
export const MAX_SIMULATION_MINUTE_OF_DAY = 1439 as SimulationMinuteOfDay;

/**
 * Total minutes in one full simulation day.
 */
export const SIMULATION_MINUTES_PER_DAY = 1440;

/**
 * Total seconds in one simulation minute.
 */
export const SIMULATION_SECONDS_PER_MINUTE = 60;

/**
 * Total seconds in one full simulation day.
 */
export const SIMULATION_SECONDS_PER_DAY = 86400;

/**
 * Baseline real milliseconds representing one simulated minute at 1x speed.
 */
export const REAL_MILLISECONDS_PER_SIMULATION_MINUTE = 1000;

/**
 * Canonical deterministic day index used when creating a fresh simulation clock state.
 */
export const INITIAL_SIMULATION_DAY_INDEX = 1 as SimulationDayIndex;

/**
 * Canonical deterministic minute-of-day baseline used when creating a fresh simulation clock state.
 */
export const INITIAL_SIMULATION_MINUTE_OF_DAY = 360 as SimulationMinuteOfDay;

/**
 * Canonical default speed identifier used by the simulation clock baseline.
 */
export const DEFAULT_SIMULATION_SPEED_ID: SimulationSpeedId = '1x';

/**
 * Canonical small speed-set for the MVP clock baseline.
 */
export const SIMULATION_SPEED_DEFINITIONS: readonly SimulationSpeedDefinition[] = [
  { id: 'realtime', label: 'Realtime', multiplier: 1 / 60 },
  { id: '0.1x', label: '0.1×', multiplier: 0.1 },
  { id: '0.5x', label: '0.5×', multiplier: 0.5 },
  { id: '1x', label: '1×', multiplier: 1 },
  { id: '5x', label: '5×', multiplier: 5 },
  { id: '10x', label: '10×', multiplier: 10 },
  { id: '20x', label: '20×', multiplier: 20 }
] as const satisfies readonly SimulationSpeedDefinition[];

/**
 * Canonical ordered list of simulation weekday identifiers.
 * Day 1 maps to the first element (Monday).
 */
export const SIMULATION_WEEKDAY_IDS: readonly SimulationWeekdayId[] = [
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
  'saturday',
  'sunday'
] as const;

/**
 * Canonical mapping from simulation weekday identifiers to short English display labels.
 */
export const SIMULATION_WEEKDAY_SHORT_LABELS: Readonly<Record<SimulationWeekdayId, string>> = {
  monday: 'Mon',
  tuesday: 'Tue',
  wednesday: 'Wed',
  thursday: 'Thu',
  friday: 'Fri',
  saturday: 'Sat',
  sunday: 'Sun'
};

/**
 * Canonical simulation weekday identifier used for the initial simulation state (Day 1).
 */
export const INITIAL_SIMULATION_WEEKDAY_ID: SimulationWeekdayId = 'monday';
