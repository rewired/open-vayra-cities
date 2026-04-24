import { describe, expect, it } from 'vitest';

import { TIME_BAND_MINUTE_RANGES } from '../constants/timeBands';
import {
  advanceSimulationClock,
  applySimulationClockCommand,
  createInitialSimulationClockState,
  createSimulationDayIndex,
  createSimulationMinuteOfDay,
  deriveTimeBandIdFromMinuteOfDay,
  formatSimulationMinuteOfDay,
  setSimulationSpeed,
  setSimulationSpeedFromUnknown
} from './simulationClock';

describe('simulationClock', () => {
  it('creates a deterministic initial clock state', () => {
    expect(createInitialSimulationClockState()).toEqual({
      timestamp: {
        dayIndex: 1,
        minuteOfDay: 360
      },
      runningState: 'paused',
      speedId: '1x',
      carryoverScaledRealMilliseconds: 0
    });
  });

  it('does not advance while paused', () => {
    const initialState = createInitialSimulationClockState();
    const updateResult = advanceSimulationClock(initialState, 15_000);

    expect(updateResult.advancedMinutes).toBe(0);
    expect(updateResult.nextState).toEqual(initialState);
  });

  it('advances while running according to selected speed', () => {
    const resumedState = applySimulationClockCommand(createInitialSimulationClockState(), {
      type: 'resume'
    }).nextState;
    const fasterState = setSimulationSpeed(resumedState, '5x');

    const updateResult = advanceSimulationClock(fasterState, 1_000);

    expect(updateResult.advancedMinutes).toBe(5);
    expect(updateResult.nextState.timestamp.minuteOfDay).toBe(365);
  });

  it('wraps minute-of-day and increments day index after 23:59', () => {
    const nearBoundaryState = {
      ...applySimulationClockCommand(createInitialSimulationClockState(), {
        type: 'resume'
      }).nextState,
      timestamp: {
        dayIndex: createSimulationDayIndex(3),
        minuteOfDay: createSimulationMinuteOfDay(1438)
      }
    };

    const updateResult = advanceSimulationClock(nearBoundaryState, 2_000);

    expect(updateResult.nextState.timestamp.dayIndex).toBe(4);
    expect(updateResult.nextState.timestamp.minuteOfDay).toBe(0);
  });

  it('applies speed selection only to future advancement', () => {
    const runningState = applySimulationClockCommand(createInitialSimulationClockState(), {
      type: 'resume'
    }).nextState;

    const firstUpdate = advanceSimulationClock(runningState, 1_000);
    const withNewSpeed = setSimulationSpeed(firstUpdate.nextState, '10x');
    const secondUpdate = advanceSimulationClock(withNewSpeed, 1_000);

    expect(firstUpdate.advancedMinutes).toBe(1);
    expect(secondUpdate.advancedMinutes).toBe(10);
  });

  it('resets clock state back to deterministic baseline defaults', () => {
    const runningState = applySimulationClockCommand(createInitialSimulationClockState(), {
      type: 'resume'
    }).nextState;
    const advancedState = advanceSimulationClock(setSimulationSpeed(runningState, '20x'), 4_000).nextState;

    const resetResult = applySimulationClockCommand(advancedState, {
      type: 'reset'
    });

    expect(resetResult.nextState).toEqual(createInitialSimulationClockState());
  });

  it('derives representative minutes for all canonical MVP time bands', () => {
    expect(deriveTimeBandIdFromMinuteOfDay(createSimulationMinuteOfDay(120))).toBe('night');
    expect(deriveTimeBandIdFromMinuteOfDay(createSimulationMinuteOfDay(420))).toBe('morning-rush');
    expect(deriveTimeBandIdFromMinuteOfDay(createSimulationMinuteOfDay(600))).toBe('late-morning');
    expect(deriveTimeBandIdFromMinuteOfDay(createSimulationMinuteOfDay(720))).toBe('midday');
    expect(deriveTimeBandIdFromMinuteOfDay(createSimulationMinuteOfDay(900))).toBe('afternoon');
    expect(deriveTimeBandIdFromMinuteOfDay(createSimulationMinuteOfDay(1020))).toBe('evening-rush');
    expect(deriveTimeBandIdFromMinuteOfDay(createSimulationMinuteOfDay(1260))).toBe('evening');
  });

  it('covers full-day boundary cases for canonical time-band derivation', () => {
    expect(deriveTimeBandIdFromMinuteOfDay(createSimulationMinuteOfDay(0))).toBe('night');
    expect(deriveTimeBandIdFromMinuteOfDay(createSimulationMinuteOfDay(1439))).toBe('night');

    const coveredMinuteCount = TIME_BAND_MINUTE_RANGES.reduce(
      (total, range) => total + (range.endMinute - range.startMinute + 1),
      0
    );

    expect(coveredMinuteCount).toBe(1440);
  });

  it('formats simulation time as stable HH:MM output', () => {
    expect(formatSimulationMinuteOfDay(createSimulationMinuteOfDay(0))).toBe('00:00');
    expect(formatSimulationMinuteOfDay(createSimulationMinuteOfDay(65))).toBe('01:05');
    expect(formatSimulationMinuteOfDay(createSimulationMinuteOfDay(1439))).toBe('23:59');
  });

  it('keeps state unchanged for invalid speed ids via safe fallback helper', () => {
    const initialState = createInitialSimulationClockState();

    expect(setSimulationSpeedFromUnknown(initialState, '999x')).toBe(initialState);
  });
});
