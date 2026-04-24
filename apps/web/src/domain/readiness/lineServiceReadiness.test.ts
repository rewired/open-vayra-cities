import { describe, expect, it } from 'vitest';

import { createLineFrequencyMinutes, createLineId, createUnsetLineFrequencyByTimeBand, type Line } from '../types/line';
import { createLineSegmentId, createRouteDistanceMeters, createRouteTravelMinutes, type RouteStatus } from '../types/lineRoute';
import { createStopId, type Stop } from '../types/stop';
import { LINE_SERVICE_READINESS_ISSUE_CODES } from '../constants/lineServiceReadiness';
import { evaluateLineServiceReadiness } from './lineServiceReadiness';

const lineId = createLineId('line-1');
const stopA = createStopId('stop-a');
const stopB = createStopId('stop-b');
const stopC = createStopId('stop-c');

const placedStops: readonly Stop[] = [
  { id: stopA, position: { lng: 9.99, lat: 53.55 }, label: 'A' },
  { id: stopB, position: { lng: 10.0, lat: 53.56 }, label: 'B' },
  { id: stopC, position: { lng: 10.01, lat: 53.57 }, label: 'C' }
];

const createSegment = (
  segmentNumber: number,
  fromStopId: Stop['id'],
  toStopId: Stop['id'],
  status: RouteStatus = 'routed'
) => ({
  id: createLineSegmentId(`segment-${segmentNumber}`),
  lineId,
  fromStopId,
  toStopId,
  orderedGeometry: [
    [9.99 + segmentNumber * 0.01, 53.55 + segmentNumber * 0.01],
    [10.0 + segmentNumber * 0.01, 53.56 + segmentNumber * 0.01]
  ] as const,
  distanceMeters: createRouteDistanceMeters(500),
  inMotionTravelMinutes: createRouteTravelMinutes(2),
  dwellMinutes: createRouteTravelMinutes(0.5),
  totalTravelMinutes: createRouteTravelMinutes(2.5),
  status
});

const createValidLine = (): Line => ({
  id: lineId,
  label: 'Line 1',
  stopIds: [stopA, stopB, stopC],
  routeSegments: [createSegment(1, stopA, stopB), createSegment(2, stopB, stopC)],
  frequencyByTimeBand: {
    'morning-rush': createLineFrequencyMinutes(6),
    'late-morning': createLineFrequencyMinutes(8),
    midday: createLineFrequencyMinutes(10),
    afternoon: createLineFrequencyMinutes(10),
    'evening-rush': createLineFrequencyMinutes(7),
    evening: createLineFrequencyMinutes(12),
    night: createLineFrequencyMinutes(15)
  }
});

describe('evaluateLineServiceReadiness', () => {
  it('returns ready when line structure, routing, and frequencies are complete', () => {
    const result = evaluateLineServiceReadiness(createValidLine(), placedStops);

    expect(result.status).toBe('ready');
    expect(result.issues).toEqual([]);
    expect(result.summary.errorIssueCount).toBe(0);
    expect(result.summary.warningIssueCount).toBe(0);
    expect(result.summary.hasAllCanonicalTimeBandsConfigured).toBe(true);
  });

  it('returns blocked for structural and frequency failures', () => {
    const invalidLine: Line = {
      ...createValidLine(),
      label: ' ',
      stopIds: [stopA, createStopId('missing-stop')],
      routeSegments: [
        {
          ...createSegment(1, stopA, stopC),
          totalTravelMinutes: createRouteTravelMinutes(1),
          status: 'invalid-status' as RouteStatus
        }
      ],
      frequencyByTimeBand: { 'morning-rush': 0 } as Line['frequencyByTimeBand']
    };

    const result = evaluateLineServiceReadiness(invalidLine, placedStops);

    expect(result.status).toBe('blocked');
    expect(result.summary.errorIssueCount).toBeGreaterThan(0);
    expect(result.issues.some((issue) => issue.code === LINE_SERVICE_READINESS_ISSUE_CODES.INVALID_LINE_LABEL)).toBe(true);
    expect(result.issues.some((issue) => issue.code === LINE_SERVICE_READINESS_ISSUE_CODES.MISSING_PLACED_STOP_REFERENCE)).toBe(true);
    expect(result.issues.some((issue) => issue.code === LINE_SERVICE_READINESS_ISSUE_CODES.ROUTE_SEGMENT_ADJACENCY_MISMATCH)).toBe(true);
    expect(result.issues.some((issue) => issue.code === LINE_SERVICE_READINESS_ISSUE_CODES.ROUTE_SEGMENT_TIMING_UNUSABLE)).toBe(true);
    expect(result.issues.some((issue) => issue.code === LINE_SERVICE_READINESS_ISSUE_CODES.UNKNOWN_ROUTE_STATUS)).toBe(true);
    expect(result.issues.some((issue) => issue.code === LINE_SERVICE_READINESS_ISSUE_CODES.MISSING_CONFIGURED_FREQUENCY)).toBe(true);
  });

  it('returns partially-ready when only warnings are present', () => {
    const frequencyByTimeBand = {
      ...createUnsetLineFrequencyByTimeBand(),
      'morning-rush': createLineFrequencyMinutes(6)
    };

    const warningLine: Line = {
      ...createValidLine(),
      routeSegments: [
        createSegment(1, stopA, stopB, 'fallback-routed'),
        createSegment(2, stopB, stopC, 'fallback-routed')
      ],
      frequencyByTimeBand
    };

    const result = evaluateLineServiceReadiness(warningLine, placedStops);

    expect(result.status).toBe('partially-ready');
    expect(result.summary.errorIssueCount).toBe(0);
    expect(result.summary.warningIssueCount).toBeGreaterThanOrEqual(1);
    expect(result.summary.hasFallbackOnlyRouting).toBe(true);
    expect(result.issues.some((issue) => issue.code === LINE_SERVICE_READINESS_ISSUE_CODES.FALLBACK_ONLY_ROUTING)).toBe(true);
    expect(result.issues.some((issue) => issue.code === LINE_SERVICE_READINESS_ISSUE_CODES.MISSING_COMPLETE_TIME_BAND_CONFIGURATION)).toBe(true);
  });
});
