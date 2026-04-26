import type { StopId } from '../domain/types/stop';
import type { LineId } from '../domain/types/line';

/** Defines the workspace tool modes available in the desktop shell. */
export type WorkspaceToolMode = 'inspect' | 'place-stop' | 'build-line';

/** Carries the active line-building draft selection as an ordered stop-id list. */
export interface LineBuildSelectionState {
  readonly selectedStopIds: readonly StopId[];
}

/**
 * Signal to open a specific dialog for a selected line.
 * Used for post-creation workflow automation.
 */
export interface SelectedLineDialogOpenIntent {
  readonly lineId: LineId;
  readonly dialogId: 'frequency';
  readonly requestId: number;
}

/** Carries a programmatic map-focus request for a stop or line. */
export interface MapFocusIntent {
  readonly target: { type: 'stop'; id: StopId } | { type: 'line'; id: LineId };
  readonly requestId: number;
}
