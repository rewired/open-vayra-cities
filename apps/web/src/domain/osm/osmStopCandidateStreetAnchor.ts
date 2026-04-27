import {
  OSM_STOP_CANDIDATE_STREET_ANCHOR_READY_MAX_DISTANCE_METERS,
  OSM_STOP_CANDIDATE_STREET_ANCHOR_REVIEW_MAX_DISTANCE_METERS
} from './osmStopCandidateAnchorConstants';
import type { OsmStopCandidateStreetAnchorStatus } from './osmStopCandidateAnchorTypes';

/**
 * Classifies the quality of a street routing anchor based on its distance from the original OSM candidate.
 * 
 * Rules:
 * - null or non-finite => blocked
 * - <= READY_MAX => ready
 * - <= REVIEW_MAX => review
 * - otherwise => blocked
 */
export function classifyOsmStopCandidateStreetAnchorDistance(
  distanceMeters: number | null
): OsmStopCandidateStreetAnchorStatus {
  if (distanceMeters === null || !Number.isFinite(distanceMeters)) {
    return 'blocked';
  }

  if (distanceMeters <= OSM_STOP_CANDIDATE_STREET_ANCHOR_READY_MAX_DISTANCE_METERS) {
    return 'ready';
  }

  if (distanceMeters <= OSM_STOP_CANDIDATE_STREET_ANCHOR_REVIEW_MAX_DISTANCE_METERS) {
    return 'review';
  }

  return 'blocked';
}
