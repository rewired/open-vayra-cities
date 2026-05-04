/**
 * Canonical GeoJSON source id for all placed stop point features rendered in the map workspace.
 */
export const MAP_SOURCE_ID_STOPS = 'openvayra-cities-stops';
/**
 * Canonical GeoJSON source id for completed session line rendering.
 */
export const MAP_SOURCE_ID_COMPLETED_LINES = 'openvayra-cities-completed-lines';

/**
 * Canonical GeoJSON source id for active draft line rendering.
 */
export const MAP_SOURCE_ID_DRAFT_LINE = 'openvayra-cities-draft-line';
/**
 * Canonical GeoJSON source id for projected active vehicle point rendering.
 */
export const MAP_SOURCE_ID_VEHICLES = 'openvayra-cities-vehicles';
/**
 * Canonical GeoJSON source id for scenario-specific routing coverage mask.
 */
export const MAP_SOURCE_ID_SCENARIO_ROUTING_COVERAGE = 'openvayra-cities-scenario-routing-coverage';

/**
 * Canonical circle layer id for stop body rendering and feature hit interactions.
 */
export const MAP_LAYER_ID_STOPS_CIRCLE = 'openvayra-cities-stops-circle';

/**
 * Canonical symbol layer id for stop label rendering.
 */
export const MAP_LAYER_ID_STOPS_LABEL = 'openvayra-cities-stops-label';

/**
 * Canonical line layer id for completed line casing contrast rendering.
 */
export const MAP_LAYER_ID_COMPLETED_LINES_CASING = 'openvayra-cities-completed-lines-casing';

/**
 * Canonical line layer id for completed line foreground rendering and interactions.
 */
export const MAP_LAYER_ID_COMPLETED_LINES = 'openvayra-cities-completed-lines';

/**
 * Canonical line layer id for active draft line preview rendering.
 */
export const MAP_LAYER_ID_DRAFT_LINE = 'openvayra-cities-draft-line';
/**
 * Canonical circle layer id for projected active vehicle marker rendering.
 */
export const MAP_LAYER_ID_VEHICLES = 'openvayra-cities-vehicles';
/**
 * Canonical fill layer id for scenario routing coverage dim/mask rendering.
 */
export const MAP_LAYER_ID_SCENARIO_ROUTING_COVERAGE_MASK = 'openvayra-cities-scenario-routing-coverage-mask';

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
 * Canonical style layer ids for scenario routing coverage mask rendering.
 */
export const MAP_SCENARIO_ROUTING_COVERAGE_LAYER_IDS = [MAP_LAYER_ID_SCENARIO_ROUTING_COVERAGE_MASK] as const;

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
 * Canonical circle layer id for OSM stop candidate hover-only highlight rendering.
 */
export const MAP_LAYER_ID_OSM_STOP_CANDIDATES_HOVER = 'osm-stop-candidates-hover';

/**
 * Filter that intentionally matches no hover highlight feature.
 */
export const MAP_ENTITY_HOVER_EMPTY_FILTER = ['==', ['get', '__hoverTarget'], '__none'] as const;

/**
 * Canonical style layer ids for OSM stop candidate rendering in deterministic order.
 */
export const MAP_OSM_STOP_CANDIDATE_LAYER_IDS = [
  MAP_LAYER_ID_OSM_STOP_CANDIDATES_CIRCLE,
  MAP_LAYER_ID_OSM_STOP_CANDIDATES_HOVER
] as const;

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
 * UI-only circle radius for the OSM stop candidate hover highlight layer.
 */
export const MAP_OSM_STOP_CANDIDATE_HOVER_CIRCLE_RADIUS = 11;

/**
 * UI-only stroke width for the OSM stop candidate hover highlight layer.
 */
export const MAP_OSM_STOP_CANDIDATE_HOVER_STROKE_WIDTH = 3;

/**
 * UI-only stroke color for the OSM stop candidate hover highlight layer.
 */
