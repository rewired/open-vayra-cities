import type { LineId } from './line';
import type { RouteDistanceMeters, RouteGeometryCoordinate } from './lineRoute';
import type { StopId } from './stop';

/**
 * Branded route travel time in seconds, constrained to non-negative finite numbers.
 */
export type RouteTravelTimeSeconds = number & { readonly __brand: 'RouteTravelTimeSeconds' };

/**
 * Explicit status for a single consecutive route segment.
 */
export type RouteSegmentBaselineStatus = 'routed' | 'fallback-routed' | 'unresolved';

/**
 * Descriptive warnings attached to individual segments.
 */
export interface RouteSegmentBaselineWarning {
  readonly type: 'missing-stop-position' | 'missing-route-segment' | 'fallback-routing-only';
}

/**
 * Canonical route segment record for one consecutive stop pair on a completed line.
 */
export interface RouteSegmentBaseline {
  readonly lineId: LineId;
  readonly segmentIndex: number;
  readonly fromStopId: StopId;
  readonly toStopId: StopId;
  readonly geometry: readonly RouteGeometryCoordinate[];
  readonly distanceMeters: RouteDistanceMeters;
  readonly travelTimeSeconds: RouteTravelTimeSeconds;
  readonly status: RouteSegmentBaselineStatus;
  readonly warnings: readonly RouteSegmentBaselineWarning[];
}

/**
 * Explicit aggregate status for a line's route baseline.
 */
export type LineRouteBaselineStatus = 'routed' | 'fallback-routed' | 'partial' | 'unresolved';

/**
 * Descriptive warnings attached to the aggregate line route baseline.
 */
export interface RouteBaselineWarning {
  readonly type: 'partial-unresolved' | 'all-unresolved' | 'fallback-routing';
}

/**
 * Canonical route baseline aggregate for a line's overall routing projection.
 */
export interface LineRouteBaseline {
  readonly lineId: LineId;
  readonly segments: readonly RouteSegmentBaseline[];
  readonly reverseSegments?: readonly RouteSegmentBaseline[] | undefined;
  readonly totalDistanceMeters: RouteDistanceMeters;
  readonly totalReverseDistanceMeters?: RouteDistanceMeters | undefined;
  readonly totalTravelTimeSeconds: RouteTravelTimeSeconds;
  readonly totalReverseTravelTimeSeconds?: RouteTravelTimeSeconds | undefined;
  readonly status: LineRouteBaselineStatus;
  readonly warnings: readonly RouteBaselineWarning[];
}

/**
 * Creates a branded route travel value in seconds from a non-negative finite numeric input.
 */
export const createRouteTravelTimeSeconds = (rawTravelSeconds: number): RouteTravelTimeSeconds => {
  if (!Number.isFinite(rawTravelSeconds) || rawTravelSeconds < 0) {
    throw new Error('Route travel time seconds must be a non-negative finite number.');
  }

  return rawTravelSeconds as RouteTravelTimeSeconds;
};
