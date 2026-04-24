import { MINIMUM_STOPS_REQUIRED_TO_COMPLETE_LINE } from '../constants/lineBuilding';
import { MVP_TIME_BAND_IDS } from '../constants/timeBands';
import type { Line, LineFrequencyByTimeBand } from '../types/line';
import { ROUTE_STATUSES, type LineRouteSegment, type RouteStatus } from '../types/lineRoute';
import type { Stop, StopId } from '../types/stop';
import type { TimeBandId } from '../types/timeBand';

/**
 * Service-readiness classification for one completed in-memory line.
 */
export type LineServiceReadinessStatus = 'ready' | 'partially-ready' | 'blocked';

/**
 * Severity level assigned to one service-readiness issue.
 */
export type LineServiceReadinessIssueSeverity = 'warning' | 'error';

/**
 * Stable machine-readable code describing one service-readiness issue category.
 */
export type LineServiceReadinessIssueCode =
  | 'invalid-line-id'
  | 'invalid-line-label'
  | 'insufficient-ordered-stops'
  | 'invalid-ordered-stop-id'
  | 'duplicate-adjacent-stop-id'
  | 'missing-placed-stop-reference'
  | 'missing-route-segments'
  | 'route-segment-count-mismatch'
  | 'route-segment-adjacency-mismatch'
  | 'route-segment-line-id-mismatch'
  | 'route-segment-timing-unusable'
  | 'unknown-route-status'
  | 'missing-canonical-time-band'
  | 'invalid-frequency-value'
  | 'missing-configured-frequency'
  | 'missing-complete-time-band-configuration'
  | 'fallback-only-routing';

/**
 * One typed service-readiness issue produced while evaluating a line.
 */
export interface LineServiceReadinessIssue {
  /** Machine-readable issue code for deterministic branching. */
  readonly code: LineServiceReadinessIssueCode;
  /** Issue severity for blocked vs partial-readiness classification. */
  readonly severity: LineServiceReadinessIssueSeverity;
  /** Human-readable issue explanation for logs and inspector surfacing. */
  readonly message: string;
  /** Optional line identifier attached when an issue applies to one specific line. */
  readonly lineId?: Line['id'];
  /** Optional stop identifier attached when an issue targets one specific stop. */
  readonly stopId?: StopId;
  /** Optional route-segment identifier attached when an issue targets one segment. */
  readonly routeSegmentId?: LineRouteSegment['id'];
  /** Optional time-band identifier attached when an issue targets one service band. */
  readonly timeBandId?: TimeBandId;
}

/**
 * Deterministic readiness summary for one completed in-memory line.
 */
export interface LineServiceReadinessSummary {
  /** Number of ordered stops on the line candidate. */
  readonly orderedStopCount: number;
  /** Number of route segments provided on the line candidate. */
  readonly routeSegmentCount: number;
  /** Expected segment count derived from ordered-stop adjacency. */
  readonly expectedRouteSegmentCount: number;
  /** Number of canonical time bands configured with usable frequency values. */
  readonly configuredTimeBandCount: number;
  /** Number of canonical time bands expected by this evaluation. */
  readonly canonicalTimeBandCount: number;
  /** Number of warning issues produced by evaluation. */
  readonly warningIssueCount: number;
  /** Number of blocking error issues produced by evaluation. */
  readonly errorIssueCount: number;
  /** Whether at least one canonical time band has a configured usable frequency. */
  readonly hasAtLeastOneConfiguredFrequency: boolean;
  /** Whether every canonical time band has a configured usable frequency. */
  readonly hasAllCanonicalTimeBandsConfigured: boolean;
  /** Whether all known route segments are fallback-routed, if any segments exist. */
  readonly hasFallbackOnlyRouting: boolean;
  /** Whether any blocking issue was produced. */
  readonly isBlocked: boolean;
}

/**
 * Full line service-readiness result including status, summary counters, and typed issues.
 */
export interface LineServiceReadinessResult {
  /** Aggregate line readiness status derived from collected issue severities. */
  readonly status: LineServiceReadinessStatus;
  /** Structured counters and flags useful for inspector projections. */
  readonly summary: LineServiceReadinessSummary;
  /** Collected typed readiness issues for detailed diagnostics. */
  readonly issues: readonly LineServiceReadinessIssue[];
}

