import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  isStaleOsmStopCandidateHover,
  resolveCachedOsmStopCandidateStreetAnchor,
  resolveOsmStopCandidateHover,
  type OsmStopCandidateHoverPayload,
  type OsmStopCandidateAnchorResolutionCache
} from './mapWorkspaceOsmCandidateHover';
import type { OsmStopCandidateGroup } from '../domain/types/osmStopCandidate';
import { createOsmStopCandidateGroupId } from '../domain/types/osmStopCandidate';
import type { MapLibreMap } from './maplibreGlobal';
import { resolveStreetLayerIdsFromStyle } from './mapWorkspaceStreetSnap';
import { resolveOsmStopCandidateGroupStreetAnchor } from './osmStopCandidateStreetAnchorResolution';
import type { OsmStopCandidateStreetAnchorResolution } from '../domain/osm/osmStopCandidateAnchorTypes';

vi.mock('./mapWorkspaceStreetSnap', () => ({
  resolveStreetLayerIdsFromStyle: vi.fn()
}));

vi.mock('./osmStopCandidateStreetAnchorResolution', () => ({
  resolveOsmStopCandidateGroupStreetAnchor: vi.fn()
}));

describe('mapWorkspaceOsmCandidateHover', () => {
  const groupId1 = createOsmStopCandidateGroupId('group-1');
  const groupId2 = createOsmStopCandidateGroupId('group-2');

  const mockHover: OsmStopCandidateHoverPayload = {
    candidateGroupId: groupId1,
    label: 'Test Group 1',
    memberCount: 2,
    memberKinds: 'bus_stop',
    berthCountHint: 2,
    x: 100,
    y: 200
  };

  const mockGroup1: OsmStopCandidateGroup = {
    id: groupId1,
    label: 'Test Group 1',
    displayPosition: { lng: 10, lat: 20 },
    routingAnchorPosition: { lng: 10, lat: 20 },
    memberIds: [],
    memberKinds: [],
    memberCount: 0,
    passengerVisibleMemberCount: 0,
    vehicleAnchorMemberCount: 0,
    berthCountHint: 0,
    source: 'osm'
  };

  const mockGroup2: OsmStopCandidateGroup = {
    id: groupId2,
    label: 'Test Group 2',
    displayPosition: { lng: 30, lat: 40 },
    routingAnchorPosition: { lng: 30, lat: 40 },
    memberIds: [],
    memberKinds: [],
    memberCount: 0,
    passengerVisibleMemberCount: 0,
    vehicleAnchorMemberCount: 0,
    berthCountHint: 0,
    source: 'osm'
  };

  const mockResolution: OsmStopCandidateStreetAnchorResolution = {
    candidateGroupId: groupId1,
    status: 'ready',
    source: 'street-snap',
    originalAnchorPosition: { lng: 10, lat: 20 },
    streetAnchorPosition: { lng: 11, lat: 21 },
    distanceMeters: 5,
    streetLabelCandidate: 'Test St',
    reason: 'Snapped to street'
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('isStaleOsmStopCandidateHover', () => {
    it('should return false when hover is null', () => {
      expect(isStaleOsmStopCandidateHover(null, [mockGroup1])).toBe(false);
    });

    it('should return false when hover candidateGroupId is in groups', () => {
      expect(isStaleOsmStopCandidateHover(mockHover, [mockGroup1, mockGroup2])).toBe(false);
    });

    it('should return true when hover candidateGroupId is not in groups', () => {
      expect(isStaleOsmStopCandidateHover(mockHover, [mockGroup2])).toBe(true);
    });
  });

  describe('resolveCachedOsmStopCandidateStreetAnchor', () => {
    it('should return cached resolution if available', () => {
      const mockCache: OsmStopCandidateAnchorResolutionCache = new Map([
        [groupId1, mockResolution]
      ]);
      const mockMap = {} as MapLibreMap;

      const result = resolveCachedOsmStopCandidateStreetAnchor({
        map: mockMap,
        group: mockGroup1,
        cache: mockCache
      });

      expect(result).toEqual(mockResolution);
      expect(resolveOsmStopCandidateGroupStreetAnchor).not.toHaveBeenCalled();
    });

    it('should compute and cache resolution if not available', () => {
      const mockCache: OsmStopCandidateAnchorResolutionCache = new Map();
      const mockMap = {} as MapLibreMap;

      vi.mocked(resolveStreetLayerIdsFromStyle).mockReturnValue(['street-layer']);
      vi.mocked(resolveOsmStopCandidateGroupStreetAnchor).mockReturnValue(mockResolution);

      const result = resolveCachedOsmStopCandidateStreetAnchor({
        map: mockMap,
        group: mockGroup1,
        cache: mockCache
      });

      expect(result).toEqual(mockResolution);
      expect(resolveOsmStopCandidateGroupStreetAnchor).toHaveBeenCalledWith(mockMap, mockGroup1, ['street-layer']);
      expect(mockCache.get(groupId1)).toEqual(mockResolution);
    });
  });

  describe('resolveOsmStopCandidateHover', () => {
    it('should return null when hover is null', () => {
      const mockCache: OsmStopCandidateAnchorResolutionCache = new Map();
      const mockMap = {} as MapLibreMap;

      expect(resolveOsmStopCandidateHover({
        map: mockMap,
        hover: null,
        groups: [mockGroup1],
        cache: mockCache
      })).toBeNull();
    });

    it('should return hover as-is when group is not found', () => {
      const mockCache: OsmStopCandidateAnchorResolutionCache = new Map();
      const mockMap = {} as MapLibreMap;

      const result = resolveOsmStopCandidateHover({
        map: mockMap,
        hover: mockHover,
        groups: [mockGroup2],
        cache: mockCache
      });

      expect(result).toEqual(mockHover);
    });

    it('should return hover with anchorResolution when group is found', () => {
      const mockCache: OsmStopCandidateAnchorResolutionCache = new Map();
      const mockMap = {} as MapLibreMap;

      vi.mocked(resolveStreetLayerIdsFromStyle).mockReturnValue(['street-layer']);
      vi.mocked(resolveOsmStopCandidateGroupStreetAnchor).mockReturnValue(mockResolution);

      const result = resolveOsmStopCandidateHover({
        map: mockMap,
        hover: mockHover,
        groups: [mockGroup1],
        cache: mockCache
      });

      expect(result).toEqual({
        ...mockHover,
        anchorResolution: mockResolution
      });
    });
  });
});
