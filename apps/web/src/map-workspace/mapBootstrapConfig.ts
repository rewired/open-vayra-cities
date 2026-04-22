/**
 * Defines the minimal bootstrap configuration used to initialize the CityOps map workspace surface.
 */
export interface MapBootstrapConfig {
  /** MapLibre style URL used for non-authoritative development basemap rendering. */
  readonly styleUrl: string;
  /** Neutral initial map center as `[longitude, latitude]` for the desktop workspace. */
  readonly center: readonly [number, number];
  /** Initial zoom level for the baseline workspace view. */
  readonly zoom: number;
  /** Lower zoom bound to keep workspace navigation practical during baseline integration. */
  readonly minZoom: number;
  /** Upper zoom bound to avoid extreme zoom levels in the baseline workspace setup. */
  readonly maxZoom: number;
}

/**
 * Centralized baseline map bootstrap settings for the initial desktop MapLibre workspace integration.
 */
export const MAP_WORKSPACE_BOOTSTRAP_CONFIG: MapBootstrapConfig = {
  styleUrl: 'https://demotiles.maplibre.org/style.json',
  center: [0, 20],
  zoom: 1.6,
  minZoom: 1,
  maxZoom: 17
};
