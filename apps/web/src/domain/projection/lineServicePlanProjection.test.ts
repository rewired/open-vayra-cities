import { readFileSync } from 'node:fs';
import path from 'node:path';

import { describe, expect, it } from 'vitest';

import type { SelectedLineExportPayload } from '../types/selectedLineExport';
import {
  createLineFrequencyMinutes,
  createLineId,
  createUnsetLineFrequencyByTimeBand,
  type Line
} from '../types/line';
import {
  createLineSegmentId,
  createRouteDistanceMeters,
  createRouteTravelMinutes,
  type LineRouteSegment
} from '../types/lineRoute';
import { createStopId, type Stop } from '../types/stop';
import {
  projectLineSelectedServiceInspector,
  projectLineServicePlan,
  projectLineServicePlanForLine
} from './lineServicePlanProjection';

const lineAId = createLineId('line-a');
const lineBId = createLineId('line-b');
const lineCId = createLineId('line-c');
const lineDId = createLineId('line-d');

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

const createBaseLine = (
  lineId: Line['id'],
  routeStatus: LineRouteSegment['status'] = 'routed'
): Line => ({
  id: lineId,
  label: `Line ${lineId}`,
  stopIds: [stopA, stopB, stopC],
  routeSegments: [
    createSegment(1, lineId, stopA, stopB, 4, routeStatus),
    createSegment(2, lineId, stopB, stopC, 6, routeStatus)
  ],
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

describe('projectLineServicePlanProjection coverage', () => {
  it('1) projects ready line + current frequency to configured and fallback-only line to degraded', () => {
    const configuredResult = projectLineServicePlanForLine(createBaseLine(lineAId), placedStops, 'morning-rush');
    const degradedResult = projectLineServicePlanForLine(
      createBaseLine(lineAId, 'fallback-routed'),
      placedStops,
      'morning-rush'
    );

    expect(configuredResult.status).toBe('configured');
    expect(degradedResult.status).toBe('degraded');
  });

  it('2) returns not-configured when line is non-blocked without active-band frequency', () => {
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
  });

  it('3) returns blocked for blocked readiness', () => {
    const blockedLine: Line = {
      ...createBaseLine(lineAId),
      stopIds: [stopA],
      routeSegments: []
    };

    const result = projectLineServicePlanForLine(blockedLine, placedStops, 'morning-rush');

    expect(result.readiness.status).toBe('blocked');
    expect(result.status).toBe('blocked');
  });

  it('4) calculates departures/hour as 60 / headway', () => {
    const line = createBaseLine(lineAId);

    const result = projectLineServicePlanForLine(line, placedStops, 'morning-rush');

    expect(result.currentBandHeadwayMinutes).toBe(6);
    expect(result.theoreticalDeparturesPerHour).toBe(10);
  });

  it('5) sums total route time from stored segment totals', () => {
    const line = createBaseLine(lineAId);

    const result = projectLineServicePlanForLine(line, placedStops, 'morning-rush');

    expect(result.totalRouteTravelMinutes).toBe(10);
  });

  it('6) includes route segment count in projection', () => {
    const line = createBaseLine(lineAId);

    const result = projectLineServicePlanForLine(line, placedStops, 'morning-rush');

    expect(result.routeSegmentCount).toBe(2);
  });

  it('7) reflects fallback-only route segments as degraded status and warning notes', () => {
    const line = createBaseLine(lineAId, 'fallback-routed');

    const result = projectLineServicePlanForLine(line, placedStops, 'morning-rush');

    expect(result.status).toBe('degraded');
    expect(result.notes?.some((note) => note.severity === 'warning')).toBe(true);
  });

  it('8) computes network summary counts correctly by status bucket', () => {
    const configuredLine = createBaseLine(lineAId);
    const degradedLine = createBaseLine(lineBId, 'fallback-routed');
    const notConfiguredLine: Line = {
      ...createBaseLine(lineCId),
      frequencyByTimeBand: {
        ...createBaseLine(lineCId).frequencyByTimeBand,
        'morning-rush': null
      }
    };
    const blockedLine: Line = {
      ...createBaseLine(lineDId),
      stopIds: [stopA],
      routeSegments: []
    };

    const projection = projectLineServicePlan(
      [configuredLine, degradedLine, notConfiguredLine, blockedLine],
      placedStops,
      'morning-rush'
    );

    expect(projection.summary.totalLineCount).toBe(4);
    expect(projection.summary.configuredLineCount).toBe(1);
    expect(projection.summary.degradedLineCount).toBe(1);
    expect(projection.summary.notConfiguredLineCount).toBe(1);
    expect(projection.summary.blockedLineCount).toBe(1);
  });

  it('9) changes projection when active time band changes', () => {
    const line: Line = {
      ...createBaseLine(lineAId),
      frequencyByTimeBand: {
        ...createUnsetLineFrequencyByTimeBand(),
        'morning-rush': createLineFrequencyMinutes(6),
        midday: null
      }
    };

    const morningResult = projectLineServicePlanForLine(line, placedStops, 'morning-rush');
    const middayResult = projectLineServicePlanForLine(line, placedStops, 'midday');

    expect(morningResult.status).toBe('degraded');
    expect(middayResult.status).toBe('not-configured');
    expect(morningResult.currentBandHeadwayMinutes).toBe(6);
    expect(middayResult.currentBandHeadwayMinutes).toBeNull();
  });

  it('10) fixture-derived all-null frequencies do not produce configured service', () => {
    const fixturePath = path.resolve(
      path.dirname(new URL(import.meta.url).pathname),
      '../../../../../data/fixtures/selected-line-exports/hamburg-line-1.v2.json'
    );
    const payload = JSON.parse(readFileSync(fixturePath, 'utf8')) as SelectedLineExportPayload;

    const line: Line = {
      id: payload.line.id,
      label: payload.line.label,
      stopIds: payload.line.orderedStopIds,
      routeSegments: payload.line.routeSegments,
      frequencyByTimeBand: createUnsetLineFrequencyByTimeBand()
    };

    const result = projectLineServicePlanForLine(line, payload.stops, 'morning-rush');

    expect(result.status).not.toBe('configured');
    expect(result.currentBandHeadwayMinutes).toBeNull();
  });

  it('11) does not recompute or mutate route segments during projection', () => {
    const line = createBaseLine(lineAId);
    const beforeJson = JSON.stringify(line.routeSegments);

    const result = projectLineServicePlanForLine(line, placedStops, 'morning-rush');

    expect(result.routeSegmentCount).toBe(line.routeSegments.length);
    expect(JSON.stringify(line.routeSegments)).toBe(beforeJson);
  });

  it('12) keeps blocker/warning counts stable across repeated inspector projections', () => {
    const degradedLine = createBaseLine(lineAId, 'fallback-routed');
    const lineProjection = projectLineServicePlanForLine(degradedLine, placedStops, 'morning-rush');

    const firstInspector = projectLineSelectedServiceInspector(lineProjection, 1);
    const secondInspector = projectLineSelectedServiceInspector(lineProjection, 3);

    expect(firstInspector.blockerCount).toBe(secondInspector.blockerCount);
    expect(firstInspector.warningCount).toBe(secondInspector.warningCount);
  });
});
