import { describe, expect, it } from 'vitest';

import {
  getMapWorkspaceCustomLayerOrder,
  listPresentMapWorkspaceCustomLayerIds,
  type MapWorkspaceSourceSyncMap
} from './mapWorkspaceSourceSync';
import {
  MAP_LAYER_ID_COMPLETED_LINES,
  MAP_LAYER_ID_COMPLETED_LINES_CASING,
  MAP_LAYER_ID_DRAFT_LINE,
  MAP_LAYER_ID_STOPS_CIRCLE,
  MAP_LAYER_ID_STOPS_LABEL,
  MAP_LAYER_ID_VEHICLES,
  MAP_LAYER_ID_OSM_STOP_CANDIDATES_CIRCLE,
  MAP_LAYER_ID_SCENARIO_DEMAND_PREVIEW_CIRCLE,
  MAP_LAYER_ID_SCENARIO_ROUTING_COVERAGE_MASK,
  MAP_LAYER_ID_DEMAND_GAP_OVERLAY_HEATMAP,
  MAP_LAYER_ID_DEMAND_GAP_OVERLAY_CIRCLE,
  MAP_LAYER_ID_DEMAND_GAP_OVERLAY_FOCUS,
  MAP_LAYER_ID_DEMAND_GAP_OD_CONTEXT_LINES
} from './mapRenderConstants';
import type { MapLibreLayerSpecification, MapLibreMap } from './maplibreGlobal';

const createMapWithPresentLayers = (presentLayerIds: readonly string[]): MapWorkspaceSourceSyncMap => {
  const layerSet = new Set(presentLayerIds);

  return {
    getSource: () => undefined,
    addSource: () => undefined,
    getLayer: (layerId: string): MapLibreLayerSpecification | undefined =>
      layerSet.has(layerId)
        ? {
            id: layerId,
            source: 'unused-test-source',
            type: 'line'
          }
        : undefined,
    addLayer: () => undefined,
    moveLayer: () => undefined,
    querySourceFeatures: () => []
  };
};

describe('mapWorkspaceSourceSync custom-layer helpers', () => {
  it('returns the canonical deterministic custom-layer order list', () => {
    expect(getMapWorkspaceCustomLayerOrder()).toEqual([
      MAP_LAYER_ID_COMPLETED_LINES_CASING,
      MAP_LAYER_ID_COMPLETED_LINES,
      MAP_LAYER_ID_DRAFT_LINE,
      MAP_LAYER_ID_SCENARIO_ROUTING_COVERAGE_MASK,
      MAP_LAYER_ID_SCENARIO_DEMAND_PREVIEW_CIRCLE,
      MAP_LAYER_ID_DEMAND_GAP_OVERLAY_HEATMAP,
      MAP_LAYER_ID_DEMAND_GAP_OVERLAY_CIRCLE,
      MAP_LAYER_ID_DEMAND_GAP_OVERLAY_FOCUS,
      MAP_LAYER_ID_DEMAND_GAP_OD_CONTEXT_LINES,
      MAP_LAYER_ID_OSM_STOP_CANDIDATES_CIRCLE,
      MAP_LAYER_ID_STOPS_CIRCLE,
      MAP_LAYER_ID_STOPS_LABEL,
      MAP_LAYER_ID_VEHICLES
    ]);
  });

  it('returns a defensive custom-layer order copy so callers cannot mutate canonical ordering', () => {
    const first = getMapWorkspaceCustomLayerOrder();
    const mutated = [...first];
    mutated.reverse();

    expect(mutated).not.toEqual(getMapWorkspaceCustomLayerOrder());
    expect(getMapWorkspaceCustomLayerOrder()).toEqual(first);
  });

  it('lists only present custom-layer ids in canonical order', () => {
    const map = createMapWithPresentLayers([
      MAP_LAYER_ID_STOPS_LABEL,
      MAP_LAYER_ID_COMPLETED_LINES,
      MAP_LAYER_ID_VEHICLES
    ]);

    expect(listPresentMapWorkspaceCustomLayerIds(map)).toEqual([
      MAP_LAYER_ID_COMPLETED_LINES,
      MAP_LAYER_ID_STOPS_LABEL,
      MAP_LAYER_ID_VEHICLES
    ]);
  });
});

