import type { ChangeEvent, ReactElement } from 'react';

import { SIMULATION_SPEED_DEFINITIONS } from '../domain/constants/simulationClock';
import { TIME_BAND_DISPLAY_LABELS } from '../domain/constants/timeBands';
import { formatSimulationMinuteOfDay } from '../domain/simulation/simulationClock';
import type { SimulationClockController } from './useSimulationClockController';
import { MaterialIcon } from '../ui/icons/MaterialIcon';

interface SimulationControlBarProps {
  readonly clockController: SimulationClockController;
  readonly sessionActions: ReactElement;
}

/** Renders the primary desktop simulation clock controls with compact session actions. */
export function SimulationControlBar({ clockController, sessionActions }: SimulationControlBarProps): ReactElement {
  const selectedSpeedIndex = Math.max(
    0,
    SIMULATION_SPEED_DEFINITIONS.findIndex((definition) => definition.id === clockController.simulationClockState.speedId)
  );

  return (
    <section className="simulation-control-bar" aria-label="Simulation control bar">
      <div className="simulation-control-bar__clock-readout">
        <strong>Day {clockController.simulationClockState.timestamp.dayIndex}</strong>
        <strong>{formatSimulationMinuteOfDay(clockController.currentSimulationMinuteOfDay)}</strong>
        <span>{TIME_BAND_DISPLAY_LABELS[clockController.activeSimulationTimeBandId]}</span>
      </div>

      <div className="simulation-control-bar__controls" role="group" aria-label="Simulation controls">
        <button
          type="button"
          className="simulation-control-bar__icon-button"
          aria-label={
            clockController.simulationClockState.runningState === 'running' ? 'Pause simulation clock' : 'Resume simulation clock'
          }
          title={clockController.simulationClockState.runningState === 'running' ? 'Pause simulation clock' : 'Resume simulation clock'}
          aria-pressed={clockController.simulationClockState.runningState === 'running'}
          onClick={() => {
            if (clockController.simulationClockState.runningState === 'running') {
              clockController.handlePauseClock();
              return;
            }

            clockController.handleResumeClock();
          }}
        >
          <MaterialIcon name={clockController.simulationClockState.runningState === 'running' ? 'pause' : 'play_arrow'} />
        </button>

        <button
          type="button"
          className="simulation-control-bar__icon-button"
          aria-label="Reset simulation clock"
          title="Reset simulation clock"
          onClick={clockController.handleResetClock}
        >
          <MaterialIcon name="restart_alt" />
        </button>

        <label className="simulation-control-bar__speed-control">
          <span className="simulation-control-bar__speed-label" aria-hidden="true">
            Speed {clockController.simulationClockState.speedId}
          </span>
          <input
            type="range"
            min={0}
            max={SIMULATION_SPEED_DEFINITIONS.length - 1}
            step={1}
            value={selectedSpeedIndex}
            aria-label="Simulation speed"
            onChange={(event: ChangeEvent<HTMLInputElement>) => {
              const nextIndex = Number.parseInt(event.currentTarget.value, 10);
              const nextDefinition = SIMULATION_SPEED_DEFINITIONS[nextIndex];

              if (!nextDefinition) {
                return;
              }

              clockController.handleSpeedSelection(nextDefinition.id);
            }}
          />
          <div className="simulation-control-bar__speed-ticks" aria-hidden="true">
            {SIMULATION_SPEED_DEFINITIONS.map((definition) => (
              <span key={definition.id}>{definition.label}</span>
            ))}
          </div>
        </label>
      </div>

      <div className="simulation-control-bar__session-actions">{sessionActions}</div>
    </section>
  );
}
