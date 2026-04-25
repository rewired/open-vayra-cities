import {
  TIME_BAND_DEFINITIONS,
  TIME_BAND_DISPLAY_LABELS,
  formatMinuteOfDayToClock,
  resolveTimeBandIdForMinuteOfDay
} from '../constants/timeBands';
import {
  projectLineServicePlan,
  projectLineServicePlanForLine
} from './lineServicePlanProjection';
import type { Line } from '../types/line';
import type {
  DepartureMinute,
  LineDepartureScheduleNetworkProjection,
  LineDepartureScheduleProjection,
  LineDepartureScheduleUnavailableReason,
  LineDepartureScheduleProjectionStatus,
  LineDepartureScheduleSummary,
  LineSelectedDepartureInspectorProjection,
  MinutesUntilDeparture
} from '../types/lineDepartureScheduleProjection';
import type { LineServiceProjectionResult } from '../types/lineServicePlanProjection';
import { SIMULATION_MINUTES_PER_DAY } from '../constants/simulationClock';
import type { SimulationMinuteOfDay } from '../types/simulationClock';
import type { Stop } from '../types/stop';
import { createMinuteOfDay, type TimeBandId } from '../types/timeBand';

const DEPARTURE_STATUS_LABELS: Readonly<Record<LineDepartureScheduleProjectionStatus, string>> = {
  unavailable: 'Unavailable',
  available: 'Available',
  degraded: 'Available with warnings'
};

/**
 * Resolves the canonical active minute range for the current active time band.
 *
 * The resolver uses both the active time-band id and current minute, ensuring deterministic
 * handling for split bands such as `night` where multiple canonical ranges may exist.
 */
export const resolveActiveTimeBandMinuteRange = (
  activeTimeBandId: TimeBandId,
  currentMinuteOfDay: SimulationMinuteOfDay
): { readonly startMinute: number; readonly endMinuteExclusive: number } => {
  const currentMinute = createMinuteOfDay(currentMinuteOfDay);
  const resolvedActiveTimeBandId = resolveTimeBandIdForMinuteOfDay(currentMinute, TIME_BAND_DEFINITIONS);

  if (resolvedActiveTimeBandId !== activeTimeBandId) {
    throw new Error(
      `Active time-band mismatch. Minute ${currentMinuteOfDay} resolves to "${resolvedActiveTimeBandId}", not "${activeTimeBandId}".`
    );
  }

  const definition = TIME_BAND_DEFINITIONS.find((entry) => entry.id === activeTimeBandId);

  if (!definition) {
    throw new Error(`No canonical time-band definition found for "${activeTimeBandId}".`);
  }

  const startMinute = definition.startMinuteOfDay;
  const endMinute = definition.endMinuteOfDay;

  if (startMinute < endMinute) {
    return {
      startMinute,
      endMinuteExclusive: endMinute
    };
  }

  if (currentMinute >= startMinute) {
    return {
      startMinute,
      endMinuteExclusive: SIMULATION_MINUTES_PER_DAY
    };
  }

  return {
    startMinute: 0,
    endMinuteExclusive: endMinute
  };
};

const toDepartureMinute = (rawMinute: number): DepartureMinute => rawMinute as DepartureMinute;

const toMinutesUntilDeparture = (rawMinutes: number): MinutesUntilDeparture =>
  rawMinutes as MinutesUntilDeparture;

const isServiceProjectionDepartureReady = (
  lineServiceProjection: LineServiceProjectionResult
): boolean =>
  (lineServiceProjection.status === 'configured' || lineServiceProjection.status === 'degraded') &&
  lineServiceProjection.activeBandState === 'frequency';

const deriveUnavailableReason = (
  lineServiceProjection: LineServiceProjectionResult
): LineDepartureScheduleUnavailableReason | null => {
  if (lineServiceProjection.status === 'blocked') {
    return 'blocked-service';
  }

  if (lineServiceProjection.activeBandState === 'no-service') {
    return 'active-band-no-service';
  }

  if (lineServiceProjection.currentBandHeadwayMinutes === null) {
    return 'missing-active-frequency';
  }

  return null;
};

