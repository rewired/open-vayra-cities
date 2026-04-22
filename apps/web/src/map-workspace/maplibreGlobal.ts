/**
 * Minimal MapLibre constructor options used by the CityOps map workspace baseline.
 */
interface MapConstructorOptions {
  readonly container: HTMLElement;
  readonly style: string;
  readonly center: readonly [number, number];
  readonly zoom: number;
  readonly minZoom: number;
  readonly maxZoom: number;
  readonly attributionControl: boolean;
}

/**
 * Screen-space coordinates emitted by pointer-like map interaction events.
 */
interface MapEventPoint {
  readonly x: number;
  readonly y: number;
}

/**
 * Geographic coordinates emitted by map interaction events when available.
 */
interface MapEventLngLat {
  readonly lng: number;
  readonly lat: number;
}

/**
 * Minimal interaction event shape consumed by the map workspace surface.
 */
export interface MapLibreInteractionEvent {
  readonly point: MapEventPoint;
  readonly lngLat?: MapEventLngLat;
}

/**
 * Interaction event names used by the workspace baseline.
 */
type MapLibreInteractionEventType = 'mousemove' | 'click';

/**
 * Minimal style-layer shape required for local stop-placement eligibility checks.
 */
interface MapLibreStyleLayer {
  readonly id: string;
  readonly type: string;
  readonly source?: string;
  readonly sourceLayer?: string;
  readonly 'source-layer'?: string;
}

/**
 * Source descriptor extracted from style layers for feature queries at click locations.
 */
export interface MapLibreFeatureSourceRef {
  readonly source: string;
  readonly sourceLayer?: string;
}

/**
 * Minimal style document shape used for runtime layer/source inspection.
 */
interface MapLibreStyleDefinition {
  readonly layers?: readonly MapLibreStyleLayer[];
}

/**
 * Minimal geometry shape needed to verify stop placement on line-like transport features.
 */
export interface MapLibreFeatureGeometry {
  readonly type?: string;
}

/**
 * Minimal rendered feature shape used by local click eligibility validation.
 */
export interface MapLibreRenderedFeature {
  readonly layer?: { readonly id: string };
  readonly source?: string;
  readonly sourceLayer?: string;
  readonly 'source-layer'?: string;
  readonly geometry?: MapLibreFeatureGeometry;
}

/**
 * Minimal source feature shape used by local click eligibility validation fallback.
 */
export interface MapLibreSourceFeature {
  readonly source?: string;
  readonly sourceLayer?: string;
  readonly 'source-layer'?: string;
  readonly geometry?: MapLibreFeatureGeometry;
}

/**
 * Query options for filtering rendered features to specific style layers.
 */
interface MapLibreRenderedFeatureQueryOptions {
  readonly layers?: readonly string[];
}

/**
 * Query options for filtering source features to a specific source layer.
 */
interface MapLibreSourceFeatureQueryOptions {
  readonly sourceLayer?: string;
}

/**
 * Minimal MapLibre map API surface required by this slice for lifecycle-safe map rendering.
 */
export interface MapLibreMap {
  /** Destroys the map instance and releases related resources. */
  remove(): void;
  /** Recomputes map dimensions after container size changes. */
  resize(): void;
  /** Adds a UI control to the map at a known anchor point. */
  addControl(control: unknown, position: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right'): void;
  /** Registers an interaction listener for the provided baseline event type. */
  on(type: MapLibreInteractionEventType, listener: (event: MapLibreInteractionEvent) => void): void;
  /** Removes a previously registered interaction listener for the provided baseline event type. */
  off(type: MapLibreInteractionEventType, listener: (event: MapLibreInteractionEvent) => void): void;
  /** Returns the active style document for layer/source-level click validation. */
  getStyle(): MapLibreStyleDefinition | undefined;
  /** Queries rendered features at a clicked screen point, optionally filtered by style layer ids. */
  queryRenderedFeatures(
    point: MapEventPoint,
    options?: MapLibreRenderedFeatureQueryOptions
  ): readonly MapLibreRenderedFeature[];
  /** Queries source features for a known source id and optional source-layer constraint. */
  querySourceFeatures(sourceId: string, options?: MapLibreSourceFeatureQueryOptions): readonly MapLibreSourceFeature[];
}

/**
 * Returns source references for the provided layer ids based on the active style definition.
 */
export const getSourceRefsForLayerIds = (
  styleDefinition: MapLibreStyleDefinition | undefined,
  layerIds: readonly string[]
): readonly MapLibreFeatureSourceRef[] => {
  if (!styleDefinition?.layers || layerIds.length === 0) {
    return [];
  }

  const eligibleLayerIdSet = new Set(layerIds);
  const sourceRefsByKey = new Map<string, MapLibreFeatureSourceRef>();

  styleDefinition.layers.forEach((layer) => {
    if (!eligibleLayerIdSet.has(layer.id) || !layer.source) {
      return;
    }

    const sourceLayer = layer.sourceLayer ?? layer['source-layer'];
    const sourceRef: MapLibreFeatureSourceRef = sourceLayer
      ? {
          source: layer.source,
          sourceLayer
        }
      : {
          source: layer.source
        };
    sourceRefsByKey.set(`${sourceRef.source}:${sourceRef.sourceLayer ?? ''}`, sourceRef);
  });

  return Array.from(sourceRefsByKey.values());
};

/**
 * Minimal marker API used to render lightweight stop markers on top of the map.
 */
export interface MapLibreMarker {
  /** Sets marker coordinates in longitude/latitude order. */
  setLngLat(lngLat: readonly [number, number]): MapLibreMarker;
  /** Mounts the marker into the provided map instance. */
  addTo(map: MapLibreMap): MapLibreMarker;
  /** Returns the marker root element for class-based state styling. */
  getElement(): HTMLElement;
  /** Removes the marker from its current map. */
  remove(): void;
}

/**
 * Minimal constructor API for `window.maplibregl` consumed by the workspace map component.
 */
interface MapLibreGlobal {
  readonly Map: new (options: MapConstructorOptions) => MapLibreMap;
  readonly NavigationControl: new (options: { readonly visualizePitch: boolean }) => unknown;
  readonly Marker: new (options?: { readonly element?: HTMLElement }) => MapLibreMarker;
}

declare global {
  interface Window {
    maplibregl: MapLibreGlobal;
  }
}

export {};
