import type { WorkspaceToolMode } from '../session/sessionTypes';

/** Identifies which existing planning workflow a focused demand gap action should open. */
export type FocusedDemandGapPlanningEntrypointKind =
  | 'start-stop-placement-near-gap'
  | 'start-line-planning-near-gap';

/** Carries a focused demand gap action request from Inspector UI to the app shell. */
export interface FocusedDemandGapPlanningEntrypointRequest {
  readonly kind: FocusedDemandGapPlanningEntrypointKind;
  readonly position: { readonly lng: number; readonly lat: number };
}

/** Callbacks owned by the shell for applying a planning entrypoint request. */
export interface FocusedDemandGapPlanningEntrypointHandlers {
  readonly focusPosition: (position: { readonly lng: number; readonly lat: number }) => void;
  readonly selectToolMode: (mode: WorkspaceToolMode) => void;
}

/** Resolves the existing workspace tool mode opened by a planning entrypoint. */
export const resolveFocusedDemandGapPlanningEntrypointToolMode = (
  kind: FocusedDemandGapPlanningEntrypointKind
): WorkspaceToolMode => {
  return kind === 'start-stop-placement-near-gap' ? 'place-stop' : 'build-line';
};

/** Applies a planning entrypoint by focusing the map and switching an existing tool mode. */
export const applyFocusedDemandGapPlanningEntrypoint = (
  request: FocusedDemandGapPlanningEntrypointRequest,
  handlers: FocusedDemandGapPlanningEntrypointHandlers
): void => {
  handlers.focusPosition(request.position);
  handlers.selectToolMode(resolveFocusedDemandGapPlanningEntrypointToolMode(request.kind));
};
