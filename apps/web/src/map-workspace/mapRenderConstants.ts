/**
 * Canonical GeoJSON source id for all placed stop point features rendered in the map workspace.
 */
export const MAP_SOURCE_ID_STOPS = 'cityops-stops';
/**
 * Canonical GeoJSON source id for completed session line rendering.
 */
export const MAP_SOURCE_ID_COMPLETED_LINES = 'cityops-completed-lines';

/**
 * Canonical GeoJSON source id for active draft line rendering.
 */
export const MAP_SOURCE_ID_DRAFT_LINE = 'cityops-draft-line';

/**
 * Canonical circle layer id for stop body rendering and feature hit interactions.
 */
export const MAP_LAYER_ID_STOPS_CIRCLE = 'cityops-stops-circle';

/**
 * Canonical symbol layer id for stop label rendering.
 */
export const MAP_LAYER_ID_STOPS_LABEL = 'cityops-stops-label';

/**
 * Canonical line layer id for non-selected completed line rendering.
 */
export const MAP_LAYER_ID_COMPLETED_LINES = 'cityops-completed-lines';

/**
 * Canonical line layer id for selected completed line emphasis.
 */
export const MAP_LAYER_ID_COMPLETED_LINES_SELECTED = 'cityops-completed-lines-selected';

/**
 * Canonical line layer id for active draft line preview rendering.
 */
export const MAP_LAYER_ID_DRAFT_LINE = 'cityops-draft-line';

/**
 * Canonical style layer ids for stop rendering in deterministic registration order.
 */
export const MAP_STOP_LAYER_IDS = [MAP_LAYER_ID_STOPS_CIRCLE, MAP_LAYER_ID_STOPS_LABEL] as const;
/**
 * Canonical style layer ids for completed line rendering in deterministic registration order.
 */
export const MAP_COMPLETED_LINE_LAYER_IDS = [MAP_LAYER_ID_COMPLETED_LINES, MAP_LAYER_ID_COMPLETED_LINES_SELECTED] as const;

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

/**
 * Canonical baseline style for non-selected completed lines.
 */
export const MAP_COMPLETED_LINE_LAYER_PAINT = {
  'line-color': '#1d4ed8',
  'line-width': 4,
  'line-opacity': 0.85
} as const;

/**
 * Canonical selection-emphasis style for selected completed lines.
 */
export const MAP_COMPLETED_LINE_SELECTED_LAYER_PAINT = {
  'line-color': '#f59e0b',
  'line-width': 6,
  'line-opacity': 1
} as const;

/**
 * Canonical style filter for non-selected completed lines.
 */
export const MAP_COMPLETED_LINE_LAYER_FILTER = ['==', ['get', 'selected'], false] as const;

/**
 * Canonical style filter for selected completed lines.
 */
export const MAP_COMPLETED_LINE_SELECTED_LAYER_FILTER = ['==', ['get', 'selected'], true] as const;

/**
 * Canonical draft line preview style.
 */
export const MAP_DRAFT_LINE_LAYER_PAINT = {
  'line-color': '#38bdf8',
  'line-width': 4,
  'line-opacity': 0.95
} as const;
