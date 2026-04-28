import { describe, expect, it, vi } from 'vitest';
import { createStopId, type Stop } from '../domain/types/stop';
import { createRoutingProviderId, type RoutingAdapter } from '../domain/routing/RoutingAdapter';
import { prepareCompletedDraftLine } from './mapWorkspaceLineCompletion';
import type { Line } from '../domain/types/line';
import { createLineId, createNoServiceLineServiceByTimeBand } from '../domain/types/line';
import { LINE_BUILD_PLACEHOLDER_LABEL_PREFIX } from '../domain/constants/lineBuilding';

describe('prepareCompletedDraftLine', () => {
  const stop1: Stop = { id: createStopId('stop-1'), position: { lng: 10, lat: 50 }, label: 'S1' };
  const stop2: Stop = { id: createStopId('stop-2'), position: { lng: 10.1, lat: 50.1 }, label: 'S2' };
  const placedStops = [stop1, stop2];
  const draftStopIds = [stop1.id, stop2.id];

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

  it('prepares a canonical Line successfully', async () => {
    const line = await prepareCompletedDraftLine({
      draftStopIds,
      placedStops,
      existingLines: [],
      topology: 'linear',
      servicePattern: 'one-way',
      routingAdapter: mockAdapter
    });

    expect(line.id).toBe('line-1');
    expect(line.stopIds).toEqual(draftStopIds);
    expect(line.routeSegments).toHaveLength(1);
    expect(line.frequencyByTimeBand).toBeDefined();
  });

  it('assigns unique labels avoiding existing line labels', async () => {
    const existingLine: Line = {
      id: createLineId('line-1'),
      label: 'S1 → S2',
      stopIds: [],
      topology: 'linear',
      servicePattern: 'one-way',
      routeSegments: [],
      frequencyByTimeBand: createNoServiceLineServiceByTimeBand()
    };

    const line = await prepareCompletedDraftLine({
      draftStopIds,
      placedStops,
      existingLines: [existingLine],
      topology: 'linear',
      servicePattern: 'one-way',
      routingAdapter: mockAdapter
    });

    expect(line.id).toBe('line-2');
    expect(line.label).not.toBe('S1 → S2');
    expect(line.label).toContain('S1 → S2');

  });

  it('falls back to placeholder label when stop-label generation returns null', async () => {
    const stopWithoutLabel: Stop = { id: createStopId('stop-3'), position: { lng: 10, lat: 50 }, label: '' };
    const stop2: Stop = { id: createStopId('stop-2'), position: { lng: 10.1, lat: 50.1 }, label: 'S2' };

    const line = await prepareCompletedDraftLine({
      draftStopIds: [stopWithoutLabel.id, stop2.id],
      placedStops: [stopWithoutLabel, stop2],
      existingLines: [],
      topology: 'linear',
      servicePattern: 'one-way',
      routingAdapter: mockAdapter
    });

    expect(line.label).toBe(`${LINE_BUILD_PLACEHOLDER_LABEL_PREFIX} 1`);
  });

  it('throws if stop sequence is shorter than minimum requirements', async () => {
    await expect(
      prepareCompletedDraftLine({
        draftStopIds: [stop1.id],
        placedStops,
        existingLines: [],
        topology: 'linear',
        servicePattern: 'one-way',
        routingAdapter: mockAdapter
      })
    ).rejects.toThrow('Cannot complete line');
  });
});