const deriveDepartureProjectionStatus = (
  lineServiceProjection: LineServiceProjectionResult,
  canProjectDepartures: boolean
): LineDepartureScheduleProjectionStatus => {
  if (!canProjectDepartures) {
    return 'unavailable';
  }

  if (lineServiceProjection.status === 'degraded') {
    return 'degraded';
  }

  if (lineServiceProjection.status === 'configured') {
    return 'available';
  }

  return 'unavailable';
};

const createDepartureMinutes = (
  startMinute: number,
  endMinuteExclusive: number,
  headwayMinutes: number
): readonly DepartureMinute[] => {
  const departures: DepartureMinute[] = [];

  for (let departureMinute = startMinute; departureMinute < endMinuteExclusive; departureMinute += headwayMinutes) {
    departures.push(toDepartureMinute(departureMinute));
  }

  return departures;
};

const toClockLabel = (minuteOfDay: number): string => formatMinuteOfDayToClock(createMinuteOfDay(minuteOfDay));

/**
 * Projects deterministic departure-raster values for one line using existing service projection output.
 */
export const projectLineDepartureScheduleForServiceProjection = (
  lineServiceProjection: LineServiceProjectionResult,
  currentMinuteOfDay: SimulationMinuteOfDay
): LineDepartureScheduleProjection => {
  const { startMinute, endMinuteExclusive } = resolveActiveTimeBandMinuteRange(
    lineServiceProjection.activeTimeBandId,
    currentMinuteOfDay
  );
  const canProjectDepartures = isServiceProjectionDepartureReady(lineServiceProjection);
  const unavailableReason = canProjectDepartures ? null : deriveUnavailableReason(lineServiceProjection);
  const headwayMinutes =
    canProjectDepartures && lineServiceProjection.currentBandHeadwayMinutes !== null
      ? lineServiceProjection.currentBandHeadwayMinutes
      : null;
  const departureMinutes =
    headwayMinutes === null
      ? []
      : createDepartureMinutes(startMinute, endMinuteExclusive, headwayMinutes);
  const previousDepartureMinute =
    departureMinutes.filter((minute) => minute < currentMinuteOfDay).at(-1) ?? null;
  const nextDepartureMinute = departureMinutes.find((minute) => minute >= currentMinuteOfDay) ?? null;
  const minutesUntilNextDeparture =
    nextDepartureMinute === null ? null : toMinutesUntilDeparture(nextDepartureMinute - currentMinuteOfDay);

  return {
    lineId: lineServiceProjection.lineId,
    lineLabel: lineServiceProjection.lineLabel,
    activeTimeBandId: lineServiceProjection.activeTimeBandId,
    status: deriveDepartureProjectionStatus(lineServiceProjection, canProjectDepartures),
    unavailableReason,
    currentBandHeadwayMinutes: headwayMinutes,
    timeBandStartMinute: startMinute,
    timeBandEndMinute: endMinuteExclusive,
    departureMinutes,
    departureCount: departureMinutes.length,
    previousDepartureMinute,
    nextDepartureMinute,
    minutesUntilNextDeparture,
    totalRouteTravelMinutes: lineServiceProjection.totalRouteTravelMinutes,
    serviceProjectionStatus: lineServiceProjection.status,
    ...(lineServiceProjection.notes ? { notes: lineServiceProjection.notes } : {})
  };
};

/**
 * Projects one completed line into deterministic departure raster values for the active time band.
 */
export const projectLineDepartureScheduleForLine = (
  line: Line,
  placedStops: readonly Stop[],
  activeTimeBandId: TimeBandId,
  currentMinuteOfDay: SimulationMinuteOfDay
): LineDepartureScheduleProjection =>
  projectLineDepartureScheduleForServiceProjection(
    projectLineServicePlanForLine(line, placedStops, activeTimeBandId),
    currentMinuteOfDay
  );

/**
 * Projects all completed lines into deterministic departure schedule outputs and network summary totals.
 */
