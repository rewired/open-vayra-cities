/**
 * Fallback bus operating speed expressed in meters per minute for route-time estimation.
 */
export const FALLBACK_BUS_SPEED_METERS_PER_MINUTE = 450;

/**
 * Default dwell duration in minutes applied per routed segment.
 */
export const DEFAULT_ROUTE_DWELL_MINUTES_PER_SEGMENT = 0.5;

/**
 * Minimum in-motion travel duration in minutes enforced for non-zero route segments.
 */
export const MINIMUM_IN_MOTION_TRAVEL_MINUTES = 0.25;

/**
 * Local OSRM base URL for development.
 */
export const OSRM_LOCAL_BASE_URL = "http://localhost:5000";

/**
 * Default OSRM routing profile.
 */
export const OSRM_ROUTE_PROFILE = "driving";

/**
 * Requested OSRM geometry format.
 */
export const OSRM_ROUTE_GEOMETRY_FORMAT = "geojson";

/**
 * Requested OSRM overview mode.
 */
export const OSRM_ROUTE_OVERVIEW_MODE = "full";

/**
 * Provider ID for the local OSRM instance.
 */
export const OSRM_PROVIDER_ID_VALUE = "osrm-local";

/**
 * Maximum duration in milliseconds allowed for an external routing request before falling back.
 */
export const ROUTING_REQUEST_TIMEOUT_MS = 2000;
