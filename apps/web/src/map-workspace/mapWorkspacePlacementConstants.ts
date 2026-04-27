/**
 * Maximum screen-space distance (in pixels) allowed between a click and the derived street snap point.
 */
export const STREET_SNAP_MAX_PIXEL_TOLERANCE = 16;

/**
 * Pixel radius for the exact click query used by direct-hit snapping.
 */
export const STREET_SNAP_DIRECT_HIT_QUERY_RADIUS_PIXELS = 0;

/**
 * Pixel radius used to probe a narrow fallback ring when direct-hit snapping has no valid line candidate.
 */
export const STREET_SNAP_FALLBACK_QUERY_RADIUS_PIXELS = 8;

/**
 * Maximum pixel distance accepted for fallback snap candidates after direct-hit fails.
 */
export const STREET_SNAP_FALLBACK_MAX_PIXEL_TOLERANCE = 10;

/**
 * Maximum allowed feature/layer match-strength rank for fallback candidates (0 is strongest).
 */
export const STREET_SNAP_FALLBACK_MAX_FEATURE_MATCH_STRENGTH = 1;

/**
 * Minimum pixel-distance lead required over the second-best fallback candidate to avoid ambiguity.
 */
export const STREET_SNAP_FALLBACK_MIN_DISTANCE_ADVANTAGE_PIXELS = 1;

/**
 * Screen-space offset used for deterministic fallback rendered-feature probes.
 */
export interface StreetSnapFallbackQueryOffset {
  readonly deltaX: number;
  readonly deltaY: number;
}

/**
 * Deterministic fallback probe offsets around the click point (clockwise ring).
 */
export const STREET_SNAP_FALLBACK_QUERY_OFFSETS: readonly StreetSnapFallbackQueryOffset[] = [
  { deltaX: STREET_SNAP_FALLBACK_QUERY_RADIUS_PIXELS, deltaY: 0 },
  { deltaX: STREET_SNAP_FALLBACK_QUERY_RADIUS_PIXELS, deltaY: STREET_SNAP_FALLBACK_QUERY_RADIUS_PIXELS },
  { deltaX: 0, deltaY: STREET_SNAP_FALLBACK_QUERY_RADIUS_PIXELS },
  { deltaX: -STREET_SNAP_FALLBACK_QUERY_RADIUS_PIXELS, deltaY: STREET_SNAP_FALLBACK_QUERY_RADIUS_PIXELS },
  { deltaX: -STREET_SNAP_FALLBACK_QUERY_RADIUS_PIXELS, deltaY: 0 },
  { deltaX: -STREET_SNAP_FALLBACK_QUERY_RADIUS_PIXELS, deltaY: -STREET_SNAP_FALLBACK_QUERY_RADIUS_PIXELS },
  { deltaX: 0, deltaY: -STREET_SNAP_FALLBACK_QUERY_RADIUS_PIXELS },
  { deltaX: STREET_SNAP_FALLBACK_QUERY_RADIUS_PIXELS, deltaY: -STREET_SNAP_FALLBACK_QUERY_RADIUS_PIXELS }
] as const;

/**
 * Staged pixel radii for the nearby rendered-label lookup.
 * Probes are performed sequentially until a usable label is found.
 */
export const STREET_LABEL_LOOKUP_QUERY_RADII_PIXELS = [12, 24, 40] as const;

/**
 * Layer/source hints used to identify and rank preferred street/road label features.
 */
export const STREET_LABEL_LAYER_HINTS = ['road', 'street', 'highway', 'transport', 'label', 'name'] as const;

/**
 * Minimum pixel radius for OSM anchor street lookup box.
 */
export const OSM_ANCHOR_LOOKUP_MIN_PIXELS = 16;

/**
 * Maximum pixel radius for OSM anchor street lookup box to prevent excessive queries.
 * This acts as a safety cap for very low zoom levels.
 */
export const OSM_ANCHOR_LOOKUP_MAX_PIXELS = 128;
