import type { DemandGapRankingProjection } from './demandGapProjection';

/** Status of the focused demand gap lifecycle. */
export type FocusedDemandGapLifecycleStatus =
  | 'unfocused'
  | 'active'
  | 'not-currently-ranked';

/**
 * A pure projection that tracks the lifecycle of a focused demand gap.
 * It identifies if a previously focused gap is still present in the current
 * ranking or if it has fallen out (e.g. due to player action or time-band changes).
 */
export interface FocusedDemandGapLifecycleProjection {
  /** Current lifecycle status of the focused gap. */
  readonly status: FocusedDemandGapLifecycleStatus;
  /** The ID of the gap being tracked, or null if unfocused. */
  readonly focusedGapId: string | null;
  /** High-level feedback title. */
  readonly title: string | null;
  /** Contextual message explaining the status. */
  readonly message: string | null;
  /** Whether the UI should offer a 'Clear focus' action. */
  readonly shouldOfferClearFocus: boolean;
}

/**
 * Projects the lifecycle status of a focused demand gap based on the current ranking.
 * 
 * @param focusedGapId - The ID of the currently focused demand gap from shell state.
 * @param ranking - The current demand gap ranking projection output.
 * @returns A strictly typed lifecycle projection.
 */
export function projectFocusedDemandGapLifecycle(
  focusedGapId: string | null,
  ranking: DemandGapRankingProjection
): FocusedDemandGapLifecycleProjection {
  if (focusedGapId === null) {
    return {
      status: 'unfocused',
      focusedGapId: null,
      title: null,
      message: null,
      shouldOfferClearFocus: false
    };
  }

  const isPresent =
    ranking.uncapturedResidentialGaps.some((g) => g.id === focusedGapId) ||
    ranking.capturedButUnservedResidentialGaps.some((g) => g.id === focusedGapId) ||
    ranking.capturedButUnreachableWorkplaceGaps.some((g) => g.id === focusedGapId);

  if (isPresent) {
    return {
      status: 'active',
      focusedGapId,
      title: 'Focused gap active',
      message: 'This gap is still present in the current demand gap ranking.',
      shouldOfferClearFocus: true
    };
  }

  return {
    status: 'not-currently-ranked',
    focusedGapId,
    title: 'Focused gap no longer appears in current gaps',
    message: 'It may be resolved, below the current ranking threshold, or no longer relevant in this active time band.',
    shouldOfferClearFocus: true
  };
}
