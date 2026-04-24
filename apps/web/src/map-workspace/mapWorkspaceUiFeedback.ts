import { MINIMUM_STOPS_REQUIRED_TO_COMPLETE_LINE } from '../domain/constants/lineBuilding';
import type { StopId } from '../domain/types/stop';
import type { WorkspaceToolMode } from '../App';
import type { PlacementAttemptResult } from './mapWorkspaceInteractions';

export const PLACEMENT_MODE_INDICATOR_LABEL = 'Placement mode active';
export const BUILD_LINE_MODE_INDICATOR_LABEL = 'Build-line mode active';

const PLACEMENT_FEEDBACK_MESSAGES = {
  modeInstruction: 'Click a street segment to place a stop.',
  streetRuleHint: 'Placement rule: stops can only be placed on street line segments.',
  attemptReady: 'Last attempt: waiting for placement input.',
  attemptPlaced: 'Last attempt: stop placed.',
  attemptInvalidTarget: 'Last attempt: blocked (street segment required).'
} as const;

const BUILD_LINE_FEEDBACK_MESSAGES = {
  instruction: 'Click existing stop markers in order to draft a schematic stop-order line (not street-routed yet).',
  minimumStopRequirement: `Minimum stops to complete: ${MINIMUM_STOPS_REQUIRED_TO_COMPLETE_LINE}.`
} as const;

/** Overlay copy for completed and draft line rendering interpretation. */
export const LINE_OVERLAY_COPY = {
  completed: 'Completed lines: schematic stop-order connections (not street-routed yet).',
  draft: 'Draft line: schematic stop-order preview (not street-routed yet).'
} as const;

/** Placement-mode overlay visibility and copy projection contract. */
export interface PlacementUiFeedbackContract {
  readonly showPlacementModeIndicator: boolean;
  readonly modeInstruction: string | null;
  readonly showStreetRuleHint: boolean;
  readonly streetRuleHint: string | null;
  readonly lastAttemptMessage: string | null;
}

/** Build-line-mode overlay visibility and copy projection contract. */
export interface BuildLineUiFeedbackContract {
  readonly showBuildLineModeIndicator: boolean;
  readonly modeInstruction: string | null;
  readonly minimumStopRequirement: string | null;
  readonly draftStopCount: number;
  readonly canCompleteDraft: boolean;
}

/** Projects placement-mode HUD copy from current tool mode and last placement result. */
export const buildPlacementUiFeedback = (
  activeToolMode: WorkspaceToolMode,
  placementAttemptResult: PlacementAttemptResult
): PlacementUiFeedbackContract => {
  const isPlacementModeActive = activeToolMode === 'place-stop';

  if (!isPlacementModeActive) {
    return {
      showPlacementModeIndicator: false,
      modeInstruction: null,
      showStreetRuleHint: false,
      streetRuleHint: null,
      lastAttemptMessage: null
    };
  }

  const lastAttemptMessage =
    placementAttemptResult === 'placed'
      ? PLACEMENT_FEEDBACK_MESSAGES.attemptPlaced
      : placementAttemptResult === 'invalid-target'
        ? PLACEMENT_FEEDBACK_MESSAGES.attemptInvalidTarget
        : PLACEMENT_FEEDBACK_MESSAGES.attemptReady;

  return {
    showPlacementModeIndicator: true,
    modeInstruction: PLACEMENT_FEEDBACK_MESSAGES.modeInstruction,
    showStreetRuleHint: true,
    streetRuleHint: PLACEMENT_FEEDBACK_MESSAGES.streetRuleHint,
    lastAttemptMessage
  };
};

/** Projects build-line HUD copy and completion eligibility from tool mode and draft stop ids. */
export const buildLineModeUiFeedback = (
  activeToolMode: WorkspaceToolMode,
  draftStopIds: readonly StopId[]
): BuildLineUiFeedbackContract => {
  if (activeToolMode !== 'build-line') {
    return {
      showBuildLineModeIndicator: false,
      modeInstruction: null,
      minimumStopRequirement: null,
      draftStopCount: 0,
      canCompleteDraft: false
    };
  }

  return {
    showBuildLineModeIndicator: true,
    modeInstruction: BUILD_LINE_FEEDBACK_MESSAGES.instruction,
    minimumStopRequirement: BUILD_LINE_FEEDBACK_MESSAGES.minimumStopRequirement,
    draftStopCount: draftStopIds.length,
    canCompleteDraft: draftStopIds.length >= MINIMUM_STOPS_REQUIRED_TO_COMPLETE_LINE
  };
};