export const MAP_OSM_STOP_CANDIDATE_HOVER_STROKE_COLOR = '#f8fafc';

/**
 * Display-only ring paint for hovered OSM stop candidates.
 */
export const MAP_OSM_STOP_CANDIDATE_HOVER_CIRCLE_LAYER_PAINT = {
  'circle-radius': MAP_OSM_STOP_CANDIDATE_HOVER_CIRCLE_RADIUS,
  'circle-color': 'transparent',
  'circle-stroke-width': MAP_OSM_STOP_CANDIDATE_HOVER_STROKE_WIDTH,
  'circle-stroke-color': MAP_OSM_STOP_CANDIDATE_HOVER_STROKE_COLOR,
  'circle-stroke-opacity': 0.95
} as const;

/**
 * Canonical GeoJSON source id for all scenario demand preview features.
 */
export const MAP_SOURCE_ID_SCENARIO_DEMAND_PREVIEW = 'openvayra-cities-scenario-demand-preview';

/**
 * Canonical circle layer id for scenario demand preview rendering.
 */
export const MAP_LAYER_ID_SCENARIO_DEMAND_PREVIEW_CIRCLE = 'openvayra-cities-scenario-demand-preview-circle';

/**
 * Canonical circle layer id for scenario demand preview hover-only highlight rendering.
 */
export const MAP_LAYER_ID_SCENARIO_DEMAND_PREVIEW_HOVER =
  'openvayra-cities-scenario-demand-preview-hover';

/**
 * Canonical style layer ids for scenario demand preview rendering in order.
 */
export const MAP_SCENARIO_DEMAND_PREVIEW_LAYER_IDS = [
  MAP_LAYER_ID_SCENARIO_DEMAND_PREVIEW_CIRCLE,
  MAP_LAYER_ID_SCENARIO_DEMAND_PREVIEW_HOVER
] as const;

/**
 * Data-driven circle layer paint style for distinct demand preview categorization.
 */
export const MAP_SCENARIO_DEMAND_PREVIEW_CIRCLE_LAYER_PAINT = {
  'circle-radius': [
    'case',
    ['==', ['get', 'entityKind'], 'node'], 4,
    ['==', ['get', 'entityKind'], 'attractor'], 6,
    8
  ],
  'circle-color': [
    'case',
    ['==', ['get', 'entityKind'], 'node'], '#38bdf8',
    ['==', ['get', 'entityKind'], 'attractor'], '#fb923c',
    '#a855f7'
  ],
  'circle-stroke-width': 1,
  'circle-stroke-color': '#ffffff',
  'circle-opacity': 0.6,
  'circle-stroke-opacity': 0.8
} as const;

/**
 * UI-only circle radius for the scenario demand node hover highlight layer.
 */
export const MAP_SCENARIO_DEMAND_PREVIEW_HOVER_CIRCLE_RADIUS = 9;

/**
 * UI-only stroke width for the scenario demand node hover highlight layer.
 */
export const MAP_SCENARIO_DEMAND_PREVIEW_HOVER_STROKE_WIDTH = 3;

/**
 * UI-only stroke color for the scenario demand node hover highlight layer.
 */
export const MAP_SCENARIO_DEMAND_PREVIEW_HOVER_STROKE_COLOR = '#f8fafc';

/**
 * Display-only ring paint for hovered scenario demand nodes.
 */
export const MAP_SCENARIO_DEMAND_PREVIEW_HOVER_CIRCLE_LAYER_PAINT = {
  'circle-radius': MAP_SCENARIO_DEMAND_PREVIEW_HOVER_CIRCLE_RADIUS,
  'circle-color': 'transparent',
  'circle-stroke-width': MAP_SCENARIO_DEMAND_PREVIEW_HOVER_STROKE_WIDTH,
  'circle-stroke-color': MAP_SCENARIO_DEMAND_PREVIEW_HOVER_STROKE_COLOR,
  'circle-stroke-opacity': 0.95
} as const;

/**
 * Maximum number of point features to render for the scenario demand preview overlay.
 */
