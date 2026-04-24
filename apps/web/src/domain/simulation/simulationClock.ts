import {
  DEFAULT_SIMULATION_SPEED_ID,
  INITIAL_SIMULATION_DAY_INDEX,
  INITIAL_SIMULATION_MINUTE_OF_DAY,
  MAX_SIMULATION_MINUTE_OF_DAY,
  MIN_SIMULATION_MINUTE_OF_DAY,
  REAL_MILLISECONDS_PER_SIMULATION_MINUTE,
  SIMULATION_MINUTES_PER_DAY,
  SIMULATION_SPEED_DEFINITIONS
} from '../constants/simulationClock';
import { TIME_BAND_MINUTE_RANGES } from '../constants/timeBands';
import type {
  SimulationClockCommand,
  SimulationClockState,
  SimulationClockUpdateResult,
  SimulationDayIndex,
  SimulationMinuteOfDay,
  SimulationRunningState,
  SimulationSpeedDefinition,
  SimulationSpeedId
} from '../types/simulationClock';
import type { TimeBandId } from '../types/timeBand';

const SIMULATION_SPEED_BY_ID: Readonly<Record<SimulationSpeedId, SimulationSpeedDefinition>> =
  Object.fromEntries(SIMULATION_SPEED_DEFINITIONS.map((speedDefinition) => [speedDefinition.id, speedDefinition])) as Readonly<
    Record<SimulationSpeedId, SimulationSpeedDefinition>
  >;

/**
 * Creates a branded simulation day index from a positive integer input.
 */
export const createSimulationDayIndex = (rawDayIndex: number): SimulationDayIndex => {
  if (!Number.isInteger(rawDayIndex) || rawDayIndex < 1) {
    throw new Error('Simulation day index must be an integer greater than or equal to 1.');
  }

  return rawDayIndex as SimulationDayIndex;
};

/**
 * Creates a branded minute-of-day from an integer input within `0..1439`.
 */
export const createSimulationMinuteOfDay = (rawMinuteOfDay: number): SimulationMinuteOfDay => {
  if (!Number.isInteger(rawMinuteOfDay)) {
    throw new Error('Simulation minute of day must be an integer.');
  }

  if (rawMinuteOfDay < MIN_SIMULATION_MINUTE_OF_DAY || rawMinuteOfDay > MAX_SIMULATION_MINUTE_OF_DAY) {
    throw new Error('Simulation minute of day must be within 0..1439.');
  }

  return rawMinuteOfDay as SimulationMinuteOfDay;
};

/**
 * Creates a deterministic baseline simulation clock state.
 */
export const createInitialSimulationClockState = (): SimulationClockState => ({
  timestamp: {
    dayIndex: INITIAL_SIMULATION_DAY_INDEX,
    minuteOfDay: INITIAL_SIMULATION_MINUTE_OF_DAY
  },
  runningState: 'paused',
  speedId: DEFAULT_SIMULATION_SPEED_ID,
  carryoverScaledRealMilliseconds: 0
});

/**
 * Resolves a canonical speed definition by identifier.
 */
export const getSimulationSpeedDefinition = (
  speedId: SimulationSpeedId
): SimulationSpeedDefinition => SIMULATION_SPEED_BY_ID[speedId];

/**
 * Safely parses unknown speed input into a canonical speed identifier when possible.
 */
export const parseSimulationSpeedId = (rawSpeedId: string): SimulationSpeedId | null =>
  rawSpeedId in SIMULATION_SPEED_BY_ID ? (rawSpeedId as SimulationSpeedId) : null;

/**
 * Derives the canonical MVP time band from a simulation minute-of-day value.
 */
export const deriveTimeBandIdFromMinuteOfDay = (minuteOfDay: SimulationMinuteOfDay): TimeBandId => {
  const matchingRange = TIME_BAND_MINUTE_RANGES.find(
    (range) => minuteOfDay >= range.startMinute && minuteOfDay <= range.endMinute
  );

  if (!matchingRange) {
    throw new Error(`No canonical time-band mapping found for minute ${minuteOfDay}.`);
  }

  return matchingRange.timeBandId;
};

/**
 * Formats a simulation minute-of-day value into a stable `HH:MM` display string.
 */
export const formatSimulationMinuteOfDay = (minuteOfDay: SimulationMinuteOfDay): string => {
  const hours = Math.floor(minuteOfDay / 60);
  const minutes = minuteOfDay % 60;

  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
};

/**
 * Returns a copy of clock state with running status set to paused.
 */
export const pauseSimulationClock = (clockState: SimulationClockState): SimulationClockState => ({
  ...clockState,
  runningState: 'paused'
});

/**
 * Returns a copy of clock state with running status set to running.
 */
export const resumeSimulationClock = (clockState: SimulationClockState): SimulationClockState => ({
  ...clockState,
  runningState: 'running'
});

/**
 * Returns a copy of clock state with a new canonical speed identifier.
 */
export const setSimulationSpeed = (
  clockState: SimulationClockState,
  speedId: SimulationSpeedId
): SimulationClockState => ({
  ...clockState,
  speedId
});

