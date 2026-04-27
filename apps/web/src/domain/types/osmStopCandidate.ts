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
 * Creates a branded OsmStopCandidateId from a raw string.
 */
export const createOsmStopCandidateId = (rawId: string): OsmStopCandidateId => rawId as OsmStopCandidateId;