export const SCENARIO_DEMAND_PREVIEW_MAX_RENDERED_FEATURES = 2000;

/**
 * Target spatial aggregation grid cell size for heavy workplace attractor clustering.
 */
export const SCENARIO_DEMAND_PREVIEW_WORKPLACE_AGGREGATION_CELL_METERS = 100;

/**
 * Minimum zoom level required to draw full, un-thinned point distributions safely.
 */
export const SCENARIO_DEMAND_PREVIEW_MIN_ZOOM_FOR_FULL_DETAIL = 13;

/**
 * Canonical fill layer paint for scenario routing coverage mask.
 * Dims areas outside the routable scenario area.
 */
export const MAP_SCENARIO_ROUTING_COVERAGE_MASK_PAINT = {
  'fill-color': '#0f172a',
  'fill-opacity': 0.6
} as const;

/**
 * Canonical GeoJSON source id for the demand gap overlay.
 */
export const MAP_SOURCE_ID_DEMAND_GAP_OVERLAY = 'openvayra-cities-demand-gap-overlay';

/**
 * Canonical GeoJSON source id for the demand gap OD context desire hints.
 */
export const MAP_SOURCE_ID_DEMAND_GAP_OD_CONTEXT = 'openvayra-cities-demand-gap-od-context';

/**
 * Canonical GeoJSON source id for selected demand node service coverage stop highlights.
 */
export const MAP_SOURCE_ID_SELECTED_DEMAND_NODE_SERVICE_COVERAGE =
  'openvayra-cities-selected-demand-node-service-coverage';

/**
 * Canonical heatmap layer id for aggregate demand gap pressure.
 */
export const MAP_LAYER_ID_DEMAND_GAP_OVERLAY_HEATMAP = 'openvayra-cities-demand-gap-overlay-heatmap';

/**
 * Canonical circle layer id for point-level demand gap detail.
 */
export const MAP_LAYER_ID_DEMAND_GAP_OVERLAY_CIRCLE = 'openvayra-cities-demand-gap-overlay-circle';

/**
 * Canonical focus layer id for demand gap point-level focus highlight.
 */
export const MAP_LAYER_ID_DEMAND_GAP_OVERLAY_FOCUS = 'openvayra-cities-demand-gap-overlay-focus';

/**
 * Canonical line layer id for demand gap OD context desire hints.
 */
export const MAP_LAYER_ID_DEMAND_GAP_OD_CONTEXT_LINES = 'openvayra-cities-demand-gap-od-context-lines';

/**
 * Canonical circle layer id for selected demand node service coverage stop highlight rings.
 */
export const MAP_LAYER_ID_SELECTED_DEMAND_NODE_SERVICE_COVERAGE_CIRCLE =
  'openvayra-cities-selected-demand-node-service-coverage-circle';

/**
 * Canonical style layer ids for demand gap overlay rendering.
 */
export const MAP_DEMAND_GAP_OVERLAY_LAYER_IDS = [
  MAP_LAYER_ID_DEMAND_GAP_OVERLAY_HEATMAP,
  MAP_LAYER_ID_DEMAND_GAP_OVERLAY_CIRCLE,
  MAP_LAYER_ID_DEMAND_GAP_OVERLAY_FOCUS
] as const;

/**
 * Canonical style layer ids for demand gap OD context hints.
 */
export const MAP_DEMAND_GAP_OD_CONTEXT_LAYER_IDS = [
  MAP_LAYER_ID_DEMAND_GAP_OD_CONTEXT_LINES
] as const;

/**
 * Canonical style layer ids for selected demand node service coverage stop highlights.
 */
export const MAP_SELECTED_DEMAND_NODE_SERVICE_COVERAGE_LAYER_IDS = [
  MAP_LAYER_ID_SELECTED_DEMAND_NODE_SERVICE_COVERAGE_CIRCLE
] as const;

/**
 * Heatmap paint style for demand gap aggregate pressure.
 * Weighted by visualWeight and intensity increases at higher zooms.
 */