/**
 * Returns a copy of clock state with a speed update only when the raw speed id is canonical.
 */
export const setSimulationSpeedFromUnknown = (
  clockState: SimulationClockState,
  rawSpeedId: string
): SimulationClockState => {
  const parsedSpeedId = parseSimulationSpeedId(rawSpeedId);

  if (!parsedSpeedId) {
    return clockState;
  }

  return setSimulationSpeed(clockState, parsedSpeedId);
};

/**
 * Resets any existing clock state back to deterministic baseline defaults.
 */
export const resetSimulationClock = (): SimulationClockState => createInitialSimulationClockState();

/**
 * Advances simulation timestamp by elapsed real milliseconds when the clock is running.
 */
export const advanceSimulationClock = (
  clockState: SimulationClockState,
  elapsedRealMilliseconds: number
): SimulationClockUpdateResult => {
  if (!Number.isFinite(elapsedRealMilliseconds) || elapsedRealMilliseconds <= 0) {
    return {
      nextState: clockState,
      advancedMinutes: 0,
      activeTimeBandId: deriveTimeBandIdFromMinuteOfDay(clockState.timestamp.minuteOfDay)
    };
  }

  if (clockState.runningState === 'paused') {
    return {
      nextState: clockState,
      advancedMinutes: 0,
      activeTimeBandId: deriveTimeBandIdFromMinuteOfDay(clockState.timestamp.minuteOfDay)
    };
  }

  const speedDefinition = getSimulationSpeedDefinition(clockState.speedId);
  const totalScaledRealMilliseconds =
    clockState.carryoverScaledRealMilliseconds + elapsedRealMilliseconds * speedDefinition.multiplier;
  const advancedMinutes = Math.floor(totalScaledRealMilliseconds / REAL_MILLISECONDS_PER_SIMULATION_MINUTE);

  if (advancedMinutes <= 0) {
    return {
      nextState: {
        ...clockState,
        carryoverScaledRealMilliseconds: totalScaledRealMilliseconds
      },
      advancedMinutes: 0,
      activeTimeBandId: deriveTimeBandIdFromMinuteOfDay(clockState.timestamp.minuteOfDay)
    };
  }

  const nextCarryoverScaledRealMilliseconds =
    totalScaledRealMilliseconds - advancedMinutes * REAL_MILLISECONDS_PER_SIMULATION_MINUTE;
  const rawAbsoluteMinutes = clockState.timestamp.minuteOfDay + advancedMinutes;
  const dayIncrement = Math.floor(rawAbsoluteMinutes / SIMULATION_MINUTES_PER_DAY);
  const wrappedMinuteOfDay = rawAbsoluteMinutes % SIMULATION_MINUTES_PER_DAY;

  const nextState: SimulationClockState = {
    ...clockState,
    timestamp: {
      dayIndex: createSimulationDayIndex(clockState.timestamp.dayIndex + dayIncrement),
      minuteOfDay: createSimulationMinuteOfDay(wrappedMinuteOfDay)
    },
    carryoverScaledRealMilliseconds: nextCarryoverScaledRealMilliseconds
  };

  return {
    nextState,
    advancedMinutes,
    activeTimeBandId: deriveTimeBandIdFromMinuteOfDay(nextState.timestamp.minuteOfDay)
  };
};

/**
 * Applies a typed simulation clock command and returns the next state projection.
 */
export const applySimulationClockCommand = (
  clockState: SimulationClockState,
  command: SimulationClockCommand
): SimulationClockUpdateResult => {
  switch (command.type) {
    case 'pause': {
      const nextState = pauseSimulationClock(clockState);
      return {
        nextState,
        advancedMinutes: 0,
        activeTimeBandId: deriveTimeBandIdFromMinuteOfDay(nextState.timestamp.minuteOfDay)
      };
    }
    case 'resume': {
      const nextState = resumeSimulationClock(clockState);
      return {
        nextState,
        advancedMinutes: 0,
        activeTimeBandId: deriveTimeBandIdFromMinuteOfDay(nextState.timestamp.minuteOfDay)
      };
    }
    case 'set-speed': {
      const nextState = setSimulationSpeed(clockState, command.speedId);
      return {
        nextState,
        advancedMinutes: 0,
        activeTimeBandId: deriveTimeBandIdFromMinuteOfDay(nextState.timestamp.minuteOfDay)
      };
    }
    case 'reset': {
      const nextState = resetSimulationClock();
      return {
        nextState,
        advancedMinutes: 0,
        activeTimeBandId: deriveTimeBandIdFromMinuteOfDay(nextState.timestamp.minuteOfDay)
      };
    }
    case 'advance-elapsed':
      return advanceSimulationClock(clockState, command.elapsedRealMilliseconds);
    default: {
      const exhaustiveCheck: never = command;
      throw new Error(`Unhandled simulation clock command: ${JSON.stringify(exhaustiveCheck)}`);
    }
  }
};

/**
 * Resolves a stable human-readable running-state label for shell status display.
 */
export const formatSimulationRunningStateLabel = (runningState: SimulationRunningState): string =>
  runningState === 'running' ? 'Running' : 'Paused';
