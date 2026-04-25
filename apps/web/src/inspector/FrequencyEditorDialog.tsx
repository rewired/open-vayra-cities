import type { ReactElement } from 'react';

import { MVP_TIME_BAND_IDS, TIME_BAND_DISPLAY_LABELS } from '../domain/constants/timeBands';
import type { TimeBandId } from '../domain/types/timeBand';
import type { LineFrequencyInputByTimeBand, LineFrequencyValidationByTimeBand } from '../session/useNetworkSessionState';

interface FrequencyEditorDialogProps {
  readonly open: boolean;
  readonly onClose: () => void;
  readonly lineFrequencyInputByTimeBand: LineFrequencyInputByTimeBand;
  readonly lineFrequencyValidationByTimeBand: LineFrequencyValidationByTimeBand;
  readonly onFrequencyChange: (timeBandId: TimeBandId, rawInputValue: string) => void;
}

/**
 * Renders frequency editing fields in a dialog while preserving session callback validation semantics.
 */
export function FrequencyEditorDialog({
  open,
  onClose,
  lineFrequencyInputByTimeBand,
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
        <p className="inspector-dialog__note">Empty value means unset. Positive minutes are valid. Zero or negatives are invalid.</p>
        <div className="inspector-frequency-editor">
          {MVP_TIME_BAND_IDS.map((timeBandId) => (
            <label key={timeBandId} className="inspector-frequency-editor__row">
              <span>{TIME_BAND_DISPLAY_LABELS[timeBandId]} interval (minutes)</span>
              <input
                type="number"
                value={lineFrequencyInputByTimeBand[timeBandId] ?? ''}
                onChange={(event) => {
                  onFrequencyChange(timeBandId, event.currentTarget.value);
                }}
              />
              {lineFrequencyValidationByTimeBand[timeBandId] ? (
                <span className="inspector-frequency-editor__error">{lineFrequencyValidationByTimeBand[timeBandId]}</span>
              ) : null}
            </label>
          ))}
        </div>
      </div>
    </div>
  );
}
