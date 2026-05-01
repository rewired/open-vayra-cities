import { describe, it, expect } from 'vitest';
import { buildDemandGapOverlayFeatureCollection } from './demandGapOverlayGeoJson';
import type { DemandGapRankingProjection } from '../domain/projection/demandGapProjection';
import type { TimeBandId } from '../domain/types/timeBand';

describe('demandGapOverlayGeoJson', () => {
  const mockProjection: DemandGapRankingProjection = {
    status: 'ready',
    activeTimeBandId: 'morning-peak' as TimeBandId,
    uncapturedResidentialGaps: [
      {
        id: 'gap-1',
        kind: 'uncaptured-residential',
        position: { lng: 13.4, lat: 52.5 },
        activeWeight: 10,
        baseWeight: 10,
        nearestStopDistanceMeters: null,
        capturingStopCount: 0,
        note: 'Note 1'
      }
    ],
    capturedButUnservedResidentialGaps: [
      {
        id: 'gap-2',
        kind: 'captured-unserved-residential',
        position: { lng: 13.41, lat: 52.51 },
        activeWeight: 5,
        baseWeight: 5,
        nearestStopDistanceMeters: 200,
        capturingStopCount: 1,
        note: 'Note 2'
      }
    ],
    capturedButUnreachableWorkplaceGaps: [
      {
        id: 'gap-3',
        kind: 'captured-unreachable-workplace',
        position: { lng: 13.42, lat: 52.52 },
        activeWeight: 8,
        baseWeight: 8,
        nearestStopDistanceMeters: 150,
        capturingStopCount: 2,
        note: 'Note 3'
      }
    ],
    summary: {
      totalGapCount: 3
    }
  };

  it('returns an empty collection when projection is null', () => {
    const result = buildDemandGapOverlayFeatureCollection(null);
    expect(result.type).toBe('FeatureCollection');
    expect(result.features).toHaveLength(0);
  });

  it('returns an empty collection when projection is unavailable', () => {
    const result = buildDemandGapOverlayFeatureCollection({
      status: 'unavailable',
      activeTimeBandId: 'morning-peak' as TimeBandId,
      uncapturedResidentialGaps: [],
      capturedButUnservedResidentialGaps: [],
      capturedButUnreachableWorkplaceGaps: [],
      summary: { totalGapCount: 0 }
    });
    expect(result.features).toHaveLength(0);
  });

  it('flattens all gap categories into one collection', () => {
    const result = buildDemandGapOverlayFeatureCollection(mockProjection);
    expect(result.features).toHaveLength(3);
    
    const ids = result.features.map(f => f.properties.gapId);
    expect(ids).toContain('gap-1');
    expect(ids).toContain('gap-2');
    expect(ids).toContain('gap-3');
  });

  it('preserves essential properties for MapLibre rendering', () => {
    const result = buildDemandGapOverlayFeatureCollection(mockProjection);
    const feature1 = result.features.find(f => f.properties.gapId === 'gap-1')!;
    
    expect(feature1.geometry.type).toBe('Point');
    expect(feature1.geometry.coordinates).toEqual([13.4, 52.5]);
    expect(feature1.properties.kind).toBe('uncaptured-residential');
    expect(feature1.properties.activeWeight).toBe(10);
    expect(feature1.properties.nearestStopDistanceMeters).toBeNull();
  });
});
