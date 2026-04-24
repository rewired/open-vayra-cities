/**
 * Canonical severity literals used by line-service readiness diagnostics.
 */
export const LINE_SERVICE_READINESS_ISSUE_SEVERITIES = {
  WARNING: 'warning',
  ERROR: 'error'
} as const;

/**
 * Canonical machine-readable issue-code literals emitted by line-service readiness diagnostics.
 */
export const LINE_SERVICE_READINESS_ISSUE_CODES = {
  INVALID_LINE_ID: 'invalid-line-id',
  INVALID_LINE_LABEL: 'invalid-line-label',
  INSUFFICIENT_ORDERED_STOPS: 'insufficient-ordered-stops',
  INVALID_ORDERED_STOP_ID: 'invalid-ordered-stop-id',
  DUPLICATE_ADJACENT_STOP_ID: 'duplicate-adjacent-stop-id',
  MISSING_PLACED_STOP_REFERENCE: 'missing-placed-stop-reference',
  MISSING_ROUTE_SEGMENTS: 'missing-route-segments',
  ROUTE_SEGMENT_COUNT_MISMATCH: 'route-segment-count-mismatch',
  ROUTE_SEGMENT_ADJACENCY_MISMATCH: 'route-segment-adjacency-mismatch',
  ROUTE_SEGMENT_LINE_ID_MISMATCH: 'route-segment-line-id-mismatch',
  ROUTE_SEGMENT_TIMING_UNUSABLE: 'route-segment-timing-unusable',
  UNKNOWN_ROUTE_STATUS: 'unknown-route-status',
  MISSING_CANONICAL_TIME_BAND: 'missing-canonical-time-band',
  INVALID_FREQUENCY_VALUE: 'invalid-frequency-value',
  MISSING_CONFIGURED_FREQUENCY: 'missing-configured-frequency',
  MISSING_COMPLETE_TIME_BAND_CONFIGURATION: 'missing-complete-time-band-configuration',
  FALLBACK_ONLY_ROUTING: 'fallback-only-routing'
} as const;
