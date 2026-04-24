import type { Line, LineId } from './line';
import type { LineSegmentId, RouteGeometryCoordinate } from './lineRoute';
import type { DepartureMinute, LineDepartureScheduleProjectionStatus } from './lineDepartureScheduleProjection';
import type { TimeBandId } from './timeBand';

/**
 * Branded identifier for one projected vehicle marker instance in the current simulation minute.
 */
export type LineVehicleProjectionId = string & { readonly __brand: 'LineVehicleProjectionId' };

/**
 * Projection status used for map-ready vehicle markers in the current simulation minute.
 */
export type LineVehicleProjectionStatus = 'projected' | 'degraded-projected' | 'unavailable';

/**
 * Per-vehicle projection derived from one active departure in the active time band.
 */
export interface LineVehicleProjection {
  /** Stable vehicle projection identifier for keyed rendering and diffing. */
  readonly id: LineVehicleProjectionId;
  /** Parent line identifier for this projected vehicle. */
  readonly lineId: LineId;
  /** Parent line label forwarded for compact inspector/debug rendering. */
  readonly lineLabel: string;
  /** Active time band used by this projection run. */
  readonly activeTimeBandId: TimeBandId;
  /** Departure minute that originated this projected vehicle. */
  readonly departureMinute: DepartureMinute;
  /** Elapsed minutes since the projected departure minute. */
  readonly elapsedMinutes: number;
  /** Progress ratio through the full route travel time, clamped to `[0, 1]`. */
  readonly routeProgressRatio: number;
  /** Progress ratio through the current route segment, clamped to `[0, 1]`. */
  readonly segmentProgressRatio: number;
  /** Current route-segment id hosting this projected vehicle, or `null` when unavailable. */
  readonly currentSegmentId: LineSegmentId | null;
  /** Current projected marker coordinate, or `null` when unavailable. */
  readonly coordinate: RouteGeometryCoordinate | null;
  /** Projection status for this vehicle marker in the current simulation minute. */
  readonly status: LineVehicleProjectionStatus;
  /** Optional degraded/unavailable note for diagnostics without forcing marker rendering. */
  readonly degradedNote?: string;
}

/**
 * Per-line vehicle projection result containing all active departures for one line.
 */
export interface LineVehicleProjectionForLine {
  /** Line identifier associated with this line-level projection result. */
  readonly lineId: Line['id'];
  /** Line label associated with this line-level projection result. */
  readonly lineLabel: string;
  /** Active time band used for this line-level projection result. */
  readonly activeTimeBandId: TimeBandId;
  /** Upstream departure projection status forwarded for line-level diagnostics. */
  readonly departureScheduleStatus: LineDepartureScheduleProjectionStatus;
  /** Active vehicle projections derived from active departures for this line. */
  readonly vehicles: readonly LineVehicleProjection[];
  /** Optional line-level note when projection is unavailable or degraded. */
  readonly note?: string;
}

/**
 * Network summary counters for current-minute line vehicle projections.
 */
export interface LineVehicleProjectionSummary {
  /** Total number of projected vehicles with `projected` status. */
  readonly totalProjectedVehicleCount: number;
  /** Total number of projected vehicles with `degraded-projected` status. */
  readonly totalDegradedProjectedVehicleCount: number;
  /** Number of lines that currently have at least one projected vehicle. */
  readonly linesWithProjectedVehiclesCount: number;
  /** Active time band used for this network-level projection run. */
  readonly activeTimeBandId: TimeBandId;
}

/**
 * Full network-level current-minute line vehicle projection output.
 */
export interface LineVehicleNetworkProjection {
  /** Per-line current-minute vehicle projection results in input order. */
  readonly lines: readonly LineVehicleProjectionForLine[];
  /** Aggregate network summary derived from all projected line results. */
  readonly summary: LineVehicleProjectionSummary;
}

/**
 * Creates a branded line-vehicle projection id from a deterministic raw key.
 */
export const createLineVehicleProjectionId = (rawProjectionId: string): LineVehicleProjectionId =>
  rawProjectionId as LineVehicleProjectionId;
