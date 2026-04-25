import { describe, expect, it, vi } from 'vitest';
import { createLineId } from '../types/line';
import { createStopId, type Stop } from '../types/stop';
import { completeLineRouting } from './completeLineRouting';
import { createRoutingProviderId, type RoutingAdapter } from './RoutingAdapter';

describe('completeLineRouting', () => {
  const lineId = createLineId('test-line');
  const stop1: Stop = { id: createStopId('s1'), position: { lng: 10, lat: 50 }, label: 'S1' };
  const stop2: Stop = { id: createStopId('s2'), position: { lng: 10.1, lat: 50.1 }, label: 'S2' };
  const placedStops = [stop1, stop2];
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

    const segments = await completeLineRouting({
      lineId,
      orderedStopIds,
      placedStops,
      routingAdapter: mockAdapter
    });

    expect(segments).toHaveLength(1);
    expect(segments[0].status).toBe('routed');
    expect(segments[0].distanceMeters).toBe(1000);
  });

  it('returns fallback segments when adapter fails', async () => {
    const mockAdapter: RoutingAdapter = {
      resolveSegment: vi.fn().mockResolvedValue({
        type: 'failed',
        provider: createRoutingProviderId('mock'),
        reason: 'NoRoute'
      })
    };

    const segments = await completeLineRouting({
      lineId,
      orderedStopIds,
      placedStops,
      routingAdapter: mockAdapter
    });

    expect(segments).toHaveLength(1);
    expect(segments[0].status).toBe('fallback-routed');
  });

  it('returns fallback segments when adapter throws', async () => {
    const mockAdapter: RoutingAdapter = {
      resolveSegment: vi.fn().mockRejectedValue(new Error('Network crash'))
    };

    const segments = await completeLineRouting({
      lineId,
      orderedStopIds,
      placedStops,
      routingAdapter: mockAdapter
    });

    expect(segments).toHaveLength(1);
    expect(segments[0].status).toBe('fallback-routed');
  });

  it('returns fallback segments on timeout', async () => {
    // Mocking timers to test timeout
    vi.useFakeTimers();

    const mockAdapter: RoutingAdapter = {
      resolveSegment: vi.fn().mockImplementation(() => new Promise(() => {})) // Never resolves
    };

    const routingPromise = completeLineRouting({
      lineId,
      orderedStopIds,
      placedStops,
      routingAdapter: mockAdapter
    });

    // Fast-forward time
    await vi.advanceTimersByTimeAsync(3000);

    const segments = await routingPromise;

    expect(segments).toHaveLength(1);
    expect(segments[0].status).toBe('fallback-routed');

    vi.useRealTimers();
  });
});
