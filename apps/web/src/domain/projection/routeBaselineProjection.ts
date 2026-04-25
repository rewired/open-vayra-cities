import type { Line } from '../types/line';
import { createRouteDistanceMeters } from '../types/lineRoute';
import {
  createRouteTravelTimeSeconds,
  type LineRouteBaseline,
  type LineRouteBaselineStatus,
  type RouteBaselineWarning,
  type RouteSegmentBaseline,
  type RouteSegmentBaselineStatus,
  type RouteSegmentBaselineWarning
} from '../types/routeBaseline';
import type { Stop } from '../types/stop';

const SECONDS_PER_MINUTE = 60;

/**
 * Projects a deterministic route baseline from a line and its placed stops.
 *
 * It generates one segment record per consecutive stop pair in the line, gracefully
 * handling missing stop coordinates or missing precomputed routing segments by marking
 * them as unresolved. It will never throw for normal editing states.
 */
export const resolveLineRouteBaseline = (line: Line, placedStops: readonly Stop[]): LineRouteBaseline => {
  if (line.stopIds.length < 2) {
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
  const segments: RouteSegmentBaseline[] = [];
  let totalDistanceRaw = 0;
  let totalTravelSecondsRaw = 0;
  let hasRouted = false;
  let hasFallback = false;
  let hasUnresolved = false;

  for (let index = 0; index < line.stopIds.length - 1; index += 1) {
    const fromStopId = line.stopIds[index]!;
    const toStopId = line.stopIds[index + 1]!;

    const isFromPlaced = placedStopIds.has(fromStopId);
    const isToPlaced = placedStopIds.has(toStopId);

    // Try to find the corresponding computed segment using both index and stop match
    // to handle repeated stops safely if they occur.
    const expectedSegment = line.routeSegments[index];
    const routeSegment =
      expectedSegment?.fromStopId === fromStopId && expectedSegment?.toStopId === toStopId
        ? expectedSegment
        : line.routeSegments.find((segment) => segment.fromStopId === fromStopId && segment.toStopId === toStopId);

    let status: RouteSegmentBaselineStatus;
    const warnings: RouteSegmentBaselineWarning[] = [];
    let distanceMeters = createRouteDistanceMeters(0);
    let travelTimeSeconds = createRouteTravelTimeSeconds(0);
    let geometry = routeSegment ? routeSegment.orderedGeometry : [];

    if (!isFromPlaced || !isToPlaced) {
      status = 'unresolved';
      hasUnresolved = true;
      warnings.push({ type: 'missing-stop-position' });
    } else if (!routeSegment) {
      status = 'unresolved';
      hasUnresolved = true;
      warnings.push({ type: 'missing-route-segment' });
    } else {
      distanceMeters = routeSegment.distanceMeters;
      travelTimeSeconds = createRouteTravelTimeSeconds(routeSegment.totalTravelMinutes * SECONDS_PER_MINUTE);

      if (routeSegment.status === 'fallback-routed') {
        status = 'fallback-routed';
        hasFallback = true;
        warnings.push({ type: 'fallback-routing-only' });
      } else if (routeSegment.status === 'routed') {
        status = 'routed';
        hasRouted = true;
      } else {
        status = 'unresolved';
        hasUnresolved = true;
      }
    }

    totalDistanceRaw += distanceMeters;
    totalTravelSecondsRaw += travelTimeSeconds;

    segments.push({
      lineId: line.id,
      segmentIndex: index,
      fromStopId,
      toStopId,
      geometry,
      distanceMeters,
      travelTimeSeconds,
      status,
      warnings
    });
  }

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
    segments,
    totalDistanceMeters: createRouteDistanceMeters(totalDistanceRaw),
    totalTravelTimeSeconds: createRouteTravelTimeSeconds(totalTravelSecondsRaw),
    status: aggregateStatus,
    warnings: aggregateWarnings
  };
};
