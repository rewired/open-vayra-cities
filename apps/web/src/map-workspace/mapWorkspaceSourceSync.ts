import type { Line } from '../domain/types/line';
import type { LineVehicleNetworkProjection } from '../domain/types/lineVehicleProjection';
import type { Stop, StopId } from '../domain/types/stop';
import type { OsmStopCandidateGroup } from '../domain/types/osmStopCandidate';

import { buildCompletedLineFeatureCollection, buildDraftLineFeatureCollection } from './lineGeoJson';
import {
  MAP_COMPLETED_LINE_CASING_LAYER_PAINT,
  MAP_COMPLETED_LINE_LAYER_PAINT,
  MAP_DRAFT_LINE_LAYER_PAINT,
  MAP_LAYER_ID_COMPLETED_LINES_CASING,
  MAP_LAYER_ID_COMPLETED_LINES,
  MAP_LAYER_ID_DRAFT_LINE,
  MAP_LAYER_ID_STOPS_CIRCLE,
  MAP_LAYER_ID_STOPS_LABEL,
  MAP_LAYER_ID_VEHICLES,
  MAP_SOURCE_ID_COMPLETED_LINES,
  MAP_SOURCE_ID_DRAFT_LINE,
  MAP_SOURCE_ID_STOPS,
  MAP_SOURCE_ID_VEHICLES,
  MAP_STOP_CIRCLE_LAYER_STYLE,
  MAP_STOP_LABEL_LAYER_LAYOUT,
  MAP_STOP_LABEL_LAYER_PAINT,
  MAP_VEHICLE_CIRCLE_LAYER_PAINT,
  MAP_SOURCE_ID_OSM_STOP_CANDIDATES,
  MAP_LAYER_ID_OSM_STOP_CANDIDATES_CIRCLE,
  MAP_LAYER_ID_OSM_STOP_CANDIDATES_HOVER,
  MAP_OSM_STOP_CANDIDATE_CIRCLE_LAYER_PAINT,
  MAP_OSM_STOP_CANDIDATE_HOVER_CIRCLE_LAYER_PAINT,
  MAP_LAYER_ID_SCENARIO_DEMAND_PREVIEW_CIRCLE,
  MAP_LAYER_ID_SCENARIO_DEMAND_PREVIEW_HOVER,
  MAP_SOURCE_ID_SCENARIO_DEMAND_PREVIEW,
  MAP_SCENARIO_DEMAND_PREVIEW_CIRCLE_LAYER_PAINT,
  MAP_SCENARIO_DEMAND_PREVIEW_HOVER_CIRCLE_LAYER_PAINT,
  MAP_SOURCE_ID_SCENARIO_ROUTING_COVERAGE,
  MAP_LAYER_ID_SCENARIO_ROUTING_COVERAGE_MASK,
  MAP_SCENARIO_ROUTING_COVERAGE_MASK_PAINT,
  MAP_SOURCE_ID_DEMAND_GAP_OVERLAY,
  MAP_LAYER_ID_DEMAND_GAP_OVERLAY_HEATMAP,
  MAP_LAYER_ID_DEMAND_GAP_OVERLAY_CIRCLE,
  MAP_LAYER_ID_DEMAND_GAP_OVERLAY_FOCUS,
  MAP_DEMAND_GAP_OVERLAY_HEATMAP_PAINT,
  MAP_DEMAND_GAP_OVERLAY_CIRCLE_PAINT,
  MAP_DEMAND_GAP_OVERLAY_FOCUS_CIRCLE_PAINT,
  MAP_SOURCE_ID_DEMAND_GAP_OD_CONTEXT,
  MAP_LAYER_ID_DEMAND_GAP_OD_CONTEXT_LINES,
  MAP_DEMAND_GAP_OD_CONTEXT_HINT_PAINT,
  MAP_SOURCE_ID_SELECTED_DEMAND_NODE_SERVICE_COVERAGE,
  MAP_LAYER_ID_SELECTED_DEMAND_NODE_SERVICE_COVERAGE_CIRCLE,
  MAP_SELECTED_DEMAND_NODE_SERVICE_COVERAGE_CIRCLE_PAINT,
  MAP_ENTITY_HOVER_EMPTY_FILTER
} from './mapRenderConstants';
import { buildScenarioDemandPreviewFeatureCollection } from './scenarioDemandPreviewGeoJson';
import type { MapLibreMap } from './maplibreGlobal';
import { buildStopFeatureCollection } from './stopGeoJson';
import { buildVehicleFeatureCollection } from './vehicleGeoJson';
import { buildOsmStopCandidateFeatureCollection } from './osmStopCandidateGeoJson';
import { buildScenarioRoutingCoverageMaskFeatureCollection } from './scenarioRoutingCoverageGeoJson';
import { buildDemandGapOverlayFeatureCollection } from './demandGapOverlayGeoJson';
import { buildDemandGapOdContextFeatureCollection } from './demandGapOdContextGeoJson';
import { buildDemandNodeContextHintFeatureCollection } from './demandNodeContextHintGeoJson';
import { buildSelectedDemandNodeServiceCoverageFeatureCollection } from './selectedDemandNodeServiceCoverageGeoJson';


