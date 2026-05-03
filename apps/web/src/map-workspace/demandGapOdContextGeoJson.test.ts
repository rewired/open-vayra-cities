import { describe, it, expect } from 'vitest';
import { buildDemandGapOdContextFeatureCollection } from './demandGapOdContextGeoJson';
import type { DemandGapOdContextProjection } from '../domain/projection/demandGapOdContextProjection';

describe('demandGapOdContextGeoJson', () => {
  const mockReadyProjection: DemandGapOdContextProjection = {
    status: 'ready',
    activeTimeBandId: 'morning-rush',
    focusedGapId: 'gap-1',
    focusedGapKind: 'uncaptured-residential',
    problemSide: 'origin',
    focusedPosition: { lng: 10, lat: 20 },
    candidates: [
      {
        id: 'workplace-1',
        role: 'destination',
        demandClass: 'workplace',
        position: { lng: 10.1, lat: 20.1 },
        activeWeight: 50,
        baseWeight: 50,
        distanceMeters: 1000
      },
      {
        id: 'workplace-2',
        role: 'destination',
        demandClass: 'workplace',
        position: { lng: 10.2, lat: 20.2 },
        activeWeight: 30,
        baseWeight: 30,
        distanceMeters: 2000
      }
    ],
    summary: {
      candidateCount: 2,
      topActiveWeight: 50
    },
    guidance: 'Test guidance'
  };

  it('returns empty collection when projection is null', () => {
    const result = buildDemandGapOdContextFeatureCollection(null);
    expect(result.features).toHaveLength(0);
  });

  it('returns empty collection when projection is unavailable', () => {
    const result = buildDemandGapOdContextFeatureCollection({
      ...mockReadyProjection,
      status: 'unavailable'
    });
    expect(result.features).toHaveLength(0);
  });

  it('returns empty collection when there are no candidates', () => {
    const result = buildDemandGapOdContextFeatureCollection({
      ...mockReadyProjection,
      candidates: []
    });
    expect(result.features).toHaveLength(0);
  });

  it('emits deterministic LineString features for origin problem side', () => {
    const result = buildDemandGapOdContextFeatureCollection(mockReadyProjection);
    expect(result.features).toHaveLength(2);

    const feature1 = result.features[0]!;
    expect(feature1.geometry.type).toBe('LineString');
    // Origin -> Destination
    expect(feature1.geometry.coordinates).toEqual([
      [10, 20], // Focused gap
      [10.1, 20.1] // Workplace
    ]);

    expect(feature1.properties.focusedGapId).toBe('gap-1');
    expect(feature1.properties.candidateId).toBe('workplace-1');
    expect(feature1.properties.problemSide).toBe('origin');
    expect(feature1.properties.candidateRole).toBe('destination');
    expect(feature1.properties.candidateDemandClass).toBe('workplace');
    expect(feature1.properties.activeWeight).toBe(50);
    expect(feature1.properties.distanceMeters).toBe(1000);
    expect(feature1.properties.ordinal).toBe(1);

    const feature2 = result.features[1]!;
    expect(feature2.properties.ordinal).toBe(2);
  });

  it('emits deterministic LineString features for destination problem side', () => {
    const destProjection: DemandGapOdContextProjection = {
      ...mockReadyProjection,
      focusedGapKind: 'captured-unreachable-workplace',
      problemSide: 'destination',
      candidates: [
        {
          id: 'res-1',
          role: 'origin',
          demandClass: 'residential',
          position: { lng: 9.9, lat: 19.9 },
          activeWeight: 20,
          baseWeight: 20,
          distanceMeters: 500
        }
      ]
    };

    const result = buildDemandGapOdContextFeatureCollection(destProjection);
    expect(result.features).toHaveLength(1);

    const feature1 = result.features[0]!;
    expect(feature1.geometry.type).toBe('LineString');
    // Origin -> Destination
    expect(feature1.geometry.coordinates).toEqual([
      [9.9, 19.9], // Residential candidate
      [10, 20] // Focused gap (workplace)
    ]);
    expect(feature1.properties.problemSide).toBe('destination');
    expect(feature1.properties.candidateDemandClass).toBe('residential');
  });
});
