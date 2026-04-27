import type { Line } from '../domain/types/line';
import type { LineVehicleNetworkProjection } from '../domain/types/lineVehicleProjection';
import type { Stop, StopId } from '../domain/types/stop';
import type { OsmStopCandidate } from '../domain/types/osmStopCandidate';
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
  MAP_OSM_STOP_CANDIDATE_CIRCLE_LAYER_PAINT
} from './mapRenderConstants';
import type { MapLibreMap } from './maplibreGlobal';
import { buildStopFeatureCollection } from './stopGeoJson';
import { buildVehicleFeatureCollection } from './vehicleGeoJson';
import { buildOsmStopCandidateFeatureCollection } from './osmStopCandidateGeoJson';

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

/**
 * Inputs for one lifecycle-safe source/layer synchronization pass.
 */
export interface SyncAllMapWorkspaceSourcesInput {
  readonly map: MapLibreMap;
  readonly stopSync?: MapWorkspaceStopSyncInput;
  readonly lineSync?: MapWorkspaceLineSyncInput;
  readonly vehicleSync?: MapWorkspaceVehicleSyncInput;
  readonly osmStopCandidateSync?: readonly OsmStopCandidate[];
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
  MAP_LAYER_ID_OSM_STOP_CANDIDATES_CIRCLE,
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
export const listPresentMapWorkspaceCustomLayerIds = (map: MapLibreMap): readonly string[] =>
  getMapWorkspaceCustomLayerOrder().filter((layerId) => map.getLayer(layerId) !== undefined);

const WORKSPACE_SOURCE_IDS = [
  MAP_SOURCE_ID_COMPLETED_LINES,
  MAP_SOURCE_ID_DRAFT_LINE,
  MAP_SOURCE_ID_STOPS,
  MAP_SOURCE_ID_VEHICLES,
  MAP_SOURCE_ID_OSM_STOP_CANDIDATES
] as const;

/**
 * Returns whether all workspace-owned GeoJSON sources already exist on the current map style.
 */
export const hasAllMapWorkspaceRenderSources = (map: MapLibreMap): boolean =>
  WORKSPACE_SOURCE_IDS.every((sourceId) => map.getSource(sourceId) !== undefined);

const countSourceFeatures = (map: MapLibreMap, sourceId: string): number => {
  if (!map.getSource(sourceId)) {
    return 0;
  }

  return map.querySourceFeatures(sourceId).length;
};

/**
 * Reapplies deterministic ordering for all workspace-owned custom layers.
 */
export const enforceMapWorkspaceCustomLayerOrder = (map: MapLibreMap): void => {
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

const ensureAllMapWorkspaceRenderSourcesAndLayers = (map: MapLibreMap): void => {
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
      paint: MAP_OSM_STOP_CANDIDATE_CIRCLE_LAYER_PAINT
    });
  }

};

const syncMapWorkspaceSourceData = ({
  map,
  stopSync,
  lineSync,
  vehicleSync,
  osmStopCandidateSync
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
    osmStopCandidateSourceFeatureCount: countSourceFeatures(map, MAP_SOURCE_ID_OSM_STOP_CANDIDATES)
  };
};

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