/**
 * Minimal MapLibre surface required for map source/layer synchronization.
 */
export interface MapWorkspaceSourceSyncMap {
  /** Returns whether the provided source id exists in the current style. */
  readonly getSource: MapLibreMap['getSource'];
  /** Registers a GeoJSON source for subsequent style-layer rendering. */
  readonly addSource: MapLibreMap['addSource'];
  /** Returns whether the provided layer id exists in the current style. */
  readonly getLayer: MapLibreMap['getLayer'];
  /** Registers a style layer bound to an existing source id. */
  readonly addLayer: MapLibreMap['addLayer'];
  /** Reorders an existing layer before another layer id, or to the top. */
  readonly moveLayer: MapLibreMap['moveLayer'];
  /** Queries source features for a known source id and optional source-layer constraint. */
  readonly querySourceFeatures: MapLibreMap['querySourceFeatures'];
}





/**
 * Optional stop-sync payload used to refresh map-native stop features.
 */
interface MapWorkspaceStopSyncInput {
  readonly stops: readonly Stop[];
  readonly selectedStopId: StopId | null;
  readonly draftStopIds: ReadonlySet<StopId>;
  readonly isBuildLineModeActive: boolean;
  readonly selectedLine: Line | null;
}

/**
 * Optional line/draft-line sync payload used to refresh map-native line features.
 */
interface MapWorkspaceLineSyncInput {
  readonly sessionLines: readonly Line[];
  readonly selectedLineId: Line['id'] | null;
  readonly draftStopIds: readonly StopId[];
  readonly stopsById: ReadonlyMap<StopId, Stop>;
}

/**
 * Optional vehicle sync payload used to refresh projected vehicle map features.
 */
interface MapWorkspaceVehicleSyncInput {
  readonly vehicleNetworkProjection: LineVehicleNetworkProjection;
}

import type { ScenarioDemandArtifact } from '../domain/types/scenarioDemand';
import type { ScenarioRoutingCoverage } from '../domain/scenario/scenarioRegistry';
import type { DemandGapRankingProjection } from '../domain/projection/demandGapProjection';
import type { DemandGapOdContextProjection } from '../domain/projection/demandGapOdContextProjection';
import type { DemandNodeInspectionProjection } from '../domain/projection/demandNodeInspectionProjection';
import type { SelectedDemandNodeServiceCoverageProjection } from '../domain/projection/selectedDemandNodeServiceCoverageProjection';

/**
 * Inputs for one lifecycle-safe source/layer synchronization pass.
 */
export interface SyncAllMapWorkspaceSourcesInput {
  readonly map: MapWorkspaceSourceSyncMap;
  readonly stopSync?: MapWorkspaceStopSyncInput;
  readonly lineSync?: MapWorkspaceLineSyncInput;
  readonly vehicleSync?: MapWorkspaceVehicleSyncInput;
  readonly osmStopCandidateSync?: readonly OsmStopCandidateGroup[];
  readonly scenarioDemandArtifact?: ScenarioDemandArtifact | null;
  readonly routingCoverage?: ScenarioRoutingCoverage | null;
  readonly demandGapRankingProjection?: DemandGapRankingProjection | null;
  readonly focusedDemandGapId?: string | null;
  readonly demandGapOdContextProjection?: DemandGapOdContextProjection | null;
  readonly demandNodeInspectionProjection?: DemandNodeInspectionProjection | null;
  readonly selectedDemandNodeServiceCoverageProjection?: SelectedDemandNodeServiceCoverageProjection | null;
}

