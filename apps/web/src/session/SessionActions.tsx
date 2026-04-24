import { useRef, type ChangeEvent, type ReactElement } from 'react';

import { MaterialIcon } from '../ui/icons/MaterialIcon';
import type { SelectedLineImportFeedback } from './useNetworkSessionState';

interface SessionActionsProps {
  readonly selectedLineImportFeedback: SelectedLineImportFeedback | null;
  readonly hasSelectedLineForExport: boolean;
  readonly onLoadStart: () => void;
  readonly onFileSelection: (event: ChangeEvent<HTMLInputElement>) => Promise<void>;
  readonly onExportSelectedLine: () => void;
}

/** Renders compact session-level selected-line load/export icon actions with accessible labels. */
export function SessionActions({
  selectedLineImportFeedback,
  hasSelectedLineForExport,
  onLoadStart,
  onFileSelection,
  onExportSelectedLine
}: SessionActionsProps): ReactElement {
  const lineJsonFileInputRef = useRef<HTMLInputElement | null>(null);

  return (
    <section className="session-actions" aria-label="Session line actions">
      <div className="session-actions__buttons" role="group" aria-label="Load and export selected line JSON">
        <button
          type="button"
          className="session-actions__icon-button"
          aria-label="Load selected-line JSON file"
          title="Load selected-line JSON file"
          onClick={() => {
            onLoadStart();
            lineJsonFileInputRef.current?.click();
          }}
        >
          <MaterialIcon name="upload_file" />
        </button>
        {hasSelectedLineForExport ? (
          <button
            type="button"
            className="session-actions__icon-button"
            aria-label="Export selected-line JSON file"
            title="Export selected-line JSON file"
            onClick={onExportSelectedLine}
          >
            <MaterialIcon name="download" />
          </button>
        ) : null}
      </div>
      <input
        ref={lineJsonFileInputRef}
        type="file"
        accept=".json,application/json"
        className="inspector-line-json-loader__file-input"
        onChange={(event) => {
          void onFileSelection(event);
        }}
      />
      {selectedLineImportFeedback ? (
        <p
          className={
            selectedLineImportFeedback.kind === 'error'
              ? 'inspector-line-json-loader__feedback inspector-line-json-loader__feedback--error'
              : 'inspector-line-json-loader__feedback inspector-line-json-loader__feedback--success'
          }
        >
          <strong>{selectedLineImportFeedback.title}:</strong> {selectedLineImportFeedback.detail}
        </p>
      ) : null}
    </section>
  );
}
