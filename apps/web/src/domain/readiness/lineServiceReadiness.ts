import {
  LINE_SERVICE_READINESS_ISSUE_CODES,
  LINE_SERVICE_READINESS_ISSUE_SEVERITIES
} from '../constants/lineServiceReadiness';
import { MINIMUM_STOPS_REQUIRED_TO_COMPLETE_LINE } from '../constants/lineBuilding';
import { MVP_TIME_BAND_IDS } from '../constants/timeBands';
import type { Line, LineServiceBandPlan, LineServiceByTimeBand } from '../types/line';
import { ROUTE_STATUSES, type RouteStatus } from '../types/lineRoute';
import type {
  LineServiceReadinessIssue,
  LineServiceReadinessResult,
  LineServiceReadinessStatus,
  LineServiceReadinessSummary
} from '../types/lineServiceReadiness';
import type { Stop, StopId } from '../types/stop';
import type { TimeBandId } from '../types/timeBand';

const KNOWN_ROUTE_STATUSES = new Set<string>(ROUTE_STATUSES);

const isNonEmptyString = (value: string): boolean => value.trim().length > 0;

const isPositiveFiniteNumber = (value: number): boolean => Number.isFinite(value) && value > 0;

const isNonNegativeFiniteNumber = (value: number): boolean => Number.isFinite(value) && value >= 0;

const isKnownRouteStatus = (status: RouteStatus): boolean => KNOWN_ROUTE_STATUSES.has(status);

const countConfiguredTimeBands = (
  frequencyByTimeBand: LineServiceByTimeBand,
  canonicalTimeBandIds: readonly TimeBandId[]
): number =>
  canonicalTimeBandIds.reduce((configuredCount, timeBandId) => {
    const value = frequencyByTimeBand[timeBandId];
    if (value.kind === 'no-service') {
      return configuredCount + 1;
    }

    if (value.kind === 'frequency' && isPositiveFiniteNumber(value.headwayMinutes)) {
      return configuredCount + 1;
    }

    return configuredCount;
  }, 0);

/**
 * Evaluates one in-memory completed line against placed stops and canonical time bands.
 */
