import type { OsmStopCandidateGroupId } from '../types/osmStopCandidate';
import type { StopPosition } from '../types/stop';

/**
 * Readiness status of an OSM candidate group for automatic adoption into the CityOps network.
 * Based on the proximity of its routing anchor to a valid street line.
 */
export type OsmStopCandidateStreetAnchorStatus = 'ready' | 'review' | 'blocked';

/**
 * Indicates which position source was used as the basis for street snapping.
 */
export type OsmStopCandidateStreetAnchorSource =
  | 'osm-stop-position'
  | 'osm-display-position'
  | 'street-snap'
  | 'unresolved';

/**
 * Result of resolving a street routing anchor for an OSM candidate group.
 */
export interface OsmStopCandidateStreetAnchorResolution {
  /** The ID of the candidate group this resolution applies to. */
  readonly candidateGroupId: OsmStopCandidateGroupId;
  /** The quality status of the resolved anchor. */
  readonly status: OsmStopCandidateStreetAnchorStatus;
  /** The source of the original anchor before snapping. */
  readonly source: OsmStopCandidateStreetAnchorSource;
  /** The original geographic anchor position from OSM metadata. */
  readonly originalAnchorPosition: StopPosition;
  /** The final snapped position on the street line, or null if unresolved. */
  readonly streetAnchorPosition: StopPosition | null;
  /** The distance in meters from original position to snapped position. */
  readonly distanceMeters: number | null;
  /** The suggested street label from the snapped feature, if found. */
  readonly streetLabelCandidate: string | null;
  /** Rationale for the current status. */
  readonly reason: string;
}
