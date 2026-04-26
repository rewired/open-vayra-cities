import type { ReactElement } from 'react';

import {
  MVP_TIME_BAND_IDS,
  TIME_BAND_DEFINITIONS,
  TIME_BAND_DISPLAY_LABELS,
  formatTimeBandWindow
} from '../domain/constants/timeBands';
import type { TimeBandDefinition, TimeBandId } from '../domain/types/timeBand';
import {
  LINE_FREQUENCY_EDITOR_MAX_LENGTH,
  normalizeLineFrequencyEditorInput
} from '../session/lineFrequencyEditorState';
import type {
  LineFrequencyControlByTimeBand,
  LineFrequencyInputByTimeBand,
  LineFrequencyValidationByTimeBand,
  SelectedLineFrequencyUpdateAction
} from '../session/useNetworkSessionState';
import { MaterialIcon } from '../ui/icons/MaterialIcon';

interface FrequencyEditorDialogProps {
  readonly open: boolean;
  readonly onClose: () => void;
  readonly lineFrequencyInputByTimeBand: LineFrequencyInputByTimeBand;
  readonly lineFrequencyControlByTimeBand: LineFrequencyControlByTimeBand;
  readonly lineFrequencyValidationByTimeBand: LineFrequencyValidationByTimeBand;
  readonly onFrequencyChange: (
    timeBandId: TimeBandId,
    rawInputValue: string,
    action?: SelectedLineFrequencyUpdateAction
  ) => void;
}

const TIME_BAND_DEFINITION_BY_ID: Readonly<Record<TimeBandId, TimeBandDefinition>> = Object.fromEntries(
  TIME_BAND_DEFINITIONS.map((definition) => [definition.id, definition])
) as Readonly<Record<TimeBandId, TimeBandDefinition>>;

/**
 * Renders a compact selected-line service-plan editor with explicit interval and no-service controls.
 */
export function FrequencyEditorDialog({
  open,
  onClose,
  lineFrequencyInputByTimeBand,
  lineFrequencyControlByTimeBand,
  lineFrequencyValidationByTimeBand,
  onFrequencyChange
}: FrequencyEditorDialogProps): ReactElement | null {
  if (!open) {
    return null;
  }

  return (
    <div className="inspector-dialog" role="dialog" aria-modal="true" aria-label="Edit service plan dialog">
      <div className="inspector-dialog__surface inspector-dialog__surface--service-plan">
        <header className="inspector-dialog__header">
          <h3>Edit service plan</h3>
          <button type="button" className="inspector-dialog__close" onClick={onClose} aria-label="Close service plan editor" title="Close service plan editor">
            <MaterialIcon name="close" />
          </button>
        </header>
        <p className="inspector-frequency-editor__note">
          Set an interval for bands that operate, or choose no service for bands without departures.
        </p>
        <div className="inspector-frequency-editor" role="table" aria-label="Service plan by time band">
          <div className="inspector-frequency-editor__header" role="row">
            <span role="columnheader">WINDOW</span>
            <span role="columnheader">TIME BAND</span>
            <span role="columnheader">SERVICE</span>
          </div>
          {MVP_TIME_BAND_IDS.map((timeBandId) => {
            const timeBandDefinition = TIME_BAND_DEFINITION_BY_ID[timeBandId];
            const controlState = lineFrequencyControlByTimeBand[timeBandId];
            const isNoService = controlState === 'no-service';
            const intervalValue = isNoService ? '–' : lineFrequencyInputByTimeBand[timeBandId] ?? '';

            return (
              <section key={timeBandId} className="inspector-frequency-editor__row" role="row">
                <p className="inspector-frequency-editor__band-window" role="cell">
                  {formatTimeBandWindow(timeBandDefinition)}
                </p>
                <p className="inspector-frequency-editor__band-label" role="cell">
                  {TIME_BAND_DISPLAY_LABELS[timeBandId]}
                </p>
                <div className="inspector-frequency-editor__controls" role="cell">
                  <button
                    type="button"
                    className="inspector-frequency-editor__toggle"
                    data-active={String(!isNoService)}
                    onClick={() => {
                      onFrequencyChange(timeBandId, lineFrequencyInputByTimeBand[timeBandId] ?? '', 'activate-frequency');
                    }}
                  >
                    Interval
                  </button>
                  <label className="inspector-frequency-editor__interval-field">
                    <input
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      maxLength={LINE_FREQUENCY_EDITOR_MAX_LENGTH}
                      aria-label={`Interval minutes for ${TIME_BAND_DISPLAY_LABELS[timeBandId]} (${formatTimeBandWindow(timeBandDefinition)})`}
                      disabled={isNoService}
                      value={intervalValue}
                      onFocus={() => {
                        onFrequencyChange(timeBandId, lineFrequencyInputByTimeBand[timeBandId] ?? '', 'activate-frequency');
                      }}
                      onClick={() => {
                        onFrequencyChange(timeBandId, lineFrequencyInputByTimeBand[timeBandId] ?? '', 'activate-frequency');
                      }}
                      onChange={(event) => {
                        const normalizedValue = normalizeLineFrequencyEditorInput(event.currentTarget.value);
                        onFrequencyChange(timeBandId, normalizedValue, 'input-change');
                      }}
                    />
                    <span>min</span>
                  </label>
                  <button
                    type="button"
                    className="inspector-frequency-editor__toggle"
                    data-active={String(isNoService)}
                    onClick={() => {
                      onFrequencyChange(timeBandId, lineFrequencyInputByTimeBand[timeBandId] ?? '', 'set-no-service');
                    }}
                  >
                    No service
                  </button>
                </div>
                {lineFrequencyValidationByTimeBand[timeBandId] ? (
                  <span className="inspector-frequency-editor__error">{lineFrequencyValidationByTimeBand[timeBandId]}</span>
                ) : null}
              </section>
            );
          })}
        </div>
      </div>
    </div>
  );
}
