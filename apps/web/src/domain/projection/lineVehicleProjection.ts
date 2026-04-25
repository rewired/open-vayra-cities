import { DEFAULT_TURNAROUND_RECOVERY_MINUTES } from '../constants/lineService';
import type { Line } from '../types/line';
import type {
  LineVehicleNetworkProjection,
  LineVehicleProjection,
  LineVehicleProjectionForLine,
  LineVehicleProjectionSummary,
  LineVehicleProjectionStatus
} from '../types/lineVehicleProjection';
import { createLineVehicleProjectionId } from '../types/lineVehicleProjection';
import type { RouteGeometryCoordinate } from '../types/lineRoute';
import type { LineRouteBaseline, RouteSegmentBaseline } from '../types/routeBaseline';
import type { LinePlanningVehicleProjection, LineBandVehicleProjection } from '../types/linePlanningVehicleProjection';
import type { SimulationMinuteOfDay } from '../types/simulationClock';
import type { TimeBandId } from '../types/timeBand';
import { clampRouteSegmentProgressRatio, projectCoordinateAlongRouteGeometry } from './routeGeometryInterpolation';

const SECONDS_PER_MINUTE = 60;

const findSegmentProgress = (
  segments: readonly RouteSegmentBaseline[],
  elapsedSeconds: number,
  totalTravelTimeSeconds: number
): {
  readonly segmentIndex: number | null;
  readonly coordinate: RouteGeometryCoordinate | null;
  readonly note?: string;
} => {
  if (segments.length === 0 || totalTravelTimeSeconds <= 0) {
    return {
      segmentIndex: null,
      coordinate: null,
      note: 'Unavailable: line has no routed segments for marker projection.'
    };
  }

  const clampedElapsedSeconds = Math.max(0, Math.min(elapsedSeconds, totalTravelTimeSeconds));
  let traversedSeconds = 0;

  for (let i = 0; i < segments.length; i += 1) {
    const segment = segments[i] as RouteSegmentBaseline;
    const segmentDurationSeconds = segment.travelTimeSeconds;
    const nextTraversedSeconds = traversedSeconds + segmentDurationSeconds;

    if (clampedElapsedSeconds <= nextTraversedSeconds) {
      if (segment.geometry.length < 2) {
        return {
          segmentIndex: null,
          coordinate: null,
          note: `Unavailable: segment index ${i} has no geometry coordinate anchors.`
        };
      }

      const segmentProgressRatio =
        segmentDurationSeconds <= 0
          ? 1
          : clampRouteSegmentProgressRatio((clampedElapsedSeconds - traversedSeconds) / segmentDurationSeconds);

      return {
        segmentIndex: i,
        coordinate: projectCoordinateAlongRouteGeometry(segment.geometry, segmentProgressRatio)
      };
    }

    traversedSeconds = nextTraversedSeconds;
  }

  const lastSegmentIndex = segments.length - 1;
  const lastSegment = segments[lastSegmentIndex];
  const lastCoordinate = lastSegment?.geometry.at(-1) ?? null;

  return {
    segmentIndex: lastSegmentIndex,
    coordinate: lastCoordinate,
    ...(lastCoordinate === null
      ? { note: 'Unavailable: no terminal route geometry coordinate for projected vehicle.' }
      : {})
  };
};

