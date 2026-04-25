import {
  LINE_SERVICE_READINESS_ISSUE_CODES,
  LINE_SERVICE_READINESS_ISSUE_SEVERITIES
} from '../constants/lineServiceReadiness';
import type { Line } from './line';
import type { LineRouteSegment } from './lineRoute';
import type { StopId } from './stop';
import type { TimeBandId } from './timeBand';

/**
 * Service-readiness classification for one completed in-memory line.
 */
export type LineServiceReadinessStatus = 'ready' | 'partially-ready' | 'blocked';

/**
 * Severity level assigned to one service-readiness issue.
 */
export type LineServiceReadinessIssueSeverity =
  (typeof LINE_SERVICE_READINESS_ISSUE_SEVERITIES)[keyof typeof LINE_SERVICE_READINESS_ISSUE_SEVERITIES];

/**
 * Stable machine-readable code describing one service-readiness issue category.
 */
export type LineServiceReadinessIssueCode =
  (typeof LINE_SERVICE_READINESS_ISSUE_CODES)[keyof typeof LINE_SERVICE_READINESS_ISSUE_CODES];

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
  /** Number of canonical time bands configured with usable service-plan values (`frequency` or `no-service`). */
  readonly configuredTimeBandCount: number;
  /** Number of canonical time bands expected by this evaluation. */
  readonly canonicalTimeBandCount: number;
  /** Number of warning issues produced by evaluation. */
  readonly warningIssueCount: number;
  /** Number of blocking error issues produced by evaluation. */
  readonly errorIssueCount: number;
  /** Whether at least one canonical time band has a configured usable service plan band. */
  readonly hasAtLeastOneConfiguredFrequency: boolean;
  /** Whether every canonical time band has a configured usable service plan band. */
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
