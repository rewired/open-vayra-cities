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
  MAP_LAYER_ID_OSM_STOP_CANDIDATES_HOVER,
  MAP_LAYER_ID_SCENARIO_DEMAND_PREVIEW_CIRCLE,
  MAP_LAYER_ID_SCENARIO_DEMAND_PREVIEW_HOVER,
  MAP_LAYER_ID_SCENARIO_ROUTING_COVERAGE_MASK,
  MAP_LAYER_ID_DEMAND_GAP_OVERLAY_HEATMAP,
  MAP_LAYER_ID_DEMAND_GAP_OVERLAY_CIRCLE,
  MAP_LAYER_ID_DEMAND_GAP_OVERLAY_FOCUS,
  MAP_LAYER_ID_DEMAND_GAP_OD_CONTEXT_LINES,
  MAP_LAYER_ID_SELECTED_DEMAND_NODE_SERVICE_COVERAGE_CIRCLE,
  MAP_ENTITY_HOVER_EMPTY_FILTER
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
      MAP_LAYER_ID_SCENARIO_DEMAND_PREVIEW_HOVER,
      MAP_LAYER_ID_DEMAND_GAP_OVERLAY_HEATMAP,
      MAP_LAYER_ID_DEMAND_GAP_OVERLAY_CIRCLE,
      MAP_LAYER_ID_DEMAND_GAP_OVERLAY_FOCUS,
      MAP_LAYER_ID_DEMAND_GAP_OD_CONTEXT_LINES,
      MAP_LAYER_ID_OSM_STOP_CANDIDATES_CIRCLE,
      MAP_LAYER_ID_OSM_STOP_CANDIDATES_HOVER,
      MAP_LAYER_ID_SELECTED_DEMAND_NODE_SERVICE_COVERAGE_CIRCLE,
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
import {
  MAP_SOURCE_ID_COMPLETED_LINES,
  MAP_SOURCE_ID_DRAFT_LINE,
  MAP_SOURCE_ID_STOPS,
  MAP_SOURCE_ID_VEHICLES,
  MAP_SOURCE_ID_OSM_STOP_CANDIDATES,
  MAP_SOURCE_ID_SCENARIO_DEMAND_PREVIEW,
  MAP_SOURCE_ID_SCENARIO_ROUTING_COVERAGE,
  MAP_SOURCE_ID_DEMAND_GAP_OVERLAY,
  MAP_SOURCE_ID_DEMAND_GAP_OD_CONTEXT,
  MAP_SOURCE_ID_SELECTED_DEMAND_NODE_SERVICE_COVERAGE
} from './mapRenderConstants';
import type { DemandGapRankingProjection } from '../domain/projection/demandGapProjection';
import type { DemandGapOdContextProjection } from '../domain/projection/demandGapOdContextProjection';
import type { DemandNodeInspectionProjection } from '../domain/projection/demandNodeInspectionProjection';
import type { SelectedDemandNodeServiceCoverageProjection } from '../domain/projection/selectedDemandNodeServiceCoverageProjection';
import { createStopId } from '../domain/types/stop';
import { createLineId } from '../domain/types/line';

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

interface SourceSyncTestMapWithSources extends SourceSyncTestMap {
  readonly testSources: ReadonlyMap<string, TestGeoJsonSource>;
}

const requireTestSource = (map: SourceSyncTestMapWithSources, sourceId: string): TestGeoJsonSource => {
  const source = map.testSources.get(sourceId);
  if (!source) {
    throw new Error(`Expected test source ${sourceId} to exist.`);
  }

  return source;
};

