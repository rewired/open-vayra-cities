import { describe, it, expect, vi } from 'vitest';
import { resolveOsmStopCandidateGroupStreetAnchor } from './osmStopCandidateStreetAnchorResolution';
import { createOsmStopCandidateGroupId, type OsmStopCandidateGroup } from '../domain/types/osmStopCandidate';
import type { StreetSnapQueryMap } from './mapWorkspaceRenderedFeatureQuery';
import * as streetSnap from './mapWorkspaceStreetSnap';
import { OSM_STOP_CANDIDATE_STREET_ANCHOR_REVIEW_MAX_DISTANCE_METERS } from '../domain/osm/osmStopCandidateAnchorConstants';

describe('osmStopCandidateStreetAnchorResolution', () => {
  const mockMap: StreetSnapQueryMap = {
    project: vi.fn(),
    getZoom: vi.fn().mockReturnValue(15),
    queryRenderedFeatures: vi.fn(),
    getStyle: vi.fn(),
    querySourceFeatures: vi.fn()
  };

  const mockGroup: OsmStopCandidateGroup = {
    id: createOsmStopCandidateGroupId('group-1'),
    label: 'Test Group',
    displayPosition: { lng: 13.4, lat: 52.5 },
    routingAnchorPosition: { lng: 13.4001, lat: 52.5001 },
    memberIds: [],
    memberKinds: ['public-transport-stop-position'],
    memberCount: 1,
    passengerVisibleMemberCount: 0,
    vehicleAnchorMemberCount: 1,
    berthCountHint: 1,
    source: 'osm'
  };

  it('should return blocked when snapping fails', () => {
    vi.spyOn(streetSnap, 'resolveNearestRenderedStreetPositionForGeographicPoint').mockReturnValue(null);

    const result = resolveOsmStopCandidateGroupStreetAnchor(mockMap, mockGroup, ['street-layer']);

    expect(result.status).toBe('blocked');
    expect(result.streetAnchorPosition).toBeNull();
    expect(result.candidateGroupId).toBe(mockGroup.id);
  });

  it('should return ready when snapped point is close', () => {
    // Approx 11 meters apart
    vi.spyOn(streetSnap, 'resolveNearestRenderedStreetPositionForGeographicPoint').mockReturnValue({
      lng: 13.4001,
      lat: 52.5002,
      distanceMeters: 11,
      streetLabelCandidate: 'Main St'
    });

    const result = resolveOsmStopCandidateGroupStreetAnchor(mockMap, mockGroup, ['street-layer']);

    expect(result.status).toBe('ready');
    expect(result.streetAnchorPosition).toEqual({ lng: 13.4001, lat: 52.5002 });
    expect(result.distanceMeters).toBe(11);
    expect(result.streetLabelCandidate).toBe('Main St');
  });

  it('should prefer routingAnchorPosition over displayPosition', () => {
    const spy = vi.spyOn(streetSnap, 'resolveNearestRenderedStreetPositionForGeographicPoint');
    
    resolveOsmStopCandidateGroupStreetAnchor(mockMap, mockGroup, ['street-layer']);

    expect(spy).toHaveBeenCalledWith(
      mockMap,
      mockGroup.routingAnchorPosition,
      ['street-layer'],
      OSM_STOP_CANDIDATE_STREET_ANCHOR_REVIEW_MAX_DISTANCE_METERS
    );
  });

  it('should identify source as osm-stop-position when stop-position member exists', () => {
    vi.spyOn(streetSnap, 'resolveNearestRenderedStreetPositionForGeographicPoint').mockReturnValue(null);

    const result = resolveOsmStopCandidateGroupStreetAnchor(mockMap, mockGroup, ['street-layer']);

    expect(result.source).toBe('osm-stop-position');
  });

  it('should identify source as osm-display-position when no stop-position member exists', () => {
    const displayOnlyGroup: OsmStopCandidateGroup = {
      ...mockGroup,
      memberKinds: ['bus-stop']
    };
    vi.spyOn(streetSnap, 'resolveNearestRenderedStreetPositionForGeographicPoint').mockReturnValue(null);

    const result = resolveOsmStopCandidateGroupStreetAnchor(mockMap, displayOnlyGroup, ['street-layer']);

    expect(result.source).toBe('osm-display-position');
  });
});
