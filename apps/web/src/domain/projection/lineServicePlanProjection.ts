import { evaluateLineServiceReadiness } from '../readiness/lineServiceReadiness';
import type { Line } from '../types/line';
import type {
  LineServicePlanProjection,
  LineServiceProjectionNote,
  LineServiceProjectionResult,
  LineServiceProjectionStatus,
  LineServiceProjectionSummary
} from '../types/lineServicePlanProjection';
import type { Stop } from '../types/stop';
import type { TimeBandId } from '../types/timeBand';

const isPositiveFiniteNumber = (value: number | null | undefined): value is number =>
  typeof value === 'number' && Number.isFinite(value) && value > 0;

const toProjectionNotes = (
  readiness: LineServiceProjectionResult['readiness']
): readonly LineServiceProjectionNote[] | undefined => {
  if (readiness.issues.length === 0) {
    return undefined;
  }

  return readiness.issues.map((issue) => ({
    code: issue.code,
    severity: issue.severity,
    message: issue.message,
    ...(issue.lineId !== undefined ? { lineId: issue.lineId } : {})
  }));
};

const resolveProjectionStatus = (
  readinessStatus: LineServiceProjectionResult['readiness']['status'],
  currentBandHeadwayMinutes: number | null
): LineServiceProjectionStatus => {
  if (readinessStatus === 'blocked') {
    return 'blocked';
  }

  if (currentBandHeadwayMinutes === null) {
    return 'not-configured';
  }

  if (readinessStatus === 'partially-ready') {
    return 'degraded';
  }

  return 'configured';
};

/**
 * Projects one completed line into active-time-band service-plan metrics and status.
 *
 * Status resolution order is deterministic:
 * 1) `blocked` when readiness has blockers,
 * 2) `not-configured` when non-blocked but active-band frequency is unset/invalid,
 * 3) `degraded` when active-band frequency is valid but readiness is warning-only (`partially-ready`),
 * 4) otherwise `configured`.
 */
export const projectLineServicePlanForLine = (
  line: Line,
  placedStops: readonly Stop[],
  activeTimeBandId: TimeBandId
): LineServiceProjectionResult => {
  const readiness = evaluateLineServiceReadiness(line, placedStops);
  const rawHeadway = line.frequencyByTimeBand[activeTimeBandId];
  const currentBandHeadwayMinutes = isPositiveFiniteNumber(rawHeadway) ? rawHeadway : null;
  const theoreticalDeparturesPerHour =
    currentBandHeadwayMinutes === null ? null : 60 / currentBandHeadwayMinutes;

  const totalRouteTravelMinutes = line.routeSegments.reduce(
    (accumulator, segment) => accumulator + segment.totalTravelMinutes,
    0
  );
  const notes = toProjectionNotes(readiness);

  return {
    lineId: line.id,
    lineLabel: line.label,
    activeTimeBandId,
    currentBandHeadwayMinutes,
    theoreticalDeparturesPerHour,
    routeSegmentCount: line.routeSegments.length,
    totalRouteTravelMinutes,
    status: resolveProjectionStatus(readiness.status, currentBandHeadwayMinutes),
    readiness,
    ...(notes !== undefined ? { notes } : {})
  };
};

/**
 * Projects completed lines into deterministic per-line service-plan outputs plus network summary totals.
 */
export const projectLineServicePlan = (
  completedLines: readonly Line[],
  placedStops: readonly Stop[],
  activeTimeBandId: TimeBandId
): LineServicePlanProjection => {
  const lines = completedLines.map((line) => projectLineServicePlanForLine(line, placedStops, activeTimeBandId));

  const summary = lines.reduce<LineServiceProjectionSummary>(
    (accumulator, lineResult) => ({
      activeTimeBandId,
      totalLineCount: accumulator.totalLineCount + 1,
      blockedLineCount: accumulator.blockedLineCount + (lineResult.status === 'blocked' ? 1 : 0),
      notConfiguredLineCount: accumulator.notConfiguredLineCount + (lineResult.status === 'not-configured' ? 1 : 0),
      configuredLineCount: accumulator.configuredLineCount + (lineResult.status === 'configured' ? 1 : 0),
      degradedLineCount: accumulator.degradedLineCount + (lineResult.status === 'degraded' ? 1 : 0),
      totalRouteSegmentCount: accumulator.totalRouteSegmentCount + lineResult.routeSegmentCount,
      totalRouteTravelMinutes: accumulator.totalRouteTravelMinutes + lineResult.totalRouteTravelMinutes,
      totalTheoreticalDeparturesPerHour:
        accumulator.totalTheoreticalDeparturesPerHour + (lineResult.theoreticalDeparturesPerHour ?? 0)
    }),
    {
      activeTimeBandId,
      totalLineCount: 0,
      blockedLineCount: 0,
      notConfiguredLineCount: 0,
      configuredLineCount: 0,
      degradedLineCount: 0,
      totalRouteSegmentCount: 0,
      totalRouteTravelMinutes: 0,
      totalTheoreticalDeparturesPerHour: 0
    }
  );

  return {
    lines,
    summary
  };
};