const KNOWN_ROUTE_STATUSES = new Set<string>(ROUTE_STATUSES);

const isNonEmptyString = (value: string): boolean => value.trim().length > 0;

const isPositiveFiniteNumber = (value: number): boolean => Number.isFinite(value) && value > 0;

const isNonNegativeFiniteNumber = (value: number): boolean => Number.isFinite(value) && value >= 0;

const isKnownRouteStatus = (status: RouteStatus): boolean => KNOWN_ROUTE_STATUSES.has(status);

const countConfiguredTimeBands = (
  frequencyByTimeBand: LineFrequencyByTimeBand,
  canonicalTimeBandIds: readonly TimeBandId[]
): number =>
  canonicalTimeBandIds.reduce((configuredCount, timeBandId) => {
    const value = frequencyByTimeBand[timeBandId];
    if (typeof value === 'number' && isPositiveFiniteNumber(value)) {
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
      code: 'invalid-line-id',
      severity: 'error',
      message: 'line.id must be a non-empty string.',
      lineId: line.id
    });
  }

  if (!isNonEmptyString(line.label)) {
    addIssue({
      code: 'invalid-line-label',
      severity: 'error',
      message: 'line.label must be a non-empty string.',
      lineId: line.id
    });
  }

  const orderedStopCount = line.stopIds.length;
  if (orderedStopCount < MINIMUM_STOPS_REQUIRED_TO_COMPLETE_LINE) {
    addIssue({
      code: 'insufficient-ordered-stops',
      severity: 'error',
      message: `line.stopIds must include at least ${MINIMUM_STOPS_REQUIRED_TO_COMPLETE_LINE} entries.`,
      lineId: line.id
    });
  }

  const placedStopIdSet = new Set<StopId>(placedStops.map((stop) => stop.id));
  for (const [index, stopId] of line.stopIds.entries()) {

    if (!isNonEmptyString(stopId)) {
      addIssue({
        code: 'invalid-ordered-stop-id',
        severity: 'error',
        message: `line.stopIds[${index}] must be a non-empty string.`,
        lineId: line.id,
        ...(stopId !== undefined ? { stopId } : {})
      });
      continue;
    }

    if (index > 0 && line.stopIds[index - 1] === stopId) {
      addIssue({
        code: 'duplicate-adjacent-stop-id',
        severity: 'error',
        message: `line.stopIds[${index - 1}] and line.stopIds[${index}] must not reference the same stop.`,
        lineId: line.id,
        stopId
      });
    }

    if (!placedStopIdSet.has(stopId)) {
      addIssue({
        code: 'missing-placed-stop-reference',
        severity: 'error',
        message: `line.stopIds[${index}] references stop "${stopId}" that is not present in placedStops.`,
        lineId: line.id,
        stopId
      });
    }
  }

  const expectedRouteSegmentCount = Math.max(orderedStopCount - 1, 0);
  if (line.routeSegments.length === 0) {
    addIssue({
      code: 'missing-route-segments',
      severity: 'error',
      message: 'line.routeSegments must contain one segment for each ordered stop pair.',
      lineId: line.id
    });
  }

  if (line.routeSegments.length !== expectedRouteSegmentCount) {
    addIssue({
      code: 'route-segment-count-mismatch',
      severity: 'error',
      message: 'line.routeSegments length must equal line.stopIds.length - 1.',
      lineId: line.id
    });
  }

  for (const [segmentIndex, segment] of line.routeSegments.entries()) {
    const expectedFromStopId = line.stopIds[segmentIndex];
    const expectedToStopId = line.stopIds[segmentIndex + 1];

    if (segment.lineId !== line.id) {
      addIssue({
        code: 'route-segment-line-id-mismatch',
        severity: 'error',
        message: `line.routeSegments[${segmentIndex}] must reference the same line id as line.id.`,
        lineId: line.id,
        routeSegmentId: segment.id
      });
    }

    if (expectedFromStopId !== undefined && expectedToStopId !== undefined) {
      if (segment.fromStopId !== expectedFromStopId || segment.toStopId !== expectedToStopId) {
        addIssue({
          code: 'route-segment-adjacency-mismatch',
          severity: 'error',
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
        code: 'route-segment-timing-unusable',
        severity: 'error',
        message: `line.routeSegments[${segmentIndex}] has unusable timing values.`,
        lineId: line.id,
        routeSegmentId: segment.id
      });
    }

    if (!isKnownRouteStatus(segment.status)) {
      addIssue({
        code: 'unknown-route-status',
        severity: 'error',
        message: `line.routeSegments[${segmentIndex}] has unknown status "${segment.status}".`,
        lineId: line.id,
        routeSegmentId: segment.id
      });
    }
  }

  const canonicalTimeBandIdSet = new Set<TimeBandId>(canonicalTimeBandIds);
  const hasAtLeastOneConfiguredFrequency = countConfiguredTimeBands(line.frequencyByTimeBand, canonicalTimeBandIds) > 0;

  for (const timeBandId of canonicalTimeBandIds) {
    if (!(timeBandId in line.frequencyByTimeBand)) {
      addIssue({
        code: 'missing-canonical-time-band',
        severity: 'error',
        message: `line.frequencyByTimeBand is missing canonical time band "${timeBandId}".`,
        lineId: line.id,
        timeBandId
      });
    }

    const frequency = line.frequencyByTimeBand[timeBandId];
    if (frequency !== undefined && frequency !== null && !isPositiveFiniteNumber(frequency)) {
      addIssue({
        code: 'invalid-frequency-value',
        severity: 'error',
        message: 'line.frequencyByTimeBand values must be unset or positive finite numbers.',
        lineId: line.id,
        timeBandId
      });
    }
  }

  for (const [timeBandId, frequency] of Object.entries(line.frequencyByTimeBand)) {
    if (!canonicalTimeBandIdSet.has(timeBandId as TimeBandId)) {
      addIssue({
        code: 'missing-canonical-time-band',
        severity: 'error',
        message: `line.frequencyByTimeBand contains non-canonical time band "${timeBandId}".`,
        lineId: line.id
      });
      continue;
    }

    if (frequency !== undefined && frequency !== null && !isPositiveFiniteNumber(frequency)) {
      addIssue({
        code: 'invalid-frequency-value',
        severity: 'error',
        message: 'line.frequencyByTimeBand values must be unset or positive finite numbers.',
        lineId: line.id,
        timeBandId: timeBandId as TimeBandId
      });
    }
  }

  const configuredTimeBandCount = countConfiguredTimeBands(line.frequencyByTimeBand, canonicalTimeBandIds);
  if (!hasAtLeastOneConfiguredFrequency) {
    addIssue({
      code: 'missing-configured-frequency',
      severity: 'error',
      message: 'At least one canonical time band must have a configured positive frequency value.',
      lineId: line.id
    });
  }

  const hasAllCanonicalTimeBandsConfigured = configuredTimeBandCount === canonicalTimeBandIds.length;
  if (!hasAllCanonicalTimeBandsConfigured) {
    addIssue({
      code: 'missing-complete-time-band-configuration',
      severity: 'warning',
      message: 'Not all canonical time bands have configured frequencies.',
      lineId: line.id
    });
  }

  const hasFallbackOnlyRouting =
    line.routeSegments.length > 0 && line.routeSegments.every((segment) => segment.status === 'fallback-routed');

  if (hasFallbackOnlyRouting) {
    addIssue({
      code: 'fallback-only-routing',
      severity: 'warning',
      message: 'All route segments are fallback-routed; line routing fidelity is limited.',
      lineId: line.id
    });
  }

  const errorIssueCount = issues.filter((issue) => issue.severity === 'error').length;
  const warningIssueCount = issues.filter((issue) => issue.severity === 'warning').length;
  const summary: LineServiceReadinessSummary = {
    orderedStopCount,
    routeSegmentCount: line.routeSegments.length,
    expectedRouteSegmentCount,
    configuredTimeBandCount,
    canonicalTimeBandCount: canonicalTimeBandIds.length,
    warningIssueCount,
    errorIssueCount,
    hasAtLeastOneConfiguredFrequency,
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
