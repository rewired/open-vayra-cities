import type {
  SimulationDayIndex,
  SimulationMinuteOfDay,
  SimulationSpeedDefinition,
  SimulationSpeedId
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
  { id: '1x', label: '1x', multiplier: 1 },
  { id: '5x', label: '5x', multiplier: 5 },
  { id: '10x', label: '10x', multiplier: 10 },
  { id: '20x', label: '20x', multiplier: 20 }
] as const satisfies readonly SimulationSpeedDefinition[];
