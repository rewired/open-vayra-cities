import { describe, expect, it } from 'vitest';
import { buildDemandNodeContextHintFeatureCollection } from './demandNodeContextHintGeoJson';
import type { DemandNodeInspectionProjection } from '../domain/projection/demandNodeInspectionProjection';

describe('buildDemandNodeContextHintFeatureCollection', () => {
  const mockProjection: DemandNodeInspectionProjection = {
    status: 'ready',
    selectedNodeId: 'node-1',
    selectedNodePosition: { lng: 10, lat: 50 },
    selectedNodeRole: 'origin',
    inspectedTimeBandId: 'morning-rush',
    inspectedTimeBandLabel: 'Morning Rush',
    followsSimulationTimeBand: true,
    title: 'Test Node',
    summary: 'Test Summary',
    problemStatus: 'not-captured',
    primaryAction: 'Test Action',
    caveat: 'Test Caveat',
    evidence: [],
    contextCandidates: [
      {
        ordinal: 1,
        candidateId: 'cand-1',
        label: 'Candidate 1',
        roleLabel: 'Destination',
        demandClassLabel: 'workplace',
        activeWeightLabel: '10.0',
        distanceLabel: '500m',
        position: { lng: 10.01, lat: 50.01 }
      }
    ]
  };

  it('returns empty collection for null projection', () => {
    const result = buildDemandNodeContextHintFeatureCollection(null);
    expect(result.type).toBe('FeatureCollection');
    expect(result.features).toHaveLength(0);
  });

  it('returns empty collection for unavailable projection', () => {
    const result = buildDemandNodeContextHintFeatureCollection({ ...mockProjection, status: 'unavailable' });
    expect(result.features).toHaveLength(0);
  });

  it('builds straight lines from origin to candidates', () => {
    const result = buildDemandNodeContextHintFeatureCollection(mockProjection);
    expect(result.features).toHaveLength(1);
    
    const feature = result.features[0]!;
    expect(feature.geometry.type).toBe('LineString');
    expect(feature.geometry.coordinates).toEqual([
      [10, 50],
      [10.01, 50.01]
    ]);
    expect(feature.properties.selectedNodeId).toBe('node-1');
    expect(feature.properties.candidateId).toBe('cand-1');
    expect(feature.properties.selectedNodeRole).toBe('origin');
  });

  it('builds straight lines from candidates to destination', () => {
    const destProjection: DemandNodeInspectionProjection = {
      ...mockProjection,
      selectedNodeRole: 'destination',
      selectedNodePosition: { lng: 11, lat: 51 }
    };
    const result = buildDemandNodeContextHintFeatureCollection(destProjection);
    expect(result.features).toHaveLength(1);
    
    const feature = result.features[0]!;
    expect(feature.geometry.coordinates).toEqual([
      [10.01, 50.01],
      [11, 51]
    ]);
    expect(feature.properties.selectedNodeRole).toBe('destination');
  });

  it('preserves candidate order and ordinal', () => {
    const multiProjection: DemandNodeInspectionProjection = {
      ...mockProjection,
      contextCandidates: [
        ...mockProjection.contextCandidates,
        {
          ordinal: 2,
          candidateId: 'cand-2',
          label: 'Candidate 2',
          roleLabel: 'Destination',
          demandClassLabel: 'workplace',
          activeWeightLabel: '5.0',
          distanceLabel: '1km',
          position: { lng: 10.02, lat: 50.02 }
        }
      ]
    };
    const result = buildDemandNodeContextHintFeatureCollection(multiProjection);
    expect(result.features).toHaveLength(2);
    expect(result.features[0]!.properties.ordinal).toBe(1);
    expect(result.features[1]!.properties.ordinal).toBe(2);
    expect(result.features[1]!.properties.candidateId).toBe('cand-2');
  });
});
