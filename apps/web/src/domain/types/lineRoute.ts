import {
  DEFAULT_ROUTE_DWELL_MINUTES_PER_SEGMENT,
  FALLBACK_BUS_SPEED_METERS_PER_MINUTE,
  MINIMUM_IN_MOTION_TRAVEL_MINUTES
} from '../constants/routing';
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
 * Canonical runtime list of route-status values for parsing and validation boundaries.
 */
export const ROUTE_STATUSES = ['not-routed', 'routed', 'fallback-routed', 'routing-failed'] as const satisfies readonly RouteStatus[];

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
 * Baseline fallback travel timing breakdown for one routed line segment.
 */
export interface BaselineRouteTravelTiming {
  readonly inMotionTravelMinutes: RouteTravelMinutes;
  readonly dwellMinutes: RouteTravelMinutes;
  readonly totalTravelMinutes: RouteTravelMinutes;
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

/**
 * Computes baseline fallback in-motion minutes from routed segment distance using canonical routing constants.
 */
export const calculateFallbackInMotionTravelMinutes = (distanceMeters: RouteDistanceMeters): RouteTravelMinutes => {
  const rawInMotionMinutes = distanceMeters / FALLBACK_BUS_SPEED_METERS_PER_MINUTE;

  if (distanceMeters === 0) {
    return createRouteTravelMinutes(0);
  }

  return createRouteTravelMinutes(Math.max(MINIMUM_IN_MOTION_TRAVEL_MINUTES, rawInMotionMinutes));
};

/**
 * Builds canonical fallback travel timing for one route segment with separate in-motion and dwell components.
 */
export const createBaselineRouteTravelTiming = (distanceMeters: RouteDistanceMeters): BaselineRouteTravelTiming => {
  const inMotionTravelMinutes = calculateFallbackInMotionTravelMinutes(distanceMeters);
  const dwellMinutes = createRouteTravelMinutes(DEFAULT_ROUTE_DWELL_MINUTES_PER_SEGMENT);

  return {
    inMotionTravelMinutes,
    dwellMinutes,
    totalTravelMinutes: createRouteTravelMinutes(inMotionTravelMinutes + dwellMinutes)
  };
};
