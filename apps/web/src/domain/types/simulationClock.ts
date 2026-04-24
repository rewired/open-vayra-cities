import type { TimeBandId } from './timeBand';

/**
 * Branded day-index value for deterministic simulation clock progression.
 */
export type SimulationDayIndex = number & { readonly __brand: 'SimulationDayIndex' };

/**
 * Branded minute-of-day value constrained to the inclusive range `0..1439`.
 */
export type SimulationMinuteOfDay = number & { readonly __brand: 'SimulationMinuteOfDay' };

/**
 * Immutable simulation timestamp tuple used by the simulation clock baseline.
 */
export interface SimulationTimestamp {
  readonly dayIndex: SimulationDayIndex;
  readonly minuteOfDay: SimulationMinuteOfDay;
}

/**
 * Running status for the simulation clock baseline.
 */
export type SimulationRunningState = 'paused' | 'running';

/**
 * Stable identifier for one selectable simulation speed option.
 */
export type SimulationSpeedId = '1x' | '5x' | '10x' | '20x';

/**
 * Canonical simulation speed definition shown in controls and used by progression helpers.
 */
export interface SimulationSpeedDefinition {
  readonly id: SimulationSpeedId;
  readonly label: string;
  readonly multiplier: number;
}

/**
 * Full mutable-domain clock state used by pure transition helpers.
 */
export interface SimulationClockState {
  readonly timestamp: SimulationTimestamp;
  readonly runningState: SimulationRunningState;
  readonly speedId: SimulationSpeedId;
  readonly carryoverScaledRealMilliseconds: number;
}

/**
 * Typed command envelope for pure simulation clock transitions.
 */
export type SimulationClockCommand =
  | { readonly type: 'pause' }
  | { readonly type: 'resume' }
  | { readonly type: 'reset' }
  | { readonly type: 'set-speed'; readonly speedId: SimulationSpeedId }
  | { readonly type: 'advance-elapsed'; readonly elapsedRealMilliseconds: number };

/**
 * Structured result from applying a clock transition.
 */
export interface SimulationClockUpdateResult {
  readonly nextState: SimulationClockState;
  readonly advancedMinutes: number;
  readonly activeTimeBandId: TimeBandId;
}
