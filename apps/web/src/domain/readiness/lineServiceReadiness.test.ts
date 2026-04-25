import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { describe, expect, it } from 'vitest';

import {
  LINE_SERVICE_READINESS_ISSUE_CODES,
  LINE_SERVICE_READINESS_ISSUE_SEVERITIES
} from '../constants/lineServiceReadiness';
import { MVP_TIME_BAND_IDS } from '../constants/timeBands';
import type { SelectedLineExportPayload } from '../types/selectedLineExport';
import { createLineFrequencyMinutes, createLineId, createNoServiceLineServiceByTimeBand, type Line } from '../types/line';
import {
  createLineSegmentId,
  createRouteDistanceMeters,
  createRouteTravelMinutes,
  type LineRouteSegment,
  type RouteStatus
} from '../types/lineRoute';
import type { LineServiceReadinessIssue } from '../types/lineServiceReadiness';
import { createStopId, type Stop } from '../types/stop';
import { evaluateLineServiceReadiness } from './lineServiceReadiness';

const lineId = createLineId('line-1');
const differentLineId = createLineId('line-2');
const stopA = createStopId('stop-a');
const stopB = createStopId('stop-b');
const stopC = createStopId('stop-c');
const stopD = createStopId('stop-d');

const placedStops: readonly Stop[] = [
  { id: stopA, position: { lng: 9.99, lat: 53.55 }, label: 'A' },
  { id: stopB, position: { lng: 10.0, lat: 53.56 }, label: 'B' },
  { id: stopC, position: { lng: 10.01, lat: 53.57 }, label: 'C' },
  { id: stopD, position: { lng: 10.02, lat: 53.58 }, label: 'D' }
];

const createSegment = (
  segmentNumber: number,
  fromStopId: Stop['id'],
  toStopId: Stop['id'],
  overrides: Partial<LineRouteSegment> = {}
): LineRouteSegment => ({
  id: createLineSegmentId(`segment-${segmentNumber}`),
  lineId,
  fromStopId,
  toStopId,
  orderedGeometry: [
    [9.99 + segmentNumber * 0.01, 53.55 + segmentNumber * 0.01],
    [10.0 + segmentNumber * 0.01, 53.56 + segmentNumber * 0.01]
  ],
  distanceMeters: createRouteDistanceMeters(500),
  inMotionTravelMinutes: createRouteTravelMinutes(2),
  dwellMinutes: createRouteTravelMinutes(0.5),
  totalTravelMinutes: createRouteTravelMinutes(2.5),
  status: 'routed',
  ...overrides
});

const createFullyConfiguredLine = (): Line => ({
  id: lineId,
  label: 'Line 1',
  stopIds: [stopA, stopB, stopC],
  topology: 'linear',
  servicePattern: 'one-way',
  routeSegments: [createSegment(1, stopA, stopB), createSegment(2, stopB, stopC)],
  frequencyByTimeBand: {
    'morning-rush': { kind: 'frequency', headwayMinutes: createLineFrequencyMinutes(6) },
    'late-morning': { kind: 'frequency', headwayMinutes: createLineFrequencyMinutes(8) },
    midday: { kind: 'frequency', headwayMinutes: createLineFrequencyMinutes(10) },
    afternoon: { kind: 'frequency', headwayMinutes: createLineFrequencyMinutes(10) },
    'evening-rush': { kind: 'frequency', headwayMinutes: createLineFrequencyMinutes(7) },
    evening: { kind: 'frequency', headwayMinutes: createLineFrequencyMinutes(12) },
    night: { kind: 'frequency', headwayMinutes: createLineFrequencyMinutes(15) }
  }
});

const issueCodes = (issues: readonly LineServiceReadinessIssue[]): readonly string[] => issues.map((issue) => issue.code);

