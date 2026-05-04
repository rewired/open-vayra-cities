import { evaluateOsmStopCandidateAdoptionEligibility } from '../osm/osmStopCandidateAdoption';
import type { OsmStopCandidateStreetAnchorResolution } from '../osm/osmStopCandidateAnchorTypes';
import type { OsmStopCandidateGroup, OsmStopCandidateGroupId } from '../types/osmStopCandidate';
import type { Stop, StopPosition } from '../types/stop';

/** Status values for the selected OSM stop candidate inspection projection. */
export type OsmStopCandidateInspectionStatus = 'unavailable' | 'no-selection' | 'not-found' | 'ready';

/** Player-facing adoption readiness status for an inspected OSM stop candidate. */
export type OsmStopCandidateInspectionAdoptionReadiness =
  | 'ready-for-adoption'
  | 'needs-street-anchor'
  | 'needs-anchor-review'
  | 'blocked-by-existing-stop'
  | 'already-adopted';

/** Compact display row used by the OSM stop candidate Inspector surface. */
export interface OsmStopCandidateInspectionDetailRow {
  readonly label: string;
  readonly value: string;
}

/** Ready projection for a selected OSM stop candidate group. */
export interface ReadyOsmStopCandidateInspectionProjection {
  readonly status: 'ready';
  readonly candidateGroupId: OsmStopCandidateGroupId;
  readonly displayLabel: string;
  readonly sourcePosition: StopPosition;
  readonly displayPosition: StopPosition;
  readonly streetAnchorPosition: StopPosition | null;
  readonly streetAnchorStatusLabel: string;
  readonly adoptionReadiness: OsmStopCandidateInspectionAdoptionReadiness;
  readonly adoptionReadinessLabel: string;
  readonly summaryLabel: string;
  readonly caveat: string;
  readonly nextActionGuidance: string;
  readonly canAdopt: boolean;
  readonly blockedReason: string | null;
  readonly detailRows: readonly OsmStopCandidateInspectionDetailRow[];
}

/** UI-agnostic projection for inspecting selected OSM stop candidates. */
export type OsmStopCandidateInspectionProjection =
  | {
      readonly status: 'unavailable';
      readonly summaryLabel: string;
      readonly caveat: string;
    }
  | {
      readonly status: 'no-selection';
      readonly summaryLabel: string;
      readonly caveat: string;
    }
  | {
      readonly status: 'not-found';
      readonly selectedCandidateGroupId: OsmStopCandidateGroupId;
      readonly summaryLabel: string;
      readonly caveat: string;
    }
  | ReadyOsmStopCandidateInspectionProjection;

/** Inputs required to project selected OSM stop candidate inspection state. */
export interface ProjectOsmStopCandidateInspectionInput {
  readonly candidateGroups: readonly OsmStopCandidateGroup[] | null;
  readonly selectedCandidateGroupId: OsmStopCandidateGroupId | null;
  readonly anchorResolution: OsmStopCandidateStreetAnchorResolution | null;
  readonly existingStops: readonly Stop[];
  readonly adoptedCandidateGroupIds: ReadonlySet<OsmStopCandidateGroupId>;
}

const NOT_CANONICAL_CAVEAT =
  'Adoption is required before this can serve demand or be used in lines.';

const formatPosition = (position: StopPosition): string =>
  `${position.lat.toFixed(5)}, ${position.lng.toFixed(5)}`;

const resolveAnchorStatusLabel = (
  anchorResolution: OsmStopCandidateStreetAnchorResolution | null
): string => {
  if (!anchorResolution) {
    return 'No street anchor resolved';
  }

  if (anchorResolution.status === 'ready') {
    return 'Ready street anchor';
  }

  if (anchorResolution.status === 'review') {
    return 'Needs street anchor review';
  }

  return 'Needs street anchor';
};

