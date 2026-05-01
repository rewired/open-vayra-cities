import { describe, expect, it, vi } from 'vitest';
import { hasInteractiveSelectionFeatureAtPoint } from './mapWorkspaceInteractions';
import type { MapLibreInteractionEvent, MapLibreRenderedFeature, MapLibreLayerSpecification } from './maplibreGlobal';
import { 
  MAP_LAYER_ID_STOPS_CIRCLE, 
  MAP_LAYER_ID_COMPLETED_LINES,
  MAP_LAYER_ID_OSM_STOP_CANDIDATES_CIRCLE
} from './mapRenderConstants';
import { 
  bindSafeLayerInteraction, 
  type RenderedFeatureLayerQueryMap, 
  type LayerInteractionBindingMap 
} from './mapWorkspaceRenderedFeatureQuery';

const createMapMock = (
  presentLayerIds: string[], 
  features: readonly MapLibreRenderedFeature[] = []
) => {
  const layerSet = new Set(presentLayerIds);
  const queryRenderedFeatures = vi.fn().mockReturnValue(features);

  const mock: RenderedFeatureLayerQueryMap & LayerInteractionBindingMap = {
    getLayer: (id: string): MapLibreLayerSpecification | undefined => 
      layerSet.has(id) ? { id, type: 'circle', source: 'test' } : undefined,
    queryRenderedFeatures,
    on: vi.fn(),
    off: vi.fn(),
  };

  return mock;
};

describe('mapWorkspaceInteractions', () => {
  describe('hasInteractiveSelectionFeatureAtPoint', () => {
    it('returns true when interactive features are found in existing layers', () => {
      const map = createMapMock(
        [MAP_LAYER_ID_STOPS_CIRCLE], 
        [{ properties: { stopId: 'stop-1' }, layer: { id: MAP_LAYER_ID_STOPS_CIRCLE } }]
      );
      const event: MapLibreInteractionEvent = { point: { x: 10, y: 10 } };
      
      const result = hasInteractiveSelectionFeatureAtPoint(map, event);
      
      expect(result).toBe(true);
      expect(map.queryRenderedFeatures).toHaveBeenCalledWith(event.point, { 
        layers: [MAP_LAYER_ID_STOPS_CIRCLE] 
      });
    });

    it('returns false when no features are found', () => {
      const map = createMapMock([MAP_LAYER_ID_STOPS_CIRCLE, MAP_LAYER_ID_COMPLETED_LINES, MAP_LAYER_ID_OSM_STOP_CANDIDATES_CIRCLE], []);
      const event: MapLibreInteractionEvent = { point: { x: 10, y: 10 } };
      
      const result = hasInteractiveSelectionFeatureAtPoint(map, event);
      
      expect(result).toBe(false);
    });

    it('returns false and does not throw when interactive layers are missing from the style', () => {
      const map = createMapMock([]); // No layers present
      const event: MapLibreInteractionEvent = { point: { x: 10, y: 10 } };
      
      const result = hasInteractiveSelectionFeatureAtPoint(map, event);
      
      expect(result).toBe(false);
      expect(map.queryRenderedFeatures).not.toHaveBeenCalled();
    });

    it('queries only the subset of interactive layers that are currently present', () => {
      const map = createMapMock([MAP_LAYER_ID_COMPLETED_LINES], []);
      const event: MapLibreInteractionEvent = { point: { x: 10, y: 10 } };
      
      hasInteractiveSelectionFeatureAtPoint(map, event);
      
      expect(map.queryRenderedFeatures).toHaveBeenCalledWith(event.point, { 
        layers: [MAP_LAYER_ID_COMPLETED_LINES] 
      });
    });
  });

  describe('bindSafeLayerInteraction', () => {
    it('registers on() and off() when the layer exists', () => {
      const map = createMapMock(['test-layer']);
      const listener = vi.fn();
      
      const binding = bindSafeLayerInteraction(map, 'click', 'test-layer', listener);
      
      expect(map.on).toHaveBeenCalledWith('click', 'test-layer', listener);
      
      binding.dispose();
      expect(map.off).toHaveBeenCalledWith('click', 'test-layer', listener);
    });

    it('skips on() and off() when the layer does not exist', () => {
      const map = createMapMock([]);
      const listener = vi.fn();
      
      const binding = bindSafeLayerInteraction(map, 'click', 'test-layer', listener);
      
      expect(map.on).not.toHaveBeenCalled();
      
      binding.dispose();
      expect(map.off).not.toHaveBeenCalled();
    });

    it('does not throw when the layer is missing', () => {
      const map = createMapMock([]);
      const listener = vi.fn();
      
      expect(() => {
        const binding = bindSafeLayerInteraction(map, 'click', 'missing-layer', listener);
        binding.dispose();
      }).not.toThrow();
    });
  });
});
