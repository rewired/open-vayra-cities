import { describe, expect, it, vi } from 'vitest';
import { queryRenderedFeaturesForExistingLayers, filterExistingLayerIds, type RenderedFeatureLayerQueryMap } from './mapWorkspaceRenderedFeatureQuery';
import type { MapLibreLayerSpecification, MapLibreMap, MapEventPoint } from './maplibreGlobal';

const createMapMock = (presentLayerIds: string[]): RenderedFeatureLayerQueryMap => {
  const layerSet = new Set(presentLayerIds);
  const queryRenderedFeatures = vi.fn().mockReturnValue([{ id: 'feature-1' }]);

  return {
    getLayer: (id: string): MapLibreLayerSpecification | undefined => 
      layerSet.has(id) ? { id, type: 'circle', source: 'test' } : undefined,
    queryRenderedFeatures,
  };
};

describe('mapWorkspaceRenderedFeatureQuery', () => {
  describe('filterExistingLayerIds', () => {
    it('returns only layers that exist in the map style', () => {
      const map = createMapMock(['layer-1', 'layer-3']);
      const result = filterExistingLayerIds(map, ['layer-1', 'layer-2', 'layer-3', 'layer-4']);
      expect(result).toEqual(['layer-1', 'layer-3']);
    });

    it('returns an empty array if no layers exist', () => {
      const map = createMapMock([]);
      const result = filterExistingLayerIds(map, ['layer-1', 'layer-2']);
      expect(result).toEqual([]);
    });
  });

  describe('queryRenderedFeaturesForExistingLayers', () => {
    it('calls queryRenderedFeatures only with existing layers', () => {
      const map = createMapMock(['layer-1', 'layer-3']);
      const point: MapEventPoint = { x: 10, y: 10 };
      
      const result = queryRenderedFeaturesForExistingLayers(map, point, ['layer-1', 'layer-2', 'layer-3']);
      
      expect(map.queryRenderedFeatures).toHaveBeenCalledWith(point, { layers: ['layer-1', 'layer-3'] });
      expect(result).toEqual([{ id: 'feature-1' }]);
    });

    it('returns an empty array and does not call map.queryRenderedFeatures if no layers exist', () => {
      const map = createMapMock([]);
      const point: MapEventPoint = { x: 10, y: 10 };
      
      const result = queryRenderedFeaturesForExistingLayers(map, point, ['layer-1', 'layer-2']);
      
      expect(map.queryRenderedFeatures).not.toHaveBeenCalled();
      expect(result).toEqual([]);
    });
  });
});
