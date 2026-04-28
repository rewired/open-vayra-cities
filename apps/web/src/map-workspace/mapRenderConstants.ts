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
 * Canonical GeoJSON source id for projected active vehicle point rendering.
 */
export const MAP_SOURCE_ID_VEHICLES = 'cityops-vehicles';

/**
 * Canonical circle layer id for stop body rendering and feature hit interactions.
 */
export const MAP_LAYER_ID_STOPS_CIRCLE = 'cityops-stops-circle';

/**
 * Canonical symbol layer id for stop label rendering.
 */
export const MAP_LAYER_ID_STOPS_LABEL = 'cityops-stops-label';

/**
 * Canonical line layer id for completed line casing contrast rendering.
 */
export const MAP_LAYER_ID_COMPLETED_LINES_CASING = 'cityops-completed-lines-casing';

/**
 * Canonical line layer id for completed line foreground rendering and interactions.
 */
export const MAP_LAYER_ID_COMPLETED_LINES = 'cityops-completed-lines';

/**
 * Canonical line layer id for active draft line preview rendering.
 */
export const MAP_LAYER_ID_DRAFT_LINE = 'cityops-draft-line';
/**
 * Canonical circle layer id for projected active vehicle marker rendering.
 */
export const MAP_LAYER_ID_VEHICLES = 'cityops-vehicles';

/**
 * Canonical style layer ids for stop rendering in deterministic registration order.
 */
export const MAP_STOP_LAYER_IDS = [MAP_LAYER_ID_STOPS_CIRCLE, MAP_LAYER_ID_STOPS_LABEL] as const;
/**
 * Canonical style layer ids for completed line rendering in deterministic registration order.
 */
export const MAP_COMPLETED_LINE_LAYER_IDS = [MAP_LAYER_ID_COMPLETED_LINES_CASING, MAP_LAYER_ID_COMPLETED_LINES] as const;
/**
 * Canonical style layer ids for projected vehicle marker rendering in deterministic registration order.
 */
export const MAP_VEHICLE_LAYER_IDS = [MAP_LAYER_ID_VEHICLES] as const;

/**
 * Canonical circle layer style for stop body rendering and state-dependent visual emphasis.
 */
export const MAP_STOP_CIRCLE_LAYER_STYLE = {
  'circle-radius': ['case', ['get', 'selected'], 15, 12],
  'circle-color': [
    'case',
    ['get', 'selected'],
    '#f59e0b',
    ['get', 'selectedLineMember'],
    '#f59e0b',
    '#0f172a'
  ],
  'circle-stroke-width': ['case', ['get', 'draftMember'], 3, 1.5],
  'circle-stroke-color': ['case', ['get', 'buildLineInteractive'], '#38bdf8', '#ffffff']
} as const;

/**
 * Canonical symbol layer layout for stop label placement and readability.
 */
export const MAP_STOP_LABEL_LAYER_LAYOUT = {
  'text-field': ['case', ['has', 'sequenceNumber'], ['to-string', ['get', 'sequenceNumber']], ''],
  'text-size': 15,
  'text-offset': [0, 0],
  'text-allow-overlap': true,
  'text-ignore-placement': true
} as const;

/**
 * Canonical symbol layer paint for stop label foreground and halo contrast.
 */
export const MAP_STOP_LABEL_LAYER_PAINT = {
  'text-color': [
    'case',
    ['get', 'selected'],
    '#0f172a',
    ['get', 'selectedLineMember'],
    '#0f172a',
    '#ffffff'
  ],
  'text-halo-color': [
    'case',
    ['get', 'selected'],
    'rgba(255, 255, 255, 0.75)',
    ['get', 'selectedLineMember'],
    'rgba(255, 255, 255, 0.75)',
    'rgba(15, 23, 42, 0.75)'
  ],
  'text-halo-width': 1
} as const;

/**
 * Pixel offset applied to separate forward and reverse directions of bidirectional lines.
 */
export const MAP_LINE_DIRECTION_OFFSET_PIXELS = 3;

/**
 * Canonical contrast-casing style beneath completed line foreground rendering.
 */
export const MAP_COMPLETED_LINE_CASING_LAYER_PAINT = {
  'line-color': '#0f172a',
  'line-width': 8,
  'line-opacity': 0.75,
  'line-offset': [
    'case',
    ['==', ['get', 'travelDirection'], 'reverse'],
    -MAP_LINE_DIRECTION_OFFSET_PIXELS,
    MAP_LINE_DIRECTION_OFFSET_PIXELS
  ]
} as const;

/**
 * Canonical completed line foreground style keyed by per-feature selection state.
 */
