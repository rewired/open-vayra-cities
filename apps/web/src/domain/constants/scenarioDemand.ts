/**
 * Allowed roles for demand nodes.
 */
export const ALLOWED_DEMAND_NODE_ROLES = ['origin', 'destination', 'bidirectional'] as const;
export type ScenarioDemandNodeRole = (typeof ALLOWED_DEMAND_NODE_ROLES)[number];

/**
 * Allowed classes for demand nodes.
 */
export const ALLOWED_DEMAND_NODE_CLASSES = [
  'residential',
  'workplace',
  'gateway',
  'education_future',
  'retail_future',
  'health_future',
  'leisure_future'
] as const;
export type ScenarioDemandNodeClass = (typeof ALLOWED_DEMAND_NODE_CLASSES)[number];

/**
 * Allowed categories for attractors.
 */
export const ALLOWED_ATTRACTOR_CATEGORIES = [
  'workplace',
  'education',
  'retail',
  'health',
  'leisure'
] as const;
export type ScenarioDemandAttractorCategory = (typeof ALLOWED_ATTRACTOR_CATEGORIES)[number];

/**
 * Allowed scales for attractors and gateways.
 */
export const ALLOWED_DEMAND_SCALES = ['local', 'district', 'major', 'metropolitan'] as const;
export type ScenarioDemandScale = (typeof ALLOWED_DEMAND_SCALES)[number];

/**
 * Allowed kinds for gateways.
 */
export const ALLOWED_GATEWAY_KINDS = [
  'rail-station',
  'bus-station',
  'airport',
  'ferry-terminal',
  'other'
] as const;
export type ScenarioDemandGatewayKind = (typeof ALLOWED_GATEWAY_KINDS)[number];

/**
 * Allowed kinds for source data.
 */
export const ALLOWED_DEMAND_SOURCE_KINDS = [
  'census',
  'osm',
  'commuter-statistics',
  'manual',
  'generated'
] as const;
export type ScenarioDemandSourceKind = (typeof ALLOWED_DEMAND_SOURCE_KINDS)[number];

/**
 * Canonical MVP stop-access radius in meters for scenario demand capture.
 */
export const SCENARIO_DEMAND_STOP_ACCESS_RADIUS_METERS = 400;

/**
 * Maximum number of demand gap items to return per category for display.
 */
export const DEMAND_GAP_RANKING_MAX_ITEMS_PER_CATEGORY = 5;

/**
 * Minimum active demand weight to be considered for gap ranking.
 */
export const DEMAND_GAP_RANKING_MIN_ACTIVE_WEIGHT = 0.1;

/**
 * Maximum number of OD context candidates to display for a focused demand gap.
 */
export const DEMAND_GAP_OD_CONTEXT_MAX_CANDIDATES = 5;

/**
 * Hyperbolic distance decay meters for ranking demand node context candidates.
 * 4,000m ensures city-scale commute context is preserved while remaining locality-aware.
 * This is a ranking weight decay, not a walking/access radius.
 */
export const DEMAND_NODE_CONTEXT_DISTANCE_DECAY_METERS = 4000;

/**
 * Maximum selected demand node covering stops to expose in compact inspector projections.
 */
export const SELECTED_DEMAND_NODE_SERVICE_COVERAGE_MAX_STOPS = 5;

/**
 * Maximum selected demand node candidate-side matches to expose in compact inspector projections.
 */
export const SELECTED_DEMAND_NODE_SERVICE_COVERAGE_MAX_CANDIDATE_MATCHES = 5;

/**
 * Maximum selected demand node connecting lines to expose in compact inspector projections.
 */
export const SELECTED_DEMAND_NODE_SERVICE_COVERAGE_MAX_LINES = 5;
