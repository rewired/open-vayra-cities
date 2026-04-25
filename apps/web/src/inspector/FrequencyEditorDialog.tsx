import type { ReactElement } from 'react';

import { MVP_TIME_BAND_IDS, TIME_BAND_DISPLAY_LABELS } from '../domain/constants/timeBands';
import type { TimeBandId } from '../domain/types/timeBand';
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

/**
 * Renders frequency editing fields in a dialog while preserving session callback validation semantics.
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
    <div className="inspector-dialog" role="dialog" aria-modal="true" aria-label="Edit frequency dialog">
      <div className="inspector-dialog__surface">
        <header className="inspector-dialog__header">
          <h3>Edit frequency</h3>
          <button type="button" className="inspector-dialog__close" onClick={onClose}>
            Close
          </button>
        </header>
        <p className="inspector-dialog__note">
          Select per-band service mode. Unset leaves the band unconfigured, no-service is explicit, and frequency requires positive minutes.
        </p>
        <div className="inspector-frequency-editor">
          {MVP_TIME_BAND_IDS.map((timeBandId) => {
            const controlState = lineFrequencyControlByTimeBand[timeBandId];
            return (
              <fieldset key={timeBandId} className="inspector-frequency-editor__row">
                <legend>{TIME_BAND_DISPLAY_LABELS[timeBandId]}</legend>
                <div className="inspector-frequency-editor__mode-group">
                  <label>
                    <input
                      type="radio"
                      name={`${timeBandId}-mode`}
                      checked={controlState === 'unset'}
                      onChange={() => {
                        onFrequencyChange(timeBandId, '', 'set-unset');
                      }}
                    />
                    Unset
                  </label>
                  <label>
                    <input
                      type="radio"
                      name={`${timeBandId}-mode`}
                      checked={controlState === 'no-service'}
                      onChange={() => {
                        onFrequencyChange(timeBandId, lineFrequencyInputByTimeBand[timeBandId] ?? '', 'set-no-service');
                      }}
                    />
                    No service
                  </label>
                  <label>
                    <input
                      type="radio"
                      name={`${timeBandId}-mode`}
                      checked={controlState === 'frequency'}
                      onChange={() => {
                        onFrequencyChange(timeBandId, lineFrequencyInputByTimeBand[timeBandId] ?? '', 'set-frequency');
                      }}
                    />
                    Frequency
                  </label>
                </div>
                <label className="inspector-frequency-editor__input-label">
                  <span>Interval (minutes)</span>
                  <input
                    type="number"
                    disabled={controlState !== 'frequency'}
                    value={lineFrequencyInputByTimeBand[timeBandId] ?? ''}
                    onChange={(event) => {
                      onFrequencyChange(timeBandId, event.currentTarget.value, 'input-change');
                    }}
                  />
                </label>
                {lineFrequencyValidationByTimeBand[timeBandId] ? (
                  <span className="inspector-frequency-editor__error">{lineFrequencyValidationByTimeBand[timeBandId]}</span>
                ) : null}
              </fieldset>
            );
          })}
        </div>
      </div>
    </div>
  );
}