export const MAP_COMPLETED_LINE_LAYER_PAINT = {
  'line-color': ['case', ['get', 'selected'], '#f59e0b', '#1d4ed8'],
  'line-width': ['case', ['get', 'selected'], 6, 4],
  'line-opacity': ['case', ['get', 'selected'], 1, 0.85],
  'line-offset': [
    'case',
    ['==', ['get', 'travelDirection'], 'reverse'],
    -MAP_LINE_DIRECTION_OFFSET_PIXELS,
    MAP_LINE_DIRECTION_OFFSET_PIXELS
  ]
} as const;

/**
 * Canonical draft line preview style.
 */
export const MAP_DRAFT_LINE_LAYER_PAINT = {
  'line-color': '#38bdf8',
  'line-width': 4,
  'line-opacity': 0.95
} as const;

/**
 * Canonical circle layer paint for projected/degraded projected vehicle marker colors and contrast.
 */
export const MAP_VEHICLE_CIRCLE_LAYER_PAINT = {
  'circle-radius': 7,
  'circle-color': ['case', ['get', 'degraded'], '#f59e0b', '#7c3aed'],
  'circle-stroke-color': '#f8fafc',
  'circle-stroke-width': 2
} as const;

/**
 * Canonical GeoJSON source id for OSM stop candidates.
 */
export const MAP_SOURCE_ID_OSM_STOP_CANDIDATES = 'osm-stop-candidates';

/**
 * Canonical circle layer id for OSM stop candidate rendering.
 */
export const MAP_LAYER_ID_OSM_STOP_CANDIDATES_CIRCLE = 'osm-stop-candidates-circle';

/**
 * Canonical style layer ids for OSM stop candidate rendering in deterministic order.
 */
export const MAP_OSM_STOP_CANDIDATE_LAYER_IDS = [MAP_LAYER_ID_OSM_STOP_CANDIDATES_CIRCLE] as const;

/**
 * Minimum zoom level at which OSM stop candidates begin to fade in.
 */
export const MAP_OSM_STOP_CANDIDATE_MIN_VISIBLE_ZOOM = 12;

/**
 * Zoom level at which OSM stop candidates reach full opacity and size.
 */
export const MAP_OSM_STOP_CANDIDATE_FULL_DETAIL_ZOOM = 14;

/**
 * Subdued circle layer paint for OSM stop candidates, visually distinct from CityOS stops.
 * Uses zoom-aware interpolation to manage overlay density at different scales.
 */
export const MAP_OSM_STOP_CANDIDATE_CIRCLE_LAYER_PAINT = {
  'circle-radius': [
    'interpolate',
    ['linear'],
    ['zoom'],
    MAP_OSM_STOP_CANDIDATE_MIN_VISIBLE_ZOOM,
    4,
    MAP_OSM_STOP_CANDIDATE_FULL_DETAIL_ZOOM,
    8
  ],
  'circle-color': '#6b7280',
  'circle-stroke-width': 1,
  'circle-stroke-color': '#9ca3af',
  'circle-opacity': [
    'interpolate',
    ['linear'],
    ['zoom'],
    MAP_OSM_STOP_CANDIDATE_MIN_VISIBLE_ZOOM,
    0,
    MAP_OSM_STOP_CANDIDATE_FULL_DETAIL_ZOOM,
    0.8
  ],
  'circle-stroke-opacity': [
    'interpolate',
    ['linear'],
    ['zoom'],
    MAP_OSM_STOP_CANDIDATE_MIN_VISIBLE_ZOOM,
    0,
    MAP_OSM_STOP_CANDIDATE_FULL_DETAIL_ZOOM,
    0.8
  ]
} as const;

/**
 * Canonical GeoJSON source id for scenario-bound demand nodes.
 */
export const MAP_SOURCE_ID_DEMAND_NODES = 'cityops-demand-nodes';

/**
 * Canonical circle layer id for non-interactive demand node markers.
 */
export const MAP_LAYER_ID_DEMAND_NODES_CIRCLE = 'cityops-demand-nodes-circle';

/**
 * Canonical style layer ids for demand node rendering in deterministic order.
 */
export const MAP_DEMAND_NODE_LAYER_IDS = [MAP_LAYER_ID_DEMAND_NODES_CIRCLE] as const;

/**
 * Circle paint attributes scaling node sizes by active weight logic.
 */
export const MAP_DEMAND_NODE_CIRCLE_LAYER_PAINT = {
  'circle-radius': [
    'interpolate',
    ['linear'],
    ['get', 'activeWeight'],
    0, 6,
    300, 18
  ],
  'circle-color': [
    'case',
    ['==', ['get', 'role'], 'origin'],
    '#14b8a6', // Teal for residential origin
    '#ec4899'  // Pink for workplace destination
  ],
  'circle-opacity': 0.6,
  'circle-stroke-width': 1.5,
  'circle-stroke-color': '#ffffff'
} as const;