/**
 * Readback counters emitted after one synchronization pass.
 */
export interface MapWorkspaceSourceSyncDiagnostics {
  readonly stopBuilderFeatureCount?: number;
  readonly stopSourceFeatureCount: number;
  readonly lineBuilderFeatureCount?: number;
  readonly lineSourceFeatureCount: number;
  readonly vehicleBuilderFeatureCount?: number;
  readonly vehicleSourceFeatureCount: number;
  readonly osmStopCandidateBuilderFeatureCount?: number;
  readonly osmStopCandidateSourceFeatureCount: number;
}


const CUSTOM_LAYER_ORDER = [
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
] as const;

/**
 * Returns the canonical deterministic custom-layer order used by the map workspace.
 */
export const getMapWorkspaceCustomLayerOrder = (): readonly string[] => [...CUSTOM_LAYER_ORDER];

/**
 * Returns existing workspace custom-layer ids in canonical deterministic order.
 */
export const listPresentMapWorkspaceCustomLayerIds = (map: MapWorkspaceSourceSyncMap): readonly string[] =>
  getMapWorkspaceCustomLayerOrder().filter((layerId) => map.getLayer(layerId) !== undefined);

const WORKSPACE_SOURCE_IDS = [
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
] as const;


/**
 * Returns whether all workspace-owned GeoJSON sources already exist on the current map style.
 */
export const hasAllMapWorkspaceRenderSources = (map: MapWorkspaceSourceSyncMap): boolean =>
  WORKSPACE_SOURCE_IDS.every((sourceId) => map.getSource(sourceId) !== undefined);

const countSourceFeatures = (map: MapWorkspaceSourceSyncMap, sourceId: string): number => {
  if (!map.getSource(sourceId)) {
    return 0;
  }

  return map.querySourceFeatures(sourceId).length;
};

/**
 * Reapplies deterministic ordering for all workspace-owned custom layers.
 */
export const enforceMapWorkspaceCustomLayerOrder = (map: MapWorkspaceSourceSyncMap): void => {
  const customLayerOrder = getMapWorkspaceCustomLayerOrder();

  for (let index = customLayerOrder.length - 1; index >= 0; index -= 1) {
    const layerId = customLayerOrder[index];
    if (!layerId) {
      continue;
    }

    if (!map.getLayer(layerId)) {
      continue;
    }

    const beforeLayerId = index < customLayerOrder.length - 1 ? customLayerOrder[index + 1] : undefined;
    const existingBeforeLayer = typeof beforeLayerId === 'string' ? map.getLayer(beforeLayerId) : undefined;

    map.moveLayer(layerId, existingBeforeLayer ? beforeLayerId : undefined);
  }
};

