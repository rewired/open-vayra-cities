import { describe, expect, it } from 'vitest';

import { createLineFrequencyMinutes, createLineId, createNoServiceLineServiceByTimeBand, type Line } from '../types/line';
import { createLineSegmentId, createRouteDistanceMeters, createRouteTravelMinutes, type LineRouteSegment } from '../types/lineRoute';
import { createStopId, type Stop } from '../types/stop';
import { projectLineServicePlan, projectLineServicePlanForLine } from './lineServicePlanProjection';

const lineAId = createLineId('line-a');
const lineBId = createLineId('line-b');
const lineCId = createLineId('line-c');

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
  inMotionTravelMinutes: createRouteTravelMinutes(3.5),
  dwellMinutes: createRouteTravelMinutes(0.5),
  totalTravelMinutes: createRouteTravelMinutes(4),
  status
});

const createBaseLine = (lineId: Line['id'], routeStatus: LineRouteSegment['status'] = 'routed'): Line => ({
  id: lineId,
  label: `Line ${lineId}`,
  stopIds: [stopA, stopB, stopC],
  routeSegments: [createSegment(1, lineId, stopA, stopB, routeStatus), createSegment(2, lineId, stopB, stopC, routeStatus)],
  frequencyByTimeBand: {
    ...createNoServiceLineServiceByTimeBand(),
    'morning-rush': { kind: 'frequency', headwayMinutes: createLineFrequencyMinutes(6) }
  }
});

describe('lineServicePlanProjection', () => {
  it('projects frequency active band as configured with headway and departures', () => {
    const result = projectLineServicePlanForLine(createBaseLine(lineAId), placedStops, 'morning-rush');

    expect(result.status).toBe('configured');
    expect(result.activeBandState).toBe('frequency');
    expect(result.currentBandHeadwayMinutes).toBe(6);
    expect(result.theoreticalDeparturesPerHour).toBe(10);
  });

  it('projects explicit no-service active band as configured without headway', () => {
    const result = projectLineServicePlanForLine(createBaseLine(lineAId), placedStops, 'midday');

    expect(result.status).toBe('configured');
    expect(result.activeBandState).toBe('no-service');
    expect(result.currentBandHeadwayMinutes).toBeNull();
  });

  it('projects fallback-only routing as degraded', () => {
    const result = projectLineServicePlanForLine(createBaseLine(lineBId, 'fallback-routed'), placedStops, 'morning-rush');
    expect(result.status).toBe('degraded');
  });

  it('projects blocked line readiness as blocked', () => {
    const blockedLine: Line = { ...createBaseLine(lineCId), stopIds: [stopA], routeSegments: [] };
    const result = projectLineServicePlanForLine(blockedLine, placedStops, 'morning-rush');
    expect(result.status).toBe('blocked');
  });

  it('summarizes configured/degraded/blocked counts without a not-configured bucket', () => {
    const summary = projectLineServicePlan(
      [createBaseLine(lineAId), createBaseLine(lineBId, 'fallback-routed'), { ...createBaseLine(lineCId), stopIds: [stopA], routeSegments: [] }],
      placedStops,
      'morning-rush'
    ).summary;

    expect(summary.totalLineCount).toBe(3);
    expect(summary.configuredLineCount).toBe(1);
    expect(summary.degradedLineCount).toBe(1);
    expect(summary.blockedLineCount).toBe(1);
  });
});
