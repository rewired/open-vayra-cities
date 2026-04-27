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
 * Minimal geometric point tuple in `[longitude, latitude]` order.
 */
type MapLibreLngLatTuple = readonly [number, number];

/**
 * Minimal interaction event shape consumed by the map workspace surface.
 */
export interface MapLibreInteractionEvent {
  readonly point: MapEventPoint;
  readonly lngLat?: MapEventLngLat;
  readonly features?: readonly MapLibreRenderedFeature[];
}

/**
 * Interaction event names used by the workspace baseline.
 */
type MapLibreInteractionEventType =
  | 'mousemove'
  | 'mouseenter'
  | 'mouseleave'
  | 'click'
  | 'movestart'
  | 'move'
  | 'moveend'
  | 'zoomstart'
  | 'zoom'
  | 'zoomend'
  | 'rotatestart'
  | 'rotate'
  | 'rotateend';

/**
 * Render-lifecycle event names used to track per-frame map draw updates.
 */
export type MapLibreRenderLifecycleEventType = 'render' | 'idle' | 'load' | 'styledata';

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
  readonly coordinates?: unknown;
}

/**
 * Minimal rendered feature shape used by local click eligibility validation.
 */
export interface MapLibreRenderedFeature {
  readonly layer?: { readonly id: string };
  readonly source?: string;
  readonly sourceLayer?: string;
  readonly 'source-layer'?: string;
  readonly properties?: Record<string, unknown>;
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
 * Bounding-box query window defined by top-left and bottom-right screen points.
 */
export type MapLibreRenderedFeatureQueryBox = readonly [MapEventPoint, MapEventPoint];

/**
 * Query options for filtering source features to a specific source layer.
 */
interface MapLibreSourceFeatureQueryOptions {
  readonly sourceLayer?: string;
}

/**
 * Minimal GeoJSON point geometry used by source data updates.
 */
interface MapLibreGeoJsonPointGeometry {
  readonly type: 'Point';
  readonly coordinates: MapLibreLngLatTuple;
}

/**
 * Minimal GeoJSON LineString geometry used by source data updates.
 */
interface MapLibreGeoJsonLineStringGeometry {
  readonly type: 'LineString';
  readonly coordinates: readonly MapLibreLngLatTuple[];
}

/**
 * Minimal GeoJSON geometry union used by typed source updates.
 */
type MapLibreGeoJsonGeometry = MapLibreGeoJsonPointGeometry | MapLibreGeoJsonLineStringGeometry;

/**
 * Minimal GeoJSON feature shape used by typed source updates.
 */
export interface MapLibreGeoJsonFeature<
  TProperties extends object = object,
  TGeometry extends MapLibreGeoJsonGeometry = MapLibreGeoJsonGeometry
> {
  readonly type: 'Feature';
  readonly geometry: TGeometry;
  readonly properties: TProperties;
}

/**
 * Minimal GeoJSON collection shape used by typed source updates.
 */
export interface MapLibreGeoJsonFeatureCollection<
  TProperties extends object = object,
  TGeometry extends MapLibreGeoJsonGeometry = MapLibreGeoJsonGeometry
> {
  readonly type: 'FeatureCollection';
  readonly features: readonly MapLibreGeoJsonFeature<TProperties, TGeometry>[];
}

/**
 * Expression-like paint/layout value supported by this minimal layer typing.
 */
type MapLibreExpressionValue = string | number | boolean | readonly unknown[];

/**
 * Minimal map source specification for GeoJSON-backed source registration.
 */
interface MapLibreGeoJsonSourceSpecification<
  TProperties extends object = object,
  TGeometry extends MapLibreGeoJsonGeometry = MapLibreGeoJsonGeometry
> {
  readonly type: 'geojson';
  readonly data: MapLibreGeoJsonFeatureCollection<TProperties, TGeometry>;
}

/**
 * Runtime GeoJSON source handle used for in-place data refresh.
 */
export interface MapLibreGeoJsonSource<
  TProperties extends object = object,
  TGeometry extends MapLibreGeoJsonGeometry = MapLibreGeoJsonGeometry
> {
  /** Replaces source data while preserving source identity and bound layers. */
  setData(data: MapLibreGeoJsonFeatureCollection<TProperties, TGeometry>): void;
}

/**
 * Minimal style layer definition used for stop circle/symbol rendering.
 */
export interface MapLibreLayerSpecification {
  readonly id: string;
  readonly type: 'circle' | 'symbol' | 'line';
  readonly source: string;
  readonly paint?: Readonly<Record<string, MapLibreExpressionValue>>;
  readonly layout?: Readonly<Record<string, MapLibreExpressionValue>>;
  readonly filter?: readonly unknown[];
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
  /** Registers a render-lifecycle listener for per-frame or post-animation update hooks. */
  on(type: MapLibreRenderLifecycleEventType, listener: () => void): void;
  /** Removes a previously registered interaction listener for the provided baseline event type. */
  off(type: MapLibreInteractionEventType, listener: (event: MapLibreInteractionEvent) => void): void;
  /** Removes a previously registered render-lifecycle listener. */
  off(type: MapLibreRenderLifecycleEventType, listener: () => void): void;
  /** Returns the active style document for layer/source-level click validation. */
  getStyle(): MapLibreStyleDefinition | undefined;
  /** Queries rendered features at a clicked screen point, optionally filtered by style layer ids. */
  queryRenderedFeatures(
    pointOrBox: MapEventPoint | MapLibreRenderedFeatureQueryBox,
    options?: MapLibreRenderedFeatureQueryOptions
  ): readonly MapLibreRenderedFeature[];
  /** Queries rendered features across the current viewport, optionally filtered by style layer ids. */
  queryRenderedFeatures(options?: MapLibreRenderedFeatureQueryOptions): readonly MapLibreRenderedFeature[];
  /** Queries source features for a known source id and optional source-layer constraint. */
  querySourceFeatures(sourceId: string, options?: MapLibreSourceFeatureQueryOptions): readonly MapLibreSourceFeature[];
  /** Projects geographic coordinates into current map viewport screen-space coordinates. */
  project(lngLat: MapLibreLngLatTuple): MapEventPoint;
  /** Returns whether the provided source id exists in the current style. */
  getSource<
    TProperties extends object = object,
    TGeometry extends MapLibreGeoJsonGeometry = MapLibreGeoJsonGeometry
  >(sourceId: string): MapLibreGeoJsonSource<TProperties, TGeometry> | undefined;
  /** Registers a GeoJSON source for subsequent style-layer rendering. */
  addSource(sourceId: string, source: MapLibreGeoJsonSourceSpecification): void;
  /** Returns whether the provided layer id exists in the current style. */
  getLayer(layerId: string): MapLibreLayerSpecification | undefined;
  /** Registers a style layer bound to an existing source id. */
  addLayer(layer: MapLibreLayerSpecification): void;
  /** Reorders an existing layer before another layer id, or to the top when `beforeId` is omitted. */
  moveLayer(layerId: string, beforeId?: string): void;
  /** Returns whether the current style is fully loaded and ready for source/layer mutations. */
  isStyleLoaded(): boolean;
  /** Returns the current zoom level of the map. */
  getZoom(): number;
  /** Registers a listener for feature interactions constrained to one style layer id. */
  on(type: 'click' | 'mouseenter' | 'mouseleave', layerId: string, listener: (event: MapLibreInteractionEvent) => void): void;
  /** Removes a feature interaction listener constrained to one style layer id. */
  off(type: 'click' | 'mouseenter' | 'mouseleave', layerId: string, listener: (event: MapLibreInteractionEvent) => void): void;
  /** Smoothly transitions the map viewport to a new center and/or zoom. */
  easeTo(options: { center?: MapLibreLngLatTuple; zoom?: number; padding?: { top: number; bottom: number; left: number; right: number } }): void;
  /** Fits the map viewport to a provided bounding box with optional padding. */
  fitBounds(bounds: [MapLibreLngLatTuple, MapLibreLngLatTuple], options?: { padding?: number | { top: number; bottom: number; left: number; right: number } }): void;
  /** Updates a paint property for an existing style layer. */
  setPaintProperty(layerId: string, name: string, value: MapLibreExpressionValue): void;
  /** Updates a layout property for an existing style layer. */
  setLayoutProperty(layerId: string, name: string, value: MapLibreExpressionValue): void;
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
 * Anchor positions supported by the minimal marker constructor surface used in this workspace.
 */
type MapLibreMarkerAnchor =
  | 'center'
  | 'top'
  | 'bottom'
  | 'left'
  | 'right'
  | 'top-left'
  | 'top-right'
  | 'bottom-left'
  | 'bottom-right';

/**
 * Pixel offset tuple applied to marker placement after anchor resolution.
 */
type MapLibreMarkerOffset = readonly [number, number];

/**
 * Minimal constructor options accepted by the marker API used for stop rendering.
 */
interface MapLibreMarkerConstructorOptions {
  readonly element?: HTMLElement;
  readonly anchor?: MapLibreMarkerAnchor;
  readonly offset?: MapLibreMarkerOffset;
}

/**
 * Minimal constructor API for `window.maplibregl` consumed by the workspace map component.
 */
interface MapLibreGlobal {
  readonly Map: new (options: MapConstructorOptions) => MapLibreMap;
  readonly NavigationControl: new (options: { readonly visualizePitch: boolean }) => unknown;
  readonly Marker: new (options?: MapLibreMarkerConstructorOptions) => MapLibreMarker;
}

declare global {
  interface Window {
    maplibregl: MapLibreGlobal;
  }
}

export {};
