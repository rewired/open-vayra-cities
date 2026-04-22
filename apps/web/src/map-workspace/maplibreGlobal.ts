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
 * Minimal MapLibre map API surface required by this slice for lifecycle-safe map rendering.
 */
export interface MapLibreMap {
  /** Destroys the map instance and releases related resources. */
  remove(): void;
  /** Adds a UI control to the map at a known anchor point. */
  addControl(control: unknown, position: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right'): void;
}

/**
 * Minimal constructor API for `window.maplibregl` consumed by the workspace map component.
 */
interface MapLibreGlobal {
  readonly Map: new (options: MapConstructorOptions) => MapLibreMap;
  readonly NavigationControl: new (options: { readonly visualizePitch: boolean }) => unknown;
}

declare global {
  interface Window {
    maplibregl: MapLibreGlobal;
  }
}

export {};