const ensureAllMapWorkspaceRenderSourcesAndLayers = (map: MapWorkspaceSourceSyncMap): void => {
  if (!map.getSource(MAP_SOURCE_ID_COMPLETED_LINES)) {
    map.addSource(MAP_SOURCE_ID_COMPLETED_LINES, {
      type: 'geojson',
      data: buildCompletedLineFeatureCollection({
        lines: [],
        stopsById: new Map(),
        selectedLineId: null
      })
    });
  }

  if (!map.getSource(MAP_SOURCE_ID_DRAFT_LINE)) {
    map.addSource(MAP_SOURCE_ID_DRAFT_LINE, {
      type: 'geojson',
      data: buildDraftLineFeatureCollection({
        draftStopIds: [],
        stopsById: new Map()
      })
    });
  }

  if (!map.getSource(MAP_SOURCE_ID_STOPS)) {
    map.addSource(MAP_SOURCE_ID_STOPS, {
      type: 'geojson',
      data: buildStopFeatureCollection({
        stops: [],
        selectedStopId: null,
        draftStopIds: new Set(),
        buildLineInteractive: false,
        selectedLine: null
      })
    });
  }

  if (!map.getSource(MAP_SOURCE_ID_VEHICLES)) {
    map.addSource(MAP_SOURCE_ID_VEHICLES, {
      type: 'geojson',
      data: {
        type: 'FeatureCollection',
        features: []
      }
    });
  }

  if (!map.getLayer(MAP_LAYER_ID_COMPLETED_LINES_CASING)) {
    map.addLayer({
      id: MAP_LAYER_ID_COMPLETED_LINES_CASING,
      type: 'line',
      source: MAP_SOURCE_ID_COMPLETED_LINES,
      paint: MAP_COMPLETED_LINE_CASING_LAYER_PAINT
    });
  }

  if (!map.getLayer(MAP_LAYER_ID_COMPLETED_LINES)) {
    map.addLayer({
      id: MAP_LAYER_ID_COMPLETED_LINES,
      type: 'line',
      source: MAP_SOURCE_ID_COMPLETED_LINES,
      paint: MAP_COMPLETED_LINE_LAYER_PAINT
    });
  }

  if (!map.getLayer(MAP_LAYER_ID_DRAFT_LINE)) {
    map.addLayer({
      id: MAP_LAYER_ID_DRAFT_LINE,
      type: 'line',
      source: MAP_SOURCE_ID_DRAFT_LINE,
      paint: MAP_DRAFT_LINE_LAYER_PAINT
    });
  }

  if (!map.getLayer(MAP_LAYER_ID_STOPS_CIRCLE)) {
    map.addLayer({
      id: MAP_LAYER_ID_STOPS_CIRCLE,
      type: 'circle',
      source: MAP_SOURCE_ID_STOPS,
      paint: MAP_STOP_CIRCLE_LAYER_STYLE
    });
  }

  if (!map.getLayer(MAP_LAYER_ID_STOPS_LABEL)) {
    map.addLayer({
      id: MAP_LAYER_ID_STOPS_LABEL,
      type: 'symbol',
      source: MAP_SOURCE_ID_STOPS,
      layout: MAP_STOP_LABEL_LAYER_LAYOUT,
      paint: MAP_STOP_LABEL_LAYER_PAINT
    });
  }

  if (!map.getLayer(MAP_LAYER_ID_VEHICLES)) {
    map.addLayer({
      id: MAP_LAYER_ID_VEHICLES,
      type: 'circle',
      source: MAP_SOURCE_ID_VEHICLES,
      paint: MAP_VEHICLE_CIRCLE_LAYER_PAINT
    });
  }

  if (!map.getSource(MAP_SOURCE_ID_OSM_STOP_CANDIDATES)) {
    map.addSource(MAP_SOURCE_ID_OSM_STOP_CANDIDATES, {
      type: 'geojson',
      data: { type: 'FeatureCollection', features: [] }
    });
  }

  if (!map.getLayer(MAP_LAYER_ID_OSM_STOP_CANDIDATES_CIRCLE)) {
    map.addLayer({
      id: MAP_LAYER_ID_OSM_STOP_CANDIDATES_CIRCLE,
      type: 'circle',
      source: MAP_SOURCE_ID_OSM_STOP_CANDIDATES,
      paint: MAP_OSM_STOP_CANDIDATE_CIRCLE_LAYER_PAINT,
      layout: { visibility: 'visible' }
    });
  }

  if (!map.getLayer(MAP_LAYER_ID_OSM_STOP_CANDIDATES_HOVER)) {
    map.addLayer({
      id: MAP_LAYER_ID_OSM_STOP_CANDIDATES_HOVER,
      type: 'circle',
      source: MAP_SOURCE_ID_OSM_STOP_CANDIDATES,
      paint: MAP_OSM_STOP_CANDIDATE_HOVER_CIRCLE_LAYER_PAINT,
      layout: { visibility: 'visible' },
      filter: MAP_ENTITY_HOVER_EMPTY_FILTER
    });
  }

  if (!map.getSource(MAP_SOURCE_ID_SCENARIO_DEMAND_PREVIEW)) {
    map.addSource(MAP_SOURCE_ID_SCENARIO_DEMAND_PREVIEW, {
      type: 'geojson',
      data: { type: 'FeatureCollection', features: [] }
    });
  }

  if (!map.getLayer(MAP_LAYER_ID_SCENARIO_DEMAND_PREVIEW_CIRCLE)) {
    map.addLayer({
      id: MAP_LAYER_ID_SCENARIO_DEMAND_PREVIEW_CIRCLE,
      type: 'circle',
      source: MAP_SOURCE_ID_SCENARIO_DEMAND_PREVIEW,
      paint: MAP_SCENARIO_DEMAND_PREVIEW_CIRCLE_LAYER_PAINT,
      layout: { visibility: 'none' }
    });
  }

  if (!map.getLayer(MAP_LAYER_ID_SCENARIO_DEMAND_PREVIEW_HOVER)) {
    map.addLayer({
      id: MAP_LAYER_ID_SCENARIO_DEMAND_PREVIEW_HOVER,
      type: 'circle',
      source: MAP_SOURCE_ID_SCENARIO_DEMAND_PREVIEW,
      paint: MAP_SCENARIO_DEMAND_PREVIEW_HOVER_CIRCLE_LAYER_PAINT,
      layout: { visibility: 'none' },
      filter: MAP_ENTITY_HOVER_EMPTY_FILTER
    });
  }
  
  if (!map.getSource(MAP_SOURCE_ID_SCENARIO_ROUTING_COVERAGE)) {
    map.addSource(MAP_SOURCE_ID_SCENARIO_ROUTING_COVERAGE, {
      type: 'geojson',
      data: { type: 'FeatureCollection', features: [] }
    });
  }

  if (!map.getLayer(MAP_LAYER_ID_SCENARIO_ROUTING_COVERAGE_MASK)) {
    map.addLayer({
      id: MAP_LAYER_ID_SCENARIO_ROUTING_COVERAGE_MASK,
      type: 'fill',
      source: MAP_SOURCE_ID_SCENARIO_ROUTING_COVERAGE,
      paint: MAP_SCENARIO_ROUTING_COVERAGE_MASK_PAINT,
      layout: { visibility: 'visible' }
    });
  }

  if (!map.getSource(MAP_SOURCE_ID_DEMAND_GAP_OVERLAY)) {
    map.addSource(MAP_SOURCE_ID_DEMAND_GAP_OVERLAY, {
      type: 'geojson',
      data: { type: 'FeatureCollection', features: [] }
    });
  }

  if (!map.getLayer(MAP_LAYER_ID_DEMAND_GAP_OVERLAY_HEATMAP)) {
    map.addLayer({
      id: MAP_LAYER_ID_DEMAND_GAP_OVERLAY_HEATMAP,
      type: 'heatmap',
      source: MAP_SOURCE_ID_DEMAND_GAP_OVERLAY,
      paint: MAP_DEMAND_GAP_OVERLAY_HEATMAP_PAINT,
      layout: { visibility: 'none' }
    });
  }

  if (!map.getLayer(MAP_LAYER_ID_DEMAND_GAP_OVERLAY_CIRCLE)) {
    map.addLayer({
      id: MAP_LAYER_ID_DEMAND_GAP_OVERLAY_CIRCLE,
      type: 'circle',
      source: MAP_SOURCE_ID_DEMAND_GAP_OVERLAY,
      paint: MAP_DEMAND_GAP_OVERLAY_CIRCLE_PAINT,
      layout: { visibility: 'none' }
    });
  }

  if (!map.getLayer(MAP_LAYER_ID_DEMAND_GAP_OVERLAY_FOCUS)) {
    map.addLayer({
      id: MAP_LAYER_ID_DEMAND_GAP_OVERLAY_FOCUS,
      type: 'circle',
      source: MAP_SOURCE_ID_DEMAND_GAP_OVERLAY,
      paint: MAP_DEMAND_GAP_OVERLAY_FOCUS_CIRCLE_PAINT,
      layout: { visibility: 'none' },
      filter: ['==', ['get', 'focused'], true]
    });
  }

  if (!map.getSource(MAP_SOURCE_ID_DEMAND_GAP_OD_CONTEXT)) {
    map.addSource(MAP_SOURCE_ID_DEMAND_GAP_OD_CONTEXT, {
      type: 'geojson',
      data: { type: 'FeatureCollection', features: [] }
    });
  }

  if (!map.getLayer(MAP_LAYER_ID_DEMAND_GAP_OD_CONTEXT_LINES)) {
    map.addLayer({
      id: MAP_LAYER_ID_DEMAND_GAP_OD_CONTEXT_LINES,
      type: 'line',
      source: MAP_SOURCE_ID_DEMAND_GAP_OD_CONTEXT,
      paint: MAP_DEMAND_GAP_OD_CONTEXT_HINT_PAINT,
      layout: { visibility: 'none' }
    });
  }

  if (!map.getSource(MAP_SOURCE_ID_SELECTED_DEMAND_NODE_SERVICE_COVERAGE)) {
    map.addSource(MAP_SOURCE_ID_SELECTED_DEMAND_NODE_SERVICE_COVERAGE, {
      type: 'geojson',
      data: { type: 'FeatureCollection', features: [] }
    });
  }

  if (!map.getLayer(MAP_LAYER_ID_SELECTED_DEMAND_NODE_SERVICE_COVERAGE_CIRCLE)) {
    map.addLayer({
      id: MAP_LAYER_ID_SELECTED_DEMAND_NODE_SERVICE_COVERAGE_CIRCLE,
      type: 'circle',
      source: MAP_SOURCE_ID_SELECTED_DEMAND_NODE_SERVICE_COVERAGE,
      paint: MAP_SELECTED_DEMAND_NODE_SERVICE_COVERAGE_CIRCLE_PAINT,
      layout: { visibility: 'visible' }
    });
  }
};


