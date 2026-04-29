import { calculateGreatCircleDistanceMeters } from '../../lib/geometry';
import type { Stop } from '../types/stop';
import { createStopId } from '../types/stop';
import type {
  OsmStopCandidateGroup,
  OsmStopCandidateGroupId
} from '../types/osmStopCandidate';
import type { OsmStopCandidateStreetAnchorResolution } from './osmStopCandidateAnchorTypes';
import { OSM_STOP_CANDIDATE_ADOPTION_DUPLICATE_DISTANCE_METERS } from './osmStopCandidateAnchorConstants';

/**
 * Result of evaluating adoption eligibility for an OSM stop candidate group.
 */
export type OsmStopCandidateAdoptionStatus =
  | 'adoptable'
  | 'already-adopted'
  | 'too-close-to-existing-stop'
  | 'anchor-not-ready';

/**
 * Detailed eligibility breakdown for adoption.
 */
export interface OsmStopCandidateAdoptionEligibility {
  readonly status: OsmStopCandidateAdoptionStatus;
  readonly canAdopt: boolean;
  readonly reason: string;
}

/**
 * Evaluates whether an OSM stop candidate group can be adopted as a canonical OpenVayra - Cities stop.
 */
export function evaluateOsmStopCandidateAdoptionEligibility(input: {
  readonly group: OsmStopCandidateGroup;
  readonly anchor: OsmStopCandidateStreetAnchorResolution | null;
  readonly existingStops: readonly Stop[];
  readonly adoptedCandidateGroupIds: ReadonlySet<OsmStopCandidateGroupId>;
}): OsmStopCandidateAdoptionEligibility {
  const { group, anchor, existingStops, adoptedCandidateGroupIds } = input;

  if (adoptedCandidateGroupIds.has(group.id)) {
    return {
      status: 'already-adopted',
      canAdopt: false,
      reason: 'This OSM candidate group has already been adopted in the current session.'
    };
  }

  if (!anchor || anchor.status !== 'ready' || !anchor.streetAnchorPosition) {
    return {
      status: 'anchor-not-ready',
      canAdopt: false,
      reason: anchor?.reason ?? 'No valid street anchor has been resolved for this candidate.'
    };
  }

  // Check proximity to existing stops
  for (const stop of existingStops) {
    const distance = calculateGreatCircleDistanceMeters(
      [stop.position.lng, stop.position.lat],
      [anchor.streetAnchorPosition.lng, anchor.streetAnchorPosition.lat]
    );

    if (distance <= OSM_STOP_CANDIDATE_ADOPTION_DUPLICATE_DISTANCE_METERS) {
      return {
        status: 'too-close-to-existing-stop',
        canAdopt: false,
        reason: `An existing stop (${stop.label}) is too close to the resolved street anchor (${Math.round(distance)}m).`
      };
    }
  }

  return {
    status: 'adoptable',
    canAdopt: true,
    reason: 'Candidate is ready for adoption.'
  };
}

/**
 * Converts a grouped OSM candidate into a canonical OpenVayra - Cities stop using its resolved street anchor.
 */
export function createStopFromOsmCandidateGroup(input: {
  readonly group: OsmStopCandidateGroup;
  readonly anchor: OsmStopCandidateStreetAnchorResolution;
  readonly nextStopIndex: number;
}): Stop {
  const { group, anchor, nextStopIndex } = input;

  if (anchor.status !== 'ready' || !anchor.streetAnchorPosition) {
    throw new Error(`Cannot create stop from OSM candidate: anchor is not ready (${anchor.status})`);
  }

  return {
    id: createStopId(`stop-${nextStopIndex}`),
    position: anchor.streetAnchorPosition,
    label: group.label
  };
}
