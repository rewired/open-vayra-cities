import type { MapLibreGeoJsonFeatureCollection } from './maplibreGlobal';
import type { DemandNodeInspectionProjection } from '../domain/projection/demandNodeInspectionProjection';
import type { ScenarioDemandNodeRole } from '../domain/constants/scenarioDemand';

/** Properties for a selected demand node context hint. */
export interface DemandNodeContextHintProperties {
  readonly selectedNodeId: string;
  readonly candidateId: string;
  readonly ordinal: number;
  readonly selectedNodeRole: ScenarioDemandNodeRole;
}

/**
 * Builds a deterministic GeoJSON FeatureCollection of contextual planning hints 
 * for a selected demand node.
 *
 * @param projection The current demand node inspection projection state.
 * @returns A FeatureCollection containing straight LineStrings from the context to likely candidates.
 */
export function buildDemandNodeContextHintFeatureCollection(
  projection: DemandNodeInspectionProjection | null
): MapLibreGeoJsonFeatureCollection<DemandNodeContextHintProperties> {
  if (
    !projection ||
    projection.status !== 'ready' ||
    !projection.selectedNodeId ||
    !projection.selectedNodePosition ||
    !projection.selectedNodeRole ||
    projection.contextCandidates.length === 0
  ) {
    return {
      type: 'FeatureCollection',
      features: []
    };
  }

  const features: MapLibreGeoJsonFeatureCollection<DemandNodeContextHintProperties>['features'][number][] = [];

  for (const [candidateIndex, candidate] of projection.contextCandidates.entries()) {
    // Create a straight LineString.
    // By convention, lines are drawn Origin -> Destination.
    // For 'bidirectional', we default to drawing from the selected node outward.
    const isOriginLike = projection.selectedNodeRole === 'origin' || projection.selectedNodeRole === 'bidirectional';
    const originCoords: readonly [number, number] = isOriginLike
      ? [projection.selectedNodePosition.lng, projection.selectedNodePosition.lat]
      : [candidate.position.lng, candidate.position.lat];
    const destinationCoords: readonly [number, number] = isOriginLike
      ? [candidate.position.lng, candidate.position.lat]
      : [projection.selectedNodePosition.lng, projection.selectedNodePosition.lat];

    features.push({
      type: 'Feature',
      geometry: {
        type: 'LineString',
        coordinates: [originCoords, destinationCoords]
      },
      properties: {
        selectedNodeId: projection.selectedNodeId,
        candidateId: candidate.candidateId,
        ordinal: candidate.ordinal,
        selectedNodeRole: projection.selectedNodeRole
      }
    });
  }

  return {
    type: 'FeatureCollection',
    features
  };
}