const projectVehiclesForLine = (
  line: Line,
  routeBaseline: LineRouteBaseline,
  planningProjection: LineBandVehicleProjection,
  currentMinuteOfDay: SimulationMinuteOfDay,
  activeTimeBandId: TimeBandId
): LineVehicleProjectionForLine => {
  if (planningProjection.serviceState !== 'frequency' || planningProjection.status === 'route-unavailable') {
    return {
      lineId: line.id,
      lineLabel: line.label,
      activeTimeBandId,
      serviceState: planningProjection.serviceState,
      routeStatus: routeBaseline.status,
      vehicles: [],
      note: `Unavailable: service state is ${planningProjection.serviceState} or route is unavailable.`
    };
  }

  const vehicles: LineVehicleProjection[] = [];
  const projectedVehicleCount = planningProjection.projectedVehicles;
  const headwayMinutes = planningProjection.headwayMinutes;
  
  if (projectedVehicleCount === undefined || headwayMinutes === undefined || projectedVehicleCount <= 0 || !planningProjection.roundTripSeconds) {
    return {
      lineId: line.id,
      lineLabel: line.label,
      activeTimeBandId,
      serviceState: planningProjection.serviceState,
      routeStatus: routeBaseline.status,
      vehicles: [],
      note: 'Unavailable: calculated projected vehicles is zero, or required planning inputs are missing.'
    };
  }

  const totalForwardSeconds = routeBaseline.totalTravelTimeSeconds;
  const totalReverseSeconds = routeBaseline.totalReverseTravelTimeSeconds ?? totalForwardSeconds;
  const recoverySeconds = DEFAULT_TURNAROUND_RECOVERY_MINUTES * SECONDS_PER_MINUTE;
  const currentSecondsOfDay = currentMinuteOfDay * SECONDS_PER_MINUTE;

  const isLoop = line.topology === 'loop';
  const isBidirectional = line.servicePattern === 'bidirectional';
  const roundTripSeconds = planningProjection.roundTripSeconds;

  const vehicleStatus: LineVehicleProjectionStatus = routeBaseline.status === 'fallback-routed' ? 'degraded-projected' : 'projected';
  const fallbackNote = routeBaseline.status === 'fallback-routed' ? 'Degraded: fallback routing in use.' : undefined;

  for (let i = 0; i < projectedVehicleCount; i += 1) {
    const phaseOffsetSeconds = i * headwayMinutes * SECONDS_PER_MINUTE;
    const elapsedPhaseSeconds = (currentSecondsOfDay + phaseOffsetSeconds) % roundTripSeconds;
    const routeProgressRatio = clampRouteSegmentProgressRatio(elapsedPhaseSeconds / roundTripSeconds);

    let direction: 'outbound' | 'return';
    let activeTravelSeconds: number;
    let activeSegments: readonly RouteSegmentBaseline[];
    let activeTotalSeconds: number;

    if (elapsedPhaseSeconds <= totalForwardSeconds) {
      // 1. Forward motion
      direction = 'outbound';
      activeTravelSeconds = elapsedPhaseSeconds;
      activeSegments = routeBaseline.segments;
      activeTotalSeconds = totalForwardSeconds;
    } else if (isLoop && !isBidirectional) {
      // 2. Loop Recovery (One-way loop)
      direction = 'outbound';
      activeTravelSeconds = totalForwardSeconds;
      activeSegments = routeBaseline.segments;
      activeTotalSeconds = totalForwardSeconds;
    } else if (elapsedPhaseSeconds <= totalForwardSeconds + recoverySeconds / 2) {
      // 3. Outbound Recovery (Linear or Bidirectional)
      direction = 'outbound';
      activeTravelSeconds = totalForwardSeconds;
      activeSegments = routeBaseline.segments;
      activeTotalSeconds = totalForwardSeconds;
    } else if (isBidirectional && routeBaseline.reverseSegments) {
      // 4. Actual Reverse Motion
      direction = 'return';
      const timeInReturn = elapsedPhaseSeconds - (totalForwardSeconds + recoverySeconds / 2);
      activeTravelSeconds = Math.min(timeInReturn, totalReverseSeconds);
      activeSegments = routeBaseline.reverseSegments;
      activeTotalSeconds = totalReverseSeconds;
    } else if (isBidirectional) {
      // 5. Symmetric Reverse Fallback (Missing reverse segments)
      direction = 'return';
      const timeInReturn = elapsedPhaseSeconds - (totalForwardSeconds + recoverySeconds / 2);
      activeTravelSeconds = Math.max(0, totalForwardSeconds - timeInReturn);
      activeSegments = routeBaseline.segments;
      activeTotalSeconds = totalForwardSeconds;
    } else if (!isLoop) {
      // 6. Linear One-way Symmetric Return (Fallback behavior)
      direction = 'return';
      const timeInReturn = elapsedPhaseSeconds - (totalForwardSeconds + recoverySeconds / 2);
      activeTravelSeconds = Math.max(0, totalForwardSeconds - timeInReturn);
      activeSegments = routeBaseline.segments;
      activeTotalSeconds = totalForwardSeconds;
    } else {
      // 7. Final recovery
      direction = 'return';
      activeTravelSeconds = 0;
      activeSegments = isBidirectional ? (routeBaseline.reverseSegments ?? routeBaseline.segments) : routeBaseline.segments;
      activeTotalSeconds = isBidirectional ? totalReverseSeconds : totalForwardSeconds;
    }

    const segmentProgress = findSegmentProgress(activeSegments, activeTravelSeconds, activeTotalSeconds);

    const degradedNote = segmentProgress.note ?? fallbackNote;
    vehicles.push({
      id: createLineVehicleProjectionId(`${line.id}:${activeTimeBandId}:bus-${i}`),
      lineId: line.id,
      lineLabel: line.label,
      activeTimeBandId,
      routeProgressRatio,
      segmentIndex: segmentProgress.segmentIndex,
      direction,
      coordinate: segmentProgress.coordinate,
      status: segmentProgress.coordinate === null ? 'unavailable' : vehicleStatus,
      ...(degradedNote ? { degradedNote } : {})
    });
  }

  return {
    lineId: line.id,
    lineLabel: line.label,
    activeTimeBandId,
    serviceState: planningProjection.serviceState,
    routeStatus: routeBaseline.status,
    vehicles,
    ...(fallbackNote ? { note: fallbackNote } : {})
  };
};

