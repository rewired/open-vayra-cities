import type { Line } from '../domain/types/line';
import type { StopSelectionState } from '../map-workspace/MapWorkspaceSurface';

/** Carries inspector data when a completed line is the active selection context. */
export interface LineSelectedInspectorPanelState {
  readonly mode: 'line-selected';
  readonly selectedLine: Line;
}

/** Carries inspector data when a stop is the active selection context. */
export interface StopSelectedInspectorPanelState {
  readonly mode: 'stop-selected';
  readonly selectedStop: StopSelectionState;
}

/** Carries inspector data when neither a line nor stop is selected. */
export interface EmptyInspectorPanelState {
  readonly mode: 'empty';
}

/** Represents the resolved inspector view model after applying selection priority rules. */
export type InspectorPanelState =
  | LineSelectedInspectorPanelState
  | StopSelectedInspectorPanelState
  | EmptyInspectorPanelState;
