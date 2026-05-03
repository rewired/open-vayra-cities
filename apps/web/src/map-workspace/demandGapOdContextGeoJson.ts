import type { MapLibreGeoJsonFeatureCollection } from './maplibreGlobal';
import type { DemandGapOdContextProjection } from '../domain/projection/demandGapOdContextProjection';

/** Properties for a focused demand gap OD context desire hint. */
export interface DemandGapOdContextHintProperties {
  readonly focusedGapId: string;
  readonly candidateId: string;
  readonly problemSide: 'origin' | 'destination';
  readonly candidateRole: 'origin' | 'destination';
  readonly candidateDemandClass: 'residential' | 'workplace';
  readonly activeWeight: number;
  readonly distanceMeters: number;
  readonly ordinal: number;
}

/**
 * Builds a deterministic GeoJSON FeatureCollection of contextual desire hints 
 * for a focused demand gap.
 *
 * @param projection The current OD context projection state.
 * @returns A FeatureCollection containing straight LineStrings from the focused gap to likely candidates.
 */
export function buildDemandGapOdContextFeatureCollection(
  projection: DemandGapOdContextProjection | null
): MapLibreGeoJsonFeatureCollection<DemandGapOdContextHintProperties> {
  if (
    !projection ||
    projection.status !== 'ready' ||
    !projection.focusedPosition ||
    !projection.focusedGapId ||
    !projection.problemSide ||
    projection.candidates.length === 0
  ) {
    return {
      type: 'FeatureCollection',
      features: []
    };
  }

  const features: MapLibreGeoJsonFeatureCollection<DemandGapOdContextHintProperties>['features'][number][] = [];

  for (let i = 0; i < projection.candidates.length; i++) {
    const candidate = projection.candidates[i]!;

    // Create a straight LineString.
    // By convention, lines are drawn Origin -> Destination.
    const isOriginProblem = projection.problemSide === 'origin';
    const originCoords: readonly [number, number] = isOriginProblem
      ? [projection.focusedPosition.lng, projection.focusedPosition.lat]
      : [candidate.position.lng, candidate.position.lat];
    const destinationCoords: readonly [number, number] = isOriginProblem
      ? [candidate.position.lng, candidate.position.lat]
      : [projection.focusedPosition.lng, projection.focusedPosition.lat];

    features.push({
      type: 'Feature',
      geometry: {
        type: 'LineString',
        coordinates: [originCoords, destinationCoords]
      },
      properties: {
        focusedGapId: projection.focusedGapId,
        candidateId: candidate.id,
        problemSide: projection.problemSide,
        candidateRole: candidate.role,
        candidateDemandClass: candidate.demandClass,
        activeWeight: candidate.activeWeight,
        distanceMeters: candidate.distanceMeters,
        ordinal: i + 1
      }
    });
  }

  return {
    type: 'FeatureCollection',
    features
  };
}
