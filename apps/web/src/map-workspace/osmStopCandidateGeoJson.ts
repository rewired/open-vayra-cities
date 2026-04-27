import type { OsmStopCandidate } from '../domain/types/osmStopCandidate';
import type { MapLibreGeoJsonFeatureCollection } from './maplibreGlobal';

/**
 * Properties for OSM stop candidate GeoJSON features, distinct from StopFeatureProperties.
 */
interface OsmStopCandidateFeatureProperties {
  readonly candidateId: string;
  readonly label: string;
  readonly kind: string;
  readonly source: string;
}

/**
 * Builds a GeoJSON FeatureCollection<Point> from OSM stop candidates.
 * Uses candidateId instead of stopId to avoid confusion with canonical CityOS stops.
 */
export const buildOsmStopCandidateFeatureCollection = (
  candidates: readonly OsmStopCandidate[]
): MapLibreGeoJsonFeatureCollection<OsmStopCandidateFeatureProperties> => ({
  type: 'FeatureCollection',
  features: candidates.map((candidate) => ({
    type: 'Feature',
    geometry: {
      type: 'Point',
      coordinates: [candidate.position.lng, candidate.position.lat]
    },
    properties: {
      candidateId: candidate.id,
      label: candidate.label,
      kind: candidate.kind,
      source: candidate.source
    }
  }))
});
