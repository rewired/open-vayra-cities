import {
  TIME_BAND_DEFINITIONS,
  TIME_BAND_DISPLAY_LABELS,
  formatTimeBandWindow
} from '../constants/timeBands';
import type { RouteBaselineAggregateMetrics } from './useNetworkPlanningProjections';
import type { Line, LineServiceBandPlan } from '../types/line';
import type { LineRouteSegment } from '../types/lineRoute';
import type {
  ActiveServiceBandSummary,
  LineDepartureTimetableCell,
  LineDepartureTimetableNotice,
  LineDepartureTimetableProjection,
  LineDepartureTimetableRow,
  RouteTimingStatus,
  TimetableRouteBaselineSummary
} from '../types/lineDepartureTimetableProjection';
import type { Stop } from '../types/stop';
import type { TimeBandId } from '../types/timeBand';

const HOURS_PER_DAY = 24;
const ROUTE_TIMING_STATUS_LABELS: Readonly<Record<RouteTimingStatus, string>> = {
  'not-routed': 'Not routed',
  routed: 'Routed',
  'fallback-routed': 'Fallback routed',
  'routing-failed': 'Routing failed'
};

const MINUTES_PER_HOUR = 60;
const MINUTES_PER_DAY = HOURS_PER_DAY * MINUTES_PER_HOUR;

const createHourRange = (): readonly number[] => Array.from({ length: HOURS_PER_DAY }, (_, hour) => hour);

const toHour = (minuteOfDay: number): number => Math.floor(minuteOfDay / MINUTES_PER_HOUR) % HOURS_PER_DAY;

const toMinuteWithinHour = (minuteOfDay: number): number => minuteOfDay % MINUTES_PER_HOUR;

const normalizeMinute = (minuteOfDay: number): number => ((minuteOfDay % MINUTES_PER_DAY) + MINUTES_PER_DAY) % MINUTES_PER_DAY;

const createEmptyHourMap = (): Map<number, number[]> =>
  new Map(createHourRange().map((hour) => [hour, [] as number[]]));

const resolveBandMinutes = (
  startMinuteOfDay: number,
  endMinuteOfDay: number
): readonly number[] => {
  const minutes: number[] = [];

  if (startMinuteOfDay < endMinuteOfDay) {
    for (let minute = startMinuteOfDay; minute < endMinuteOfDay; minute += 1) {
      minutes.push(minute);
    }
    return minutes;
  }

  for (let minute = startMinuteOfDay; minute < MINUTES_PER_DAY; minute += 1) {
    minutes.push(minute);
  }
  for (let minute = 0; minute < endMinuteOfDay; minute += 1) {
    minutes.push(minute);
  }

  return minutes;
};

const addFrequencyBandDepartures = (
  departuresByMinute: boolean[],
  bandStartMinute: number,
  bandEndMinute: number,
  headwayMinutes: number
): void => {
  const bandMinutes = resolveBandMinutes(bandStartMinute, bandEndMinute);
  if (bandMinutes.length === 0) {
    return;
  }

  const firstMinute = bandMinutes[0];
  if (firstMinute === undefined) {
    return;
  }

  for (
    let departureMinute = firstMinute;
    departureMinute < firstMinute + bandMinutes.length;
    departureMinute += headwayMinutes
  ) {
    departuresByMinute[normalizeMinute(departureMinute)] = true;
  }
};

