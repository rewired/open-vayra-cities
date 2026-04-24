import type { ReactElement } from 'react';

import { SIMULATION_SPEED_DEFINITIONS } from '../domain/constants/simulationClock';
import { TIME_BAND_DISPLAY_LABELS } from '../domain/constants/timeBands';
import { formatSimulationMinuteOfDay } from '../domain/simulation/simulationClock';
import type { SimulationClockController } from './useSimulationClockController';
import { MaterialIcon } from '../ui/icons/MaterialIcon';

interface SimulationControlBarProps {
  readonly clockController: SimulationClockController;
  readonly sessionActions: ReactElement;
}

const CANONICAL_SIMULATION_SPEED_IDS = ['1x', '5x', '10x', '20x'] as const;

/** Renders the integrated top bar with brand, simulation clock controls, speed controls, and compact session actions. */
export function SimulationControlBar({ clockController, sessionActions }: SimulationControlBarProps): ReactElement {
  return (
    <section className="simulation-control-bar" aria-label="CityOps top bar">
      <div className="simulation-control-bar__brand" aria-label="Application brand">
        <strong>CityOps</strong>
      </div>

      <div className="simulation-control-bar__clock-readout" aria-label="Simulation day and time">
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

        <div className="simulation-control-bar__speed-control" role="group" aria-label="Simulation speed">
          {SIMULATION_SPEED_DEFINITIONS.filter((definition) => CANONICAL_SIMULATION_SPEED_IDS.includes(definition.id)).map((definition) => (
            <button
              key={definition.id}
              type="button"
              className="simulation-control-bar__speed-button"
              aria-pressed={clockController.simulationClockState.speedId === definition.id}
              aria-label={`Set simulation speed to ${definition.label}`}
              title={`Set simulation speed to ${definition.label}`}
              onClick={() => {
                clockController.handleSpeedSelection(definition.id);
              }}
            >
              {definition.label}
            </button>
          ))}
        </div>
      </div>

      <div className="simulation-control-bar__session-actions">{sessionActions}</div>
    </section>
  );
}
