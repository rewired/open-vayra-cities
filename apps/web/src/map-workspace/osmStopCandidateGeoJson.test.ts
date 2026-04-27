import { describe, it, expect } from 'vitest';
import { buildOsmStopCandidateFeatureCollection } from './osmStopCandidateGeoJson';
import { createOsmStopCandidateId } from '../domain/types/osmStopCandidate';
import type { OsmStopCandidate } from '../domain/types/osmStopCandidate';

const mockCandidate: OsmStopCandidate = {
  id: createOsmStopCandidateId('test-candidate-1'),
  position: { lng: 10.0, lat: 53.5 },
  label: 'Test Stop',
  kind: 'bus-stop',
  source: 'osm'
};

describe('buildOsmStopCandidateFeatureCollection', () => {
  it('returns empty FeatureCollection for empty input', () => {
    const result = buildOsmStopCandidateFeatureCollection([]);
    expect(result.features).toHaveLength(0);
    expect(result.type).toBe('FeatureCollection');
  });

  it('produces point features at [lng, lat] for single candidate', () => {
    const result = buildOsmStopCandidateFeatureCollection([mockCandidate]);
    expect(result.features).toHaveLength(1);
    const feature = result.features[0]!;
    expect(feature.geometry.type).toBe('Point');
    expect(feature.geometry.coordinates).toEqual([10.0, 53.5]);
  });

  it('uses candidateId instead of stopId in properties', () => {
    const result = buildOsmStopCandidateFeatureCollection([mockCandidate]);
    const feature = result.features[0]!;
    const props = feature.properties;
    expect(props.candidateId).toBe('test-candidate-1');
    expect('stopId' in props).toBe(false);
  });

  it('preserves label and kind in properties', () => {
    const result = buildOsmStopCandidateFeatureCollection([mockCandidate]);
    const feature = result.features[0]!;
    const props = feature.properties;
    expect(props.label).toBe('Test Stop');
    expect(props.kind).toBe('bus-stop');
    expect(props.source).toBe('osm');
  });

  it('handles multiple candidates', () => {
    const candidate2: OsmStopCandidate = {
      ...mockCandidate,
      id: createOsmStopCandidateId('test-candidate-2'),
      position: { lng: 10.1, lat: 53.6 },
      label: 'Test Stop 2'
    };
    const result = buildOsmStopCandidateFeatureCollection([mockCandidate, candidate2]);
    expect(result.features).toHaveLength(2);
  });
});
