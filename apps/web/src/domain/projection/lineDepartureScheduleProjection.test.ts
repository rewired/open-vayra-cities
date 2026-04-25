import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { describe, expect, it } from 'vitest';

import type { SelectedLineExportPayload } from '../types/selectedLineExport';
import { createLineFrequencyMinutes, createLineId, createNoServiceLineServiceByTimeBand, type Line } from '../types/line';
import {
  createLineSegmentId,
  createRouteDistanceMeters,
  createRouteTravelMinutes,
  type LineRouteSegment
} from '../types/lineRoute';
import { createSimulationMinuteOfDay } from '../simulation/simulationClock';
import { createStopId, type Stop } from '../types/stop';
import {
  projectLineDepartureScheduleForLine,
  projectLineDepartureScheduleNetwork
} from './lineDepartureScheduleProjection';

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
    'morning-rush': { kind: 'frequency', headwayMinutes: createLineFrequencyMinutes(6) },
    'late-morning': { kind: 'frequency', headwayMinutes: createLineFrequencyMinutes(8) },
    midday: { kind: 'frequency', headwayMinutes: createLineFrequencyMinutes(10) },
    afternoon: { kind: 'frequency', headwayMinutes: createLineFrequencyMinutes(10) },
    'evening-rush': { kind: 'frequency', headwayMinutes: createLineFrequencyMinutes(7) },
    evening: { kind: 'frequency', headwayMinutes: createLineFrequencyMinutes(12) },
    night: { kind: 'frequency', headwayMinutes: createLineFrequencyMinutes(15) }
  }
});

