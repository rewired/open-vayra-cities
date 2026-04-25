import { MVP_TIME_BAND_IDS } from '../constants/timeBands';
import { DEFAULT_TURNAROUND_RECOVERY_MINUTES } from '../constants/lineService';
import { resolveLineServiceBandHeadwayMinutes, type Line } from '../types/line';
import {
  createProjectedVehicleCount,
  type LineBandVehicleProjection,
  type LinePlanningVehicleProjection,
  type VehicleProjectionWarning
} from '../types/linePlanningVehicleProjection';
import { createRouteTravelTimeSeconds, type LineRouteBaseline } from '../types/routeBaseline';

const SECONDS_PER_MINUTE = 60;

/**
 * Projects the aggregate planning vehicle requirements for a completed line
 * across all canonical time bands, based on its service frequency and route baseline runtime.
 */
export const projectLinePlanningVehicles = (
  line: Line,
  routeBaseline: LineRouteBaseline | null
): LinePlanningVehicleProjection => {
  let maxProjectedVehiclesRaw = 0;
  let totalConfiguredBands = 0;
  let totalNoServiceBands = 0;
  let totalUnconfiguredBands = 0;
  let hasFallbackRouteWarning = false;

  const bands = MVP_TIME_BAND_IDS.map<LineBandVehicleProjection>((timeBandId) => {
    const serviceBandPlan = line.frequencyByTimeBand[timeBandId];

    if (!serviceBandPlan) {
      totalUnconfiguredBands += 1;
      return {
        lineId: line.id,
        timeBandId,
        serviceState: 'unset',
        status: 'unconfigured',
        warnings: []
      };
    }

    if (serviceBandPlan.kind === 'no-service') {
      totalNoServiceBands += 1;
      totalConfiguredBands += 1;
      return {
        lineId: line.id,
        timeBandId,
        serviceState: 'no-service',
        projectedVehicles: createProjectedVehicleCount(0),
        status: 'no-service',
        warnings: []
      };
    }

    const headwayMinutes = resolveLineServiceBandHeadwayMinutes(serviceBandPlan);

    if (headwayMinutes === null || headwayMinutes <= 0) {
      totalUnconfiguredBands += 1;
      return {
        lineId: line.id,
        timeBandId,
        serviceState: 'unset',
        status: 'unconfigured',
        warnings: []
      };
    }

    if (!routeBaseline || routeBaseline.status === 'unresolved' || routeBaseline.status === 'partial') {
      totalConfiguredBands += 1;
      return {
        lineId: line.id,
        timeBandId,
        serviceState: 'frequency',
        headwayMinutes,
        status: 'route-unavailable',
        warnings: []
      };
    }

    totalConfiguredBands += 1;
    const warnings: VehicleProjectionWarning[] = [];
    let status: LineBandVehicleProjection['status'] = 'ready';

    if (routeBaseline.status === 'fallback-routed') {
      status = 'fallback-route';
      hasFallbackRouteWarning = true;
      warnings.push({ type: 'fallback-routing' });
    }

    const isLoop = line.topology === 'loop';
    const isBidirectional = line.servicePattern === 'bidirectional';
    
    let roundTripSecondsRaw: number;
    if (isBidirectional) {
      roundTripSecondsRaw = 
        routeBaseline.totalTravelTimeSeconds + 
        (routeBaseline.totalReverseTravelTimeSeconds ?? routeBaseline.totalTravelTimeSeconds) + 
        DEFAULT_TURNAROUND_RECOVERY_MINUTES * SECONDS_PER_MINUTE;
    } else if (isLoop) {
      roundTripSecondsRaw = 
        routeBaseline.totalTravelTimeSeconds + 
        DEFAULT_TURNAROUND_RECOVERY_MINUTES * SECONDS_PER_MINUTE;
    } else {
      // Linear One-way: assume symmetric return trip
      roundTripSecondsRaw = 
        routeBaseline.totalTravelTimeSeconds * 2 + 
        DEFAULT_TURNAROUND_RECOVERY_MINUTES * SECONDS_PER_MINUTE;
    }

    const roundTripSeconds = createRouteTravelTimeSeconds(roundTripSecondsRaw);
    
    const roundTripMinutes = roundTripSecondsRaw / SECONDS_PER_MINUTE;
    const projectedVehiclesRaw = Math.max(1, Math.ceil(roundTripMinutes / headwayMinutes));
    const projectedVehicles = createProjectedVehicleCount(projectedVehiclesRaw);

    if (projectedVehiclesRaw > maxProjectedVehiclesRaw) {
      maxProjectedVehiclesRaw = projectedVehiclesRaw;
    }

    return {
      lineId: line.id,
      timeBandId,
      serviceState: 'frequency',
      headwayMinutes,
      roundTripSeconds,
      projectedVehicles,
      status,
      warnings
    };
  });

  return {
    lineId: line.id,
    bands,
    maxProjectedVehicles: createProjectedVehicleCount(maxProjectedVehiclesRaw),
    totalConfiguredBands,
    totalNoServiceBands,
    totalUnconfiguredBands,
    hasFallbackRouteWarning
  };
};

/**
 * Projects planning vehicle requirements for a network of completed lines.
 */
export const projectNetworkPlanningVehicles = (
  lines: readonly Line[],
  routeBaselinesByLineId: ReadonlyMap<string, LineRouteBaseline>
): readonly LinePlanningVehicleProjection[] =>
  lines.map((line) => projectLinePlanningVehicles(line, routeBaselinesByLineId.get(line.id) ?? null));