export const MAP_DEMAND_GAP_OVERLAY_HEATMAP_PAINT = {
  'heatmap-weight': ['get', 'visualWeight'],
  'heatmap-intensity': [
    'interpolate',
    ['linear'],
    ['zoom'],
    10,
    1.1,
    15,
    2.6
  ],
  'heatmap-color': [
    'interpolate',
    ['linear'],
    ['heatmap-density'],
    0,
    'rgba(255,255,255,0)',
    0.2,
    'rgba(254,243,199,0.3)',
    0.4,
    'rgba(252,211,77,0.4)',
    0.6,
    'rgba(251,191,36,0.45)',
    0.8,
    'rgba(180,83,9,0.5)',
    1,
    'rgba(160,70,10,0.6)'
  ],
  'heatmap-radius': [
    'interpolate',
    ['linear'],
    ['zoom'],
    10,
    30,
    15,
    58
  ],
  'heatmap-opacity': 0.6
} as const;

/**
 * Circle paint style for demand gap point-level detail.
 * Fades in at higher zooms to avoid visual clutter at low zooms.
 */
export const MAP_DEMAND_GAP_OVERLAY_CIRCLE_PAINT = {
  'circle-radius': 4,
  'circle-color': [
    'match',
    ['get', 'kind'],
    'uncaptured-residential',
    '#991b1b',
    'captured-unserved-residential',
    '#9a3412',
    'captured-unreachable-workplace',
    '#5b21b6',
    '#4b5563'
  ],
  'circle-stroke-width': 1,
  'circle-stroke-color': 'rgba(255, 255, 255, 0.5)',
  'circle-opacity': [
    'interpolate',
    ['linear'],
    ['zoom'],
    11,
    0,
    12,
    0.5
  ],
  'circle-stroke-opacity': [
    'interpolate',
    ['linear'],
    ['zoom'],
    11,
    0,
    12,
    0.55
  ]
} as const;

/**
 * Circle paint style for demand gap point-level focus highlight.
 * Large, high-contrast ring that sits above the gap point but below interaction layers.
 */
export const MAP_DEMAND_GAP_OVERLAY_FOCUS_CIRCLE_PAINT = {
  'circle-radius': [
    'interpolate',
    ['linear'],
    ['zoom'],
    12,
    8,
    15,
    16
  ],
  'circle-color': 'transparent',
  'circle-stroke-width': 2,
  'circle-stroke-color': '#ffffff',
  'circle-stroke-opacity': [
    'interpolate',
    ['linear'],
    ['zoom'],
    11,
    0,
    12,
    0.65
  ]
} as const;

/**
 * Line paint style for demand gap OD context desire hints.
 * Dashed, visually subordinate contextual planning hints.
 */
export const MAP_DEMAND_GAP_OD_CONTEXT_HINT_PAINT = {
  'line-color': '#9ca3af',
  'line-width': 1.5,
  'line-opacity': 0.5,
  'line-dasharray': [2, 2]
} as const;

/**
 * Circle ring paint style for display-only selected demand node service coverage stop highlights.
 */
export const MAP_SELECTED_DEMAND_NODE_SERVICE_COVERAGE_CIRCLE_PAINT = {
  'circle-radius': [
    'match',
    ['get', 'coverageStatus'],
    'active-service',
    19,
    'structural-connection',
    17,
    15
  ],
  'circle-color': 'transparent',
  'circle-stroke-color': [
    'match',
    ['get', 'role'],
    'selected-side-stop',
    '#0ea5e9',
    'opposite-side-stop',
    '#f97316',
    '#64748b'
  ],
  'circle-stroke-width': [
    'match',
    ['get', 'coverageStatus'],
    'active-service',
    4,
    'structural-connection',
    3,
    2
  ],
  'circle-stroke-opacity': [
    'match',
    ['get', 'coverageStatus'],
    'active-service',
    0.95,
    'structural-connection',
    0.85,
    0.65
  ]
} as const;
