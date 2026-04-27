import { describe, it, expect, vi } from 'vitest';
import { resolveOsmStopCandidateGroupStreetAnchor } from './osmStopCandidateStreetAnchorResolution';
import type { OsmStopCandidateGroup } from '../domain/types/osmStopCandidate';
import type { MapLibreMap } from './maplibreGlobal';
import * as streetSnap from './mapWorkspaceStreetSnap';

describe('osmStopCandidateStreetAnchorResolution', () => {
  const mockMap = {
    project: vi.fn()
  } as unknown as MapLibreMap;

  const mockGroup: OsmStopCandidateGroup = {
    id: 'group-1' as any,
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
    vi.spyOn(streetSnap, 'resolveSnappedStreetPositionForGeographicPoint').mockReturnValue(null);

    const result = resolveOsmStopCandidateGroupStreetAnchor(mockMap, mockGroup, ['street-layer']);

    expect(result.status).toBe('blocked');
    expect(result.streetAnchorPosition).toBeNull();
    expect(result.candidateGroupId).toBe(mockGroup.id);
  });

  it('should return ready when snapped point is close', () => {
    // Approx 11 meters apart
    vi.spyOn(streetSnap, 'resolveSnappedStreetPositionForGeographicPoint').mockReturnValue({
      lng: 13.4001,
      lat: 52.5002,
      streetLabelCandidate: 'Main St'
    });

    const result = resolveOsmStopCandidateGroupStreetAnchor(mockMap, mockGroup, ['street-layer']);

    expect(result.status).toBe('ready');
    expect(result.streetAnchorPosition).toEqual({ lng: 13.4001, lat: 52.5002 });
    expect(result.distanceMeters).toBeLessThan(20);
    expect(result.streetLabelCandidate).toBe('Main St');
  });

  it('should prefer routingAnchorPosition over displayPosition', () => {
    const spy = vi.spyOn(streetSnap, 'resolveSnappedStreetPositionForGeographicPoint');
    
    resolveOsmStopCandidateGroupStreetAnchor(mockMap, mockGroup, ['street-layer']);

    expect(spy).toHaveBeenCalledWith(mockMap, mockGroup.routingAnchorPosition, ['street-layer']);
  });

  it('should identify source as osm-stop-position when stop-position member exists', () => {
    vi.spyOn(streetSnap, 'resolveSnappedStreetPositionForGeographicPoint').mockReturnValue(null);

    const result = resolveOsmStopCandidateGroupStreetAnchor(mockMap, mockGroup, ['street-layer']);

    expect(result.source).toBe('osm-stop-position');
  });

  it('should identify source as osm-display-position when no stop-position member exists', () => {
    const displayOnlyGroup: OsmStopCandidateGroup = {
      ...mockGroup,
      memberKinds: ['bus-stop']
    };
    vi.spyOn(streetSnap, 'resolveSnappedStreetPositionForGeographicPoint').mockReturnValue(null);

    const result = resolveOsmStopCandidateGroupStreetAnchor(mockMap, displayOnlyGroup, ['street-layer']);

    expect(result.source).toBe('osm-display-position');
  });
});
