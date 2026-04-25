import { useState, type ReactElement } from 'react';
import type { LineServicePattern, LineTopology } from '../domain/types/line';

interface LineCompletionDialogProps {
  readonly open: boolean;
  readonly onCancel: () => void;
  readonly onConfirm: (options: { topology: LineTopology; servicePattern: LineServicePattern }) => void;
  readonly isProcessing?: boolean;
}

/**
 * Dialog for selecting line topology and service pattern upon completion of a bus line.
 */
export function LineCompletionDialog({
  open,
  onCancel,
  onConfirm,
  isProcessing = false
}: LineCompletionDialogProps): ReactElement | null {
  const [topology, setTopology] = useState<LineTopology>('linear');
  const [servicePattern, setServicePattern] = useState<LineServicePattern>('one-way');

  if (!open) {
    return null;
  }

  return (
    <div className="inspector-dialog" role="dialog" aria-modal="true" aria-label="Line completion settings">
      <div className="inspector-dialog__surface inspector-dialog__surface--completion">
        <header className="inspector-dialog__header">
          <h3>Complete Line</h3>
          <button type="button" className="inspector-dialog__close" onClick={onCancel} disabled={isProcessing}>
            Close
          </button>
        </header>

        <div className="line-completion-dialog__content">
          <section className="line-completion-dialog__section">
            <h4>Line Topology</h4>
            <div className="line-completion-dialog__options">
              <button
                type="button"
                className={`line-completion-dialog__option ${topology === 'linear' ? 'line-completion-dialog__option--active' : ''}`}
                onClick={() => setTopology('linear')}
                disabled={isProcessing}
              >
                <strong>Linear</strong>
                <span>Open-ended path</span>
              </button>
              <button
                type="button"
                className={`line-completion-dialog__option ${topology === 'loop' ? 'line-completion-dialog__option--active' : ''}`}
                onClick={() => setTopology('loop')}
                disabled={isProcessing}
              >
                <strong>Loop</strong>
                <span>Closed circuit</span>
              </button>
            </div>
          </section>

          <section className="line-completion-dialog__section">
            <h4>Service Pattern</h4>
            <div className="line-completion-dialog__options">
              <button
                type="button"
                className={`line-completion-dialog__option ${servicePattern === 'one-way' ? 'line-completion-dialog__option--active' : ''}`}
                onClick={() => setServicePattern('one-way')}
                disabled={isProcessing}
              >
                <strong>One-way</strong>
                <span>Forward direction only</span>
              </button>
              <button
                type="button"
                className={`line-completion-dialog__option ${servicePattern === 'bidirectional' ? 'line-completion-dialog__option--active' : ''}`}
                onClick={() => setServicePattern('bidirectional')}
                disabled={isProcessing}
              >
                <strong>Bidirectional</strong>
                <span>Both directions</span>
              </button>
            </div>
          </section>
        </div>

        <footer className="inspector-dialog__footer">
          <button
            type="button"
            className="inspector-lines-tab__action"
            onClick={() => onConfirm({ topology, servicePattern })}
            disabled={isProcessing}
          >
            {isProcessing ? 'Processing...' : 'Create Line'}
          </button>
        </footer>
      </div>
    </div>
  );
}
