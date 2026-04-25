import { readFileSync } from 'node:fs';
import path from 'node:path';

import { describe, expect, it } from 'vitest';

import { createSimulationMinuteOfDay } from '../simulation/simulationClock';
import {
  createLineFrequencyMinutes,
  createLineId,
  createUnsetLineServiceByTimeBand,
  type Line
} from '../types/line';
import type {
  DepartureMinute,
  LineDepartureScheduleNetworkProjection,
  MinutesUntilDeparture
} from '../types/lineDepartureScheduleProjection';
import {
  createLineSegmentId,
  createRouteDistanceMeters,
  createRouteTravelMinutes,
  type LineRouteSegment
} from '../types/lineRoute';
import type { SelectedLineExportPayload } from '../types/selectedLineExport';
import { createStopId } from '../types/stop';
import { projectLineDepartureScheduleNetwork } from './lineDepartureScheduleProjection';
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
    ...createUnsetLineServiceByTimeBand(),
    'morning-rush': { kind: 'frequency', headwayMinutes: createLineFrequencyMinutes(6) }
  }
};

const lineB: Line = {
  ...lineA,
  id: degradedLineId,
  label: 'Line B',
  routeSegments: [createSegment(1, degradedLineId, stopA, stopB, 5), createSegment(2, degradedLineId, stopB, stopC, 5)]
};

const toDepartureMinute = (minute: number): DepartureMinute => minute as DepartureMinute;
const toMinutesUntilDeparture = (minutes: number): MinutesUntilDeparture =>
  minutes as MinutesUntilDeparture;