export const projectLineDepartureScheduleNetwork = (
  completedLines: readonly Line[],
  placedStops: readonly Stop[],
  activeTimeBandId: TimeBandId,
  currentMinuteOfDay: SimulationMinuteOfDay
): LineDepartureScheduleNetworkProjection => {
  const servicePlanProjection = projectLineServicePlan(completedLines, placedStops, activeTimeBandId);
  const lines = servicePlanProjection.lines.map((lineServiceProjection) =>
    projectLineDepartureScheduleForServiceProjection(lineServiceProjection, currentMinuteOfDay)
  );

  const summary = lines.reduce<LineDepartureScheduleSummary>(
    (accumulator, lineProjection) => ({
      totalCompletedLineCount: accumulator.totalCompletedLineCount + 1,
      activeTimeBandId,
      availableLineCount: accumulator.availableLineCount + (lineProjection.status === 'available' ? 1 : 0),
      degradedLineCount: accumulator.degradedLineCount + (lineProjection.status === 'degraded' ? 1 : 0),
      unavailableLineCount: accumulator.unavailableLineCount + (lineProjection.status === 'unavailable' ? 1 : 0),
      totalTheoreticalDepartureCount:
        accumulator.totalTheoreticalDepartureCount + lineProjection.departureCount
    }),
    {
      totalCompletedLineCount: 0,
      activeTimeBandId,
      availableLineCount: 0,
      degradedLineCount: 0,
      unavailableLineCount: 0,
      totalTheoreticalDepartureCount: 0
    }
  );

  return {
    lines,
    summary
  };
};

/**
 * Projects compact selected-line departure fields for inspector rendering.
 */
export const projectLineSelectedDepartureInspector = (
  lineProjection: LineDepartureScheduleProjection,
  maxUpcomingDeparturesVisible = 5,
  maxNotesVisible = 3
): LineSelectedDepartureInspectorProjection => {
  const boundedMaxUpcomingDepartures = Number.isFinite(maxUpcomingDeparturesVisible)
    ? Math.max(0, Math.floor(maxUpcomingDeparturesVisible))
    : 0;
  const boundedMaxNotesVisible = Number.isFinite(maxNotesVisible)
    ? Math.max(0, Math.floor(maxNotesVisible))
    : 0;
  const upcomingDepartureLabels = lineProjection.departureMinutes
    .filter((minute) => lineProjection.nextDepartureMinute !== null && minute >= lineProjection.nextDepartureMinute)
    .slice(0, boundedMaxUpcomingDepartures)
    .map((minute) => toClockLabel(minute));

  return {
    activeTimeBandId: lineProjection.activeTimeBandId,
    activeTimeBandLabel: TIME_BAND_DISPLAY_LABELS[lineProjection.activeTimeBandId],
    status: lineProjection.status,
    statusLabel: DEPARTURE_STATUS_LABELS[lineProjection.status],
    currentBandHeadwayMinutes: lineProjection.currentBandHeadwayMinutes,
    headwayLabel:
      lineProjection.currentBandHeadwayMinutes === null
        ? 'No active-band headway available.'
        : `${lineProjection.currentBandHeadwayMinutes} min`,
    previousDepartureLabel:
      lineProjection.previousDepartureMinute === null ? null : toClockLabel(lineProjection.previousDepartureMinute),
    nextDepartureLabel:
      lineProjection.nextDepartureMinute === null ? null : toClockLabel(lineProjection.nextDepartureMinute),
    minutesUntilNextDepartureLabel:
      lineProjection.minutesUntilNextDeparture === null
        ? null
        : `${lineProjection.minutesUntilNextDeparture} min`,
    departureCount: lineProjection.departureCount,
    upcomingDepartureLabels,
    totalRouteTravelMinutes: lineProjection.totalRouteTravelMinutes,
    totalRouteTravelMinutesLabel: `${lineProjection.totalRouteTravelMinutes.toFixed(2)} min`,
    noteMessages: (lineProjection.notes ?? []).slice(0, boundedMaxNotesVisible).map((note) => note.message)
  };
};
