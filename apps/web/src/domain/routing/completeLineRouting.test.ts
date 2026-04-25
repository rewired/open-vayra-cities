import { describe, expect, it, vi } from 'vitest';
import { createLineId } from '../types/line';
import { createStopId, type Stop } from '../types/stop';
import { completeLineRouting } from './completeLineRouting';
import { createRoutingProviderId, type RoutingAdapter } from './RoutingAdapter';

describe('completeLineRouting', () => {
  const lineId = createLineId('test-line');
  const stop1: Stop = { id: createStopId('s1'), position: { lng: 10, lat: 50 }, label: 'S1' };
  const stop2: Stop = { id: createStopId('s2'), position: { lng: 10.1, lat: 50.1 }, label: 'S2' };
  const stop3: Stop = { id: createStopId('s3'), position: { lng: 10.2, lat: 50.2 }, label: 'S3' };
  const placedStops = [stop1, stop2, stop3];
  const orderedStopIds = [stop1.id, stop2.id];

  it('returns routed segments when adapter succeeds', async () => {
    const mockAdapter: RoutingAdapter = {
      resolveSegment: vi.fn().mockResolvedValue({
        type: 'resolved',
        provider: createRoutingProviderId('mock'),
        distanceMeters: 1000,
        durationSeconds: 120,
        geometry: { type: 'LineString', coordinates: [[10, 50], [10.1, 50.1]] }
      })
    };

    const result = await completeLineRouting({
      lineId,
      orderedStopIds,
      placedStops,
      topology: 'linear',
      servicePattern: 'one-way',
      routingAdapter: mockAdapter
    });

    expect(result.routeSegments).toHaveLength(1);
    expect(result.routeSegments[0]!.status).toBe('routed');
    expect(result.routeSegments[0]!.distanceMeters).toBe(1000);
    expect(result.reverseRouteSegments).toBeUndefined();
  });

  it('adds a closing segment for loop topology', async () => {
    const mockAdapter: RoutingAdapter = {
      resolveSegment: vi.fn().mockResolvedValue({
        type: 'resolved',
        provider: createRoutingProviderId('mock'),
        distanceMeters: 1000,
        durationSeconds: 120,
        geometry: { type: 'LineString', coordinates: [[10, 50], [10.1, 50.1]] }
      })
    };

    const result = await completeLineRouting({
      lineId,
      orderedStopIds: [stop1.id, stop2.id, stop3.id],
      placedStops,
      topology: 'loop',
      servicePattern: 'one-way',
      routingAdapter: mockAdapter
    });

    // 1->2, 2->3, 3->1
    expect(result.routeSegments).toHaveLength(3);
    expect(result.routeSegments[2]!.fromStopId).toBe(stop3.id);
    expect(result.routeSegments[2]!.toStopId).toBe(stop1.id);
  });

  it('computes reverse segments for bidirectional service', async () => {
    const mockAdapter: RoutingAdapter = {
      resolveSegment: vi.fn().mockImplementation((req) => Promise.resolve({
        type: 'resolved',
        provider: createRoutingProviderId('mock'),
        distanceMeters: 1000,
        durationSeconds: 120,
        geometry: { 
          type: 'LineString', 
          coordinates: [[req.originLng, req.originLat], [req.destinationLng, req.destinationLat]] 
        }
      }))
    };

    const result = await completeLineRouting({
      lineId,
      orderedStopIds,
      placedStops,
      topology: 'linear',
      servicePattern: 'bidirectional',
      routingAdapter: mockAdapter
    });

    expect(result.routeSegments).toHaveLength(1);
    expect(result.reverseRouteSegments!).toHaveLength(1);
    expect(result.routeSegments[0]!.fromStopId).toBe(stop1.id);
    expect(result.routeSegments[0]!.toStopId).toBe(stop2.id);
    expect(result.reverseRouteSegments![0]!.fromStopId).toBe(stop2.id);
    expect(result.reverseRouteSegments![0]!.toStopId).toBe(stop1.id);
  });

  it('returns fallback segments when adapter fails', async () => {
    const mockAdapter: RoutingAdapter = {
      resolveSegment: vi.fn().mockResolvedValue({
        type: 'failed',
        provider: createRoutingProviderId('mock'),
        reason: 'NoRoute'
      })
    };

    const result = await completeLineRouting({
      lineId,
      orderedStopIds,
      placedStops,
      topology: 'linear',
      servicePattern: 'one-way',
      routingAdapter: mockAdapter
    });

    expect(result.routeSegments).toHaveLength(1);
    expect(result.routeSegments[0]!.status).toBe('fallback-routed');
  });

  it('returns fallback segments on timeout', async () => {
    vi.useFakeTimers();

    const mockAdapter: RoutingAdapter = {
      resolveSegment: vi.fn().mockImplementation(() => new Promise(() => {}))
    };

    const routingPromise = completeLineRouting({
      lineId,
      orderedStopIds,
      placedStops,
      topology: 'linear',
      servicePattern: 'bidirectional',
      routingAdapter: mockAdapter
    });

    await vi.advanceTimersByTimeAsync(3000);

    const result = await routingPromise;

    expect(result.routeSegments).toHaveLength(1);
    expect(result.routeSegments[0]!.status).toBe('fallback-routed');
    expect(result.reverseRouteSegments!).toHaveLength(1);
    expect(result.reverseRouteSegments![0]!.status).toBe('fallback-routed');

    vi.useRealTimers();
  });
});
