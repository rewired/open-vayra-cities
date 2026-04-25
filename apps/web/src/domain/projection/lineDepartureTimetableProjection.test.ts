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
import type { RouteBaselineAggregateMetrics } from './useNetworkPlanningProjections';

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

const routeBaselineMetrics: RouteBaselineAggregateMetrics = {
  segmentCount: 2,
  totalDistanceMeters: 2_400,
  totalInMotionMinutes: 7,
  totalDwellMinutes: 1,
  totalLineMinutes: 8,
  hasFallbackSegments: false
};

describe('projectLineDepartureTimetable', () => {
  it('projects frequency-band departures by hour and stop offset', () => {
    const line = createLine([
      createSegment('segment-1', stopA, stopB, 3),
      createSegment('segment-2', stopB, stopC, 5)
    ]);

    const result = projectLineDepartureTimetable(line, placedStops, 'morning-rush', routeBaselineMetrics);
    const originMorningHour = result.rows[0]?.cells[6];
    const secondStopMorningHour = result.rows[1]?.cells[6];

    expect(originMorningHour?.departureMinutes.slice(0, 4)).toEqual([0, 5, 10, 15]);
    expect(secondStopMorningHour?.departureMinutes.slice(0, 4)).toEqual([3, 8, 13, 18]);
  });

  it('marks no-service bands with quiet empty cells and no departures', () => {
    const line = createLine([
      createSegment('segment-1', stopA, stopB, 3),
      createSegment('segment-2', stopB, stopC, 5)
    ]);

    const result = projectLineDepartureTimetable(line, placedStops, 'midday', routeBaselineMetrics);
    const middayCell = result.rows[0]?.cells[12];

    expect(middayCell?.state).toBe('no-service');
    expect(middayCell?.departureMinutes).toEqual([]);
  });

  it('handles night service across midnight within 23:00 and 00:00 hours', () => {
    const line = createLine([
      createSegment('segment-1', stopA, stopB, 3),
      createSegment('segment-2', stopB, stopC, 5)
    ]);

    const result = projectLineDepartureTimetable(line, placedStops, 'night', routeBaselineMetrics);
    const hour23 = result.rows[0]?.cells[23];
    const hour00 = result.rows[0]?.cells[0];

    expect(hour23?.departureMinutes.slice(0, 3)).toEqual([0, 20, 40]);
    expect(hour00?.departureMinutes.slice(0, 3)).toEqual([0, 20, 40]);
  });

  it('does not fabricate downstream stop times when segment-level timing is incomplete', () => {
    const line = createLine([createSegment('segment-1', stopA, stopB, 3)]);

    const result = projectLineDepartureTimetable(line, placedStops, 'morning-rush', routeBaselineMetrics);

    expect(result.rows[0]?.cells[6]?.state).toBe('departures');
    expect(result.rows[1]?.cells[6]?.state).toBe('unavailable');
    expect(result.rows[2]?.cells[6]?.state).toBe('unavailable');
    expect(result.hasUnavailableDownstreamStopTiming).toBe(true);
  });

  it('provides active-band summary text for player-facing compact status rendering', () => {
    const line = createLine([
      createSegment('segment-1', stopA, stopB, 3),
      createSegment('segment-2', stopB, stopC, 5)
    ]);

    const result = projectLineDepartureTimetable(line, placedStops, 'night', routeBaselineMetrics);

    expect(result.activeServiceSummary.activeWindowLabel).toBe('23:00–06:00');
    expect(result.activeServiceSummary.activeServiceLabel).toBe('every 20 min');
  });
});
