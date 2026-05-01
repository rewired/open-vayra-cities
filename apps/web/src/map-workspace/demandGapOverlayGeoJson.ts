import type { MapLibreGeoJsonFeatureCollection } from './maplibreGlobal';
import type { DemandGapRankingProjection, DemandGapRankingItem } from '../domain/projection/demandGapProjection';

/**
 * Public demand gap overlay feature property contract projected into MapLibre GeoJSON sources.
 */
export interface DemandGapOverlayFeatureProperties {
  /** Unique gap identifier. */
  readonly gapId: string;
  /** Kind of demand gap. */
  readonly kind: DemandGapRankingItem['kind'];
  /** Active demand weight for the current time band. */
  readonly activeWeight: number;
  /** Visual weight clamped for heatmap visibility. */
  readonly visualWeight: number;
  /** Base demographic weight. */
  readonly baseWeight: number;
  /** Distance to the nearest stop in meters, if any. */
  readonly nearestStopDistanceMeters: number | null;
  /** Number of stops currently capturing this node. */
  readonly capturingStopCount: number;
  /** Whether this gap is currently focused in the UI. */
  readonly focused: boolean;
}

/**
 * Builds a deterministic GeoJSON FeatureCollection of Point features representing demand gaps.
 * Flattens all gap categories from the projection into a single collection.
 * 
 * @param projection The current demand gap ranking projection.
 * @param focusedGapId Optional ID of the currently focused demand gap.
 */
export function buildDemandGapOverlayFeatureCollection(
  projection: DemandGapRankingProjection | null,
  focusedGapId: string | null = null
): MapLibreGeoJsonFeatureCollection<DemandGapOverlayFeatureProperties> {
  if (!projection || projection.status === 'unavailable') {
    return {
      type: 'FeatureCollection',
      features: []
    };
  }

  const allGaps = [
    ...projection.uncapturedResidentialGaps,
    ...projection.capturedButUnservedResidentialGaps,
    ...projection.capturedButUnreachableWorkplaceGaps
  ];

  return {
    type: 'FeatureCollection',
    features: allGaps.map((item) => ({
      type: 'Feature',
      geometry: {
        type: 'Point',
        coordinates: [item.position.lng, item.position.lat]
      },
      properties: {
        gapId: item.id,
        kind: item.kind,
        activeWeight: item.activeWeight,
        // Clamp visual weight to ensure even small gaps contribute to the heatmap pressure.
        // We use a floor to avoid invisible heat areas for very small weights.
        visualWeight: Math.max(1, Math.min(20, item.activeWeight)),
        baseWeight: item.baseWeight,
        nearestStopDistanceMeters: item.nearestStopDistanceMeters,
        capturingStopCount: item.capturingStopCount,
        focused: item.id === focusedGapId
      }
    }))
  };
}
