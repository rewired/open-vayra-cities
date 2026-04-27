import type { ReactElement } from 'react';
import type { ActiveDataOperation } from './types';

interface BlockingDataOperationModalProps {
  /** The active operation to display, or null to render nothing. */
  readonly activeOperation: ActiveDataOperation | null;
}

/**
 * A blocking modal that displays progress for an app-runtime data operation.
 * Blurs and dims the background while preventing interactions.
 */
export function BlockingDataOperationModal({
  activeOperation
}: BlockingDataOperationModalProps): ReactElement | null {
  if (!activeOperation) {
    return null;
  }

  const { title, phase, progress } = activeOperation;

  let progressPercent: number | null = null;
  if (progress.kind === 'determinate') {
    progressPercent = Math.min(100, Math.max(0, (progress.completed / progress.total) * 100));
  }

  return (
    <div
      className="blocking-data-operation-modal-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="data-op-title"
    >
      <div className="blocking-data-operation-modal">
        <h2 id="data-op-title" className="blocking-data-operation-modal__title">
          {title}
        </h2>
        <div className="blocking-data-operation-modal__phase">{phase}</div>
        <div className="blocking-data-operation-modal__progress-container">
          {progress.kind === 'indeterminate' ? (
            <div className="blocking-data-operation-modal__progress-bar blocking-data-operation-modal__progress-bar--indeterminate" />
          ) : (
            <div
              className="blocking-data-operation-modal__progress-bar"
              style={{ width: `${progressPercent}%` }}
              role="progressbar"
              aria-valuenow={progressPercent ?? 0}
              aria-valuemin={0}
              aria-valuemax={100}
            />
          )}
        </div>
        {progress.kind === 'determinate' && (
          <div className="blocking-data-operation-modal__percent">
            {Math.round(progressPercent ?? 0)}%
          </div>
        )}
      </div>
    </div>
  );
}