import { vi } from 'vitest';
import { syncAllMapWorkspaceSources, syncExistingMapWorkspaceSourceData } from './mapWorkspaceSourceSync';
import { MAP_SOURCE_ID_DEMAND_GAP_OVERLAY, MAP_SOURCE_ID_DEMAND_GAP_OD_CONTEXT } from './mapRenderConstants';
import type { DemandGapRankingProjection } from '../domain/projection/demandGapProjection';
import type { DemandGapOdContextProjection } from '../domain/projection/demandGapOdContextProjection';

interface TestGeoJsonSource {
  setData: ReturnType<typeof vi.fn>;
}

interface SourceSyncTestMap extends MapWorkspaceSourceSyncMap {
  getSource: ReturnType<typeof vi.fn>;
  addSource: ReturnType<typeof vi.fn>;
  getLayer: ReturnType<typeof vi.fn>;
  addLayer: ReturnType<typeof vi.fn>;
  moveLayer: ReturnType<typeof vi.fn>;
  querySourceFeatures: ReturnType<typeof vi.fn>;
}

describe('mapWorkspaceSourceSync integration', () => {
  const createMockMap = (): MapWorkspaceSourceSyncMap => {
    const sources = new Map<string, TestGeoJsonSource>();
    const layers = new Set<string>();

    const mockMap: SourceSyncTestMap = {
      getSource: vi.fn((id: string) => sources.get(id)),
      addSource: vi.fn((id: string) => {
        sources.set(id, { setData: vi.fn() });
      }),
      getLayer: vi.fn((id: string) => layers.has(id) ? { id, type: 'circle', source: 'test' } : undefined),
      addLayer: vi.fn((spec: MapLibreLayerSpecification) => {
        layers.add(spec.id);
      }),
      moveLayer: vi.fn(),
      querySourceFeatures: vi.fn(() => []),
    };

    return mockMap;
  };

  it('syncAllMapWorkspaceSources ensures demand gap source and sets data', () => {
    const map = createMockMap();
    const mockProjection: DemandGapRankingProjection = { 
      status: 'ready', 
      activeTimeBandId: 'morning-rush',
      uncapturedResidentialGaps: [],
      capturedButUnservedResidentialGaps: [],
      capturedButUnreachableWorkplaceGaps: [],
      summary: { totalGapCount: 0 }
    };

    syncAllMapWorkspaceSources({
      map,
      demandGapRankingProjection: mockProjection
    });

    expect(map.addSource).toHaveBeenCalled();
    const source = map.getSource(MAP_SOURCE_ID_DEMAND_GAP_OVERLAY);
    expect(source?.setData).toHaveBeenCalled();
  });

  it('syncExistingMapWorkspaceSourceData skips demand gap sync if source is missing', () => {
    const map = createMockMap();
    // Add all other sources except demand-gap
    const otherSourceIds = [
      'openvayra-cities-completed-lines', 'openvayra-cities-draft-line', 
      'openvayra-cities-stops', 'openvayra-cities-vehicles', 
      'osm-stop-candidates', 'openvayra-cities-scenario-demand-preview', 
      'openvayra-cities-scenario-routing-coverage', 'openvayra-cities-demand-gap-od-context'
    ];
    otherSourceIds.forEach(id => map.addSource(id, { type: 'geojson', data: { type: 'FeatureCollection', features: [] } }));

    const mockProjection: DemandGapRankingProjection = { 
      status: 'ready', 
      activeTimeBandId: 'morning-rush',
      uncapturedResidentialGaps: [],
      capturedButUnservedResidentialGaps: [],
      capturedButUnreachableWorkplaceGaps: [],
      summary: { totalGapCount: 0 }
    };

    const result = syncExistingMapWorkspaceSourceData({
      map,
      demandGapRankingProjection: mockProjection
    });

    expect(result).toBeNull();
    expect(map.getSource).toHaveBeenCalledWith(MAP_SOURCE_ID_DEMAND_GAP_OVERLAY);
  });

  it('syncMapWorkspaceSourceData handles null/unavailable projection gracefully', () => {
    const map = createMockMap();
    
    // We need to make sure all sources are present for syncExisting to not return null
    const sourceIds = [
      'openvayra-cities-completed-lines', 'openvayra-cities-draft-line', 
      'openvayra-cities-stops', 'openvayra-cities-vehicles', 
      'osm-stop-candidates', 'openvayra-cities-scenario-demand-preview', 
      'openvayra-cities-scenario-routing-coverage', 'openvayra-cities-demand-gap-overlay',
      'openvayra-cities-demand-gap-od-context'
    ];
    sourceIds.forEach(id => map.addSource(id, { type: 'geojson', data: { type: 'FeatureCollection', features: [] } }));

    syncExistingMapWorkspaceSourceData({
      map,
      demandGapRankingProjection: null
    });

    const source = map.getSource(MAP_SOURCE_ID_DEMAND_GAP_OVERLAY);
    expect(source?.setData).toHaveBeenCalledWith(expect.objectContaining({
      type: 'FeatureCollection',
      features: []
    }));
  });

  it('syncAllMapWorkspaceSources ensures demand gap OD context source and sets data', () => {
    const map = createMockMap();
    const mockOdProjection: DemandGapOdContextProjection = {
      status: 'ready',
      activeTimeBandId: 'morning-rush',
      focusedPosition: { lat: 0, lng: 0 },
      focusedGapId: 'gap-1',
      focusedGapKind: 'uncaptured-residential',
      problemSide: 'origin',
      candidates: [],
      summary: { candidateCount: 0, topActiveWeight: 0 },
      guidance: null
    };

    syncAllMapWorkspaceSources({
      map,
      demandGapOdContextProjection: mockOdProjection
    });

    expect(map.addSource).toHaveBeenCalled();
    const source = map.getSource(MAP_SOURCE_ID_DEMAND_GAP_OD_CONTEXT);
    expect(source?.setData).toHaveBeenCalled();
  });

  it('syncExistingMapWorkspaceSourceData skips OD context sync if source is missing', () => {
    const map = createMockMap();
    const otherSourceIds = [
      'openvayra-cities-completed-lines', 'openvayra-cities-draft-line', 
      'openvayra-cities-stops', 'openvayra-cities-vehicles', 
      'osm-stop-candidates', 'openvayra-cities-scenario-demand-preview', 
      'openvayra-cities-scenario-routing-coverage', 'openvayra-cities-demand-gap-overlay'
    ];
    otherSourceIds.forEach(id => map.addSource(id, { type: 'geojson', data: { type: 'FeatureCollection', features: [] } }));

    const mockOdProjection: DemandGapOdContextProjection = {
      status: 'ready',
      activeTimeBandId: 'morning-rush',
      focusedPosition: { lat: 0, lng: 0 },
      focusedGapId: 'gap-1',
      focusedGapKind: 'uncaptured-residential',
      problemSide: 'origin',
      candidates: [],
      summary: { candidateCount: 0, topActiveWeight: 0 },
      guidance: null
    };

    const result = syncExistingMapWorkspaceSourceData({
      map,
      demandGapOdContextProjection: mockOdProjection
    });

    expect(result).toBeNull();
    expect(map.getSource).toHaveBeenCalledWith(MAP_SOURCE_ID_DEMAND_GAP_OD_CONTEXT);
  });
});