describe('evaluateLineServiceReadiness', () => {
  it('returns ready for a fully configured and coherent line', () => {
    const result = evaluateLineServiceReadiness(createFullyConfiguredLine(), placedStops);

    expect(result.status).toBe('ready');
    expect(result.issues).toEqual([]);
  });

  it('returns ready when all frequencies are explicit no-service', () => {
    const line: Line = {
      ...createFullyConfiguredLine(),
      frequencyByTimeBand: createNoServiceLineServiceByTimeBand()
    };

    const result = evaluateLineServiceReadiness(line, placedStops);

    expect(result.status).toBe('ready');
    expect(result.summary.configuredTimeBandCount).toBe(MVP_TIME_BAND_IDS.length);
    expect(issueCodes(result.issues)).not.toContain(LINE_SERVICE_READINESS_ISSUE_CODES.MISSING_CONFIGURED_FREQUENCY);
    expect(issueCodes(result.issues)).not.toContain(
      LINE_SERVICE_READINESS_ISSUE_CODES.MISSING_COMPLETE_TIME_BAND_CONFIGURATION
    );
  });

  it('treats no-service bands as configured service-plan bands', () => {
    const line: Line = {
      ...createFullyConfiguredLine(),
      frequencyByTimeBand: {
        ...createNoServiceLineServiceByTimeBand(),
        'morning-rush': { kind: 'no-service' },
        'late-morning': { kind: 'no-service' },
        midday: { kind: 'no-service' },
        afternoon: { kind: 'no-service' },
        'evening-rush': { kind: 'no-service' },
        evening: { kind: 'no-service' },
        night: { kind: 'no-service' }
      }
    };

    const result = evaluateLineServiceReadiness(line, placedStops);

    expect(result.status).toBe('ready');
    expect(result.summary.configuredTimeBandCount).toBe(MVP_TIME_BAND_IDS.length);
    expect(issueCodes(result.issues)).not.toContain(LINE_SERVICE_READINESS_ISSUE_CODES.MISSING_CONFIGURED_FREQUENCY);
    expect(issueCodes(result.issues)).not.toContain(
      LINE_SERVICE_READINESS_ISSUE_CODES.MISSING_COMPLETE_TIME_BAND_CONFIGURATION
    );
  });

  it('returns ready when mixed frequency and no-service plans cover all canonical bands', () => {
    const line: Line = {
      ...createFullyConfiguredLine(),
      frequencyByTimeBand: {
        ...createNoServiceLineServiceByTimeBand(),
        'morning-rush': { kind: 'frequency', headwayMinutes: createLineFrequencyMinutes(6) },
        midday: { kind: 'frequency', headwayMinutes: createLineFrequencyMinutes(10) }
      }
    };

    const result = evaluateLineServiceReadiness(line, placedStops);

    expect(result.status).toBe('ready');
    expect(result.summary.configuredTimeBandCount).toBe(MVP_TIME_BAND_IDS.length);
    expect(issueCodes(result.issues)).not.toContain(LINE_SERVICE_READINESS_ISSUE_CODES.MISSING_COMPLETE_TIME_BAND_CONFIGURATION);
  });

  it('returns blocked when fewer than minimum stops are configured', () => {
    const line: Line = {
      ...createFullyConfiguredLine(),
      stopIds: [stopA],
      routeSegments: []
    };

    const result = evaluateLineServiceReadiness(line, placedStops);

    expect(result.status).toBe('blocked');
    expect(issueCodes(result.issues)).toContain(LINE_SERVICE_READINESS_ISSUE_CODES.INSUFFICIENT_ORDERED_STOPS);
  });

  it('returns blocked when a referenced stop is missing from placed stops', () => {
    const line: Line = {
      ...createFullyConfiguredLine(),
      stopIds: [stopA, createStopId('stop-missing'), stopC],
      routeSegments: [createSegment(1, stopA, createStopId('stop-missing')), createSegment(2, createStopId('stop-missing'), stopC)]
    };

    const result = evaluateLineServiceReadiness(line, placedStops);

    expect(result.status).toBe('blocked');
    expect(issueCodes(result.issues)).toContain(LINE_SERVICE_READINESS_ISSUE_CODES.MISSING_PLACED_STOP_REFERENCE);
  });

  it('returns blocked when route segments are missing', () => {
    const line: Line = {
      ...createFullyConfiguredLine(),
      routeSegments: []
    };

    const result = evaluateLineServiceReadiness(line, placedStops);

    expect(result.status).toBe('blocked');
    expect(issueCodes(result.issues)).toContain(LINE_SERVICE_READINESS_ISSUE_CODES.MISSING_ROUTE_SEGMENTS);
  });

  it('returns blocked when route segment count does not match stop adjacency count', () => {
    const line: Line = {
      ...createFullyConfiguredLine(),
      routeSegments: [createSegment(1, stopA, stopB)]
    };

    const result = evaluateLineServiceReadiness(line, placedStops);

    expect(result.status).toBe('blocked');
    expect(issueCodes(result.issues)).toContain(LINE_SERVICE_READINESS_ISSUE_CODES.ROUTE_SEGMENT_COUNT_MISMATCH);
  });

  it('returns blocked when route segment adjacency mismatches ordered stop pairs', () => {
    const line: Line = {
      ...createFullyConfiguredLine(),
      routeSegments: [createSegment(1, stopA, stopC), createSegment(2, stopB, stopC)]
    };

    const result = evaluateLineServiceReadiness(line, placedStops);

    expect(result.status).toBe('blocked');
    expect(issueCodes(result.issues)).toContain(LINE_SERVICE_READINESS_ISSUE_CODES.ROUTE_SEGMENT_ADJACENCY_MISMATCH);
  });

  it('returns blocked when route segment lineId does not match line id', () => {
    const line: Line = {
      ...createFullyConfiguredLine(),
      routeSegments: [
        createSegment(1, stopA, stopB),
        createSegment(2, stopB, stopC, { lineId: differentLineId })
      ]
    };

    const result = evaluateLineServiceReadiness(line, placedStops);

    expect(result.status).toBe('blocked');
    expect(issueCodes(result.issues)).toContain(LINE_SERVICE_READINESS_ISSUE_CODES.ROUTE_SEGMENT_LINE_ID_MISMATCH);
  });

  it('returns blocked when segment timing is invalid', () => {
    const line: Line = {
      ...createFullyConfiguredLine(),
      routeSegments: [
        createSegment(1, stopA, stopB),
        createSegment(2, stopB, stopC, { totalTravelMinutes: createRouteTravelMinutes(1) })
      ]
    };

    const result = evaluateLineServiceReadiness(line, placedStops);

    expect(result.status).toBe('blocked');
    expect(issueCodes(result.issues)).toContain(LINE_SERVICE_READINESS_ISSUE_CODES.ROUTE_SEGMENT_TIMING_UNUSABLE);
  });

  it('surfaces fallback-routed warning when all segments are fallback-routed', () => {
    const line: Line = {
      ...createFullyConfiguredLine(),
      routeSegments: [
        createSegment(1, stopA, stopB, { status: 'fallback-routed' }),
        createSegment(2, stopB, stopC, { status: 'fallback-routed' })
      ]
    };

    const result = evaluateLineServiceReadiness(line, placedStops);

    expect(result.status).toBe('partially-ready');
    expect(result.summary.hasFallbackOnlyRouting).toBe(true);
    expect(issueCodes(result.issues)).toContain(LINE_SERVICE_READINESS_ISSUE_CODES.FALLBACK_ONLY_ROUTING);
  });

  it('reports configured and missing canonical time-band counts correctly', () => {
    const line: Line = {
      ...createFullyConfiguredLine(),
      frequencyByTimeBand: {
        ...createNoServiceLineServiceByTimeBand(),
        'morning-rush': { kind: 'frequency', headwayMinutes: createLineFrequencyMinutes(5) },
        evening: { kind: 'frequency', headwayMinutes: createLineFrequencyMinutes(12) }
      }
    };

    const result = evaluateLineServiceReadiness(line, placedStops);

    expect(result.summary.configuredTimeBandCount).toBe(MVP_TIME_BAND_IDS.length);
    expect(result.summary.canonicalTimeBandCount).toBe(MVP_TIME_BAND_IDS.length);
    expect(result.summary.hasAllCanonicalTimeBandsConfigured).toBe(true);
  });

  it('keeps issue code and severity contracts stable for representative diagnostics', () => {
    const line: Line = {
      ...createFullyConfiguredLine(),
      routeSegments: [
        createSegment(1, stopA, stopB, { status: 'invalid-status' as RouteStatus }),
        createSegment(2, stopB, stopC, { status: 'fallback-routed' })
      ],
      frequencyByTimeBand: createNoServiceLineServiceByTimeBand()
    };

    const result = evaluateLineServiceReadiness(line, placedStops);
    const issuesByCode = new Map(result.issues.map((issue) => [issue.code, issue]));

    expect(issuesByCode.get(LINE_SERVICE_READINESS_ISSUE_CODES.UNKNOWN_ROUTE_STATUS)?.severity).toBe(
      LINE_SERVICE_READINESS_ISSUE_SEVERITIES.ERROR
    );
  });

  it('evaluates Hamburg fixture-derived line as partially-ready when frequencies are no-service', () => {
    const fixturePath = path.resolve(
      path.dirname(fileURLToPath(import.meta.url)),
      '../../../../../data/fixtures/selected-line-exports/hamburg-line-1.v2.json'
    );
    const payload = JSON.parse(readFileSync(fixturePath, 'utf8')) as SelectedLineExportPayload;

    const line: Line = {
      id: payload.line.id,
      label: payload.line.label,
      stopIds: payload.line.orderedStopIds,
      topology: (payload.line as any).topology ?? 'linear',
      servicePattern: (payload.line as any).servicePattern ?? 'one-way',
      routeSegments: payload.line.routeSegments,
      frequencyByTimeBand: createNoServiceLineServiceByTimeBand()
    };

    const result = evaluateLineServiceReadiness(line, payload.stops);

    expect(result.status).toBe('partially-ready');
    expect(result.summary.hasAtLeastOneConfiguredFrequency).toBe(true);
    expect(issueCodes(result.issues)).toContain(LINE_SERVICE_READINESS_ISSUE_CODES.FALLBACK_ONLY_ROUTING);
  });
});
