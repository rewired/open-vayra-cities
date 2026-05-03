import type { OsmStopCandidateGroup } from '../domain/types/osmStopCandidate';
import type {
  OsmStopCandidateStreetAnchorResolution,
  OsmStopCandidateStreetAnchorSource
} from '../domain/osm/osmStopCandidateAnchorTypes';
import { classifyOsmStopCandidateStreetAnchorDistance } from '../domain/osm/osmStopCandidateStreetAnchor';
import { calculateGreatCircleDistanceMeters } from '../lib/geometry';
import { resolveNearestRenderedStreetPositionForGeographicPoint } from './mapWorkspaceStreetSnap';
import { OSM_STOP_CANDIDATE_STREET_ANCHOR_REVIEW_MAX_DISTANCE_METERS } from '../domain/osm/osmStopCandidateAnchorConstants';
import type { StreetSnapQueryMap } from './mapWorkspaceRenderedFeatureQuery';

/**
 * Resolves the street routing anchor for an OSM candidate group by snapping its
 * routing anchor position to the nearest rendered street line.
 * 
 * Rules:
 * 1. Uses group.routingAnchorPosition as the basis for snapping.
 * 2. Snaps to nearest street using map-rendered features.
 * 3. Classifies quality by great-circle distance (ready/review/blocked).
 * 4. Preserves original anchor source intent (stop-position vs display-position).
 */
export function resolveOsmStopCandidateGroupStreetAnchor(
  map: StreetSnapQueryMap,
  group: OsmStopCandidateGroup,
  streetLayerIds: readonly string[]
): OsmStopCandidateStreetAnchorResolution {
  const originalAnchor = group.routingAnchorPosition;
  
  // Determine source intent: if group has stop-position members, it was intended as a routing anchor.
  const hasStopPositionMember = group.memberKinds.includes('public-transport-stop-position');
  const source: OsmStopCandidateStreetAnchorSource = hasStopPositionMember
    ? 'osm-stop-position'
    : 'osm-display-position';

  const snapped = resolveNearestRenderedStreetPositionForGeographicPoint(
    map,
    originalAnchor,
    streetLayerIds,
    OSM_STOP_CANDIDATE_STREET_ANCHOR_REVIEW_MAX_DISTANCE_METERS
  );

  if (!snapped) {
    return {
      candidateGroupId: group.id,
      status: 'blocked',
      source,
      originalAnchorPosition: originalAnchor,
      streetAnchorPosition: null,
      distanceMeters: null,
      streetLabelCandidate: null,
      reason: `No rendered street line found within ${OSM_STOP_CANDIDATE_STREET_ANCHOR_REVIEW_MAX_DISTANCE_METERS}m.`
    };
  }

  const distanceMeters = snapped.distanceMeters;

  const status = classifyOsmStopCandidateStreetAnchorDistance(distanceMeters);

  return {
    candidateGroupId: group.id,
    status,
    source: 'street-snap',
    originalAnchorPosition: originalAnchor,
    streetAnchorPosition: { lng: snapped.lng, lat: snapped.lat },
    distanceMeters,
    streetLabelCandidate: snapped.streetLabelCandidate,
    reason: `Snapped to ${snapped.streetLabelCandidate ?? 'unnamed street'} (${Math.round(distanceMeters)}m).`
  };
}
