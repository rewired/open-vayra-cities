import { describe, expect, it } from 'vitest';

import { createLineFrequencyMinutes, createLineId, createUnsetLineFrequencyByTimeBand, type Line } from '../types/line';
import {
  createLineSegmentId,
  createRouteDistanceMeters,
  createRouteTravelMinutes,
  type LineRouteSegment
} from '../types/lineRoute';
import { createStopId, type Stop } from '../types/stop';
import { projectLineServicePlan, projectLineServicePlanForLine } from './lineServicePlanProjection';

const lineAId = createLineId('line-a');
const lineBId = createLineId('line-b');

const stopA = createStopId('stop-a');
const stopB = createStopId('stop-b');
const stopC = createStopId('stop-c');

const placedStops: readonly Stop[] = [
  { id: stopA, position: { lng: 10, lat: 53 }, label: 'A' },
  { id: stopB, position: { lng: 10.01, lat: 53.01 }, label: 'B' },
  { id: stopC, position: { lng: 10.02, lat: 53.02 }, label: 'C' }
];

const createSegment = (
  segmentNumber: number,
  lineId: Line['id'],
  fromStopId: Stop['id'],
  toStopId: Stop['id'],
  totalTravelMinutes = 4,
  status: LineRouteSegment['status'] = 'routed'
): LineRouteSegment => ({
  id: createLineSegmentId(`segment-${lineId}-${segmentNumber}`),
  lineId,
  fromStopId,
  toStopId,
  orderedGeometry: [
    [10 + segmentNumber * 0.01, 53 + segmentNumber * 0.01],
    [10.005 + segmentNumber * 0.01, 53.005 + segmentNumber * 0.01]
  ],
  distanceMeters: createRouteDistanceMeters(1200),
  inMotionTravelMinutes: createRouteTravelMinutes(totalTravelMinutes - 0.5),
  dwellMinutes: createRouteTravelMinutes(0.5),
  totalTravelMinutes: createRouteTravelMinutes(totalTravelMinutes),
  status
});

const createBaseLine = (lineId: Line['id']): Line => ({
  id: lineId,
  label: `Line ${lineId}`,
  stopIds: [stopA, stopB, stopC],
  routeSegments: [createSegment(1, lineId, stopA, stopB, 4), createSegment(2, lineId, stopB, stopC, 6)],
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

describe('projectLineServicePlanForLine', () => {
  it('returns configured when readiness is ready and current-band headway is valid', () => {
    const result = projectLineServicePlanForLine(createBaseLine(lineAId), placedStops, 'morning-rush');

    expect(result.status).toBe('configured');
    expect(result.currentBandHeadwayMinutes).toBe(6);
    expect(result.theoreticalDeparturesPerHour).toBe(10);
    expect(result.routeSegmentCount).toBe(2);
    expect(result.totalRouteTravelMinutes).toBe(10);
    expect(result.notes).toBeUndefined();
  });

  it('returns blocked when readiness has errors', () => {
    const blockedLine: Line = {
      ...createBaseLine(lineAId),
      stopIds: [stopA],
      routeSegments: []
    };

    const result = projectLineServicePlanForLine(blockedLine, placedStops, 'morning-rush');

    expect(result.status).toBe('blocked');
    expect(result.notes?.length).toBeGreaterThan(0);
  });

  it('returns not-configured when active-band frequency is unset and line is non-blocked', () => {
    const notConfiguredLine: Line = {
      ...createBaseLine(lineAId),
      frequencyByTimeBand: {
        ...createBaseLine(lineAId).frequencyByTimeBand,
        'morning-rush': null
      }
    };

    const result = projectLineServicePlanForLine(notConfiguredLine, placedStops, 'morning-rush');

    expect(result.readiness.status).toBe('partially-ready');
    expect(result.status).toBe('not-configured');
    expect(result.currentBandHeadwayMinutes).toBeNull();
    expect(result.theoreticalDeparturesPerHour).toBeNull();
  });

  it('returns degraded when active-band frequency is valid but readiness has warnings', () => {
    const degradedLine: Line = {
      ...createBaseLine(lineAId),
      routeSegments: [
        createSegment(1, lineAId, stopA, stopB, 4, 'fallback-routed'),
        createSegment(2, lineAId, stopB, stopC, 6, 'fallback-routed')
      ]
    };

    const result = projectLineServicePlanForLine(degradedLine, placedStops, 'morning-rush');

    expect(result.readiness.status).toBe('partially-ready');
    expect(result.status).toBe('degraded');
    expect(result.currentBandHeadwayMinutes).toBe(6);
    expect(result.theoreticalDeparturesPerHour).toBe(10);
  });
});

describe('projectLineServicePlan', () => {
  it('builds network-level totals and status counts for projected lines', () => {
    const configuredLine = createBaseLine(lineAId);
    const notConfiguredLine: Line = {
      ...createBaseLine(lineBId),
      frequencyByTimeBand: {
        ...createUnsetLineFrequencyByTimeBand(),
        midday: createLineFrequencyMinutes(10)
      }
    };

    const projection = projectLineServicePlan([configuredLine, notConfiguredLine], placedStops, 'morning-rush');

    expect(projection.summary.activeTimeBandId).toBe('morning-rush');
    expect(projection.summary.totalLineCount).toBe(2);
    expect(projection.summary.configuredLineCount).toBe(1);
    expect(projection.summary.notConfiguredLineCount).toBe(1);
    expect(projection.summary.blockedLineCount).toBe(0);
    expect(projection.summary.degradedLineCount).toBe(0);
    expect(projection.summary.totalRouteSegmentCount).toBe(4);
    expect(projection.summary.totalRouteTravelMinutes).toBe(20);
    expect(projection.summary.totalTheoreticalDeparturesPerHour).toBe(10);
  });
});