const projectOriginDeparturesByHour = (
  frequencyByTimeBand: Line['frequencyByTimeBand']
): { readonly byHour: ReadonlyMap<number, readonly number[]>; readonly hasUnconfiguredBands: boolean } => {
  const hourlyMinutes = createEmptyHourMap();
  const departuresByMinute = Array.from({ length: MINUTES_PER_DAY }, () => false);
  let hasUnconfiguredBands = false;

  for (const definition of TIME_BAND_DEFINITIONS) {
    const bandPlan = frequencyByTimeBand[definition.id] as LineServiceBandPlan | undefined;
    if (!bandPlan) {
      hasUnconfiguredBands = true;
      continue;
    }

    if (bandPlan.kind !== 'frequency') {
      continue;
    }

    addFrequencyBandDepartures(
      departuresByMinute,
      definition.startMinuteOfDay,
      definition.endMinuteOfDay,
      bandPlan.headwayMinutes
    );
  }

  for (let minuteOfDay = 0; minuteOfDay < MINUTES_PER_DAY; minuteOfDay += 1) {
    if (!departuresByMinute[minuteOfDay]) {
      continue;
    }
    const hour = toHour(minuteOfDay);
    hourlyMinutes.get(hour)?.push(toMinuteWithinHour(minuteOfDay));
  }

  return {
    byHour: new Map(
      [...hourlyMinutes.entries()].map(([hour, minutes]) => [hour, [...minutes].sort((left, right) => left - right)])
    ),
    hasUnconfiguredBands
  };
};

const resolveStopLabels = (line: Line, placedStops: readonly Stop[]): readonly string[] => {
  const stopLabelById = new Map(placedStops.map((stop) => [stop.id, stop.label]));
  return line.stopIds.map((stopId) => stopLabelById.get(stopId) ?? stopId);
};

const resolveStopOffsets = (line: Line): readonly number[] | null => {
  if (line.stopIds.length === 0) {
    return [];
  }

  if (line.routeSegments.length !== Math.max(0, line.stopIds.length - 1)) {
    return null;
  }

  const offsets: number[] = [0];
  let cumulativeMinutes = 0;

  for (let index = 0; index < line.routeSegments.length; index += 1) {
    const segment = line.routeSegments[index];
    const expectedFrom = line.stopIds[index];
    const expectedTo = line.stopIds[index + 1];

    if (!segment || segment.fromStopId !== expectedFrom || segment.toStopId !== expectedTo) {
      return null;
    }

    cumulativeMinutes += segment.totalTravelMinutes;
    offsets.push(cumulativeMinutes);
  }

  return offsets;
};

const projectRowCells = (
  hourlyOriginDepartures: ReadonlyMap<number, readonly number[]>,
  offsetMinutes: number,
  options: {
    readonly hasUnavailableTiming: boolean;
    readonly hasUnconfiguredBands: boolean;
  }
): readonly LineDepartureTimetableCell[] =>
  createHourRange().map((hour) => {
    if (options.hasUnavailableTiming) {
      return {
        hour,
        departureMinutes: [],
        state: 'unavailable',
        note: 'Stop timing unavailable'
      } satisfies LineDepartureTimetableCell;
    }

    const minuteAccumulator: number[] = [];
    for (const [originHour, originMinutes] of hourlyOriginDepartures.entries()) {
      for (const originMinute of originMinutes) {
        const originMinuteOfDay = originHour * MINUTES_PER_HOUR + originMinute;
        const shiftedMinute = normalizeMinute(originMinuteOfDay + offsetMinutes);
        if (toHour(shiftedMinute) === hour) {
          minuteAccumulator.push(toMinuteWithinHour(shiftedMinute));
        }
      }
    }

    const sortedMinutes = minuteAccumulator.sort((left, right) => left - right);
    if (sortedMinutes.length > 0) {
      return {
        hour,
        departureMinutes: sortedMinutes,
        state: 'departures',
        note: null
      } satisfies LineDepartureTimetableCell;
    }

    if (options.hasUnconfiguredBands) {
      return {
        hour,
        departureMinutes: [],
        state: 'unconfigured',
        note: 'Service configuration needed'
      } satisfies LineDepartureTimetableCell;
    }

    return {
      hour,
      departureMinutes: [],
      state: 'no-service',
      note: null
    } satisfies LineDepartureTimetableCell;
  });

