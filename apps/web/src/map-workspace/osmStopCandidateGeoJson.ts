import type { OsmStopCandidateGroup } from '../domain/types/osmStopCandidate';
import type { MapLibreGeoJsonFeatureCollection } from './maplibreGlobal';

/**
 * Properties for OSM stop candidate GeoJSON features, distinct from StopFeatureProperties.
 */
interface OsmStopCandidateFeatureProperties {
  readonly candidateGroupId: string;
  readonly label: string;
  readonly source: string;
  readonly memberCount: number;
  readonly passengerVisibleMemberCount: number;
  readonly vehicleAnchorMemberCount: number;
  readonly berthCountHint: number;
  readonly memberKinds: string;
}

/**
 * Builds a GeoJSON FeatureCollection<Point> from consolidated OSM stop candidate groups.
 * Uses candidateGroupId instead of stopId to avoid confusion with canonical CityOS stops.
 */
export const buildOsmStopCandidateFeatureCollection = (
  groups: readonly OsmStopCandidateGroup[]
): MapLibreGeoJsonFeatureCollection<OsmStopCandidateFeatureProperties> => ({
  type: 'FeatureCollection',
  features: groups.map((group) => ({
    type: 'Feature',
    geometry: {
      type: 'Point',
      coordinates: [group.displayPosition.lng, group.displayPosition.lat]
    },
    properties: {
      candidateGroupId: group.id,
      label: group.label,
      source: group.source,
      memberCount: group.memberCount,
      passengerVisibleMemberCount: group.passengerVisibleMemberCount,
      vehicleAnchorMemberCount: group.vehicleAnchorMemberCount,
      berthCountHint: group.berthCountHint,
      memberKinds: group.memberKinds.join(', ')
    }
  }))
});
