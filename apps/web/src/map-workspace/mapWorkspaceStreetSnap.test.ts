import { describe, it, expect, vi } from 'vitest';
import { resolveSnappedStreetPositionForGeographicPoint } from './mapWorkspaceStreetSnap';
import type { StreetSnapQueryMap } from './mapWorkspaceRenderedFeatureQuery';

describe('mapWorkspaceStreetSnap', () => {
  describe('resolveSnappedStreetPositionForGeographicPoint', () => {
    it('should return null when no street layers exist', () => {
      const mockMap: StreetSnapQueryMap = {
        project: vi.fn().mockReturnValue({ x: 100, y: 100 }),
        queryRenderedFeatures: vi.fn().mockReturnValue([]),
        getZoom: vi.fn().mockReturnValue(15),
        getStyle: vi.fn().mockReturnValue({ layers: [] }),
        querySourceFeatures: vi.fn().mockReturnValue([])
      };

      const result = resolveSnappedStreetPositionForGeographicPoint(mockMap, { lng: 13.4, lat: 52.5 }, []);

      expect(result).toBeNull();
    });

    it('should return snapped point when street features are found', () => {
      const mockMap: StreetSnapQueryMap = {
        project: vi.fn().mockReturnValue({ x: 100, y: 100 }),
        queryRenderedFeatures: vi.fn().mockReturnValue([
          {
            geometry: {
              type: 'LineString',
              coordinates: [
                [13.4, 52.5],
                [13.41, 52.51]
              ]
            },
            properties: { name: 'Main St' },
            source: 'osm',
            layer: { id: 'streets' }
          }
        ]),
        getZoom: vi.fn().mockReturnValue(15),
        getStyle: vi.fn().mockReturnValue({ layers: [{ id: 'streets', type: 'line', source: 'osm' }] }),
        querySourceFeatures: vi.fn().mockReturnValue([])
      };

      const result = resolveSnappedStreetPositionForGeographicPoint(mockMap, { lng: 13.4001, lat: 52.5001 }, ['streets']);

      expect(result).not.toBeNull();
      expect(result?.lng).toBeCloseTo(13.4001);
      expect(result?.lat).toBeCloseTo(52.5001);
      expect(result?.streetLabelCandidate).toBe('Main St');
    });
  });
});
