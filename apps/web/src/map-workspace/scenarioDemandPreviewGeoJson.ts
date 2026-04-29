import type { MapLibreGeoJsonFeatureCollection } from './maplibreGlobal';
import type { ScenarioDemandArtifact } from '../domain/types/scenarioDemand';
import { SCENARIO_DEMAND_PREVIEW_MAX_RENDERED_FEATURES } from './mapRenderConstants';

/**
 * Public scenario demand preview feature property contract projected into MapLibre GeoJSON sources.
 */
export interface ScenarioDemandPreviewFeatureProperties {
  /** Unique entity identifier. */
  readonly entityId: string;
  /** Structural role classification. */
  readonly entityKind: 'node' | 'attractor' | 'gateway';
  /** Human-readable entity label. */
  readonly label: string;
  /** Categorization string mapped from role, category, or kind. */
  readonly roleOrCategory: string;
  /** Catchment tier mapped from scale, defaults to 'n/a'. */
  readonly scale: string;
  /** Baseline demographic weight constraint. */
  readonly weight: number;

  // Entity-specific preservation extensions
  readonly isOriginNode?: boolean;
  readonly isDestinationNode?: boolean;
  readonly attractorCategory?: string;
  readonly attractorScale?: string;
  readonly gatewayKind?: string;
  readonly gatewayScale?: string;
}

/**
 * Builds a deterministic GeoJSON FeatureCollection of Point features representing spatial scenario demand entities.
 * Features are grouped and ordered: nodes first, then attractors, then gateways.
 * 
 * @param artifact The optional loaded ScenarioDemandArtifact.
 */
export function buildScenarioDemandPreviewFeatureCollection(
  artifact: ScenarioDemandArtifact | null
): MapLibreGeoJsonFeatureCollection<ScenarioDemandPreviewFeatureProperties> {
  if (!artifact) {
    return {
      type: 'FeatureCollection',
      features: []
    };
  }

  const features: Array<{
    type: 'Feature';
    geometry: {
      type: 'Point';
      coordinates: [number, number];
    };
    properties: ScenarioDemandPreviewFeatureProperties;
  }> = [];

  // 1. Demand Nodes (Consumes runtime demand nodes only)
  if (artifact.nodes) {
    for (const node of artifact.nodes) {
      let entityKind: 'node' | 'attractor' | 'gateway' = 'node';
      if (node.class === 'workplace') {
        entityKind = 'attractor';
      } else if (node.class === 'gateway') {
        entityKind = 'gateway';
      }

      features.push({
        type: 'Feature',
        geometry: {
          type: 'Point',
          coordinates: [node.position.lng, node.position.lat]
        },
        properties: {
          entityId: node.id,
          entityKind,
          label: node.id,
          roleOrCategory: node.role === 'destination' ? (node.class || 'workplace') : node.role,
          scale: 'n/a',
          weight: node.baseWeight,
          isOriginNode: node.role === 'origin',
          isDestinationNode: node.role === 'destination',
          ...(entityKind === 'attractor' ? { attractorCategory: node.class, attractorScale: 'n/a' } : {}),
          ...(entityKind === 'gateway' ? { gatewayKind: 'other', gatewayScale: 'n/a' } : {})
        }
      });
    }
  }

  let finalFeatures = features;
  if (features.length > SCENARIO_DEMAND_PREVIEW_MAX_RENDERED_FEATURES) {
    const step = features.length / SCENARIO_DEMAND_PREVIEW_MAX_RENDERED_FEATURES;
    finalFeatures = [];
    for (let i = 0; i < SCENARIO_DEMAND_PREVIEW_MAX_RENDERED_FEATURES; i++) {
      const index = Math.floor(i * step);
      if (features[index]) {
        finalFeatures.push(features[index]);
      }
    }
  }

  return {
    type: 'FeatureCollection',
    features: finalFeatures
  };
}
