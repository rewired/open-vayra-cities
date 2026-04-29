import type { MapLibreGeoJsonFeatureCollection } from './maplibreGlobal';
import type { ScenarioDemandArtifact } from '../domain/types/scenarioDemand';

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

  // 1. Demand Nodes
  if (artifact.nodes) {
    for (const node of artifact.nodes) {
      features.push({
        type: 'Feature',
        geometry: {
          type: 'Point',
          coordinates: [node.position.lng, node.position.lat]
        },
        properties: {
          entityId: node.id,
          entityKind: 'node',
          label: node.id,
          roleOrCategory: node.role,
          scale: 'n/a',
          weight: node.baseWeight,
          isOriginNode: node.role === 'origin',
          isDestinationNode: node.role === 'destination'
        }
      });
    }
  }

  // 2. Attractors
  if (artifact.attractors) {
    for (const attractor of artifact.attractors) {
      features.push({
        type: 'Feature',
        geometry: {
          type: 'Point',
          coordinates: [attractor.position.lng, attractor.position.lat]
        },
        properties: {
          entityId: attractor.id,
          entityKind: 'attractor',
          label: attractor.id,
          roleOrCategory: attractor.category,
          scale: attractor.scale,
          weight: attractor.sourceWeight,
          attractorCategory: attractor.category,
          attractorScale: attractor.scale
        }
      });
    }
  }

  // 3. Gateways
  if (artifact.gateways) {
    for (const gateway of artifact.gateways) {
      features.push({
        type: 'Feature',
        geometry: {
          type: 'Point',
          coordinates: [gateway.position.lng, gateway.position.lat]
        },
        properties: {
          entityId: gateway.id,
          entityKind: 'gateway',
          label: gateway.id,
          roleOrCategory: gateway.kind,
          scale: gateway.scale,
          weight: gateway.sourceWeight,
          gatewayKind: gateway.kind,
          gatewayScale: gateway.scale
        }
      });
    }
  }

  return {
    type: 'FeatureCollection',
    features
  };
}