/**
 * Projects derived visible bus positions for all lines based on deterministic headway pacing.
 */
export const projectLineVehicleNetwork = (
  completedLines: readonly Line[],
  routeBaselinesByLineId: ReadonlyMap<string, LineRouteBaseline>,
  planningProjections: readonly LinePlanningVehicleProjection[],
  currentMinuteOfDay: SimulationMinuteOfDay,
  activeTimeBandId: TimeBandId
): LineVehicleNetworkProjection => {
  const planningByLineId = new Map(planningProjections.map((p) => [p.lineId, p]));

  const lines = completedLines.map<LineVehicleProjectionForLine>((line) => {
    const routeBaseline = routeBaselinesByLineId.get(line.id);
    const planningProjection = planningByLineId.get(line.id);
    const bandPlanning = planningProjection?.bands.find((b) => b.timeBandId === activeTimeBandId);

    if (!routeBaseline || !bandPlanning) {
      return {
        lineId: line.id,
        lineLabel: line.label,
        activeTimeBandId,
        serviceState: 'unset',
        routeStatus: routeBaseline?.status ?? 'unresolved',
        vehicles: [],
        note: 'Unavailable: missing route baseline or planning projection for this line.'
      };
    }

    return projectVehiclesForLine(line, routeBaseline, bandPlanning, currentMinuteOfDay, activeTimeBandId);
  });

  const summary = lines.reduce<LineVehicleProjectionSummary>(
    (accumulator, lineProjection) => {
      const projectedVehicleCount = lineProjection.vehicles.filter((vehicle) => vehicle.status === 'projected').length;
      const degradedProjectedVehicleCount = lineProjection.vehicles.filter(
        (vehicle) => vehicle.status === 'degraded-projected'
      ).length;

      return {
        totalProjectedVehicleCount: accumulator.totalProjectedVehicleCount + projectedVehicleCount,
        totalDegradedProjectedVehicleCount:
          accumulator.totalDegradedProjectedVehicleCount + degradedProjectedVehicleCount,
        linesWithProjectedVehiclesCount:
          accumulator.linesWithProjectedVehiclesCount +
          (projectedVehicleCount + degradedProjectedVehicleCount > 0 ? 1 : 0),
        activeTimeBandId
      };
    },
    {
      totalProjectedVehicleCount: 0,
      totalDegradedProjectedVehicleCount: 0,
      linesWithProjectedVehiclesCount: 0,
      activeTimeBandId
    }
  );

  return {
    lines,
    summary
  };
};
