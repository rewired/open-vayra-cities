/**
 * Defines the centralized bootstrap values used to initialize the CityOps Hamburg map workspace surface.
 */
export interface MapBootstrapConfig {
  /** MapLibre style URL for a street-legible Hamburg startup basemap suitable for stop placement. */
  readonly styleUrl: string;
  /** Initial Hamburg startup center as `[longitude, latitude]` for immediate city gameplay context. */
  readonly center: readonly [number, number];
  /** Initial city-scale zoom tuned for practical street readability during stop placement. */
  readonly zoom: number;
  /** Lower zoom bound that keeps desktop MVP navigation intentionally city-focused. */
  readonly minZoom: number;
  /** Upper zoom bound that still supports close street inspection without excessive granularity. */
  readonly maxZoom: number;
}

/**
 * Centralized Hamburg startup map bootstrap settings for desktop MVP stop-placement readability.
 */
export const MAP_WORKSPACE_BOOTSTRAP_CONFIG: MapBootstrapConfig = {
  styleUrl: 'https://basemaps.cartocdn.com/gl/positron-gl-style/style.json',
  center: [9.993682, 53.551086],
  zoom: 12,
  minZoom: 10,
  maxZoom: 18
};
