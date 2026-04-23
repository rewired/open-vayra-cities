/**
 * Canonical GeoJSON source id for all placed stop point features rendered in the map workspace.
 */
export const MAP_SOURCE_ID_STOPS = 'cityops-stops';

/**
 * Canonical circle layer id for stop body rendering and feature hit interactions.
 */
export const MAP_LAYER_ID_STOPS_CIRCLE = 'cityops-stops-circle';

/**
 * Canonical symbol layer id for stop label rendering.
 */
export const MAP_LAYER_ID_STOPS_LABEL = 'cityops-stops-label';

/**
 * Canonical style layer ids for stop rendering in deterministic registration order.
 */
export const MAP_STOP_LAYER_IDS = [MAP_LAYER_ID_STOPS_CIRCLE, MAP_LAYER_ID_STOPS_LABEL] as const;

/**
 * Canonical circle layer style for stop body rendering and state-dependent visual emphasis.
 */
export const MAP_STOP_CIRCLE_LAYER_STYLE = {
  'circle-radius': ['case', ['get', 'selected'], 9, 6],
  'circle-color': ['case', ['get', 'selected'], '#f59e0b', '#0f172a'],
  'circle-stroke-width': ['case', ['get', 'draftMember'], 3, 1.5],
  'circle-stroke-color': ['case', ['get', 'buildLineInteractive'], '#38bdf8', '#ffffff']
} as const;

/**
 * Canonical symbol layer layout for stop label placement and readability.
 */
export const MAP_STOP_LABEL_LAYER_LAYOUT = {
  'text-field': ['get', 'label'],
  'text-size': 11,
  'text-offset': [0, 1.3]
} as const;

/**
 * Canonical symbol layer paint for stop label foreground and halo contrast.
 */
export const MAP_STOP_LABEL_LAYER_PAINT = {
  'text-color': '#111827',
  'text-halo-color': '#ffffff',
  'text-halo-width': 1
} as const;
