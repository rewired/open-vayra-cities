import { describe, expect, it, vi } from 'vitest';
import {
  decodeOsmCandidateGroupIdFromFeatureProperties,
  decodeStopIdFromFeatureProperties,
  hasInteractiveSelectionFeatureAtPoint,
  isPointInScenarioRoutingCoverage,
  resolveInspectModeMapClickSelection,
  resolveOsmCandidateFeatureInteractionSelection
} from './mapWorkspaceInteractions';
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

    it('keeps placed stops ahead of OSM candidates in the interactive query order', () => {
      const map = createMapMock([MAP_LAYER_ID_STOPS_CIRCLE, MAP_LAYER_ID_OSM_STOP_CANDIDATES_CIRCLE], []);
      const event: MapLibreInteractionEvent = { point: { x: 10, y: 10 } };

      hasInteractiveSelectionFeatureAtPoint(map, event);

      expect(map.queryRenderedFeatures).toHaveBeenCalledWith(event.point, {
        layers: [MAP_LAYER_ID_STOPS_CIRCLE, MAP_LAYER_ID_OSM_STOP_CANDIDATES_CIRCLE]
      });
    });
  });

  describe('OSM candidate feature interaction decoding', () => {
    it('decodes OSM candidate group ids from typed feature properties', () => {
      const decoded = decodeOsmCandidateGroupIdFromFeatureProperties({
        candidateGroupId: 'osm-group:test-1',
        label: 'Test candidate'
      });

      expect(decoded).toBe('osm-group:test-1');
    });

    it('rejects missing or invalid OSM candidate group ids', () => {
      expect(decodeOsmCandidateGroupIdFromFeatureProperties({ candidateGroupId: 5 })).toBeNull();
      expect(decodeOsmCandidateGroupIdFromFeatureProperties(undefined)).toBeNull();
    });

    it('selects OSM candidate context only in inspect mode', () => {
      const properties = { candidateGroupId: 'osm-group:test-1' };

      expect(resolveOsmCandidateFeatureInteractionSelection(properties, 'inspect')).toBe('osm-group:test-1');
      expect(resolveOsmCandidateFeatureInteractionSelection(properties, 'build-line')).toBeNull();
    });

    it('does not decode OSM candidate properties as canonical stop properties', () => {
      const properties = { candidateGroupId: 'osm-group:test-1' };

      expect(decodeStopIdFromFeatureProperties(properties)).toBeNull();
    });

    it('empty inspect clicks clear selection state through a null stop selection result', () => {
      expect(resolveInspectModeMapClickSelection()).toBeNull();
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

  describe('isPointInScenarioRoutingCoverage', () => {
    const coverage: import('../domain/scenario/scenarioRegistry').ScenarioRoutingCoverage = {
      kind: 'bounds',
      bounds: { west: 10, south: 50, east: 12, north: 52 }
    };

    it('returns true if point is inside bounds', () => {
      expect(isPointInScenarioRoutingCoverage(coverage, 11, 51)).toBe(true);
    });

    it('returns true if point is on the boundary', () => {
      expect(isPointInScenarioRoutingCoverage(coverage, 10, 50)).toBe(true);
    });

    it('returns false if point is outside bounds', () => {
      expect(isPointInScenarioRoutingCoverage(coverage, 9, 51)).toBe(false);
      expect(isPointInScenarioRoutingCoverage(coverage, 11, 53)).toBe(false);
    });

    it('returns true if coverage is null', () => {
      expect(isPointInScenarioRoutingCoverage(null, 0, 0)).toBe(true);
    });
  });
});
