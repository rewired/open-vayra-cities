import { describe, expect, it } from 'vitest';
import { createLineId, createNoServiceLineServiceByTimeBand } from '../types/line';
import { createLineSegmentId, createRouteDistanceMeters, createRouteTravelMinutes } from '../types/lineRoute';
import { createStopId } from '../types/stop';
import { resolveLineRouteBaseline } from './routeBaselineProjection';

describe('routeBaselineProjection', () => {
  it('resolves empty baseline when line has fewer than two stops', () => {
    const result = resolveLineRouteBaseline(
      {
        id: createLineId('l1'),
        label: 'Test Line',
        stopIds: [createStopId('s1')],
        routeSegments: [],
        frequencyByTimeBand: createNoServiceLineServiceByTimeBand()
      },
      [{ id: createStopId('s1'), position: { lng: 0, lat: 0 } }]
    );

    expect(result.segments).toHaveLength(0);
    expect(result.status).toBe('unresolved');
    expect(result.warnings).toEqual([{ type: 'all-unresolved' }]);
  });

  it('resolves fallback segments when valid route segments are present', () => {
    const s1 = createStopId('s1');
    const s2 = createStopId('s2');
    const s3 = createStopId('s3');

    const result = resolveLineRouteBaseline(
      {
        id: createLineId('l1'),
        label: 'Test Line',
        stopIds: [s1, s2, s3],
        frequencyByTimeBand: createNoServiceLineServiceByTimeBand(),
        routeSegments: [
          {
            id: createLineSegmentId('seg1'),
            lineId: createLineId('l1'),
            fromStopId: s1,
            toStopId: s2,
            orderedGeometry: [[0, 0], [1, 1]],
            distanceMeters: createRouteDistanceMeters(100),
            inMotionTravelMinutes: createRouteTravelMinutes(1),
            dwellMinutes: createRouteTravelMinutes(0.5),
            totalTravelMinutes: createRouteTravelMinutes(1.5),
            status: 'fallback-routed'
          },
          {
            id: createLineSegmentId('seg2'),
            lineId: createLineId('l1'),
            fromStopId: s2,
            toStopId: s3,
            orderedGeometry: [[1, 1], [2, 2]],
            distanceMeters: createRouteDistanceMeters(200),
            inMotionTravelMinutes: createRouteTravelMinutes(2),
            dwellMinutes: createRouteTravelMinutes(0.5),
            totalTravelMinutes: createRouteTravelMinutes(2.5),
            status: 'fallback-routed'
          }
        ]
      },
      [
        { id: s1, position: { lng: 0, lat: 0 } },
        { id: s2, position: { lng: 1, lat: 1 } },
        { id: s3, position: { lng: 2, lat: 2 } }
      ]
    );

    expect(result.status).toBe('fallback-routed');
    expect(result.totalDistanceMeters).toBe(300);
    // 1.5 min * 60 = 90, 2.5 min * 60 = 150. Total = 240
    expect(result.totalTravelTimeSeconds).toBe(240);
    expect(result.segments).toHaveLength(2);

    expect(result.segments[0]).toMatchObject({
      segmentIndex: 0,
      fromStopId: s1,
      toStopId: s2,
      distanceMeters: 100,
      travelTimeSeconds: 90,
      status: 'fallback-routed',
      warnings: [{ type: 'fallback-routing-only' }]
    });

    expect(result.segments[1]).toMatchObject({
      segmentIndex: 1,
      fromStopId: s2,
      toStopId: s3,
      distanceMeters: 200,
      travelTimeSeconds: 150,
      status: 'fallback-routed',
      warnings: [{ type: 'fallback-routing-only' }]
    });
  });

  it('marks segments unresolved if placed stops are missing', () => {
    const s1 = createStopId('s1');
    const s2 = createStopId('s2');

    const result = resolveLineRouteBaseline(
      {
        id: createLineId('l1'),
        label: 'Test Line',
        stopIds: [s1, s2],
        frequencyByTimeBand: createNoServiceLineServiceByTimeBand(),
        routeSegments: [
          {
            id: createLineSegmentId('seg1'),
            lineId: createLineId('l1'),
            fromStopId: s1,
            toStopId: s2,
            orderedGeometry: [[0, 0], [1, 1]],
            distanceMeters: createRouteDistanceMeters(100),
            inMotionTravelMinutes: createRouteTravelMinutes(1),
            dwellMinutes: createRouteTravelMinutes(0.5),
            totalTravelMinutes: createRouteTravelMinutes(1.5),
            status: 'fallback-routed'
          }
        ]
      },
      [{ id: s1, position: { lng: 0, lat: 0 } }] // s2 is missing
    );

    expect(result.status).toBe('unresolved');
    expect(result.segments[0]?.status).toBe('unresolved');
    expect(result.segments[0]?.warnings).toEqual([{ type: 'missing-stop-position' }]);
  });

  it('marks segments unresolved if route segment data is missing for placed stops', () => {
    const s1 = createStopId('s1');
    const s2 = createStopId('s2');

    const result = resolveLineRouteBaseline(
      {
        id: createLineId('l1'),
        label: 'Test Line',
        stopIds: [s1, s2],
        frequencyByTimeBand: createNoServiceLineServiceByTimeBand(),
        routeSegments: [] // Missing segment data
      },
      [
        { id: s1, position: { lng: 0, lat: 0 } },
        { id: s2, position: { lng: 1, lat: 1 } }
      ]
    );

    expect(result.status).toBe('unresolved');
    expect(result.segments[0]?.status).toBe('unresolved');
    expect(result.segments[0]?.warnings).toEqual([{ type: 'missing-route-segment' }]);
  });
});