describe('projectLineDepartureScheduleProjection coverage', () => {
  it('1) configured current service produces deterministic departure minutes for the active time band', () => {
    const line = createBaseLine(lineAId);

    const result = projectLineDepartureScheduleForLine(
      line,
      placedStops,
      'morning-rush',
      createSimulationMinuteOfDay(420)
    );

    expect(result.status).toBe('available');
    expect(result.unavailableReason).toBeNull();
    expect(result.departureMinutes.slice(0, 4)).toEqual([360, 366, 372, 378]);
  });

  it('2) departure minutes start at the active time-band start minute', () => {
    const result = projectLineDepartureScheduleForLine(
      createBaseLine(lineAId),
      placedStops,
      'morning-rush',
      createSimulationMinuteOfDay(420)
    );

    expect(result.departureMinutes[0]).toBe(360);
  });

  it('3) departure minutes stop before the active time-band end minute', () => {
    const result = projectLineDepartureScheduleForLine(
      createBaseLine(lineAId),
      placedStops,
      'morning-rush',
      createSimulationMinuteOfDay(420)
    );

    expect(result.departureMinutes.at(-1)).toBe(534);
    expect(result.departureMinutes.every((minute) => minute < result.timeBandEndMinute)).toBe(true);
  });

  it('4) previous departure is derived correctly before current simulation minute', () => {
    const result = projectLineDepartureScheduleForLine(
      createBaseLine(lineAId),
      placedStops,
      'morning-rush',
      createSimulationMinuteOfDay(421)
    );

    expect(result.previousDepartureMinute).toBe(420);
  });

  it('5) next departure is derived correctly at or after current simulation minute', () => {
    const atDeparture = projectLineDepartureScheduleForLine(
      createBaseLine(lineAId),
      placedStops,
      'morning-rush',
      createSimulationMinuteOfDay(420)
    );
    const betweenDepartures = projectLineDepartureScheduleForLine(
      createBaseLine(lineAId),
      placedStops,
      'morning-rush',
      createSimulationMinuteOfDay(421)
    );

    expect(atDeparture.nextDepartureMinute).toBe(420);
    expect(betweenDepartures.nextDepartureMinute).toBe(426);
  });

  it('6) minutes until next departure is derived correctly', () => {
    const result = projectLineDepartureScheduleForLine(
      createBaseLine(lineAId),
      placedStops,
      'morning-rush',
      createSimulationMinuteOfDay(421)
    );

    expect(result.minutesUntilNextDeparture).toBe(5);
  });

  it('7) no next departure is returned after the last departure in the active time band', () => {
    const result = projectLineDepartureScheduleForLine(
      createBaseLine(lineAId),
      placedStops,
      'morning-rush',
      createSimulationMinuteOfDay(539)
    );

    expect(result.nextDepartureMinute).toBeNull();
    expect(result.minutesUntilNextDeparture).toBeNull();
  });

  it('8) blocked current service returns unavailable departure projection', () => {
    const blockedLine: Line = {
      ...createBaseLine(lineAId),
      stopIds: [stopA],
      routeSegments: []
    };

    const result = projectLineDepartureScheduleForLine(
      blockedLine,
      placedStops,
      'morning-rush',
      createSimulationMinuteOfDay(420)
    );

    expect(result.serviceProjectionStatus).toBe('blocked');
    expect(result.status).toBe('unavailable');
    expect(result.unavailableReason).toBe('blocked-service');
    expect(result.departureCount).toBe(0);
  });

  it('9) configured current service returns unavailable departure projection', () => {
    const line: Line = {
      ...createBaseLine(lineAId),
      frequencyByTimeBand: {
        ...createBaseLine(lineAId).frequencyByTimeBand,
        'morning-rush': { kind: 'no-service' }
      }
    };

    const result = projectLineDepartureScheduleForLine(
      line,
      placedStops,
      'morning-rush',
      createSimulationMinuteOfDay(420)
    );

    expect(result.serviceProjectionStatus).toBe('configured');
    expect(result.status).toBe('unavailable');
    expect(result.unavailableReason).toBe('active-band-no-service');
    expect(result.departureCount).toBe(0);
  });

  it('9b) active no-service returns unavailable departures with explicit no-service reason', () => {
    const noServiceLine: Line = {
      ...createBaseLine(lineAId),
      frequencyByTimeBand: {
        ...createBaseLine(lineAId).frequencyByTimeBand,
        'morning-rush': { kind: 'no-service' }
      }
    };

    const result = projectLineDepartureScheduleForLine(
      noServiceLine,
      placedStops,
      'morning-rush',
      createSimulationMinuteOfDay(420)
    );

    expect(result.serviceProjectionStatus).toBe('configured');
    expect(result.status).toBe('unavailable');
    expect(result.unavailableReason).toBe('active-band-no-service');
    expect(result.currentBandHeadwayMinutes).toBeNull();
    expect(result.departureMinutes).toEqual([]);
    expect(result.departureCount).toBe(0);
    expect(result.previousDepartureMinute).toBeNull();
    expect(result.nextDepartureMinute).toBeNull();
    expect(result.minutesUntilNextDeparture).toBeNull();
  });

  it('10) degraded current service returns degraded departure projection with departures', () => {
    const degradedLine = createBaseLine(lineAId, 'fallback-routed');

    const result = projectLineDepartureScheduleForLine(
      degradedLine,
      placedStops,
      'morning-rush',
      createSimulationMinuteOfDay(420)
    );

    expect(result.serviceProjectionStatus).toBe('degraded');
    expect(result.status).toBe('degraded');
    expect(result.unavailableReason).toBeNull();
    expect(result.departureCount).toBeGreaterThan(0);
  });

  it('11) network summary counts available, degraded, and unavailable projections correctly', () => {
    const availableLine = createBaseLine(lineAId);
    const degradedLine = createBaseLine(lineBId, 'fallback-routed');
    const unavailableLine: Line = {
      ...createBaseLine(lineCId),
      frequencyByTimeBand: {
        ...createBaseLine(lineCId).frequencyByTimeBand,
        'morning-rush': { kind: 'no-service' }
      }
    };

    const result = projectLineDepartureScheduleNetwork(
      [availableLine, degradedLine, unavailableLine],
      placedStops,
      'morning-rush',
      createSimulationMinuteOfDay(420)
    );

    expect(result.summary.totalCompletedLineCount).toBe(3);
    expect(result.summary.availableLineCount).toBe(1);
    expect(result.summary.degradedLineCount).toBe(1);
    expect(result.summary.unavailableLineCount).toBe(1);
  });

  it('12) all-null fixture-style frequencies do not produce available departures', () => {
    const fixturePath = path.resolve(
      path.dirname(fileURLToPath(import.meta.url)),
      '../../../../../data/fixtures/selected-line-exports/hamburg-line-1.v2.json'
    );
    const payload = JSON.parse(readFileSync(fixturePath, 'utf8')) as SelectedLineExportPayload;

    const line: Line = {
      id: payload.line.id,
      label: payload.line.label,
      stopIds: payload.line.orderedStopIds,
      routeSegments: payload.line.routeSegments,
      frequencyByTimeBand: createNoServiceLineServiceByTimeBand()
    };

    const result = projectLineDepartureScheduleForLine(
      line,
      payload.stops,
      'morning-rush',
      createSimulationMinuteOfDay(420)
    );

    expect(result.status).toBe('unavailable');
    expect(result.departureCount).toBe(0);
  });

  it('13) active time-band changes produce different departure windows when the time band changes', () => {
    const line = createBaseLine(lineAId);

    const morning = projectLineDepartureScheduleForLine(
      line,
      placedStops,
      'morning-rush',
      createSimulationMinuteOfDay(420)
    );
    const midday = projectLineDepartureScheduleForLine(
      line,
      placedStops,
      'midday',
      createSimulationMinuteOfDay(780)
    );

    expect(morning.timeBandStartMinute).toBe(360);
    expect(morning.timeBandEndMinute).toBe(540);
    expect(midday.timeBandStartMinute).toBe(660);
    expect(midday.timeBandEndMinute).toBe(840);
  });

  it('14) route segments are not recomputed during departure projection', () => {
    const line = createBaseLine(lineAId);
    const beforeJson = JSON.stringify(line.routeSegments);

    const result = projectLineDepartureScheduleForLine(
      line,
      placedStops,
      'morning-rush',
      createSimulationMinuteOfDay(420)
    );

    expect(result.totalRouteTravelMinutes).toBe(10);
    expect(JSON.stringify(line.routeSegments)).toBe(beforeJson);
  });

  it('15) wrapped night windows resolve to the correct active segment before and after midnight', () => {
    const line = createBaseLine(lineAId);

    const lateNight = projectLineDepartureScheduleForLine(
      line,
      placedStops,
      'night',
      createSimulationMinuteOfDay(1385)
    );
    const afterMidnight = projectLineDepartureScheduleForLine(
      line,
      placedStops,
      'night',
      createSimulationMinuteOfDay(120)
    );

    expect(lateNight.timeBandStartMinute).toBe(1380);
    expect(lateNight.timeBandEndMinute).toBe(1440);
    expect(afterMidnight.timeBandStartMinute).toBe(0);
    expect(afterMidnight.timeBandEndMinute).toBe(360);
  });

});