describe('mapWorkspaceSourceSync integration', () => {
  const createMockMap = (): SourceSyncTestMapWithSources => {
    const sources = new Map<string, TestGeoJsonSource>();
    const layers = new Set<string>();

    const mockMap: SourceSyncTestMapWithSources = {
      testSources: sources,
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

  const createServiceCoverageProjection = (
    overrides: Partial<SelectedDemandNodeServiceCoverageProjection> = {}
  ): SelectedDemandNodeServiceCoverageProjection => {
    const selectedStopId = createStopId('stop-selected');
    const oppositeStopId = createStopId('stop-opposite');

    return {
      status: 'served-by-active-line',
      selectedNodeId: 'node-selected',
      selectedNodeRole: 'origin',
      inspectedTimeBandId: 'morning-rush',
      inspectedTimeBandLabel: 'Morning Rush',
      accessRadiusMeters: 400,
      summaryLabel: 'Active structural service available',
      reason: 'At least one completed bus line structurally connects this selected side with a covered context-candidate side and has active service.',
      coveringStops: [
        {
          stopId: selectedStopId,
          label: 'Selected Stop',
          position: { lng: 10, lat: 50 },
          distanceMeters: 100,
          distanceLabel: '100m'
        }
      ],
      candidateMatches: [
        {
          candidateId: 'node-work',
          label: 'Workplace',
          distanceLabel: '500m',
          coveringStops: [
            {
              stopId: oppositeStopId,
              label: 'Opposite Stop',
              position: { lng: 10.01, lat: 50.01 },
              distanceMeters: 120,
              distanceLabel: '120m'
            }
          ],
          connectingLineLabels: ['Line 1']
        }
      ],
      connectingLines: [
        {
          lineId: createLineId('line-1'),
          label: 'Line 1',
          topologyLabel: 'Linear',
          servicePatternLabel: 'One-way',
          serviceLabel: '10 min headway',
          selectedSideStopIds: [selectedStopId],
          selectedSideStopLabels: ['Selected Stop'],
          oppositeSideStopIds: [oppositeStopId],
          oppositeSideStopLabels: ['Opposite Stop']
        }
      ],
      activeLines: [
        {
          lineId: createLineId('line-1'),
          label: 'Line 1',
          topologyLabel: 'Linear',
          servicePatternLabel: 'One-way',
          serviceLabel: '10 min headway',
          selectedSideStopIds: [selectedStopId],
          selectedSideStopLabels: ['Selected Stop'],
          oppositeSideStopIds: [oppositeStopId],
          oppositeSideStopLabels: ['Opposite Stop']
        }
      ],
      diagnostics: {
        selectedSideCoveringStopCount: 1,
        hiddenSelectedSideCoveringStopCount: 0,
        oppositeCandidateWithStopCoverageCount: 1,
        hiddenOppositeCandidateMatchCount: 0,
        lineWithSelectedSideStopCount: 1,
        structurallyConnectingLineCount: 1,
        hiddenStructurallyConnectingLineCount: 0,
        activeConnectingLineCount: 1,
        hiddenActiveConnectingLineCount: 0
      },
      caveat: 'This is a planning projection, not observed travel behavior.',
      ...overrides
    };
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
      MAP_SOURCE_ID_COMPLETED_LINES, MAP_SOURCE_ID_DRAFT_LINE, 
      MAP_SOURCE_ID_STOPS, MAP_SOURCE_ID_VEHICLES, 
      MAP_SOURCE_ID_OSM_STOP_CANDIDATES, MAP_SOURCE_ID_SCENARIO_DEMAND_PREVIEW, 
      MAP_SOURCE_ID_SCENARIO_ROUTING_COVERAGE, MAP_SOURCE_ID_DEMAND_GAP_OD_CONTEXT,
      MAP_SOURCE_ID_SELECTED_DEMAND_NODE_SERVICE_COVERAGE
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
      MAP_SOURCE_ID_COMPLETED_LINES, MAP_SOURCE_ID_DRAFT_LINE, 
      MAP_SOURCE_ID_STOPS, MAP_SOURCE_ID_VEHICLES, 
      MAP_SOURCE_ID_OSM_STOP_CANDIDATES, MAP_SOURCE_ID_SCENARIO_DEMAND_PREVIEW, 
      MAP_SOURCE_ID_SCENARIO_ROUTING_COVERAGE, MAP_SOURCE_ID_DEMAND_GAP_OVERLAY,
      MAP_SOURCE_ID_DEMAND_GAP_OD_CONTEXT, MAP_SOURCE_ID_SELECTED_DEMAND_NODE_SERVICE_COVERAGE
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

    expect(map.addSource).toHaveBeenCalledWith(
      MAP_SOURCE_ID_DEMAND_GAP_OD_CONTEXT,
      expect.anything()
    );
    expect(map.addLayer).toHaveBeenCalledWith(
      expect.objectContaining({ id: MAP_LAYER_ID_DEMAND_GAP_OD_CONTEXT_LINES })
    );

    const source = map.getSource(MAP_SOURCE_ID_DEMAND_GAP_OD_CONTEXT);
    expect(source?.setData).toHaveBeenCalled();
  });

  it('syncAllMapWorkspaceSources ensures hover highlight layers without creating new sources', () => {
    const map = createMockMap();

    syncAllMapWorkspaceSources({ map });

    expect(map.addLayer).toHaveBeenCalledWith(
      expect.objectContaining({
        id: MAP_LAYER_ID_SCENARIO_DEMAND_PREVIEW_HOVER,
        source: MAP_SOURCE_ID_SCENARIO_DEMAND_PREVIEW,
        filter: MAP_ENTITY_HOVER_EMPTY_FILTER
      })
    );
    expect(map.addLayer).toHaveBeenCalledWith(
      expect.objectContaining({
        id: MAP_LAYER_ID_OSM_STOP_CANDIDATES_HOVER,
        source: MAP_SOURCE_ID_OSM_STOP_CANDIDATES,
        filter: MAP_ENTITY_HOVER_EMPTY_FILTER
      })
    );
  });

  it('syncAllMapWorkspaceSources ensures selected demand node service coverage source and sets data', () => {
    const map = createMockMap();

    syncAllMapWorkspaceSources({
      map,
      selectedDemandNodeServiceCoverageProjection: createServiceCoverageProjection()
    });

    expect(map.addSource).toHaveBeenCalledWith(
      MAP_SOURCE_ID_SELECTED_DEMAND_NODE_SERVICE_COVERAGE,
      expect.anything()
    );
    expect(map.addLayer).toHaveBeenCalledWith(
      expect.objectContaining({ id: MAP_LAYER_ID_SELECTED_DEMAND_NODE_SERVICE_COVERAGE_CIRCLE })
    );

    const source = requireTestSource(map, MAP_SOURCE_ID_SELECTED_DEMAND_NODE_SERVICE_COVERAGE);
    expect(source.setData).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'FeatureCollection',
        features: expect.arrayContaining([
          expect.objectContaining({
            properties: expect.objectContaining({
              stopId: createStopId('stop-selected'),
              role: 'selected-side-stop',
              coverageStatus: 'active-service'
            })
          })
        ])
      })
    );
  });

  it('syncExistingMapWorkspaceSourceData skips service coverage sync if source is missing', () => {
    const map = createMockMap();
    const otherSourceIds = [
      MAP_SOURCE_ID_COMPLETED_LINES, MAP_SOURCE_ID_DRAFT_LINE,
      MAP_SOURCE_ID_STOPS, MAP_SOURCE_ID_VEHICLES,
      MAP_SOURCE_ID_OSM_STOP_CANDIDATES, MAP_SOURCE_ID_SCENARIO_DEMAND_PREVIEW,
      MAP_SOURCE_ID_SCENARIO_ROUTING_COVERAGE, MAP_SOURCE_ID_DEMAND_GAP_OVERLAY,
      MAP_SOURCE_ID_DEMAND_GAP_OD_CONTEXT
    ];
    otherSourceIds.forEach(id => map.addSource(id, { type: 'geojson', data: { type: 'FeatureCollection', features: [] } }));

    const result = syncExistingMapWorkspaceSourceData({
      map,
      selectedDemandNodeServiceCoverageProjection: createServiceCoverageProjection()
    });

    expect(result).toBeNull();
    expect(map.getSource).toHaveBeenCalledWith(MAP_SOURCE_ID_SELECTED_DEMAND_NODE_SERVICE_COVERAGE);
  });

  it('syncExistingMapWorkspaceSourceData empties service coverage source when projection has no stop coverage', () => {
    const map = createMockMap();
    const sourceIds = [
      MAP_SOURCE_ID_COMPLETED_LINES, MAP_SOURCE_ID_DRAFT_LINE,
      MAP_SOURCE_ID_STOPS, MAP_SOURCE_ID_VEHICLES,
      MAP_SOURCE_ID_OSM_STOP_CANDIDATES, MAP_SOURCE_ID_SCENARIO_DEMAND_PREVIEW,
      MAP_SOURCE_ID_SCENARIO_ROUTING_COVERAGE, MAP_SOURCE_ID_DEMAND_GAP_OVERLAY,
      MAP_SOURCE_ID_DEMAND_GAP_OD_CONTEXT, MAP_SOURCE_ID_SELECTED_DEMAND_NODE_SERVICE_COVERAGE
    ];
    sourceIds.forEach(id => map.addSource(id, { type: 'geojson', data: { type: 'FeatureCollection', features: [] } }));

    const result = syncExistingMapWorkspaceSourceData({
      map,
      selectedDemandNodeServiceCoverageProjection: createServiceCoverageProjection({
        status: 'no-stop-coverage',
        coveringStops: [],
        candidateMatches: [],
        connectingLines: [],
        activeLines: []
      })
    });

    expect(result).not.toBeNull();
    const source = requireTestSource(map, MAP_SOURCE_ID_SELECTED_DEMAND_NODE_SERVICE_COVERAGE);
    expect(source.setData).toHaveBeenCalledWith({
      type: 'FeatureCollection',
      features: []
    });
  });

  it('syncExistingMapWorkspaceSourceData skips OD context sync if source is missing', () => {
    const map = createMockMap();
    const otherSourceIds = [
      MAP_SOURCE_ID_COMPLETED_LINES, MAP_SOURCE_ID_DRAFT_LINE, 
      MAP_SOURCE_ID_STOPS, MAP_SOURCE_ID_VEHICLES, 
      MAP_SOURCE_ID_OSM_STOP_CANDIDATES, MAP_SOURCE_ID_SCENARIO_DEMAND_PREVIEW, 
      MAP_SOURCE_ID_SCENARIO_ROUTING_COVERAGE, MAP_SOURCE_ID_DEMAND_GAP_OVERLAY,
      MAP_SOURCE_ID_SELECTED_DEMAND_NODE_SERVICE_COVERAGE
    ];
    otherSourceIds.forEach(id => map.addSource(id, { type: 'geojson', data: { type: 'FeatureCollection', features: [] } }));

    const mockOdProjection: DemandGapOdContextProjection = {
      status: 'ready',
      activeTimeBandId: 'morning-rush',
      focusedPosition: { lat: 0, lng: 0 },
      focusedGapId: 'gap-1',
      focusedGapKind: 'uncaptured-residential',
      problemSide: 'origin',
      candidates: [
        {
          id: 'workplace-1',
          role: 'destination',
          demandClass: 'workplace',
          position: { lng: 1, lat: 1 },
          activeWeight: 10,
          baseWeight: 10,
          distanceMeters: 500
        }
      ],
      summary: { candidateCount: 1, topActiveWeight: 10 },
      guidance: null
    };

    const result = syncExistingMapWorkspaceSourceData({
      map,
      demandGapOdContextProjection: mockOdProjection
    });

    expect(result).toBeNull();
    expect(map.getSource).toHaveBeenCalledWith(MAP_SOURCE_ID_DEMAND_GAP_OD_CONTEXT);
  });

  it('syncExistingMapWorkspaceSourceData sets data for OD context when source is present and projection is ready', () => {
    const map = createMockMap();
    const sourceIds = [
      MAP_SOURCE_ID_COMPLETED_LINES, MAP_SOURCE_ID_DRAFT_LINE, 
      MAP_SOURCE_ID_STOPS, MAP_SOURCE_ID_VEHICLES, 
      MAP_SOURCE_ID_OSM_STOP_CANDIDATES, MAP_SOURCE_ID_SCENARIO_DEMAND_PREVIEW, 
      MAP_SOURCE_ID_SCENARIO_ROUTING_COVERAGE, MAP_SOURCE_ID_DEMAND_GAP_OVERLAY,
      MAP_SOURCE_ID_DEMAND_GAP_OD_CONTEXT, MAP_SOURCE_ID_SELECTED_DEMAND_NODE_SERVICE_COVERAGE
    ];
    sourceIds.forEach(id => map.addSource(id, { type: 'geojson', data: { type: 'FeatureCollection', features: [] } }));

    const mockOdProjection: DemandGapOdContextProjection = {
      status: 'ready',
      activeTimeBandId: 'morning-rush',
      focusedPosition: { lat: 10, lng: 10 },
      focusedGapId: 'gap-1',
      focusedGapKind: 'uncaptured-residential',
      problemSide: 'origin',
      candidates: [
        {
          id: 'workplace-1',
          role: 'destination',
          demandClass: 'workplace',
          position: { lng: 11, lat: 11 },
          activeWeight: 10,
          baseWeight: 10,
          distanceMeters: 500
        }
      ],
      summary: { candidateCount: 1, topActiveWeight: 10 },
      guidance: null
    };

    const result = syncExistingMapWorkspaceSourceData({
      map,
      demandGapOdContextProjection: mockOdProjection
    });

    expect(result).not.toBeNull();
    
    const source = map.getSource(MAP_SOURCE_ID_DEMAND_GAP_OD_CONTEXT);
    if (!source) throw new Error('Expected source to be defined');

    expect(source.setData).toHaveBeenCalledTimes(1);
    expect(source.setData).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'FeatureCollection',
        features: [
          expect.objectContaining({
            type: 'Feature',
            properties: expect.objectContaining({
              candidateId: 'workplace-1',
              problemSide: 'origin',
              ordinal: 1
            })
          })
        ]
      })
    );
  });

  it('prioritizes selected demand node context hints over focused demand gap hints', () => {
    const map = createMockMap();
    const sourceIds = [
      MAP_SOURCE_ID_COMPLETED_LINES, MAP_SOURCE_ID_DRAFT_LINE, 
      MAP_SOURCE_ID_STOPS, MAP_SOURCE_ID_VEHICLES, 
      MAP_SOURCE_ID_OSM_STOP_CANDIDATES, MAP_SOURCE_ID_SCENARIO_DEMAND_PREVIEW, 
      MAP_SOURCE_ID_SCENARIO_ROUTING_COVERAGE, MAP_SOURCE_ID_DEMAND_GAP_OVERLAY,
      MAP_SOURCE_ID_DEMAND_GAP_OD_CONTEXT, MAP_SOURCE_ID_SELECTED_DEMAND_NODE_SERVICE_COVERAGE
    ];
    sourceIds.forEach(id => map.addSource(id, { type: 'geojson', data: { type: 'FeatureCollection', features: [] } }));

    const mockOdProjection: DemandGapOdContextProjection = {
      status: 'ready',
      activeTimeBandId: 'morning-rush',
      focusedPosition: { lat: 10, lng: 10 },
      focusedGapId: 'gap-1',
      focusedGapKind: 'uncaptured-residential',
      problemSide: 'origin',
      candidates: [
        {
          id: 'workplace-od',
          role: 'destination',
          demandClass: 'workplace',
          position: { lng: 11, lat: 11 },
          activeWeight: 10,
          baseWeight: 10,
          distanceMeters: 500
        }
      ],
      summary: { candidateCount: 1, topActiveWeight: 10 },
      guidance: null
    };

    const mockInspectionProjection: DemandNodeInspectionProjection = {
      status: 'ready',
      selectedNodeId: 'node-res-1',
      inspectedTimeBandId: 'morning-rush',
      inspectedTimeBandLabel: 'Morning Rush',
      followsSimulationTimeBand: true,
      title: 'Test Node',
      summary: 'Summary',
      problemStatus: 'captured-and-served',
      primaryAction: 'Action',
      caveat: 'Caveat',
      evidence: [],
      contextCandidates: [
        {
          ordinal: 1,
          candidateId: 'workplace-inspection',
          label: 'Workplace',
          roleLabel: 'Destination',
          demandClassLabel: 'workplace',
          activeWeightLabel: '10.0',
          distanceLabel: '100m',
          position: { lng: 10.001, lat: 50 }
        }
      ],
      selectedNodePosition: { lng: 10, lat: 50 },
      selectedNodeRole: 'origin'
    };

    syncExistingMapWorkspaceSourceData({
      map,
      demandGapOdContextProjection: mockOdProjection,
      demandNodeInspectionProjection: mockInspectionProjection
    });

    const source = requireTestSource(map, MAP_SOURCE_ID_DEMAND_GAP_OD_CONTEXT);

    // Should contain the inspection candidate, not the OD candidate
    expect(source.setData).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'FeatureCollection',
        features: expect.arrayContaining([
          expect.objectContaining({
            properties: expect.objectContaining({
              candidateId: 'workplace-inspection'
            })
          })
        ])
      })
    );
    
    expect(source.setData).not.toHaveBeenCalledWith(
      expect.objectContaining({
        features: expect.arrayContaining([
          expect.objectContaining({
            properties: expect.objectContaining({
              candidateId: 'workplace-od'
            })
          })
        ])
      })
    );
  });
});
