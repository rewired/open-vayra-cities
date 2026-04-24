import type { ReactElement } from 'react';

import type { StopSelectedInspectorPanelState } from './types';

interface SelectedStopInspectorProps {
  readonly panelState: StopSelectedInspectorPanelState;
}

/** Renders the stop-selected inspector state without owning selection truth. */
export function SelectedStopInspector({ panelState }: SelectedStopInspectorProps): ReactElement {
  return (
    <div>
      <p>Selected stop</p>
      <p>ID: {panelState.selectedStop.selectedStopId}</p>
    </div>
  );
}
