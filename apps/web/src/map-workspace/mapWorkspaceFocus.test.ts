import { describe, expect, it } from 'vitest';
import { createStopId, type Stop } from '../domain/types/stop';
import { createLineId, type Line, createNoServiceLineServiceByTimeBand } from '../domain/types/line';
import { createLineSegmentId, type LineRouteSegment, createRouteDistanceMeters, createRouteTravelMinutes } from '../domain/types/lineRoute';
import { resolveLineFocusBounds } from './mapWorkspaceFocus';

const stopAId = createStopId('stop-a');
const stopBId = createStopId('stop-b');
const stopCId = createStopId('stop-c');
const lineId = createLineId('line-1');

const stops: readonly Stop[] = [
  { id: stopAId, position: { lng: 9.99, lat: 53.55 }, label: 'Stop A' },
  { id: stopBId, position: { lng: 10.01, lat: 53.56 }, label: 'Stop B' },
  { id: stopCId, position: { lng: 10.03, lat: 53.57 }, label: 'Stop C' }
];

const buildRouteSegment = ({
  id,
  fromStopId,
  toStopId,
  orderedGeometry
}: {
  readonly id: string;
  readonly fromStopId: Stop['id'];
  readonly toStopId: Stop['id'];
  readonly orderedGeometry: readonly (readonly [number, number])[];
}): LineRouteSegment => ({
  id: createLineSegmentId(id),
  lineId,
  fromStopId,
  toStopId,
  orderedGeometry,
  distanceMeters: createRouteDistanceMeters(1000),
  inMotionTravelMinutes: createRouteTravelMinutes(2),
  dwellMinutes: createRouteTravelMinutes(1),
  totalTravelMinutes: createRouteTravelMinutes(3),
  status: 'routed'
});

const buildLine = ({
  routeSegments = [],
  stopIds = [stopAId, stopBId, stopCId]
}: {
  readonly routeSegments?: readonly LineRouteSegment[];
  readonly stopIds?: readonly Stop['id'][];
} = {}): Line => ({
  id: lineId,
  label: 'Line 1',
  stopIds,
  topology: 'linear',
  servicePattern: 'one-way',
  routeSegments,
  frequencyByTimeBand: createNoServiceLineServiceByTimeBand()
});

describe('resolveLineFocusBounds', () => {
  it('resolves bounds using route segment geometry', () => {
    const line = buildLine({
      routeSegments: [
        buildRouteSegment({
          id: 'segment-1',
          fromStopId: stopAId,
          toStopId: stopBId,
          orderedGeometry: [
            [9.99, 53.55],
            [10.0, 53.555],
            [10.01, 53.56]
          ]
        })
      ]
    });

    const bounds = resolveLineFocusBounds(line, stops);
    expect(bounds).toEqual([
      [9.99, 53.55],
      [10.01, 53.56]
    ]);
  });

  it('falls back to stop positions when route segments are empty', () => {
    const line = buildLine({ routeSegments: [] });
    const bounds = resolveLineFocusBounds(line, stops);
    expect(bounds).toEqual([
      [9.99, 53.55],
      [10.03, 53.57]
    ]);
  });

  it('returns null when neither geometry nor stops are available', () => {
    const line = buildLine({ routeSegments: [], stopIds: [] });
    const bounds = resolveLineFocusBounds(line, stops);
    expect(bounds).toBeNull();
  });
});
