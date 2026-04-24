import type { Line } from '../types/line';
import {
  createLineVehicleProjectionId,
  type LineVehicleNetworkProjection,
  type LineVehicleProjection,
  type LineVehicleProjectionForLine,
  type LineVehicleProjectionStatus,
  type LineVehicleProjectionSummary
} from '../types/lineVehicleProjection';
import type { LineRouteSegment, RouteGeometryCoordinate } from '../types/lineRoute';
import type { LineDepartureScheduleNetworkProjection } from '../types/lineDepartureScheduleProjection';
import type { SimulationMinuteOfDay } from '../types/simulationClock';
import type { TimeBandId } from '../types/timeBand';

const clampRatio = (value: number): number => Math.max(0, Math.min(1, value));

const isActiveDeparture = (
  departureMinute: number,
  currentMinuteOfDay: SimulationMinuteOfDay,
  totalRouteTimeMinutes: number
): boolean => departureMinute <= currentMinuteOfDay && currentMinuteOfDay < departureMinute + totalRouteTimeMinutes;

const toRouteCoordinate = (
  fromCoordinate: RouteGeometryCoordinate,
  toCoordinate: RouteGeometryCoordinate,
  ratio: number
): RouteGeometryCoordinate => {
  const boundedRatio = clampRatio(ratio);
  const lng = fromCoordinate[0] + (toCoordinate[0] - fromCoordinate[0]) * boundedRatio;
  const lat = fromCoordinate[1] + (toCoordinate[1] - fromCoordinate[1]) * boundedRatio;

  return [lng, lat];
};

const findSegmentProgress = (
  routeSegments: readonly LineRouteSegment[],
  elapsedMinutes: number,
  totalRouteTimeMinutes: number
): {
  readonly currentSegmentId: LineRouteSegment['id'] | null;
  readonly segmentProgressRatio: number;
  readonly coordinate: RouteGeometryCoordinate | null;
  readonly note?: string;
} => {
  if (routeSegments.length === 0 || totalRouteTimeMinutes <= 0) {
    return {
      currentSegmentId: null,
      segmentProgressRatio: 0,
      coordinate: null,
      note: 'Unavailable: line has no routed segments for marker projection.'
    };
  }

  const clampedElapsedMinutes = Math.max(0, Math.min(elapsedMinutes, totalRouteTimeMinutes));
  let traversedMinutes = 0;

  for (const segment of routeSegments) {
    const segmentDurationMinutes = segment.totalTravelMinutes;
    const nextTraversedMinutes = traversedMinutes + segmentDurationMinutes;

    if (clampedElapsedMinutes <= nextTraversedMinutes) {
      const fromCoordinate = segment.orderedGeometry[0];
      const toCoordinate = segment.orderedGeometry.at(-1);

      if (!fromCoordinate || !toCoordinate) {
        return {
          currentSegmentId: null,
          segmentProgressRatio: 0,
          coordinate: null,
          note: `Unavailable: segment "${segment.id}" has no geometry coordinate anchors.`
        };
      }

      const segmentProgressRatio =
        segmentDurationMinutes <= 0 ? 1 : clampRatio((clampedElapsedMinutes - traversedMinutes) / segmentDurationMinutes);

      return {
        currentSegmentId: segment.id,
        segmentProgressRatio,
        coordinate: toRouteCoordinate(fromCoordinate, toCoordinate, segmentProgressRatio)
      };
    }

    traversedMinutes = nextTraversedMinutes;
  }

  const lastSegment = routeSegments.at(-1);
  const lastCoordinate = lastSegment?.orderedGeometry.at(-1) ?? null;

  return {
    currentSegmentId: lastSegment?.id ?? null,
    segmentProgressRatio: 1,
    coordinate: lastCoordinate,
    ...(lastCoordinate === null
      ? { note: 'Unavailable: no terminal route geometry coordinate for projected vehicle.' }
      : {})
  };
};

