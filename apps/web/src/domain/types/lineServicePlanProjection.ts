import type { Line } from './line';
import type { LineServiceReadinessIssue, LineServiceReadinessResult } from './lineServiceReadiness';
import type { TimeBandId } from './timeBand';

/**
 * Current service projection status for one completed line in the active time band.
 *
 * `not-configured` is only used when the active band is `unset`.
 * `configured`/`degraded` can still apply when the active band is explicitly `no-service`.
 * `degraded` is used when readiness is warning-only (`partially-ready`).
 */
export type LineServiceProjectionStatus = 'blocked' | 'not-configured' | 'configured' | 'degraded';

/**
 * Explicit active-band service plan kind resolved from one line's active time-band configuration.
 */
export type LineServiceActiveBandState = 'unset' | 'no-service' | 'frequency';

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
  /** Explicit active-band service plan kind (`unset`, `no-service`, or `frequency`). */
  readonly activeBandState: LineServiceActiveBandState;
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
 * Compact line-selected inspector projection derived from one line service projection result.
 */
export interface LineSelectedServiceInspectorProjection {
  /** Active time-band identifier used for this inspector projection. */
  readonly activeTimeBandId: TimeBandId;
  /** Explicit active-band service plan kind (`unset`, `no-service`, or `frequency`). */
  readonly activeBandState: LineServiceActiveBandState;
  /** Active time-band display label for compact UI rendering. */
  readonly activeTimeBandLabel: string;
  /** Current line service projection status for the active band. */
  readonly status: LineServiceProjectionStatus;
  /** Human-readable status label for inspector/status-bar rendering. */
  readonly statusLabel: string;
  /** Active-band headway in minutes, or `null` when unset/invalid. */
  readonly currentBandHeadwayMinutes: number | null;
  /**
   * Active-band headway label.
   * Uses an explicit unconfigured message when no valid active-band headway exists.
   */
  readonly headwayLabel: string;
  /** Theoretical departures per hour (`60 / headway`) when configured, otherwise `null`. */
  readonly theoreticalDeparturesPerHour: number | null;
  /** Human-readable departures-per-hour label when configured, otherwise `null`. */
  readonly theoreticalDeparturesPerHourLabel: string | null;
  /** Sum of stored route-segment travel minutes for this line. */
  readonly totalRouteTravelMinutes: number;
  /** Human-readable total route-travel-time label for compact inspector rendering. */
  readonly totalRouteTravelMinutesLabel: string;
  /** Number of stored route segments on the selected line. */
  readonly routeSegmentCount: number;
  /** Number of blocker readiness issues. */
  readonly blockerCount: number;
  /** Number of warning readiness issues. */
  readonly warningCount: number;
  /** Short note list forwarded from readiness diagnostics (message-only projection). */
  readonly noteMessages: readonly string[];
}

/**
 * Network-level summary for all projected completed lines in one active time band.
 */
export interface LineServiceProjectionSummary {
  /** Active time band used for this projection run. */
  readonly activeTimeBandId: TimeBandId;
  /** Number of completed lines passed into projection. */
  readonly totalCompletedLineCount: number;
  /** Backward-compatible alias for `totalCompletedLineCount`. */
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
