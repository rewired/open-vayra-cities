import { describe, expect, it } from 'vitest';

import { createLineFrequencyMinutes, createLineId, type Line } from '../types/line';
import {
  createLineSegmentId,
  createRouteDistanceMeters,
  createRouteTravelMinutes,
  type LineRouteSegment
} from '../types/lineRoute';
import { createStopId, type Stop } from '../types/stop';
import { projectLineDepartureTimetable } from './lineDepartureTimetableProjection';
import { createRouteTravelTimeSeconds, type LineRouteBaseline } from '../types/routeBaseline';

const lineId = createLineId('line-1');
const stopA = createStopId('stop-a');
const stopB = createStopId('stop-b');
const stopC = createStopId('stop-c');

const placedStops: readonly Stop[] = [
  { id: stopA, label: 'Alpha', position: { lat: 53, lng: 10 } },
  { id: stopB, label: 'Bravo', position: { lat: 53.01, lng: 10.01 } },
  { id: stopC, label: 'Charlie', position: { lat: 53.02, lng: 10.02 } }
];

const createSegment = (
  id: string,
  fromStopId: Stop['id'],
  toStopId: Stop['id'],
  totalTravelMinutes: number,
  status: LineRouteSegment['status'] = 'routed'
): LineRouteSegment => ({
  id: createLineSegmentId(id),
  lineId,
  fromStopId,
  toStopId,
  orderedGeometry: [
    [10, 53],
    [10.01, 53.01]
  ],
  distanceMeters: createRouteDistanceMeters(1_200),
  inMotionTravelMinutes: createRouteTravelMinutes(totalTravelMinutes - 0.5),
  dwellMinutes: createRouteTravelMinutes(0.5),
  totalTravelMinutes: createRouteTravelMinutes(totalTravelMinutes),
  status
});

const createLine = (segments: readonly LineRouteSegment[]): Line => ({
  id: lineId,
  label: 'Line 1',
  stopIds: [stopA, stopB, stopC],
  topology: 'linear',
  servicePattern: 'one-way',
  routeSegments: segments,
  frequencyByTimeBand: {
    'morning-rush': { kind: 'frequency', headwayMinutes: createLineFrequencyMinutes(5) },
    'late-morning': { kind: 'frequency', headwayMinutes: createLineFrequencyMinutes(8) },
    midday: { kind: 'no-service' },
    afternoon: { kind: 'no-service' },
    'evening-rush': { kind: 'frequency', headwayMinutes: createLineFrequencyMinutes(10) },
    evening: { kind: 'no-service' },
    night: { kind: 'frequency', headwayMinutes: createLineFrequencyMinutes(20) }
  }
});

const routeBaseline: LineRouteBaseline = {
  lineId,
  segments: [
    {
      lineId,
      segmentIndex: 0,
      fromStopId: stopA,
      toStopId: stopB,
      geometry: [],
      distanceMeters: createRouteDistanceMeters(1_200),
      travelTimeSeconds: createRouteTravelTimeSeconds(180),
      status: 'routed',
      warnings: []
    },
    {
      lineId,
      segmentIndex: 1,
      fromStopId: stopB,
      toStopId: stopC,
      geometry: [],
      distanceMeters: createRouteDistanceMeters(1_200),
      travelTimeSeconds: createRouteTravelTimeSeconds(300),
      status: 'routed',
      warnings: []
    }
  ],
  totalDistanceMeters: createRouteDistanceMeters(2_400),
  totalTravelTimeSeconds: createRouteTravelTimeSeconds(480),
  status: 'routed',
  warnings: []
};

describe('projectLineDepartureTimetable', () => {
  it('projects frequency-band departures by time band and stop offset', () => {
    const line = createLine([
      createSegment('segment-1', stopA, stopB, 3),
      createSegment('segment-2', stopB, stopC, 5)
    ]);

    const result = projectLineDepartureTimetable(line, placedStops, 'morning-rush', routeBaseline);
    const originMorningBand = result.rows[0]?.cells[0];
    const secondStopMorningBand = result.rows[1]?.cells[0];

    expect(originMorningBand?.departureMinuteLabels.slice(0, 4)).toEqual(['00', '05', '10', '15']);
    expect(secondStopMorningBand?.departureMinuteLabels.slice(0, 4)).toEqual(['03', '08', '13', '18']);
  });

  it('marks no-service bands with quiet empty cells and no departures', () => {
    const line = createLine([
      createSegment('segment-1', stopA, stopB, 3),
      createSegment('segment-2', stopB, stopC, 5)
    ]);

    const result = projectLineDepartureTimetable(line, placedStops, 'midday', routeBaseline);
    const middayCell = result.rows[0]?.cells[2];

    expect(middayCell?.state).toBe('no-service');
    expect(middayCell?.departureMinuteLabels).toEqual([]);
  });

  it('handles night service departures within the night time band', () => {
    const line = createLine([
      createSegment('segment-1', stopA, stopB, 3),
      createSegment('segment-2', stopB, stopC, 5)
    ]);

    const result = projectLineDepartureTimetable(line, placedStops, 'night', routeBaseline);
    const nightCell = result.rows[0]?.cells[6];

    expect(nightCell?.departureMinuteLabels.slice(0, 3)).toEqual(['00', '20', '40']);
  });

  it('does not fabricate downstream stop times when segment-level timing is incomplete', () => {
    const line = createLine([createSegment('segment-1', stopA, stopB, 3)]);

    const result = projectLineDepartureTimetable(line, placedStops, 'morning-rush', routeBaseline);

    expect(result.rows[0]?.cells[0]?.state).toBe('departures');
    expect(result.rows[1]?.cells[0]?.state).toBe('unavailable');
    expect(result.rows[2]?.cells[0]?.state).toBe('unavailable');
    expect(result.hasUnavailableDownstreamStopTiming).toBe(true);
  });

  it('provides active-band summary text for player-facing compact status rendering', () => {
    const line = createLine([
      createSegment('segment-1', stopA, stopB, 3),
      createSegment('segment-2', stopB, stopC, 5)
    ]);

    const result = projectLineDepartureTimetable(line, placedStops, 'night', routeBaseline);

    expect(result.activeServiceSummary.activeWindowLabel).toBe('23:00–06:00');
    expect(result.activeServiceSummary.activeServiceLabel).toBe('every 20 min');
  });
});