export const evaluateLineServiceReadiness = (
  line: Line,
  placedStops: readonly Stop[],
  canonicalTimeBandIds: readonly TimeBandId[] = MVP_TIME_BAND_IDS
): LineServiceReadinessResult => {
  const issues: LineServiceReadinessIssue[] = [];
  const addIssue = (issue: LineServiceReadinessIssue): void => {
    issues.push(issue);
  };

  if (!isNonEmptyString(line.id)) {
    addIssue({
      code: LINE_SERVICE_READINESS_ISSUE_CODES.INVALID_LINE_ID,
      severity: LINE_SERVICE_READINESS_ISSUE_SEVERITIES.ERROR,
      message: 'line.id must be a non-empty string.',
      lineId: line.id
    });
  }

  if (!isNonEmptyString(line.label)) {
    addIssue({
      code: LINE_SERVICE_READINESS_ISSUE_CODES.INVALID_LINE_LABEL,
      severity: LINE_SERVICE_READINESS_ISSUE_SEVERITIES.ERROR,
      message: 'line.label must be a non-empty string.',
      lineId: line.id
    });
  }

  const orderedStopCount = line.stopIds.length;
  if (orderedStopCount < MINIMUM_STOPS_REQUIRED_TO_COMPLETE_LINE) {
    addIssue({
      code: LINE_SERVICE_READINESS_ISSUE_CODES.INSUFFICIENT_ORDERED_STOPS,
      severity: LINE_SERVICE_READINESS_ISSUE_SEVERITIES.ERROR,
      message: `line.stopIds must include at least ${MINIMUM_STOPS_REQUIRED_TO_COMPLETE_LINE} entries.`,
      lineId: line.id
    });
  }

  const placedStopIdSet = new Set<StopId>(placedStops.map((stop) => stop.id));
  for (const [index, stopId] of line.stopIds.entries()) {

    if (!isNonEmptyString(stopId)) {
      addIssue({
        code: LINE_SERVICE_READINESS_ISSUE_CODES.INVALID_ORDERED_STOP_ID,
        severity: LINE_SERVICE_READINESS_ISSUE_SEVERITIES.ERROR,
        message: `line.stopIds[${index}] must be a non-empty string.`,
        lineId: line.id,
        ...(stopId !== undefined ? { stopId } : {})
      });
      continue;
    }

    if (index > 0 && line.stopIds[index - 1] === stopId) {
      addIssue({
        code: LINE_SERVICE_READINESS_ISSUE_CODES.DUPLICATE_ADJACENT_STOP_ID,
        severity: LINE_SERVICE_READINESS_ISSUE_SEVERITIES.ERROR,
        message: `line.stopIds[${index - 1}] and line.stopIds[${index}] must not reference the same stop.`,
        lineId: line.id,
        stopId
      });
    }

    if (!placedStopIdSet.has(stopId)) {
      addIssue({
        code: LINE_SERVICE_READINESS_ISSUE_CODES.MISSING_PLACED_STOP_REFERENCE,
        severity: LINE_SERVICE_READINESS_ISSUE_SEVERITIES.ERROR,
        message: `line.stopIds[${index}] references stop "${stopId}" that is not present in placedStops.`,
        lineId: line.id,
        stopId
      });
    }
  }

  const expectedRouteSegmentCount = Math.max(orderedStopCount - 1, 0);
  if (line.routeSegments.length === 0) {
    addIssue({
      code: LINE_SERVICE_READINESS_ISSUE_CODES.MISSING_ROUTE_SEGMENTS,
      severity: LINE_SERVICE_READINESS_ISSUE_SEVERITIES.ERROR,
      message: 'line.routeSegments must contain one segment for each ordered stop pair.',
      lineId: line.id
    });
  }

  if (line.routeSegments.length !== expectedRouteSegmentCount) {
    addIssue({
      code: LINE_SERVICE_READINESS_ISSUE_CODES.ROUTE_SEGMENT_COUNT_MISMATCH,
      severity: LINE_SERVICE_READINESS_ISSUE_SEVERITIES.ERROR,
      message: 'line.routeSegments length must equal line.stopIds.length - 1.',
      lineId: line.id
    });
  }

  for (const [segmentIndex, segment] of line.routeSegments.entries()) {
    const expectedFromStopId = line.stopIds[segmentIndex];
    const expectedToStopId = line.stopIds[segmentIndex + 1];

    if (segment.lineId !== line.id) {
      addIssue({
        code: LINE_SERVICE_READINESS_ISSUE_CODES.ROUTE_SEGMENT_LINE_ID_MISMATCH,
        severity: LINE_SERVICE_READINESS_ISSUE_SEVERITIES.ERROR,
        message: `line.routeSegments[${segmentIndex}] must reference the same line id as line.id.`,
        lineId: line.id,
        routeSegmentId: segment.id
      });
    }

    if (expectedFromStopId !== undefined && expectedToStopId !== undefined) {
      if (segment.fromStopId !== expectedFromStopId || segment.toStopId !== expectedToStopId) {
        addIssue({
          code: LINE_SERVICE_READINESS_ISSUE_CODES.ROUTE_SEGMENT_ADJACENCY_MISMATCH,
          severity: LINE_SERVICE_READINESS_ISSUE_SEVERITIES.ERROR,
          message: `line.routeSegments[${segmentIndex}] must match ordered stop pair ${expectedFromStopId} -> ${expectedToStopId}.`,
          lineId: line.id,
          routeSegmentId: segment.id
        });
      }
    }

    const hasUsableTiming =
      isNonNegativeFiniteNumber(segment.inMotionTravelMinutes) &&
      isNonNegativeFiniteNumber(segment.dwellMinutes) &&
      isNonNegativeFiniteNumber(segment.totalTravelMinutes) &&
      segment.totalTravelMinutes >= segment.inMotionTravelMinutes + segment.dwellMinutes;

    if (!hasUsableTiming) {
      addIssue({
        code: LINE_SERVICE_READINESS_ISSUE_CODES.ROUTE_SEGMENT_TIMING_UNUSABLE,
        severity: LINE_SERVICE_READINESS_ISSUE_SEVERITIES.ERROR,
        message: `line.routeSegments[${segmentIndex}] has unusable timing values.`,
        lineId: line.id,
        routeSegmentId: segment.id
      });
    }

    if (!isKnownRouteStatus(segment.status)) {
      addIssue({
        code: LINE_SERVICE_READINESS_ISSUE_CODES.UNKNOWN_ROUTE_STATUS,
        severity: LINE_SERVICE_READINESS_ISSUE_SEVERITIES.ERROR,
        message: `line.routeSegments[${segmentIndex}] has unknown status "${segment.status}".`,
        lineId: line.id,
        routeSegmentId: segment.id
      });
    }
  }

  const canonicalTimeBandIdSet = new Set<TimeBandId>(canonicalTimeBandIds);
  const hasAtLeastOneConfiguredServiceBand = countConfiguredTimeBands(line.frequencyByTimeBand, canonicalTimeBandIds) > 0;

  for (const timeBandId of canonicalTimeBandIds) {
    if (!(timeBandId in line.frequencyByTimeBand)) {
      addIssue({
        code: LINE_SERVICE_READINESS_ISSUE_CODES.MISSING_CANONICAL_TIME_BAND,
        severity: LINE_SERVICE_READINESS_ISSUE_SEVERITIES.ERROR,
        message: `line.frequencyByTimeBand is missing canonical time band "${timeBandId}".`,
        lineId: line.id,
        timeBandId
      });
    }

    const bandPlan = line.frequencyByTimeBand[timeBandId];
    const isValidBandPlan =
      bandPlan.kind === 'no-service' ||
      (bandPlan.kind === 'frequency' && isPositiveFiniteNumber(bandPlan.headwayMinutes));

    if (!isValidBandPlan) {
      addIssue({
        code: LINE_SERVICE_READINESS_ISSUE_CODES.INVALID_FREQUENCY_VALUE,
        severity: LINE_SERVICE_READINESS_ISSUE_SEVERITIES.ERROR,
        message: 'line.frequencyByTimeBand values must be no-service or positive finite frequency plans.',
        lineId: line.id,
        timeBandId
      });
    }
  }

  for (const [timeBandId, bandPlan] of Object.entries(line.frequencyByTimeBand) as [TimeBandId, LineServiceBandPlan][]) {
    if (!canonicalTimeBandIdSet.has(timeBandId as TimeBandId)) {
      addIssue({
        code: LINE_SERVICE_READINESS_ISSUE_CODES.MISSING_CANONICAL_TIME_BAND,
        severity: LINE_SERVICE_READINESS_ISSUE_SEVERITIES.ERROR,
        message: `line.frequencyByTimeBand contains non-canonical time band "${timeBandId}".`,
        lineId: line.id
      });
      continue;
    }

    const isValidBandPlan =
      bandPlan.kind === 'no-service' ||
      (bandPlan.kind === 'frequency' && isPositiveFiniteNumber(bandPlan.headwayMinutes));
    if (!isValidBandPlan) {
      addIssue({
        code: LINE_SERVICE_READINESS_ISSUE_CODES.INVALID_FREQUENCY_VALUE,
        severity: LINE_SERVICE_READINESS_ISSUE_SEVERITIES.ERROR,
        message: 'line.frequencyByTimeBand values must be no-service or positive finite frequency plans.',
        lineId: line.id,
        timeBandId: timeBandId as TimeBandId
      });
    }
  }

  const configuredTimeBandCount = countConfiguredTimeBands(line.frequencyByTimeBand, canonicalTimeBandIds);
  if (!hasAtLeastOneConfiguredServiceBand) {
    addIssue({
      code: LINE_SERVICE_READINESS_ISSUE_CODES.MISSING_CONFIGURED_FREQUENCY,
      severity: LINE_SERVICE_READINESS_ISSUE_SEVERITIES.ERROR,
      message: 'At least one canonical time band must have a configured service plan band (frequency or no-service).',
      lineId: line.id
    });
  }

  const hasAllCanonicalTimeBandsConfigured = configuredTimeBandCount === canonicalTimeBandIds.length;
  if (!hasAllCanonicalTimeBandsConfigured) {
    addIssue({
      code: LINE_SERVICE_READINESS_ISSUE_CODES.MISSING_COMPLETE_TIME_BAND_CONFIGURATION,
      severity: LINE_SERVICE_READINESS_ISSUE_SEVERITIES.WARNING,
      message: 'Not all canonical time bands have configured service plan bands.',
      lineId: line.id
    });
  }

  const hasFallbackOnlyRouting =
    line.routeSegments.length > 0 && line.routeSegments.every((segment) => segment.status === 'fallback-routed');

  if (hasFallbackOnlyRouting) {
    addIssue({
      code: LINE_SERVICE_READINESS_ISSUE_CODES.FALLBACK_ONLY_ROUTING,
      severity: LINE_SERVICE_READINESS_ISSUE_SEVERITIES.WARNING,
      message: 'All route segments are fallback-routed; line routing fidelity is limited.',
      lineId: line.id
    });
  }

  const errorIssueCount = issues.filter((issue) => issue.severity === LINE_SERVICE_READINESS_ISSUE_SEVERITIES.ERROR).length;
  const warningIssueCount = issues.filter((issue) => issue.severity === LINE_SERVICE_READINESS_ISSUE_SEVERITIES.WARNING).length;
  const summary: LineServiceReadinessSummary = {
    orderedStopCount,
    routeSegmentCount: line.routeSegments.length,
    expectedRouteSegmentCount,
    configuredTimeBandCount,
    canonicalTimeBandCount: canonicalTimeBandIds.length,
    warningIssueCount,
    errorIssueCount,
    hasAtLeastOneConfiguredFrequency: hasAtLeastOneConfiguredServiceBand,
    hasAllCanonicalTimeBandsConfigured,
    hasFallbackOnlyRouting,
    isBlocked: errorIssueCount > 0
  };

  const status: LineServiceReadinessStatus =
    errorIssueCount > 0 ? 'blocked' : warningIssueCount > 0 ? 'partially-ready' : 'ready';

  return {
    status,
    summary,
    issues
  };
};
