import type { Line } from './line';
import type { LineServiceProjectionNote, LineServiceProjectionStatus } from './lineServicePlanProjection';
import type { TimeBandId } from './timeBand';

/**
 * Status of a line's deterministic current-time-band departure raster projection.
 */
export type LineDepartureScheduleProjectionStatus = 'unavailable' | 'available' | 'degraded';

/**
 * Branded minute-of-day value used for projected theoretical departures.
 */
export type DepartureMinute = number & { readonly __brand: 'DepartureMinute' };

/**
 * Branded minute delta value used for "minutes until next departure" projections.
 */
export type MinutesUntilDeparture = number & { readonly __brand: 'MinutesUntilDeparture' };

/**
 * Deterministic departure schedule projection for one completed line in one active time band.
 */
export interface LineDepartureScheduleProjection {
  /** Line identifier associated with this projection. */
  readonly lineId: Line['id'];
  /** Human-readable line label forwarded for compact inspector rendering. */
  readonly lineLabel: string;
  /** Active time-band id used by this projection run. */
  readonly activeTimeBandId: TimeBandId;
  /** Departure projection status for this line in the active time band. */
  readonly status: LineDepartureScheduleProjectionStatus;
  /** Current active-band headway in minutes, or `null` when unavailable. */
  readonly currentBandHeadwayMinutes: number | null;
  /** Canonical inclusive start minute for the active time-band window. */
  readonly timeBandStartMinute: number;
  /** Canonical exclusive end minute for the active time-band window. */
  readonly timeBandEndMinute: number;
  /** Theoretical departure minute raster within `[startMinute, endMinute)`. */
  readonly departureMinutes: readonly DepartureMinute[];
  /** Number of projected theoretical departures in the active time-band window. */
  readonly departureCount: number;
  /** Most recent departure minute strictly before current minute, else `null`. */
  readonly previousDepartureMinute: DepartureMinute | null;
  /** Next departure minute at or after current minute, else `null`. */
  readonly nextDepartureMinute: DepartureMinute | null;
  /** Minutes until next departure, or `null` when no next departure exists. */
  readonly minutesUntilNextDeparture: MinutesUntilDeparture | null;
  /** Sum of stored route-segment total travel minutes for this line. */
  readonly totalRouteTravelMinutes: number;
  /** Upstream line service projection status reused from Slice 020. */
  readonly serviceProjectionStatus: LineServiceProjectionStatus;
  /** Optional notes/issues forwarded from current service projection. */
  readonly notes?: readonly LineServiceProjectionNote[];
}

/**
 * Network-level aggregate summary across line departure schedule projections.
 */
export interface LineDepartureScheduleSummary {
  /** Number of completed lines passed into the projection run. */
  readonly totalCompletedLineCount: number;
  /** Active time-band id used for this network projection run. */
  readonly activeTimeBandId: TimeBandId;
  /** Number of line projections in `available` status. */
  readonly availableLineCount: number;
  /** Number of line projections in `degraded` status. */
  readonly degradedLineCount: number;
  /** Number of line projections in `unavailable` status. */
  readonly unavailableLineCount: number;
  /** Sum of line-level theoretical departure counts in the active time-band window. */
  readonly totalTheoreticalDepartureCount: number;
}

/**
 * Full departure schedule projection output with per-line values and network summary.
 */
export interface LineDepartureScheduleNetworkProjection {
  /** Per-line deterministic departure schedule projection results. */
  readonly lines: readonly LineDepartureScheduleProjection[];
  /** Aggregate network summary totals derived from per-line projections. */
  readonly summary: LineDepartureScheduleSummary;
}

/**
 * Compact selected-line inspector projection for departure schedule display fields.
 */
export interface LineSelectedDepartureInspectorProjection {
  /** Active time-band identifier for this selected-line projection. */
  readonly activeTimeBandId: TimeBandId;
  /** Human-readable active time-band label. */
  readonly activeTimeBandLabel: string;
  /** Departure projection status shown in selected-line inspector. */
  readonly status: LineDepartureScheduleProjectionStatus;
  /** Human-readable status label for selected-line inspector display. */
  readonly statusLabel: string;
  /** Current active-band headway in minutes, or `null` when unavailable. */
  readonly currentBandHeadwayMinutes: number | null;
  /** Human-readable active-band headway label. */
  readonly headwayLabel: string;
  /** Human-readable previous departure time string, or `null` when unavailable. */
  readonly previousDepartureLabel: string | null;
  /** Human-readable next departure time string, or `null` when unavailable. */
  readonly nextDepartureLabel: string | null;
  /** Human-readable minutes-until-next-departure label, or `null` when unavailable. */
  readonly minutesUntilNextDepartureLabel: string | null;
  /** Active-band theoretical departure count. */
  readonly departureCount: number;
  /** Bounded list of upcoming departures in `HH:MM` format. */
  readonly upcomingDepartureLabels: readonly string[];
  /** Sum of stored route-segment total travel minutes for this line. */
  readonly totalRouteTravelMinutes: number;
  /** Human-readable total route travel time label. */
  readonly totalRouteTravelMinutesLabel: string;
  /** Optional compact note messages forwarded from upstream diagnostics. */
  readonly noteMessages: readonly string[];
}
