import { describe, expect, it } from 'vitest';

import { createSimulationMinuteOfDay } from '../simulation/simulationClock';
import { createLineFrequencyMinutes, createLineId, type Line } from '../types/line';
import {
  createLineSegmentId,
  createRouteDistanceMeters,
  createRouteTravelMinutes,
  type LineRouteSegment
} from '../types/lineRoute';
import { createStopId } from '../types/stop';
import type {
  DepartureMinute,
  LineDepartureScheduleNetworkProjection,
  MinutesUntilDeparture
} from '../types/lineDepartureScheduleProjection';
import { projectLineVehicleNetwork } from './lineVehicleProjection';

const stopA = createStopId('stop-a');
const stopB = createStopId('stop-b');
const stopC = createStopId('stop-c');
const lineId = createLineId('line-a');
const degradedLineId = createLineId('line-b');

const createSegment = (
  segmentNumber: number,
  parentLineId: Line['id'],
  fromStopId: LineRouteSegment['fromStopId'],
  toStopId: LineRouteSegment['toStopId'],
  totalTravelMinutes: number
): LineRouteSegment => ({
  id: createLineSegmentId(`segment-${parentLineId}-${segmentNumber}`),
  lineId: parentLineId,
  fromStopId,
  toStopId,
  orderedGeometry: [
    [10 + segmentNumber * 0.01, 53 + segmentNumber * 0.01],
    [10.005 + segmentNumber * 0.01, 53.005 + segmentNumber * 0.01]
  ],
  distanceMeters: createRouteDistanceMeters(1000),
  inMotionTravelMinutes: createRouteTravelMinutes(totalTravelMinutes - 0.5),
  dwellMinutes: createRouteTravelMinutes(0.5),
  totalTravelMinutes: createRouteTravelMinutes(totalTravelMinutes),
  status: 'routed'
});

const lineA: Line = {
  id: lineId,
  label: 'Line A',
  stopIds: [stopA, stopB, stopC],
  routeSegments: [createSegment(1, lineId, stopA, stopB, 4), createSegment(2, lineId, stopB, stopC, 6)],
  frequencyByTimeBand: {
    'morning-rush': createLineFrequencyMinutes(6)
  }
};

const toDepartureMinute = (minute: number): DepartureMinute => minute as DepartureMinute;
const toMinutesUntilDeparture = (minutes: number): MinutesUntilDeparture =>
  minutes as MinutesUntilDeparture;

const lineB: Line = {
  ...lineA,
  id: degradedLineId,
  label: 'Line B',
  routeSegments: [createSegment(1, degradedLineId, stopA, stopB, 5), createSegment(2, degradedLineId, stopB, stopC, 5)]
};

const departureScheduleProjection: LineDepartureScheduleNetworkProjection = {
  lines: [
    {
      lineId,
      lineLabel: 'Line A',
      activeTimeBandId: 'morning-rush',
      status: 'available',
      currentBandHeadwayMinutes: 6,
      timeBandStartMinute: 360,
      timeBandEndMinute: 540,
      departureMinutes: [toDepartureMinute(414), toDepartureMinute(420), toDepartureMinute(426)],
      departureCount: 3,
      previousDepartureMinute: toDepartureMinute(414),
      nextDepartureMinute: toDepartureMinute(420),
      minutesUntilNextDeparture: toMinutesUntilDeparture(0),
      totalRouteTravelMinutes: 10,
      serviceProjectionStatus: 'configured'
    },
    {
      lineId: degradedLineId,
      lineLabel: 'Line B',
      activeTimeBandId: 'morning-rush',
      status: 'degraded',
      currentBandHeadwayMinutes: 10,
      timeBandStartMinute: 360,
      timeBandEndMinute: 540,
      departureMinutes: [toDepartureMinute(420)],
      departureCount: 1,
      previousDepartureMinute: toDepartureMinute(420),
      nextDepartureMinute: toDepartureMinute(420),
      minutesUntilNextDeparture: toMinutesUntilDeparture(0),
      totalRouteTravelMinutes: 10,
      serviceProjectionStatus: 'degraded',
      notes: [{ code: 'fallback-only-routing', severity: 'warning', message: 'Fallback-only route segments.' }]
    }
  ],
  summary: {
    totalCompletedLineCount: 2,
    activeTimeBandId: 'morning-rush',
    availableLineCount: 1,
    degradedLineCount: 1,
    unavailableLineCount: 0,
    totalTheoreticalDepartureCount: 4
  }
};

describe('projectLineVehicleNetwork', () => {
  it('projects only active departures into current-minute vehicle markers', () => {
    const result = projectLineVehicleNetwork(
      [lineA, lineB],
      departureScheduleProjection,
      createSimulationMinuteOfDay(420),
      'morning-rush'
    );

    const lineAProjection = result.lines.find((lineProjection) => lineProjection.lineId === lineId);

    expect(lineAProjection?.vehicles).toHaveLength(2);
    expect(lineAProjection?.vehicles.map((vehicle) => vehicle.departureMinute)).toEqual([414, 420]);
  });

  it('maps degraded departure projection status to degraded-projected vehicles', () => {
    const result = projectLineVehicleNetwork(
      [lineA, lineB],
      departureScheduleProjection,
      createSimulationMinuteOfDay(420),
      'morning-rush'
    );

    const lineBProjection = result.lines.find((lineProjection) => lineProjection.lineId === degradedLineId);

    expect(lineBProjection?.vehicles).toHaveLength(1);
    expect(lineBProjection?.vehicles[0]?.status).toBe('degraded-projected');
    expect(lineBProjection?.vehicles[0]?.degradedNote).toContain('fallback');
  });

  it('returns line-level unavailable notes without creating markers for unavailable lines', () => {
    const unavailableProjection: LineDepartureScheduleNetworkProjection = {
      lines: [
        {
          lineId,
          lineLabel: 'Line A',
          activeTimeBandId: 'morning-rush',
          status: 'unavailable',
          currentBandHeadwayMinutes: null,
          timeBandStartMinute: 360,
          timeBandEndMinute: 540,
          departureMinutes: [],
          departureCount: 0,
          previousDepartureMinute: null,
          nextDepartureMinute: null,
          minutesUntilNextDeparture: null,
          totalRouteTravelMinutes: 10,
          serviceProjectionStatus: 'not-configured'
        }
      ],
      summary: {
        totalCompletedLineCount: 1,
        activeTimeBandId: 'morning-rush',
        availableLineCount: 0,
        degradedLineCount: 0,
        unavailableLineCount: 1,
        totalTheoreticalDepartureCount: 0
      }
    };

    const result = projectLineVehicleNetwork(
      [lineA],
      unavailableProjection,
      createSimulationMinuteOfDay(420),
      'morning-rush'
    );

    expect(result.lines[0]?.vehicles).toHaveLength(0);
    expect(result.lines[0]?.note).toContain('Unavailable');
  });

  it('preserves input object immutability for line and departure projection inputs', () => {
    const linesBefore = JSON.stringify([lineA, lineB]);
    const projectionBefore = JSON.stringify(departureScheduleProjection);

    projectLineVehicleNetwork([lineA, lineB], departureScheduleProjection, createSimulationMinuteOfDay(420), 'morning-rush');

    expect(JSON.stringify([lineA, lineB])).toBe(linesBefore);
    expect(JSON.stringify(departureScheduleProjection)).toBe(projectionBefore);
  });
});
