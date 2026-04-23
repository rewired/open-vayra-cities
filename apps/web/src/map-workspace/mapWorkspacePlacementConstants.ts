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
