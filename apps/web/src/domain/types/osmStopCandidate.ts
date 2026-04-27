import type { StopPosition } from './stop';

/**
 * Branded identifier for OSM stop candidates, distinct from CityOS StopId.
 */
export type OsmStopCandidateId = string & { readonly __brand: 'OsmStopCandidateId' };

/**
 * Kind of OSM public transport stop candidate relevant to bus-first MVP.
 */
export type OsmStopCandidateKind = 'bus-stop' | 'public-transport-platform' | 'public-transport-stop-position';

/**
 * OSM-derived stop candidate, kept separate from canonical CityOS Stop type.
 */
export interface OsmStopCandidate {
  readonly id: OsmStopCandidateId;
  readonly position: StopPosition;
  readonly label: string;
  readonly kind: OsmStopCandidateKind;
  readonly source: 'osm';
  readonly osmElementType?: 'node' | 'way' | 'relation';
  readonly osmElementId?: string;
}

/**
 * Branded identifier for OSM stop candidate groups.
 */
export type OsmStopCandidateGroupId = string & { readonly __brand: 'OsmStopCandidateGroupId' };

/**
 * Member of an OSM stop candidate group, representing one raw OSM object.
 */
export interface OsmStopCandidateGroupMember {
  readonly id: OsmStopCandidateId;
  readonly kind: OsmStopCandidateKind;
  readonly label: string;
  readonly position: StopPosition;
  readonly osmElementId?: string;
}

/**
 * Consolidated OSM stop candidate group, used for display and future adoption.
 * Separated from canonical CityOps Stop type.
 */
export interface OsmStopCandidateGroup {
  readonly id: OsmStopCandidateGroupId;
  readonly label: string;
  readonly displayPosition: StopPosition;
  readonly routingAnchorPosition: StopPosition;
  readonly memberIds: readonly OsmStopCandidateId[];
  readonly memberKinds: readonly OsmStopCandidateKind[];
  readonly memberCount: number;
  readonly passengerVisibleMemberCount: number;
  readonly vehicleAnchorMemberCount: number;
  readonly berthCountHint: number;
  readonly source: 'osm';
}

/**
 * Creates a branded OsmStopCandidateId from a raw string.
 */
export const createOsmStopCandidateId = (rawId: string): OsmStopCandidateId => rawId as OsmStopCandidateId;

/**
 * Creates a branded OsmStopCandidateGroupId from a raw string.
 */
export const createOsmStopCandidateGroupId = (rawId: string): OsmStopCandidateGroupId =>
  rawId as OsmStopCandidateGroupId;
