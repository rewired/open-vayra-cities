import type { DemandGapOdContextProjection } from './demandGapOdContextProjection';

/** Player-facing display row for one projected OD context candidate. */
export interface DemandGapOdCandidateDisplayRow {
  readonly ordinal: number;
  readonly candidateId: string;
  readonly roleLabel: string;
  readonly demandClassLabel: string;
  readonly displayLabel: string;
  readonly activeWeightLabel: string;
  readonly distanceLabel: string;
  readonly position: { readonly lng: number; readonly lat: number };
}

/** Read-only projection state representing a list of OD candidates for a focused demand gap. */
export interface DemandGapOdCandidateListProjection {
  readonly status: 'unavailable' | 'ready';
  readonly heading: string | null;
  readonly rows: readonly DemandGapOdCandidateDisplayRow[];
}

const createEmptyProjection = (): DemandGapOdCandidateListProjection => ({
  status: 'unavailable',
  heading: null,
  rows: []
});

/**
 * Derives a pure display projection for OD candidates, decoupling raw domain IDs
 * from the Inspector UI. Formats weights and distances deterministically.
 */
export function projectDemandGapOdCandidateList(
  context: DemandGapOdContextProjection
): DemandGapOdCandidateListProjection {
  if (
    context.status !== 'ready' ||
    context.candidates.length === 0 ||
    context.problemSide === null
  ) {
    return createEmptyProjection();
  }

  const isWorkplaceProblem = context.problemSide === 'origin';
  const heading = isWorkplaceProblem ? 'Likely workplace candidates' : 'Likely residential candidates';
  const labelPrefix = isWorkplaceProblem ? 'Workplace candidate' : 'Residential candidate';

  const rows = context.candidates.map((candidate, index): DemandGapOdCandidateDisplayRow => {
    const ordinal = index + 1;
    const distanceMeters = candidate.distanceMeters;
    
    let distanceLabel: string;
    if (distanceMeters < 1000) {
      distanceLabel = `${Math.round(distanceMeters)}m`;
    } else {
      distanceLabel = `${(distanceMeters / 1000).toFixed(1)}km`;
    }

    return {
      ordinal,
      candidateId: candidate.id,
      roleLabel: candidate.role,
      demandClassLabel: candidate.demandClass,
      displayLabel: `#${ordinal} ${labelPrefix}`,
      activeWeightLabel: candidate.activeWeight.toFixed(1),
      distanceLabel,
      position: candidate.position
    };
  });

  return {
    status: 'ready',
    heading,
    rows
  };
}
