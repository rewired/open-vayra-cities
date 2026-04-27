import { describe, it, expect } from 'vitest';
import { buildOsmStopCandidateFeatureCollection } from './osmStopCandidateGeoJson';
import { createOsmStopCandidateGroupId, createOsmStopCandidateId } from '../domain/types/osmStopCandidate';
import type { OsmStopCandidateGroup } from '../domain/types/osmStopCandidate';

const mockGroup: OsmStopCandidateGroup = {
  id: createOsmStopCandidateGroupId('osm-group:test-1'),
  label: 'Test Stop',
  displayPosition: { lng: 10.0, lat: 53.5 },
  routingAnchorPosition: { lng: 10.0001, lat: 53.5001 },
  memberIds: [createOsmStopCandidateId('test-1')],
  memberKinds: ['bus-stop'],
  memberCount: 1,
  passengerVisibleMemberCount: 1,
  vehicleAnchorMemberCount: 0,
  berthCountHint: 1,
  source: 'osm'
};

describe('buildOsmStopCandidateFeatureCollection', () => {
  it('returns empty FeatureCollection for empty input', () => {
    const result = buildOsmStopCandidateFeatureCollection([]);
    expect(result.features).toHaveLength(0);
    expect(result.type).toBe('FeatureCollection');
  });

  it('produces point features at [lng, lat] for single group', () => {
    const result = buildOsmStopCandidateFeatureCollection([mockGroup]);
    expect(result.features).toHaveLength(1);
    const feature = result.features[0]!;
    expect(feature.geometry.type).toBe('Point');
    expect(feature.geometry.coordinates).toEqual([10.0, 53.5]);
  });

  it('uses candidateGroupId instead of stopId in properties', () => {
    const result = buildOsmStopCandidateFeatureCollection([mockGroup]);
    const feature = result.features[0]!;
    const props = feature.properties;
    expect(props.candidateGroupId).toBe('osm-group:test-1');
    expect('stopId' in props).toBe(false);
    expect('candidateId' in props).toBe(false);
  });

  it('preserves label and memberCount in properties', () => {
    const result = buildOsmStopCandidateFeatureCollection([mockGroup]);
    const feature = result.features[0]!;
    const props = feature.properties;
    expect(props.label).toBe('Test Stop');
    expect(props.memberCount).toBe(1);
    expect(props.source).toBe('osm');
    expect(props.memberKinds).toBe('bus-stop');
  });

  it('handles multiple groups', () => {
    const group2: OsmStopCandidateGroup = {
      ...mockGroup,
      id: createOsmStopCandidateGroupId('osm-group:test-2'),
      displayPosition: { lng: 10.1, lat: 53.6 },
      label: 'Test Stop 2'
    };
    const result = buildOsmStopCandidateFeatureCollection([mockGroup, group2]);
    expect(result.features).toHaveLength(2);
  });
});
