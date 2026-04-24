import type { Line } from './line';
import type { LineServiceReadinessIssue, LineServiceReadinessResult } from './lineServiceReadiness';
import type { TimeBandId } from './timeBand';

/**
 * Current service projection status for one completed line in the active time band.
 *
 * `degraded` is used when a line has a valid current-band frequency but readiness is warning-only
 * (`partially-ready`) due to fallback-only routing and/or other non-blocking readiness warnings.
 */
export type LineServiceProjectionStatus = 'blocked' | 'not-configured' | 'configured' | 'degraded';

/**
 * Optional projection note shape used to surface per-line warning/error diagnostics.
 */
export interface LineServiceProjectionNote {
  /** Stable machine-readable issue code that aligns with readiness diagnostics. */
  readonly code: LineServiceReadinessIssue['code'];
  /** Severity forwarded from readiness diagnostics for UI emphasis. */
  readonly severity: LineServiceReadinessIssue['severity'];
  /** Human-readable diagnostic message for inspector-style projections. */
  readonly message: string;
  /** Optional line id when a note is tied to one concrete line. */
  readonly lineId?: Line['id'];
}

/**
 * Projection result for one completed line in one active time band.
 */
export interface LineServiceProjectionResult {
  /** Projected line identifier. */
  readonly lineId: Line['id'];
  /** Projected line label. */
  readonly lineLabel: string;
  /** Active time band used for headway/frequency extraction. */
  readonly activeTimeBandId: TimeBandId;
  /** Current active-band headway in minutes, or `null` when unset/invalid. */
  readonly currentBandHeadwayMinutes: number | null;
  /** Theoretical departures per hour (`60 / headway`) when headway is configured, otherwise `null`. */
  readonly theoreticalDeparturesPerHour: number | null;
  /** Number of stored routed segments on this line. */
  readonly routeSegmentCount: number;
  /** Sum of `routeSegments[].totalTravelMinutes` across the line. */
  readonly totalRouteTravelMinutes: number;
  /** Current service projection status for the active time band. */
  readonly status: LineServiceProjectionStatus;
  /** Full readiness result reused to avoid duplicated readiness rule ownership. */
  readonly readiness: LineServiceReadinessResult;
  /** Optional projection notes/issues forwarded from readiness diagnostics. */
  readonly notes?: readonly LineServiceProjectionNote[];
}

/**
 * Network-level summary for all projected completed lines in one active time band.
 */
export interface LineServiceProjectionSummary {
  /** Active time band used for this projection run. */
  readonly activeTimeBandId: TimeBandId;
  /** Number of completed lines passed into projection. */
  readonly totalLineCount: number;
  /** Number of lines in `blocked` status. */
  readonly blockedLineCount: number;
  /** Number of lines in `not-configured` status. */
  readonly notConfiguredLineCount: number;
  /** Number of lines in `configured` status. */
  readonly configuredLineCount: number;
  /** Number of lines in `degraded` status. */
  readonly degradedLineCount: number;
  /** Sum of route segment counts across all projected lines. */
  readonly totalRouteSegmentCount: number;
  /** Sum of projected total route minutes across all projected lines. */
  readonly totalRouteTravelMinutes: number;
  /**
   * Sum of `theoreticalDeparturesPerHour` across lines with configured active-band frequencies.
   * Lines without an active-band frequency contribute `0`.
   */
  readonly totalTheoreticalDeparturesPerHour: number;
}

/**
 * Full network projection output containing per-line results and summary aggregates.
 */
export interface LineServicePlanProjection {
  /** Deterministic per-line projection outputs in input order. */
  readonly lines: readonly LineServiceProjectionResult[];
  /** Aggregate summary counters and totals across all projected lines. */
  readonly summary: LineServiceProjectionSummary;
}
