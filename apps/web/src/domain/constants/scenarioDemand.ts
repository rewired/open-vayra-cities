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

