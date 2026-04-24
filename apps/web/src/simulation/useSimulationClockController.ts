import { useEffect, useRef, useState } from 'react';

import { deriveTimeBandIdFromMinuteOfDay, createInitialSimulationClockState, applySimulationClockCommand } from '../domain/simulation/simulationClock';
import type { SimulationMinuteOfDay, SimulationSpeedId } from '../domain/types/simulationClock';

/** Shell clock controller contract exposing state, derived read values, and command handlers. */
export interface SimulationClockController {
  readonly simulationClockState: ReturnType<typeof createInitialSimulationClockState>;
  readonly currentSimulationMinuteOfDay: SimulationMinuteOfDay;
  readonly activeSimulationTimeBandId: ReturnType<typeof deriveTimeBandIdFromMinuteOfDay>;
  readonly handlePauseClock: () => void;
  readonly handleResumeClock: () => void;
  readonly handleResetClock: () => void;
  readonly handleSpeedSelection: (speedId: SimulationSpeedId) => void;
}

/** Owns simulation clock lifecycle ticking and delegates command semantics to canonical domain helpers. */
export const useSimulationClockController = (): SimulationClockController => {
  const [simulationClockState, setSimulationClockState] = useState(createInitialSimulationClockState);
  const lastClockTickRealMillisecondsRef = useRef<number | null>(null);

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      const nowMilliseconds = performance.now();
      const previousTick = lastClockTickRealMillisecondsRef.current;
      lastClockTickRealMillisecondsRef.current = nowMilliseconds;

      if (previousTick === null) {
        return;
      }

      const elapsedRealMilliseconds = nowMilliseconds - previousTick;
      setSimulationClockState((currentClockState) =>
        applySimulationClockCommand(currentClockState, {
          type: 'advance-elapsed',
          elapsedRealMilliseconds
        }).nextState
      );
    }, 250);

    return () => {
      window.clearInterval(intervalId);
    };
  }, []);

  const currentSimulationMinuteOfDay = simulationClockState.timestamp.minuteOfDay;
  const activeSimulationTimeBandId = deriveTimeBandIdFromMinuteOfDay(currentSimulationMinuteOfDay);

  return {
    simulationClockState,
    currentSimulationMinuteOfDay,
    activeSimulationTimeBandId,
    handlePauseClock: () => {
      setSimulationClockState((currentClockState) =>
        applySimulationClockCommand(currentClockState, { type: 'pause' }).nextState
      );
    },
    handleResumeClock: () => {
      setSimulationClockState((currentClockState) =>
        applySimulationClockCommand(currentClockState, { type: 'resume' }).nextState
      );
    },
    handleResetClock: () => {
      setSimulationClockState((currentClockState) =>
        applySimulationClockCommand(currentClockState, { type: 'reset' }).nextState
      );
    },
    handleSpeedSelection: (speedId) => {
      setSimulationClockState((currentClockState) =>
        applySimulationClockCommand(currentClockState, {
          type: 'set-speed',
          speedId
        }).nextState
      );
    }
  };
};
