import type { OsmStopCandidateGroupId } from '../domain/types/osmStopCandidate';
import { createOsmStopCandidateGroupId } from '../domain/types/osmStopCandidate';
import type { ScenarioDemandNode } from '../domain/types/scenarioDemand';
import type { MapLibreExpressionValue, MapLibreMap } from './maplibreGlobal';
import {
  MAP_ENTITY_HOVER_EMPTY_FILTER,
  MAP_LAYER_ID_OSM_STOP_CANDIDATES_HOVER,
  MAP_LAYER_ID_SCENARIO_DEMAND_PREVIEW_HOVER
} from './mapRenderConstants';

/**
 * Shared hover affordance target for clickable map entities.
 *
 * The OSM branch uses the rendered consolidated candidate group id because
 * OSM candidate map interaction is group-based until explicit adoption.
 */
export type MapEntityHoverTarget =
  | { readonly kind: 'demand-node'; readonly id: ScenarioDemandNode['id'] }
  | { readonly kind: 'osm-stop-candidate'; readonly id: OsmStopCandidateGroupId };

/**
 * Minimal canvas surface required to toggle the map cursor during hover.
 */
export interface MapEntityHoverCanvas {
  /** Mutable CSS cursor value for the MapLibre canvas element. */
  readonly style: {
    cursor: string;
  };
}

/**
 * Minimal map surface required to apply and clear hover-only affordance styling.
 */
export type MapEntityHoverAffordanceMap = Pick<MapLibreMap, 'getLayer' | 'setFilter'> & {
  /** Returns the canvas-like element whose cursor should reflect hover affordance. */
  getCanvas(): MapEntityHoverCanvas;
};

/** Controller that makes hover affordance synchronization idempotent. */
export interface MapEntityHoverAffordanceController {
  /** Applies a new hover target only when it differs from the current target. */
  readonly sync: (target: MapEntityHoverTarget | null) => void;
  /** Clears hover affordance only when a target is currently active. */
  readonly clear: () => void;
}

const hasNonEmptyString = (value: unknown): value is string => typeof value === 'string' && value.length > 0;

/**
 * Decodes a supported clickable map entity hover target from rendered feature properties.
 *
 * Returns null for unsupported, incomplete, or malformed property records.
 */
export function decodeMapEntityHoverTargetFromFeatureProperties(
  properties: Record<string, unknown> | undefined
): MapEntityHoverTarget | null {
  if (!properties) {
    return null;
  }

  if (hasNonEmptyString(properties.entityId)) {
    return {
      kind: 'demand-node',
      id: properties.entityId
    };
  }

  if (hasNonEmptyString(properties.candidateGroupId)) {
    return {
      kind: 'osm-stop-candidate',
      id: createOsmStopCandidateGroupId(properties.candidateGroupId)
    };
  }

  return null;
}

const setFilterIfLayerExists = (
  map: MapEntityHoverAffordanceMap,
  layerId: string,
  filter: MapLibreExpressionValue
): void => {
  if (!map.getLayer(layerId)) {
    return;
  }

  map.setFilter(layerId, filter);
};

const buildDemandNodeHoverFilter = (targetId: ScenarioDemandNode['id']): MapLibreExpressionValue =>
  ['==', ['get', 'entityId'], targetId];

const buildOsmStopCandidateHoverFilter = (targetId: OsmStopCandidateGroupId): MapLibreExpressionValue =>
  ['==', ['get', 'candidateGroupId'], targetId];

const areHoverTargetsEqual = (left: MapEntityHoverTarget | null, right: MapEntityHoverTarget | null): boolean =>
  left?.kind === right?.kind && left?.id === right?.id;

/**
 * Applies pointer cursor and display-only hover layer filters for the current map entity hover target.
 *
 * Passing null clears all supported entity hover affordances.
 */
export function syncMapEntityHoverAffordance(
  map: MapEntityHoverAffordanceMap,
  target: MapEntityHoverTarget | null
): void {
  map.getCanvas().style.cursor = target ? 'pointer' : '';
  setFilterIfLayerExists(map, MAP_LAYER_ID_SCENARIO_DEMAND_PREVIEW_HOVER, MAP_ENTITY_HOVER_EMPTY_FILTER);
  setFilterIfLayerExists(map, MAP_LAYER_ID_OSM_STOP_CANDIDATES_HOVER, MAP_ENTITY_HOVER_EMPTY_FILTER);

  if (!target) {
    return;
  }

  if (target.kind === 'demand-node') {
    setFilterIfLayerExists(map, MAP_LAYER_ID_SCENARIO_DEMAND_PREVIEW_HOVER, buildDemandNodeHoverFilter(target.id));
    return;
  }

  setFilterIfLayerExists(map, MAP_LAYER_ID_OSM_STOP_CANDIDATES_HOVER, buildOsmStopCandidateHoverFilter(target.id));
}

/**
 * Creates an idempotent controller for map entity hover affordance mutations.
 *
 * Repeated sync calls for the same target do not rewrite filters or cursor state.
 */
export function createMapEntityHoverAffordanceController(
  map: MapEntityHoverAffordanceMap
): MapEntityHoverAffordanceController {
  let currentHoverTarget: MapEntityHoverTarget | null = null;

  return {
    sync: (target) => {
      if (areHoverTargetsEqual(currentHoverTarget, target)) {
        return;
      }

      currentHoverTarget = target;
      syncMapEntityHoverAffordance(map, target);
    },
    clear: () => {
      if (!currentHoverTarget) {
        return;
      }

      currentHoverTarget = null;
      syncMapEntityHoverAffordance(map, null);
    }
  };
}
