import type { DemandGapOdContextProjection } from './demandGapOdContextProjection';
import type { DemandGapRankingItem, DemandGapRankingProjection } from './demandGapProjection';

export type FocusedDemandGapPlanningStatus = 'unavailable' | 'ready';

export type FocusedDemandGapPlanningActionKind =
  | 'add-stop-coverage'
  | 'connect-origin-to-destination'
  | 'connect-destination-from-origin';

export interface FocusedDemandGapPlanningEvidenceItem {
  readonly label: string;
  readonly value: string;
}

/**
 * A derived pure projection providing concise planning guidance for a focused demand gap.
 * It combines gap ranking output with OD candidate context to advise the player
 * on the most appropriate next planning action without owning exact simulation truth.
 */
export interface FocusedDemandGapPlanningProjection {
  readonly status: FocusedDemandGapPlanningStatus;
  readonly focusedGapId: string | null;
  readonly actionKind: FocusedDemandGapPlanningActionKind | null;
  readonly title: string | null;
  readonly primaryAction: string | null;
  readonly supportingContext: string | null;
  readonly caveat: string | null;
  readonly evidence: readonly FocusedDemandGapPlanningEvidenceItem[];
}

const findFocusedGapItem = (
  ranking: DemandGapRankingProjection,
  gapId: string
): DemandGapRankingItem | null => {
  if (ranking.status !== 'ready') return null;
  
  return (
    ranking.uncapturedResidentialGaps.find(g => g.id === gapId) ??
    ranking.capturedButUnservedResidentialGaps.find(g => g.id === gapId) ??
    ranking.capturedButUnreachableWorkplaceGaps.find(g => g.id === gapId) ??
    null
  );
};

const createEmptyProjection = (): FocusedDemandGapPlanningProjection => ({
  status: 'unavailable',
  focusedGapId: null,
  actionKind: null,
  title: null,
  primaryAction: null,
  supportingContext: null,
  caveat: null,
  evidence: []
});

/**
 * Projects a concise planning summary for the currently focused demand gap.
 * Derives actionable guidance and simple evidence values based on the kind of gap
 * and its related OD candidate context.
 * 
 * @param ranking - The current demand gap ranking projection
 * @param odContext - The current origin-destination context projection for the focused gap
 * @param focusedGapId - The ID of the currently focused demand gap
 * @returns A strictly typed planning summary projection
 */
export function projectFocusedDemandGapPlanningSummary(
  ranking: DemandGapRankingProjection,
  odContext: DemandGapOdContextProjection,
  focusedGapId: string | null
): FocusedDemandGapPlanningProjection {
  if (!focusedGapId || ranking.status !== 'ready') {
    return createEmptyProjection();
  }

  const gapItem = findFocusedGapItem(ranking, focusedGapId);
  if (!gapItem) {
    return createEmptyProjection();
  }

  const evidence: FocusedDemandGapPlanningEvidenceItem[] = [
    { label: 'Active pressure', value: gapItem.activeWeight.toFixed(1) }
  ];

  if (gapItem.kind !== 'uncaptured-residential') {
    evidence.push({ label: 'Capturing stops', value: gapItem.capturingStopCount.toString() });
  } else {
    evidence.push({
      label: 'Nearest stop',
      value: gapItem.nearestStopDistanceMeters !== null 
        ? `${gapItem.nearestStopDistanceMeters.toFixed(0)}m` 
        : 'Outside access'
    });
  }

  if (odContext.status === 'ready') {
    evidence.push({ label: 'OD candidates', value: odContext.summary.candidateCount.toString() });
    if (odContext.summary.candidateCount > 0) {
      evidence.push({ label: 'Top candidate weight', value: odContext.summary.topActiveWeight.toFixed(1) });
    }
  }

  switch (gapItem.kind) {
    case 'uncaptured-residential':
      return {
        status: 'ready',
        focusedGapId: gapItem.id,
        actionKind: 'add-stop-coverage',
        title: 'Coverage gap',
        primaryAction: 'Place a stop within access range of this residential demand.',
        supportingContext: 'Then connect it toward one of the listed workplace candidates.',
        caveat: 'Hints are planning context, not exact passenger flows.',
        evidence
      };
    case 'captured-unserved-residential':
      return {
        status: 'ready',
        focusedGapId: gapItem.id,
        actionKind: 'connect-origin-to-destination',
        title: 'Unserved captured demand',
        primaryAction: 'Connect the captured origin side to a workplace candidate with active service.',
        supportingContext: 'Check line direction, active time-band service, and whether a workplace-side stop is reachable.',
        caveat: 'This does not assign passengers to a route.',
        evidence
      };
    case 'captured-unreachable-workplace':
      return {
        status: 'ready',
        focusedGapId: gapItem.id,
        actionKind: 'connect-destination-from-origin',
        title: 'Unreachable workplace',
        primaryAction: 'Connect likely residential origins toward this workplace with active service.',
        supportingContext: 'Check line direction and active time-band service before adding more stops.',
        caveat: 'Hints show likely context only, not exact real-world OD truth.',
        evidence
      };
  }
}
