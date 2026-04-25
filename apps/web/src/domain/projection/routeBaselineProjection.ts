import type { Line } from '../types/line';
import { createRouteDistanceMeters, type LineRouteSegment } from '../types/lineRoute';
import {
  createRouteTravelTimeSeconds,
  type LineRouteBaseline,
  type LineRouteBaselineStatus,
  type RouteBaselineWarning,
  type RouteSegmentBaseline,
  type RouteSegmentBaselineStatus,
  type RouteSegmentBaselineWarning
} from '../types/routeBaseline';
import type { Stop, StopId } from '../types/stop';

const SECONDS_PER_MINUTE = 60;

/**
 * Internal helper to project a single segment baseline from precomputed route segments.
 */
function projectSegmentBaseline(
  line: Line,
  fromStopId: StopId,
  toStopId: StopId,
  segmentIndex: number,
  placedStopIds: Set<StopId>,
  routeSegments: readonly LineRouteSegment[]
): {
  segment: RouteSegmentBaseline;
  isRouted: boolean;
  isFallback: boolean;
  isUnresolved: boolean;
} {
  const isFromPlaced = placedStopIds.has(fromStopId);
  const isToPlaced = placedStopIds.has(toStopId);

  // Match logic: preferred by index, then by stop pair match
  const expectedSegment = routeSegments[segmentIndex];
  const routeSegment =
    expectedSegment?.fromStopId === fromStopId && expectedSegment?.toStopId === toStopId
      ? expectedSegment
      : routeSegments.find((segment) => segment.fromStopId === fromStopId && segment.toStopId === toStopId);

  let status: RouteSegmentBaselineStatus;
  const warnings: RouteSegmentBaselineWarning[] = [];
  let distanceMeters = createRouteDistanceMeters(0);
  let travelTimeSeconds = createRouteTravelTimeSeconds(0);
  let geometry = routeSegment ? routeSegment.orderedGeometry : [];

  let isRouted = false;
  let isFallback = false;
  let isUnresolved = false;

  if (!isFromPlaced || !isToPlaced) {
    status = 'unresolved';
    isUnresolved = true;
    warnings.push({ type: 'missing-stop-position' });
  } else if (!routeSegment) {
    status = 'unresolved';
    isUnresolved = true;
    warnings.push({ type: 'missing-route-segment' });
  } else {
    distanceMeters = routeSegment.distanceMeters;
    travelTimeSeconds = createRouteTravelTimeSeconds(routeSegment.totalTravelMinutes * SECONDS_PER_MINUTE);

    if (routeSegment.status === 'fallback-routed') {
      status = 'fallback-routed';
      isFallback = true;
      warnings.push({ type: 'fallback-routing-only' });
    } else if (routeSegment.status === 'routed') {
      status = 'routed';
      isRouted = true;
    } else {
      status = 'unresolved';
      isUnresolved = true;
    }
  }

  return {
    segment: {
      lineId: line.id,
      segmentIndex,
      fromStopId,
      toStopId,
      geometry,
      distanceMeters,
      travelTimeSeconds,
      status,
      warnings
    },
    isRouted,
    isFallback,
    isUnresolved
  };
}

/**
 * Projects a deterministic route baseline from a line and its placed stops.
 *
 * It generates segment records for both forward and (if bidirectional) reverse directions,
 * accounting for loop topology where the last stop connects back to the first.
 */
export const resolveLineRouteBaseline = (line: Line, placedStops: readonly Stop[]): LineRouteBaseline => {
  const stopCount = line.stopIds.length;
  if (stopCount < 2) {
    return {
      lineId: line.id,
      segments: [],
      totalDistanceMeters: createRouteDistanceMeters(0),
      totalTravelTimeSeconds: createRouteTravelTimeSeconds(0),
      status: 'unresolved',
      warnings: [{ type: 'all-unresolved' }]
    };
  }

  const placedStopIds = new Set(placedStops.map((stop) => stop.id));
  const isLoop = line.topology === 'loop';
  const isBidirectional = line.servicePattern === 'bidirectional';
  const forwardTargetCount = isLoop ? stopCount : stopCount - 1;

  let hasRouted = false;
  let hasFallback = false;
  let hasUnresolved = false;

  // 1. Project forward segments
  const forwardSegments: RouteSegmentBaseline[] = [];
  let totalDistanceRaw = 0;
  let totalTravelSecondsRaw = 0;

  for (let i = 0; i < forwardTargetCount; i++) {
    const fromStopId = line.stopIds[i]!;
    const toStopId = line.stopIds[(i + 1) % stopCount]!;
    const result = projectSegmentBaseline(line, fromStopId, toStopId, i, placedStopIds, line.routeSegments);
    
    forwardSegments.push(result.segment);
    totalDistanceRaw += result.segment.distanceMeters;
    totalTravelSecondsRaw += result.segment.travelTimeSeconds;
    if (result.isRouted) hasRouted = true;
    if (result.isFallback) hasFallback = true;
    if (result.isUnresolved) hasUnresolved = true;
  }

  // 2. Project reverse segments if bidirectional
  let reverseSegments: RouteSegmentBaseline[] | undefined = undefined;
  let totalReverseDistanceRaw = 0;
  let totalReverseTravelSecondsRaw = 0;

  if (isBidirectional && line.reverseRouteSegments) {
    reverseSegments = [];
    const reverseStopIds = isLoop
      ? [line.stopIds[0], ...[...line.stopIds.slice(1)].reverse()]
      : [...line.stopIds].reverse();

    for (let i = 0; i < forwardTargetCount; i++) {
      const fromStopId = reverseStopIds[i]!;
      const toStopId = reverseStopIds[(i + 1) % stopCount]!;
      const result = projectSegmentBaseline(line, fromStopId, toStopId, i, placedStopIds, line.reverseRouteSegments);
      
      reverseSegments.push(result.segment);
      totalReverseDistanceRaw += result.segment.distanceMeters;
      totalReverseTravelSecondsRaw += result.segment.travelTimeSeconds;
      if (result.isRouted) hasRouted = true;
      if (result.isFallback) hasFallback = true;
      if (result.isUnresolved) hasUnresolved = true;
    }
  }

  // 3. Aggregate aggregate status and warnings
  let aggregateStatus: LineRouteBaselineStatus;
  const aggregateWarnings: RouteBaselineWarning[] = [];

  if (hasUnresolved) {
    if (hasRouted || hasFallback) {
      aggregateStatus = 'partial';
      aggregateWarnings.push({ type: 'partial-unresolved' });
    } else {
      aggregateStatus = 'unresolved';
      aggregateWarnings.push({ type: 'all-unresolved' });
    }
  } else if (hasFallback) {
    aggregateStatus = 'fallback-routed';
    aggregateWarnings.push({ type: 'fallback-routing' });
  } else {
    aggregateStatus = 'routed';
  }

  return {
    lineId: line.id,
    segments: forwardSegments,
    reverseSegments,
    totalDistanceMeters: createRouteDistanceMeters(totalDistanceRaw),
    totalReverseDistanceMeters: reverseSegments ? createRouteDistanceMeters(totalReverseDistanceRaw) : undefined,
    totalTravelTimeSeconds: createRouteTravelTimeSeconds(totalTravelSecondsRaw),
    totalReverseTravelTimeSeconds: reverseSegments ? createRouteTravelTimeSeconds(totalReverseTravelSecondsRaw) : undefined,
    status: aggregateStatus,
    warnings: aggregateWarnings
  };
};
