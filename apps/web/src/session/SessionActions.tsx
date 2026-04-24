import { useRef, type ChangeEvent, type ReactElement } from 'react';

import type { SelectedLineImportFeedback } from './useNetworkSessionState';

interface SessionActionsProps {
  readonly selectedLineImportFeedback: SelectedLineImportFeedback | null;
  readonly hasSelectedLineForExport: boolean;
  readonly onLoadStart: () => void;
  readonly onFileSelection: (event: ChangeEvent<HTMLInputElement>) => Promise<void>;
  readonly onExportSelectedLine: () => void;
}

/** Renders session-level selected-line load/export actions as a thin shell interaction boundary. */
export function SessionActions({
  selectedLineImportFeedback,
  hasSelectedLineForExport,
  onLoadStart,
  onFileSelection,
  onExportSelectedLine
}: SessionActionsProps): ReactElement {
  const lineJsonFileInputRef = useRef<HTMLInputElement | null>(null);

  return (
    <>
      <section className="inspector-line-json-loader" aria-label="Line JSON loader">
        <h3>Session line loading</h3>
        <p>Load replaces current in-memory stops and completed lines.</p>
        <button
          type="button"
          onClick={() => {
            onLoadStart();
            lineJsonFileInputRef.current?.click();
          }}
        >
          Load line JSON
        </button>
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
      {hasSelectedLineForExport ? (
        <button type="button" onClick={onExportSelectedLine}>
          Export line JSON
        </button>
      ) : null}
    </>
  );
}
