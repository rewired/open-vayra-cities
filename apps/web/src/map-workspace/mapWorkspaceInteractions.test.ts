import { describe, expect, it, vi } from 'vitest';
import {
  decodeOsmCandidateGroupIdFromFeatureProperties,
  decodeStopIdFromFeatureProperties,
  hasInteractiveSelectionFeatureAtPoint,
  isPointInScenarioRoutingCoverage,
  resolveInspectModeMapClickSelection,
  resolveOsmCandidateFeatureInteractionSelection,
  setupMapWorkspaceInteractions,
  type MapWorkspaceInteractionRuntimeMap
} from './mapWorkspaceInteractions';
import type { MapLibreInteractionEvent, MapLibreRenderedFeature, MapLibreLayerSpecification } from './maplibreGlobal';
import { 
  MAP_LAYER_ID_STOPS_CIRCLE, 
  MAP_LAYER_ID_COMPLETED_LINES,
  MAP_LAYER_ID_OSM_STOP_CANDIDATES_CIRCLE,
  MAP_LAYER_ID_OSM_STOP_CANDIDATES_HOVER,
  MAP_LAYER_ID_SCENARIO_DEMAND_PREVIEW_CIRCLE,
  MAP_LAYER_ID_SCENARIO_DEMAND_PREVIEW_HOVER
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

interface SetupInteractionMapMock extends MapWorkspaceInteractionRuntimeMap {
  readonly canvas: { readonly style: { cursor: string } };
  readonly setFilter: ReturnType<typeof vi.fn>;
  readonly getCapturedLayerListener: (
    eventType: 'mouseenter' | 'mousemove' | 'mouseleave' | 'click',
    layerId: string
  ) => ((event: MapLibreInteractionEvent) => void) | undefined;
}

const createSetupInteractionMapMock = (presentLayerIds: readonly string[]): SetupInteractionMapMock => {
  const layerSet = new Set(presentLayerIds);
  const layerListeners = new Map<string, (event: MapLibreInteractionEvent) => void>();
  const canvas = { style: { cursor: '' } };

  const map: SetupInteractionMapMock = {
    canvas,
    getCapturedLayerListener: (eventType, layerId) => layerListeners.get(`${eventType}:${layerId}`),
    getLayer: (layerId: string): MapLibreLayerSpecification | undefined =>
      layerSet.has(layerId)
        ? {
            id: layerId,
            type: 'circle',
            source: 'test'
          }
        : undefined,
    queryRenderedFeatures: vi.fn(() => []),
    on: vi.fn((
      eventType: string,
      layerIdOrListener: string | ((event: MapLibreInteractionEvent) => void),
      listener?: (event: MapLibreInteractionEvent) => void
    ) => {
      if (typeof layerIdOrListener !== 'string' || !listener) {
        return;
      }

      layerListeners.set(`${eventType}:${layerIdOrListener}`, listener);
    }),
    off: vi.fn(),
    getStyle: () => ({ layers: [] }),
    getZoom: () => 14,
    project: () => ({ x: 0, y: 0 }),
    querySourceFeatures: () => [],
    getCanvas: () => canvas,
    setFilter: vi.fn()
  };

  return map;
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

  describe('hover affordance bindings', () => {
    const baseInteractionContracts = {
      activeToolMode: 'inspect' as const,
      setInteractionState: vi.fn(),
      setPlacementAttemptResult: vi.fn(),
      onStopSelectionChange: vi.fn(),
      onStopHoverChange: vi.fn(),
      onValidPlacement: () => {
        throw new Error('Unexpected placement in hover test.');
      },
      buildLineContracts: {
        onInspectModeNonFeatureMapClick: vi.fn()
      },
      onDemandNodeSelectionChange: vi.fn(),
      routingCoverage: null
    };

    it('does not call demand node selection callbacks on demand node hover', () => {
      const onDemandNodeSelectionChange = vi.fn();
      const map = createSetupInteractionMapMock([
        MAP_LAYER_ID_SCENARIO_DEMAND_PREVIEW_CIRCLE,
        MAP_LAYER_ID_SCENARIO_DEMAND_PREVIEW_HOVER,
        MAP_LAYER_ID_OSM_STOP_CANDIDATES_HOVER
      ]);

      const binding = setupMapWorkspaceInteractions({
        map,
        ...baseInteractionContracts,
        onDemandNodeSelectionChange
      });

      const listener = map.getCapturedLayerListener('mouseenter', MAP_LAYER_ID_SCENARIO_DEMAND_PREVIEW_CIRCLE);
      if (!listener) {
        throw new Error('Expected demand node mouseenter listener to be captured.');
      }

      listener({
        point: { x: 12, y: 14 },
        features: [
          {
            layer: { id: MAP_LAYER_ID_SCENARIO_DEMAND_PREVIEW_CIRCLE },
            properties: {
              entityId: 'node-1',
              entityKind: 'node'
            }
          }
        ]
      });

      expect(onDemandNodeSelectionChange).not.toHaveBeenCalled();
      expect(map.canvas.style.cursor).toBe('pointer');
      expect(map.setFilter).toHaveBeenCalledTimes(3);

      binding.dispose();
    });

    it('does not call selection callbacks on OSM stop candidate hover', () => {
      const onStopSelectionChange = vi.fn();
      const onDemandNodeSelectionChange = vi.fn();
      const onOsmCandidateHoverChange = vi.fn();
      const map = createSetupInteractionMapMock([
        MAP_LAYER_ID_OSM_STOP_CANDIDATES_CIRCLE,
        MAP_LAYER_ID_OSM_STOP_CANDIDATES_HOVER,
        MAP_LAYER_ID_SCENARIO_DEMAND_PREVIEW_HOVER
      ]);

      const binding = setupMapWorkspaceInteractions({
        map,
        ...baseInteractionContracts,
        onStopSelectionChange,
        onDemandNodeSelectionChange,
        onOsmCandidateHoverChange
      });

      const listener = map.getCapturedLayerListener('mouseenter', MAP_LAYER_ID_OSM_STOP_CANDIDATES_CIRCLE);
      if (!listener) {
        throw new Error('Expected OSM candidate mouseenter listener to be captured.');
      }

      listener({
        point: { x: 12, y: 14 },
        features: [
          {
            layer: { id: MAP_LAYER_ID_OSM_STOP_CANDIDATES_CIRCLE },
            properties: {
              candidateGroupId: 'osm-group:1',
              label: 'Candidate',
              memberCount: 2,
              memberKinds: 'bus-stop',
              berthCountHint: 1
            }
          }
        ]
      });

      expect(onStopSelectionChange).not.toHaveBeenCalled();
      expect(onDemandNodeSelectionChange).not.toHaveBeenCalled();
      expect(onOsmCandidateHoverChange).toHaveBeenCalledWith(
        expect.objectContaining({
          candidateGroupId: 'osm-group:1',
          label: 'Candidate'
        })
      );
      expect(map.canvas.style.cursor).toBe('pointer');
      expect(map.setFilter).toHaveBeenCalledTimes(3);

      binding.dispose();
      expect(map.canvas.style.cursor).toBe('');
    });

    it('does not repeatedly mutate hover filters while moving within the same demand node', () => {
      const map = createSetupInteractionMapMock([
        MAP_LAYER_ID_SCENARIO_DEMAND_PREVIEW_CIRCLE,
        MAP_LAYER_ID_SCENARIO_DEMAND_PREVIEW_HOVER,
        MAP_LAYER_ID_OSM_STOP_CANDIDATES_HOVER
      ]);

      const binding = setupMapWorkspaceInteractions({
        map,
        ...baseInteractionContracts
      });

      const listener = map.getCapturedLayerListener('mousemove', MAP_LAYER_ID_SCENARIO_DEMAND_PREVIEW_CIRCLE);
      if (!listener) {
        throw new Error('Expected demand node mousemove listener to be captured.');
      }

      const event: MapLibreInteractionEvent = {
        point: { x: 12, y: 14 },
        features: [
          {
            layer: { id: MAP_LAYER_ID_SCENARIO_DEMAND_PREVIEW_CIRCLE },
            properties: {
              entityId: 'node-1',
              entityKind: 'node'
            }
          }
        ]
      };

      listener(event);
      listener(event);

      expect(map.setFilter).toHaveBeenCalledTimes(3);

      binding.dispose();
    });

    it('updates hover filters exactly once when moving to a different OSM candidate', () => {
      const map = createSetupInteractionMapMock([
        MAP_LAYER_ID_OSM_STOP_CANDIDATES_CIRCLE,
        MAP_LAYER_ID_OSM_STOP_CANDIDATES_HOVER,
        MAP_LAYER_ID_SCENARIO_DEMAND_PREVIEW_HOVER
      ]);

      const binding = setupMapWorkspaceInteractions({
        map,
        ...baseInteractionContracts
      });

      const listener = map.getCapturedLayerListener('mousemove', MAP_LAYER_ID_OSM_STOP_CANDIDATES_CIRCLE);
      if (!listener) {
        throw new Error('Expected OSM candidate mousemove listener to be captured.');
      }

      listener({
        point: { x: 12, y: 14 },
        features: [
          {
            layer: { id: MAP_LAYER_ID_OSM_STOP_CANDIDATES_CIRCLE },
            properties: {
              candidateGroupId: 'osm-group:1',
              label: 'Candidate 1',
              memberCount: 2
            }
          }
        ]
      });
      listener({
        point: { x: 12, y: 14 },
        features: [
          {
            layer: { id: MAP_LAYER_ID_OSM_STOP_CANDIDATES_CIRCLE },
            properties: {
              candidateGroupId: 'osm-group:2',
              label: 'Candidate 2',
              memberCount: 2
            }
          }
        ]
      });

      expect(map.setFilter).toHaveBeenCalledTimes(6);

      binding.dispose();
    });

    it('does not show clickable hover affordance outside inspect mode', () => {
      const onOsmCandidateHoverChange = vi.fn();
      const map = createSetupInteractionMapMock([
        MAP_LAYER_ID_OSM_STOP_CANDIDATES_CIRCLE,
        MAP_LAYER_ID_OSM_STOP_CANDIDATES_HOVER,
        MAP_LAYER_ID_SCENARIO_DEMAND_PREVIEW_HOVER
      ]);

      const binding = setupMapWorkspaceInteractions({
        map,
        ...baseInteractionContracts,
        activeToolMode: 'build-line',
        onOsmCandidateHoverChange
      });

      const listener = map.getCapturedLayerListener('mouseenter', MAP_LAYER_ID_OSM_STOP_CANDIDATES_CIRCLE);
      if (!listener) {
        throw new Error('Expected OSM candidate mouseenter listener to be captured.');
      }

      listener({
        point: { x: 12, y: 14 },
        features: [
          {
            layer: { id: MAP_LAYER_ID_OSM_STOP_CANDIDATES_CIRCLE },
            properties: {
              candidateGroupId: 'osm-group:1',
              label: 'Candidate',
              memberCount: 2
            }
          }
        ]
      });

      expect(onOsmCandidateHoverChange).not.toHaveBeenCalled();
      expect(map.canvas.style.cursor).toBe('');
      expect(map.setFilter).not.toHaveBeenCalled();

      binding.dispose();
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
