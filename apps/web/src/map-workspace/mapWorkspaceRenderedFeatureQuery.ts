import type { 
  MapLibreMap, 
  MapEventPoint, 
  MapLibreRenderedFeatureQueryBox, 
  MapLibreRenderedFeature,
  MapLibreInteractionEvent
} from './maplibreGlobal';

/** Disposable interaction binding returned by workspace map setup helpers. */
export interface MapWorkspaceInteractionBinding {
  readonly dispose: () => void;
}

/**
 * Minimal MapLibre surface required for rendered feature queries on existing layers.
 */
export interface RenderedFeatureLayerQueryMap {
  /** Returns whether the provided layer id exists in the current style. */
  readonly getLayer: MapLibreMap['getLayer'];
  /** Queries rendered features at a screen point or box, optionally filtered by layers. */
  readonly queryRenderedFeatures: MapLibreMap['queryRenderedFeatures'];
}

/**
 * Minimal MapLibre surface required for safe layer-scoped interaction binding.
 */
export interface LayerInteractionBindingMap {
  /** Returns whether the provided layer id exists in the current style. */
  readonly getLayer: MapLibreMap['getLayer'];
  /** Registers an interaction listener for a style layer id. */
  readonly on: MapLibreMap['on'];
  /** Removes a previously registered interaction listener. */
  readonly off: MapLibreMap['off'];
}

/**
 * Minimal MapLibre surface required for nearby street label lookups.
 */
export interface NearbyLabelQueryMap {
  /** Projects geographic coordinates into current map viewport screen-space coordinates. */
  readonly project: MapLibreMap['project'];
  /** Queries rendered features at a clicked screen point, optionally filtered by style layer ids. */
  readonly queryRenderedFeatures: MapLibreMap['queryRenderedFeatures'];
}

/**
 * Minimal MapLibre surface required for street snap resolution.
 */
export interface StreetSnapQueryMap {
  /** Returns the active style document for layer/source-level click validation. */
  readonly getStyle: MapLibreMap['getStyle'];
  /** Returns the current zoom level of the map. */
  readonly getZoom: MapLibreMap['getZoom'];
  /** Projects geographic coordinates into current map viewport screen-space coordinates. */
  readonly project: MapLibreMap['project'];
  /** Queries rendered features at a clicked screen point, optionally filtered by style layer ids. */
  readonly queryRenderedFeatures: MapLibreMap['queryRenderedFeatures'];
  /** Queries source features for a known source id and optional source-layer constraint. */
  readonly querySourceFeatures: MapLibreMap['querySourceFeatures'];
}

/**
 * Filters the requested layer IDs to only those currently present in the map style.
 * 
 * MapLibre throws an error if queryRenderedFeatures is called with layer IDs
 * that do not exist in the current style.
 * 
 * @param map The MapLibre map instance.
 * @param layerIds The candidate layer IDs to query.
 * @returns The subset of layer IDs that actually exist in the style.
 */
export const filterExistingLayerIds = (map: RenderedFeatureLayerQueryMap, layerIds: readonly string[]): string[] => {
  return layerIds.filter((layerId) => map.getLayer(layerId) !== undefined);
};

/**
 * Safely queries rendered features for a set of layer IDs, filtering out any missing layers.
 * 
 * Returns an empty array if none of the requested layers exist in the current style.
 * 
 * @param map The MapLibre map instance.
 * @param pointOrBox The geometry to query.
 * @param layerIds The layer IDs to query for features.
 * @returns The rendered features found in the existing layers.
 */
export const queryRenderedFeaturesForExistingLayers = (
  map: RenderedFeatureLayerQueryMap,
  pointOrBox: MapEventPoint | MapLibreRenderedFeatureQueryBox,
  layerIds: readonly string[]
): readonly MapLibreRenderedFeature[] => {
  const existingLayerIds = filterExistingLayerIds(map, layerIds);

  if (existingLayerIds.length === 0) {
    return [];
  }

  return map.queryRenderedFeatures(pointOrBox, { layers: existingLayerIds });
};

/**
 * Safely registers a layer-scoped MapLibre interaction listener only if the layer exists.
 * 
 * Returns a disposable binding that removes the listener only if it was actually registered.
 * 
 * @param map The MapLibre map instance.
 * @param type The interaction event type.
 * @param layerId The style layer ID to bind to.
 * @param listener The interaction event listener.
 * @returns A disposable binding.
 */
export const bindSafeLayerInteraction = (
  map: LayerInteractionBindingMap,
  type: 'click' | 'mouseenter' | 'mouseleave' | 'mousemove',
  layerId: string,
  listener: (event: MapLibreInteractionEvent) => void
): MapWorkspaceInteractionBinding => {
  if (!map.getLayer(layerId)) {
    return { dispose: () => {} };
  }

  map.on(type, layerId, listener);

  return {
    dispose: () => {
      map.off(type, layerId, listener);
    }
  };
};
