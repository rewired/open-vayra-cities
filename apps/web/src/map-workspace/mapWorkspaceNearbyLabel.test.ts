import { describe, it, expect, vi } from 'vitest';
import { resolveNearbyStreetLabelCandidate } from './mapWorkspaceStreetSnap';
import type { MapLibreMap } from './maplibreGlobal';

describe('resolveNearbyStreetLabelCandidate', () => {
  it('returns label from nearby rendered feature', () => {
    const mockMap = {
      project: vi.fn().mockReturnValue({ x: 100, y: 100 }),
      queryRenderedFeatures: vi.fn().mockReturnValue([
        { properties: { name: 'Mönckebergstraße' } }
      ])
    } as unknown as MapLibreMap;

    const result = resolveNearbyStreetLabelCandidate(mockMap, { lng: 10, lat: 50 });
    expect(result).toBe('Mönckebergstraße');
    expect(mockMap.queryRenderedFeatures).toHaveBeenCalled();
  });

  it('ranks features with road/street hints higher', () => {
    const mockMap = {
      project: vi.fn().mockReturnValue({ x: 100, y: 100 }),
      queryRenderedFeatures: vi.fn().mockReturnValue([
        { properties: { name: 'Generic Place' } },
        { 
          layer: { id: 'road-label' },
          properties: { name: 'Mönckebergstraße' } 
        }
      ])
    } as unknown as MapLibreMap;

    const result = resolveNearbyStreetLabelCandidate(mockMap, { lng: 10, lat: 50 });
    expect(result).toBe('Mönckebergstraße');
  });

  it('uses stable lexical tie-breaking for equal match strength', () => {
    const mockMap = {
      project: vi.fn().mockReturnValue({ x: 100, y: 100 }),
      queryRenderedFeatures: vi.fn().mockReturnValue([
        { properties: { name: 'B-Street' } },
        { properties: { name: 'A-Street' } }
      ])
    } as unknown as MapLibreMap;

    const result = resolveNearbyStreetLabelCandidate(mockMap, { lng: 10, lat: 50 });
    expect(result).toBe('A-Street');
  });

  it('probes multiple radii until a label is found', () => {
    const queryRenderedFeatures = vi.fn();
    // First probe (radius 12) finds nothing
    queryRenderedFeatures.mockReturnValueOnce([]);
    // Second probe (radius 24) finds a label
    queryRenderedFeatures.mockReturnValueOnce([
      { properties: { name: 'Further Away Street' } }
    ]);

    const mockMap = {
      project: vi.fn().mockReturnValue({ x: 100, y: 100 }),
      queryRenderedFeatures
    } as unknown as MapLibreMap;

    const result = resolveNearbyStreetLabelCandidate(mockMap, { lng: 10, lat: 50 });
    expect(result).toBe('Further Away Street');
    expect(queryRenderedFeatures).toHaveBeenCalledTimes(2);
  });

  it('returns null if no nearby feature has a name across all radii', () => {
    const mockMap = {
      project: vi.fn().mockReturnValue({ x: 100, y: 100 }),
      queryRenderedFeatures: vi.fn().mockReturnValue([
        { properties: { technical_id: '123' } }
      ])
    } as unknown as MapLibreMap;

    const result = resolveNearbyStreetLabelCandidate(mockMap, { lng: 10, lat: 50 });
    expect(result).toBeNull();
  });
});
