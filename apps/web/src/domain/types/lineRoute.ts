import type { LineId } from './line';
import type { StopId } from './stop';

/**
 * Branded line-segment identifier used to keep route-segment ids distinct from plain strings.
 */
export type LineSegmentId = string & { readonly __brand: 'LineSegmentId' };

/**
 * Geographic coordinate tuple represented as `[longitude, latitude]`.
 */
export type RouteGeometryCoordinate = readonly [longitude: number, latitude: number];

/**
 * Branded route distance in meters, constrained to non-negative finite numbers.
 */
export type RouteDistanceMeters = number & { readonly __brand: 'RouteDistanceMeters' };

/**
 * Branded route travel time in minutes, constrained to non-negative finite numbers.
 */
export type RouteTravelMinutes = number & { readonly __brand: 'RouteTravelMinutes' };

/**
 * Route computation status for a line segment, including explicit fallback routing.
 */
export type RouteStatus = 'not-routed' | 'routed' | 'fallback-routed' | 'routing-failed';

/**
 * Canonical route segment model between two ordered stops on a line.
 */
export interface LineRouteSegment {
  readonly id: LineSegmentId;
  readonly lineId: LineId;
  readonly fromStopId: StopId;
  readonly toStopId: StopId;
  readonly orderedGeometry: readonly RouteGeometryCoordinate[];
  readonly distanceMeters: RouteDistanceMeters;
  readonly inMotionTravelMinutes: RouteTravelMinutes;
  readonly dwellMinutes: RouteTravelMinutes;
  readonly totalTravelMinutes: RouteTravelMinutes;
  readonly status: RouteStatus;
}

/**
 * Creates a branded line-segment identifier from a deterministic raw segment key.
 */
export const createLineSegmentId = (rawLineSegmentId: string): LineSegmentId =>
  rawLineSegmentId as LineSegmentId;

/**
 * Creates a branded route distance value in meters from a non-negative finite numeric input.
 */
export const createRouteDistanceMeters = (rawDistanceMeters: number): RouteDistanceMeters => {
  if (!Number.isFinite(rawDistanceMeters) || rawDistanceMeters < 0) {
    throw new Error('Route distance meters must be a non-negative finite number.');
  }

  return rawDistanceMeters as RouteDistanceMeters;
};

/**
 * Creates a branded route travel value in minutes from a non-negative finite numeric input.
 */
export const createRouteTravelMinutes = (rawTravelMinutes: number): RouteTravelMinutes => {
  if (!Number.isFinite(rawTravelMinutes) || rawTravelMinutes < 0) {
    throw new Error('Route travel minutes must be a non-negative finite number.');
  }

  return rawTravelMinutes as RouteTravelMinutes;
};
