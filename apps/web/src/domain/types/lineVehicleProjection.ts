import type { Line, LineId } from './line';
import type { RouteGeometryCoordinate } from './lineRoute';
import type { LineRouteBaselineStatus } from './routeBaseline';
import type { TimeBandId } from './timeBand';

/**
 * Branded identifier for one projected vehicle marker instance in the current projection run.
 */
export type LineVehicleProjectionId = string & { readonly __brand: 'LineVehicleProjectionId' };

/**
 * Projection status used for map-ready vehicle markers in the current projection run.
 */
export type LineVehicleProjectionStatus = 'projected' | 'degraded-projected' | 'unavailable';

/**
 * Per-vehicle projection derived deterministically from service headway and route runtime.
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
  /** Progress ratio through the full route round-trip, clamped to `[0, 1]`. */
  readonly routeProgressRatio: number;
  /** Current route-segment index hosting this projected vehicle, or `null` when unavailable. */
  readonly segmentIndex: number | null;
  /** Interpolated travel direction derived from headway phase. */
  readonly direction: 'outbound' | 'return';
  /** Current projected marker coordinate, or `null` when unavailable. */
  readonly coordinate: RouteGeometryCoordinate | null;
  /** Projection status for this vehicle marker in the current projection run. */
  readonly status: LineVehicleProjectionStatus;
  /** Optional degraded/unavailable note for diagnostics without forcing marker rendering. */
  readonly degradedNote?: string;
}

/**
 * Per-line vehicle projection result containing all visible buses for one line.
 */
export interface LineVehicleProjectionForLine {
  /** Line identifier associated with this line-level projection result. */
  readonly lineId: Line['id'];
  /** Line label associated with this line-level projection result. */
  readonly lineLabel: string;
  /** Active time band used for this line-level projection result. */
  readonly activeTimeBandId: TimeBandId;
  /** Active service state used to derive this projection. */
  readonly serviceState: 'frequency' | 'no-service' | 'unset';
  /** Route baseline status defining availability and fallback states. */
  readonly routeStatus: LineRouteBaselineStatus;
  /** Active vehicle projections derived from deterministic phasing. */
  readonly vehicles: readonly LineVehicleProjection[];
  /** Optional line-level note when projection is unavailable or degraded. */
  readonly note?: string;
}

/**
 * Network summary counters for continuous-time line vehicle projections.
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
 * Full network-level continuous-time line vehicle projection output.
 */
export interface LineVehicleNetworkProjection {
  /** Per-line continuous-time vehicle projection results in input order. */
  readonly lines: readonly LineVehicleProjectionForLine[];
  /** Aggregate network summary derived from all projected line results. */
  readonly summary: LineVehicleProjectionSummary;
}

/**
 * Creates a branded line-vehicle projection id from a deterministic raw key.
 */
export const createLineVehicleProjectionId = (rawProjectionId: string): LineVehicleProjectionId =>
  rawProjectionId as LineVehicleProjectionId;