const departureScheduleProjection: LineDepartureScheduleNetworkProjection = {
  lines: [
    {
      lineId,
      lineLabel: 'Line A',
      activeTimeBandId: 'morning-rush',
      status: 'available',
      unavailableReason: null,
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
      unavailableReason: null,
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

const createUnavailableProjection = (): LineDepartureScheduleNetworkProjection => ({
  lines: [
    {
      lineId,
      lineLabel: 'Line A',
      activeTimeBandId: 'morning-rush',
      status: 'unavailable',
      unavailableReason: 'active-band-unset',
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
});

const loadSelectedLineFixture = (): SelectedLineExportPayload => {
  const fixturePath = path.resolve(
    path.dirname(new URL(import.meta.url).pathname),
    '../../../../../data/fixtures/selected-line-exports/hamburg-line-1.v2.json'
  );

  return JSON.parse(readFileSync(fixturePath, 'utf8')) as SelectedLineExportPayload;
};

describe('projectLineVehicleNetwork', () => {
  it('returns no projected vehicles when departure projection is unavailable', () => {
    const result = projectLineVehicleNetwork(
      [lineA],
      createUnavailableProjection(),
      createSimulationMinuteOfDay(420),
      'morning-rush'
    );

    expect(result.lines[0]?.vehicles).toHaveLength(0);
    expect(result.summary.totalProjectedVehicleCount).toBe(0);
    expect(result.summary.totalDegradedProjectedVehicleCount).toBe(0);
  });

  it('keeps no-service unavailable projections at zero vehicles with explicit note', () => {
    const noServiceProjection: LineDepartureScheduleNetworkProjection = {
      lines: [
        {
          ...createUnavailableProjection().lines[0],
          unavailableReason: 'active-band-no-service',
          serviceProjectionStatus: 'configured'
        }
      ],
      summary: createUnavailableProjection().summary
    };

    const result = projectLineVehicleNetwork(
      [lineA],
      noServiceProjection,
      createSimulationMinuteOfDay(420),
      'morning-rush'
    );

    expect(result.lines[0]?.vehicles).toEqual([]);
    expect(result.lines[0]?.note).toContain('no-service');
    expect(result.summary.totalProjectedVehicleCount).toBe(0);
    expect(result.summary.totalDegradedProjectedVehicleCount).toBe(0);
  });

  it('applies before/equal/inside/after departure window filtering', () => {
    const scheduleAtBoundary: LineDepartureScheduleNetworkProjection = {
      ...departureScheduleProjection,
      lines: [
        {
          ...departureScheduleProjection.lines[0],
          departureMinutes: [toDepartureMinute(409), toDepartureMinute(410), toDepartureMinute(419), toDepartureMinute(420)]
        }
      ]
    };

    const result = projectLineVehicleNetwork(
      [lineA],
      scheduleAtBoundary,
      createSimulationMinuteOfDay(420),
      'morning-rush'
    );

    expect(result.lines[0]?.vehicles.map((vehicle) => vehicle.departureMinute)).toEqual([419, 420]);
  });

  it('derives elapsed route minutes and route progress ratio from active departures', () => {
    const result = projectLineVehicleNetwork(
      [lineA],
      departureScheduleProjection,
      createSimulationMinuteOfDay(420),
      'morning-rush'
    );

    const firstVehicle = result.lines[0]?.vehicles[0];
    const secondVehicle = result.lines[0]?.vehicles[1];

    expect(firstVehicle?.elapsedMinutes).toBe(6);
    expect(firstVehicle?.routeProgressRatio).toBeCloseTo(0.6);
    expect(secondVehicle?.elapsedMinutes).toBe(0);
    expect(secondVehicle?.routeProgressRatio).toBe(0);
  });

  it('selects current segment by cumulative timing and derives segment progress ratio', () => {
    const result = projectLineVehicleNetwork(
      [lineA],
      departureScheduleProjection,
      createSimulationMinuteOfDay(420),
      'morning-rush'
    );

    const firstVehicle = result.lines[0]?.vehicles[0];

    expect(firstVehicle?.currentSegmentId).toBe(lineA.routeSegments[1]?.id);
    expect(firstVehicle?.segmentProgressRatio).toBeCloseTo((6 - 4) / 6);
    expect(firstVehicle?.coordinate).not.toBeNull();
  });

  it('maps degraded departure projection status to degraded-projected vehicles and degraded summary counts', () => {
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
    expect(result.summary.totalProjectedVehicleCount).toBe(2);
    expect(result.summary.totalDegradedProjectedVehicleCount).toBe(1);
    expect(result.summary.linesWithProjectedVehiclesCount).toBe(2);
  });

  it('keeps all-null fixture-style frequencies at zero vehicles unless in-memory frequency overlay is applied', () => {
    const payload = loadSelectedLineFixture();
    const lineFromFixture: Line = {
      id: payload.line.id,
      label: payload.line.label,
      stopIds: payload.line.orderedStopIds,
      routeSegments: payload.line.routeSegments,
      frequencyByTimeBand: createUnsetLineServiceByTimeBand()
    };

    const departureWithoutOverlay = projectLineDepartureScheduleNetwork(
      [lineFromFixture],
      payload.stops,
      'morning-rush',
      createSimulationMinuteOfDay(420)
    );
    const vehicleWithoutOverlay = projectLineVehicleNetwork(
      [lineFromFixture],
      departureWithoutOverlay,
      createSimulationMinuteOfDay(420),
      'morning-rush'
    );

    expect(vehicleWithoutOverlay.summary.totalProjectedVehicleCount).toBe(0);

    const overlaidLine: Line = {
      ...lineFromFixture,
      frequencyByTimeBand: {
        ...lineFromFixture.frequencyByTimeBand,
        'morning-rush': { kind: 'frequency', headwayMinutes: createLineFrequencyMinutes(10) }
      }
    };

    const departureWithOverlay = projectLineDepartureScheduleNetwork(
      [overlaidLine],
      payload.stops,
      'morning-rush',
      createSimulationMinuteOfDay(420)
    );
    const vehicleWithOverlay = projectLineVehicleNetwork(
      [overlaidLine],
      departureWithOverlay,
      createSimulationMinuteOfDay(420),
      'morning-rush'
    );

    expect(
      vehicleWithOverlay.summary.totalProjectedVehicleCount +
        vehicleWithOverlay.summary.totalDegradedProjectedVehicleCount
    ).toBeGreaterThan(0);
  });

  it('does not recompute or mutate route segments during vehicle projection', () => {
    const routeSegmentsBefore = JSON.stringify(lineA.routeSegments);
    const linesBefore = JSON.stringify([lineA, lineB]);
    const projectionBefore = JSON.stringify(departureScheduleProjection);

    projectLineVehicleNetwork([lineA, lineB], departureScheduleProjection, createSimulationMinuteOfDay(420), 'morning-rush');

    expect(JSON.stringify(lineA.routeSegments)).toBe(routeSegmentsBefore);
    expect(JSON.stringify([lineA, lineB])).toBe(linesBefore);
    expect(JSON.stringify(departureScheduleProjection)).toBe(projectionBefore);
  });
});