const syncMapWorkspaceSourceData = ({
  map,
  stopSync,
  lineSync,
  vehicleSync,
  osmStopCandidateSync,
  scenarioDemandArtifact,
  routingCoverage,
  demandGapRankingProjection,
  focusedDemandGapId,
  demandGapOdContextProjection,
  demandNodeInspectionProjection,
  selectedDemandNodeServiceCoverageProjection
}: SyncAllMapWorkspaceSourcesInput): MapWorkspaceSourceSyncDiagnostics => {

  let stopBuilderFeatureCount: number | undefined;
  let lineBuilderFeatureCount: number | undefined;
  let vehicleBuilderFeatureCount: number | undefined;
  let osmStopCandidateBuilderFeatureCount: number | undefined;

  if (stopSync) {
    const stopFeatureCollection = buildStopFeatureCollection({
      stops: stopSync.stops,
      selectedStopId: stopSync.selectedStopId,
      draftStopIds: stopSync.draftStopIds,
      buildLineInteractive: stopSync.isBuildLineModeActive,
      selectedLine: stopSync.selectedLine
    });
    stopBuilderFeatureCount = stopFeatureCollection.features.length;

    const stopSource = map.getSource(MAP_SOURCE_ID_STOPS);
    stopSource?.setData(stopFeatureCollection);
  }

  if (lineSync) {
    const completedLineFeatureCollection = buildCompletedLineFeatureCollection({
      lines: lineSync.sessionLines,
      stopsById: lineSync.stopsById,
      selectedLineId: lineSync.selectedLineId
    });
    const draftLineFeatureCollection = buildDraftLineFeatureCollection({
      draftStopIds: lineSync.draftStopIds,
      stopsById: lineSync.stopsById
    });

    lineBuilderFeatureCount = completedLineFeatureCollection.features.length + draftLineFeatureCollection.features.length;

    const completedLineSource = map.getSource(MAP_SOURCE_ID_COMPLETED_LINES);
    const draftLineSource = map.getSource(MAP_SOURCE_ID_DRAFT_LINE);

    completedLineSource?.setData(completedLineFeatureCollection);
    draftLineSource?.setData(draftLineFeatureCollection);
  }

  if (vehicleSync) {
    const vehicleFeatureCollection = buildVehicleFeatureCollection({
      vehicleNetworkProjection: vehicleSync.vehicleNetworkProjection
    });

    vehicleBuilderFeatureCount = vehicleFeatureCollection.features.length;

    const vehicleSource = map.getSource(MAP_SOURCE_ID_VEHICLES);
    vehicleSource?.setData(vehicleFeatureCollection);
  }

  if (osmStopCandidateSync) {
    const osmFeatureCollection = buildOsmStopCandidateFeatureCollection(osmStopCandidateSync);
    osmStopCandidateBuilderFeatureCount = osmFeatureCollection.features.length;
    const osmSource = map.getSource(MAP_SOURCE_ID_OSM_STOP_CANDIDATES);
    osmSource?.setData(osmFeatureCollection);
  }

  if (scenarioDemandArtifact !== undefined) {
    const demandFeatureCollection = buildScenarioDemandPreviewFeatureCollection(scenarioDemandArtifact);
    const demandSource = map.getSource(MAP_SOURCE_ID_SCENARIO_DEMAND_PREVIEW);
    demandSource?.setData(demandFeatureCollection);
  }

  if (routingCoverage !== undefined) {
    const coverageFeatureCollection = buildScenarioRoutingCoverageMaskFeatureCollection(routingCoverage);
    const coverageSource = map.getSource(MAP_SOURCE_ID_SCENARIO_ROUTING_COVERAGE);
    coverageSource?.setData(coverageFeatureCollection);
  }

  if (demandGapRankingProjection !== undefined) {
    const demandGapFeatureCollection = buildDemandGapOverlayFeatureCollection(
      demandGapRankingProjection,
      focusedDemandGapId ?? null
    );
    const demandGapSource = map.getSource(MAP_SOURCE_ID_DEMAND_GAP_OVERLAY);
    demandGapSource?.setData(demandGapFeatureCollection);
  }

  if (demandGapOdContextProjection !== undefined || demandNodeInspectionProjection !== undefined) {
    let odContextFeatureCollection;

    // Priority: selected demand node context hints > focused demand gap OD hints
    if (demandNodeInspectionProjection?.status === 'ready' && demandNodeInspectionProjection.contextCandidates.length > 0) {
      odContextFeatureCollection = buildDemandNodeContextHintFeatureCollection(demandNodeInspectionProjection);
    } else if (demandGapOdContextProjection) {
      odContextFeatureCollection = buildDemandGapOdContextFeatureCollection(demandGapOdContextProjection);
    } else {
      odContextFeatureCollection = { type: 'FeatureCollection' as const, features: [] };
    }

    const odContextSource = map.getSource(MAP_SOURCE_ID_DEMAND_GAP_OD_CONTEXT);
    odContextSource?.setData(odContextFeatureCollection);
  }

  if (selectedDemandNodeServiceCoverageProjection !== undefined) {
    const serviceCoverageFeatureCollection = buildSelectedDemandNodeServiceCoverageFeatureCollection(
      selectedDemandNodeServiceCoverageProjection
    );
    const serviceCoverageSource = map.getSource(MAP_SOURCE_ID_SELECTED_DEMAND_NODE_SERVICE_COVERAGE);
    serviceCoverageSource?.setData(serviceCoverageFeatureCollection);
  }

  enforceMapWorkspaceCustomLayerOrder(map);

  return {
    ...(stopBuilderFeatureCount === undefined ? {} : { stopBuilderFeatureCount }),
    stopSourceFeatureCount: countSourceFeatures(map, MAP_SOURCE_ID_STOPS),
    ...(lineBuilderFeatureCount === undefined ? {} : { lineBuilderFeatureCount }),
    lineSourceFeatureCount:
      countSourceFeatures(map, MAP_SOURCE_ID_COMPLETED_LINES) + countSourceFeatures(map, MAP_SOURCE_ID_DRAFT_LINE),
    ...(vehicleBuilderFeatureCount === undefined ? {} : { vehicleBuilderFeatureCount }),
    vehicleSourceFeatureCount: countSourceFeatures(map, MAP_SOURCE_ID_VEHICLES),
    ...(osmStopCandidateBuilderFeatureCount === undefined ? {} : { osmStopCandidateBuilderFeatureCount }),
    osmStopCandidateSourceFeatureCount: osmStopCandidateBuilderFeatureCount ?? 0,
  };
}
;

/**
 * Synchronizes source data immediately when all workspace sources already exist.
 * Returns null when at least one source handle is still missing.
 */
export const syncExistingMapWorkspaceSourceData = (
  input: SyncAllMapWorkspaceSourcesInput
): MapWorkspaceSourceSyncDiagnostics | null => {
  if (!hasAllMapWorkspaceRenderSources(input.map)) {
    return null;
  }

  return syncMapWorkspaceSourceData(input);
};

/**
 * Synchronizes all workspace-owned map sources/layers in one pass and returns source readback diagnostics.
 */
export const syncAllMapWorkspaceSources = (input: SyncAllMapWorkspaceSourcesInput): MapWorkspaceSourceSyncDiagnostics => {
  ensureAllMapWorkspaceRenderSourcesAndLayers(input.map);
  return syncMapWorkspaceSourceData(input);
};
