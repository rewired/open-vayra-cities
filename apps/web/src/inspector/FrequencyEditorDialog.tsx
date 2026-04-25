import type { ReactElement } from 'react';

import {
  MVP_TIME_BAND_IDS,
  TIME_BAND_DEFINITIONS,
  TIME_BAND_DISPLAY_LABELS,
  formatTimeBandWindow
} from '../domain/constants/timeBands';
import type { TimeBandId } from '../domain/types/timeBand';
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

const TIME_BAND_WINDOW_BY_ID: Readonly<Record<TimeBandId, string>> = Object.fromEntries(
  TIME_BAND_DEFINITIONS.map((definition) => [definition.id, formatTimeBandWindow(definition)])
) as Readonly<Record<TimeBandId, string>>;

/**
 * Renders a compact selected-line service-plan editor with explicit Interval vs No service controls per canonical time band.
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
      <div className="inspector-dialog__surface inspector-dialog__surface--service-plan-editor">
        <header className="inspector-dialog__header">
          <h3>Edit service plan</h3>
          <button type="button" className="inspector-dialog__close" onClick={onClose}>
            Close
          </button>
        </header>
        <div className="inspector-frequency-editor" role="table" aria-label="Service plan by time band">
          {MVP_TIME_BAND_IDS.map((timeBandId) => {
            const controlState = lineFrequencyControlByTimeBand[timeBandId];
            const isNoService = controlState === 'no-service';
            const isUnset = controlState === 'unset';
            const intervalValue = isNoService ? '–' : lineFrequencyInputByTimeBand[timeBandId] ?? '';
            const rowClassName = [
              'inspector-frequency-editor__row',
              isUnset ? 'inspector-frequency-editor__row--not-configured' : null
            ]
              .filter(Boolean)
              .join(' ');
            return (
              <section key={timeBandId} className={rowClassName} role="row">
                <p className="inspector-frequency-editor__band-label" role="rowheader">
                  <span className="inspector-frequency-editor__band-window">{TIME_BAND_WINDOW_BY_ID[timeBandId]}</span>{' '}
                  <span>({TIME_BAND_DISPLAY_LABELS[timeBandId]})</span>
                </p>
                <div className="inspector-frequency-editor__controls">
                  <button
                    type="button"
                    className="inspector-frequency-editor__mode-button"
                    aria-pressed={controlState === 'frequency'}
                    onClick={() => {
                      onFrequencyChange(timeBandId, lineFrequencyInputByTimeBand[timeBandId] ?? '', 'set-frequency');
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
                      aria-label={`Interval minutes for ${TIME_BAND_WINDOW_BY_ID[timeBandId]}`}
                      disabled={isNoService}
                      value={intervalValue}
                      onFocus={() => {
                        onFrequencyChange(timeBandId, lineFrequencyInputByTimeBand[timeBandId] ?? '', 'set-frequency');
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
                    className="inspector-frequency-editor__mode-button"
                    aria-pressed={isNoService}
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