const resolveAdoptionReadiness = (
  eligibilityStatus: ReturnType<typeof evaluateOsmStopCandidateAdoptionEligibility>['status'],
  anchorResolution: OsmStopCandidateStreetAnchorResolution | null
): OsmStopCandidateInspectionAdoptionReadiness => {
  if (eligibilityStatus === 'adoptable') {
    return 'ready-for-adoption';
  }

  if (eligibilityStatus === 'already-adopted') {
    return 'already-adopted';
  }

  if (eligibilityStatus === 'too-close-to-existing-stop') {
    return 'blocked-by-existing-stop';
  }

  if (anchorResolution?.status === 'review') {
    return 'needs-anchor-review';
  }

  return 'needs-street-anchor';
};

const ADOPTION_READINESS_LABELS: Readonly<Record<OsmStopCandidateInspectionAdoptionReadiness, string>> = {
  'ready-for-adoption': 'Ready for adoption',
  'needs-street-anchor': 'Needs street anchor',
  'needs-anchor-review': 'Needs street anchor review',
  'blocked-by-existing-stop': 'Blocked by existing stop',
  'already-adopted': 'Already adopted'
};

/** Projects selected OSM stop candidate readiness without creating canonical stops or mutating network truth. */
export function projectOsmStopCandidateInspection(
  input: ProjectOsmStopCandidateInspectionInput
): OsmStopCandidateInspectionProjection {
  if (!input.candidateGroups) {
    return {
      status: 'unavailable',
      summaryLabel: 'OSM stop candidates unavailable',
      caveat: NOT_CANONICAL_CAVEAT
    };
  }

  if (!input.selectedCandidateGroupId) {
    return {
      status: 'no-selection',
      summaryLabel: 'No OSM stop candidate selected',
      caveat: NOT_CANONICAL_CAVEAT
    };
  }

  const candidateGroup = input.candidateGroups.find((group) => group.id === input.selectedCandidateGroupId);

  if (!candidateGroup) {
    return {
      status: 'not-found',
      selectedCandidateGroupId: input.selectedCandidateGroupId,
      summaryLabel: 'Selected OSM stop candidate not found',
      caveat: NOT_CANONICAL_CAVEAT
    };
  }

  const anchorResolution =
    input.anchorResolution?.candidateGroupId === candidateGroup.id ? input.anchorResolution : null;
  const eligibility = evaluateOsmStopCandidateAdoptionEligibility({
    group: candidateGroup,
    anchor: anchorResolution,
    existingStops: input.existingStops,
    adoptedCandidateGroupIds: input.adoptedCandidateGroupIds
  });
  const adoptionReadiness = resolveAdoptionReadiness(eligibility.status, anchorResolution);
  const streetAnchorPosition = anchorResolution?.streetAnchorPosition ?? null;

  return {
    status: 'ready',
    candidateGroupId: candidateGroup.id,
    displayLabel: candidateGroup.label,
    sourcePosition: candidateGroup.routingAnchorPosition,
    displayPosition: candidateGroup.displayPosition,
    streetAnchorPosition,
    streetAnchorStatusLabel: resolveAnchorStatusLabel(anchorResolution),
    adoptionReadiness,
    adoptionReadinessLabel: ADOPTION_READINESS_LABELS[adoptionReadiness],
    summaryLabel: 'Not yet a game stop',
    caveat: NOT_CANONICAL_CAVEAT,
    nextActionGuidance:
      adoptionReadiness === 'ready-for-adoption'
        ? 'Adopt this candidate to create one canonical OpenVayra stop.'
        : 'Resolve a ready street anchor before creating a real OpenVayra stop from this candidate.',
    canAdopt: eligibility.canAdopt,
    blockedReason: eligibility.canAdopt ? null : eligibility.reason,
    detailRows: [
      { label: 'Candidate ID', value: candidateGroup.id },
      { label: 'Display position', value: formatPosition(candidateGroup.displayPosition) },
      { label: 'Source anchor', value: formatPosition(candidateGroup.routingAnchorPosition) },
      {
        label: 'Street anchor',
        value: streetAnchorPosition ? formatPosition(streetAnchorPosition) : 'Not resolved'
      },
      { label: 'Members', value: `${candidateGroup.memberCount}` },
      { label: 'Berths', value: `${candidateGroup.berthCountHint}` }
    ]
  };
}