const toVehicleStatus = (
  departureProjectionStatus: LineVehicleProjectionForLine['departureScheduleStatus']
): LineVehicleProjectionStatus => (departureProjectionStatus === 'degraded' ? 'degraded-projected' : 'projected');

const projectVehiclesForLine = (
  line: Line,
  currentMinuteOfDay: SimulationMinuteOfDay,
  activeTimeBandId: TimeBandId,
  departureLineProjection: LineDepartureScheduleNetworkProjection['lines'][number]
): LineVehicleProjectionForLine => {
  const totalRouteTimeMinutes = departureLineProjection.totalRouteTravelMinutes;
  const status = departureLineProjection.status;

  if (status === 'unavailable' || totalRouteTimeMinutes <= 0) {
    return {
      lineId: line.id,
      lineLabel: line.label,
      activeTimeBandId,
      departureScheduleStatus: status,
      vehicles: [],
      note:
        status === 'unavailable'
          ? 'Unavailable: no active departure/service projection is available for this line.'
          : 'Unavailable: total route travel minutes are not positive.'
    };
  }

  const vehicleStatus = toVehicleStatus(status);
  const activeDepartures = departureLineProjection.departureMinutes.filter((departureMinute) =>
    isActiveDeparture(departureMinute, currentMinuteOfDay, totalRouteTimeMinutes)
  );

  const vehicles = activeDepartures.map<LineVehicleProjection>((departureMinute) => {
    const elapsedMinutes = currentMinuteOfDay - departureMinute;
    const routeProgressRatio = clampRatio(elapsedMinutes / totalRouteTimeMinutes);
    const segmentProgress = findSegmentProgress(line.routeSegments, elapsedMinutes, totalRouteTimeMinutes);

    return {
      id: createLineVehicleProjectionId(`${line.id}:${activeTimeBandId}:${departureMinute}`),
      lineId: line.id,
      lineLabel: line.label,
      activeTimeBandId,
      departureMinute,
      elapsedMinutes,
      routeProgressRatio,
      segmentProgressRatio: segmentProgress.segmentProgressRatio,
      currentSegmentId: segmentProgress.currentSegmentId,
      coordinate: segmentProgress.coordinate,
      status: segmentProgress.coordinate === null ? 'unavailable' : vehicleStatus,
      ...(vehicleStatus === 'degraded-projected'
        ? {
            degradedNote:
              segmentProgress.note ?? 'Degraded: upstream departure/service projection indicates fallback conditions.'
          }
        : segmentProgress.note
          ? { degradedNote: segmentProgress.note }
          : {})
    };
  });

  return {
    lineId: line.id,
    lineLabel: line.label,
    activeTimeBandId,
    departureScheduleStatus: status,
    vehicles,
    ...(status === 'degraded'
      ? { note: 'Degraded: active departures projected with fallback service conditions.' }
      : {})
  };
};

/**
 * Projects current-minute in-flight line vehicles from departure schedule output and stored route segments.
 */
export const projectLineVehicleNetwork = (
  completedLines: readonly Line[],
  departureScheduleProjection: LineDepartureScheduleNetworkProjection,
  currentMinuteOfDay: SimulationMinuteOfDay,
  activeTimeBandId: TimeBandId
): LineVehicleNetworkProjection => {
  const lineById = new Map(completedLines.map((line) => [line.id, line]));

  const lines = departureScheduleProjection.lines.map<LineVehicleProjectionForLine>((departureLineProjection) => {
    const line = lineById.get(departureLineProjection.lineId);

    if (!line) {
      return {
        lineId: departureLineProjection.lineId,
        lineLabel: departureLineProjection.lineLabel,
        activeTimeBandId,
        departureScheduleStatus: departureLineProjection.status,
        vehicles: [],
        note: 'Unavailable: line is missing from the provided completed line set.'
      };
    }

    return projectVehiclesForLine(line, currentMinuteOfDay, activeTimeBandId, departureLineProjection);
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