const resolveActiveBandSummary = (
  line: Line,
  activeTimeBandId: TimeBandId
): ActiveServiceBandSummary => {
  const activeDefinition = TIME_BAND_DEFINITIONS.find((definition) => definition.id === activeTimeBandId);
  if (!activeDefinition) {
    throw new Error(`Missing canonical time-band definition for ${activeTimeBandId}.`);
  }

  const activeBandPlan = line.frequencyByTimeBand[activeTimeBandId] as LineServiceBandPlan | undefined;
  const activeServiceLabel = !activeBandPlan
    ? 'configuration needed'
    : activeBandPlan.kind === 'frequency'
      ? `every ${activeBandPlan.headwayMinutes} min`
      : 'no service';

  return {
    activeTimeBandId,
    activeTimeBandLabel: TIME_BAND_DISPLAY_LABELS[activeTimeBandId],
    activeWindowLabel: formatTimeBandWindow(activeDefinition),
    activeServiceLabel
  };
};

const resolveRouteTimingStatus = (segments: readonly LineRouteSegment[]): RouteTimingStatus => {
  if (segments.some((segment) => segment.status === 'routing-failed')) {
    return 'routing-failed';
  }
  if (segments.some((segment) => segment.status === 'not-routed')) {
    return 'not-routed';
  }
  if (segments.some((segment) => segment.status === 'fallback-routed')) {
    return 'fallback-routed';
  }
  return 'routed';
};

const projectRouteBaselineSummary = (
  metrics: RouteBaselineAggregateMetrics | null,
  routeSegments: readonly LineRouteSegment[]
): TimetableRouteBaselineSummary | null => {
  if (!metrics) {
    return null;
  }

  const timingStatus = resolveRouteTimingStatus(routeSegments);

  return {
    segmentCount: metrics.segmentCount,
    totalLineMinutes: metrics.totalLineMinutes,
    routingStatusLabel: ROUTE_TIMING_STATUS_LABELS[timingStatus],
    fallbackWarning: metrics.hasFallbackSegments
      ? 'Fallback routing is active for at least one segment. Downstream times are baseline estimates.'
      : null
  };
};

/**
 * Projects a full 24-hour stop-by-hour departures matrix for one selected line.
 */
export const projectLineDepartureTimetable = (
  line: Line,
  placedStops: readonly Stop[],
  activeTimeBandId: TimeBandId,
  selectedLineRouteBaselineMetrics: RouteBaselineAggregateMetrics | null
): LineDepartureTimetableProjection => {
  const stopLabels = resolveStopLabels(line, placedStops);
  const stopOffsets = resolveStopOffsets(line);
  const originDepartureProjection = projectOriginDeparturesByHour(line.frequencyByTimeBand);
  const hasUnavailableDownstreamStopTiming = stopOffsets === null && line.stopIds.length > 1;

  const rows: LineDepartureTimetableRow[] = stopLabels.map((stopLabel, index) => {
    const isOrigin = index === 0;
    const offsetMinutes = stopOffsets?.[index] ?? 0;

    return {
      stopLabel,
      cells: projectRowCells(originDepartureProjection.byHour, offsetMinutes, {
        hasUnavailableTiming: hasUnavailableDownstreamStopTiming && !isOrigin,
        hasUnconfiguredBands: originDepartureProjection.hasUnconfiguredBands
      })
    };
  });

  const notices: LineDepartureTimetableNotice[] = [];
  if (originDepartureProjection.hasUnconfiguredBands) {
    notices.push({ message: 'At least one service band is unconfigured. Configure service to populate departures.' });
  }
  if (hasUnavailableDownstreamStopTiming) {
    notices.push({
      message:
        'Stop-level downstream departure times are unavailable because segment-level route timing is incomplete. Origin departures are shown.'
    });
  }

  return {
    lineLabel: line.label,
    activeServiceSummary: resolveActiveBandSummary(line, activeTimeBandId),
    rows,
    routeBaselineSummary: projectRouteBaselineSummary(selectedLineRouteBaselineMetrics, line.routeSegments),
    notices,
    hasUnavailableDownstreamStopTiming
  };
};
