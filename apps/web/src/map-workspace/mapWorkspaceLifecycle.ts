import { MAP_WORKSPACE_BOOTSTRAP_CONFIG } from './mapBootstrapConfig';
import type { MapLibreMap } from './maplibreGlobal';

/** Disposable resize binding contract for map workspace lifecycle setup. */
export interface MapWorkspaceResizeBinding {
  readonly dispose: () => void;
}

/** Creates the canonical MapLibre instance for the map workspace using bootstrap config defaults. */
export const createMapWorkspaceInstance = (containerElement: HTMLDivElement): MapLibreMap => {
  const mapInstance = new window.maplibregl.Map({
    container: containerElement,
    style: MAP_WORKSPACE_BOOTSTRAP_CONFIG.styleUrl,
    center: MAP_WORKSPACE_BOOTSTRAP_CONFIG.center,
    zoom: MAP_WORKSPACE_BOOTSTRAP_CONFIG.zoom,
    minZoom: MAP_WORKSPACE_BOOTSTRAP_CONFIG.minZoom,
    maxZoom: MAP_WORKSPACE_BOOTSTRAP_CONFIG.maxZoom,
    attributionControl: true
  });

  mapInstance.addControl(new window.maplibregl.NavigationControl({ visualizePitch: false }), 'top-left');
  return mapInstance;
};

/** Binds container resize behavior to MapLibre resize calls with ResizeObserver fallback. */
export const setupMapResizeBinding = (
  containerElement: HTMLDivElement,
  mapRef: { readonly current: MapLibreMap | null }
): MapWorkspaceResizeBinding => {
  const handleMapResize = (): void => {
    mapRef.current?.resize();
  };
  const resizeObserver =
    typeof ResizeObserver !== 'undefined'
      ? new ResizeObserver(() => {
          handleMapResize();
        })
      : null;

  if (resizeObserver) {
    resizeObserver.observe(containerElement);
  } else {
    window.addEventListener('resize', handleMapResize);
  }

  return {
    dispose: () => {
      if (resizeObserver) {
        resizeObserver.disconnect();
      } else {
        window.removeEventListener('resize', handleMapResize);
      }
    }
  };
};

/** Runs the callback once map style resources are ready and returns an optional unsubscribe hook. */
export const runWhenMapStyleReady = (map: MapLibreMap, callback: () => void): (() => void) | void => {
  if (map.isStyleLoaded()) {
    callback();
    return;
  }

  const onStyleData = (): void => {
    if (!map.isStyleLoaded()) {
      return;
    }

    map.off('styledata', onStyleData);
    callback();
  };

  map.on('styledata', onStyleData);

  return () => {
    map.off('styledata', onStyleData);
  };
};

/** Counts currently rendered features for layers that are present in the active style. */
export const countRenderedFeaturesForLayers = (map: MapLibreMap, layerIds: readonly string[]): number => {
  const availableLayerIds = layerIds.filter((layerId) => map.getLayer(layerId) !== undefined);

  if (availableLayerIds.length === 0) {
    return 0;
  }

  return map.queryRenderedFeatures({ layers: availableLayerIds }).length;
};
