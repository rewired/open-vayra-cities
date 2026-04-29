import React, { useEffect, useRef } from 'react';
import type { RefObject } from 'react';
import type { Line } from '../domain/types/line';
import type { LineVehicleNetworkProjection } from '../domain/types/lineVehicleProjection';
import type { OsmStopCandidateGroup } from '../domain/types/osmStopCandidate';
import type { Stop, StopId } from '../domain/types/stop';
import type { WorkspaceToolMode } from '../session/sessionTypes';
import type { MapLibreMap } from './maplibreGlobal';
import type { MapLayerVisibilityById } from '../ui/constants/mapLayerUiConstants';
import { applyMapLayerVisibility } from './mapLayerVisibility';

import {
  MAP_LAYER_ID_COMPLETED_LINES,
  MAP_LAYER_ID_DRAFT_LINE,
  MAP_LAYER_ID_VEHICLES
} from './mapRenderConstants';
import { syncAllMapWorkspaceSources, syncExistingMapWorkspaceSourceData } from './mapWorkspaceSourceSync';
import {
  countRenderedFeaturesForLayers,
  runWhenMapStyleReady
} from './mapWorkspaceLifecycle';
import { applyBasemapSemanticReadabilityOverrides } from './mapBaseStyleOverrides';

/** Feature diagnostics for a specific layer group. */
export interface LayerFeatureDiagnostics {
  readonly builderFeatureCount: number;
  readonly sourceFeatureCount: number;
  readonly renderedFeatureCount: number;
}

/** Diagnostics for all map workspace features. */
export interface MapWorkspaceFeatureDiagnostics {
  readonly lines: LayerFeatureDiagnostics;
  readonly vehicles: LayerFeatureDiagnostics;
}

/** Inputs required to keep map workspace GeoJSON sources synchronized with React state. */
export interface UseMapWorkspaceSourceSyncInput {
  readonly mapRef: RefObject<MapLibreMap | null>;
  readonly activeToolMode: WorkspaceToolMode;
  readonly placedStops: readonly Stop[];
  readonly selectedStopId: StopId | null;
  readonly draftStopIds: readonly StopId[];
  readonly draftStopIdSet: ReadonlySet<StopId>;
  readonly sessionLines: readonly Line[];
  readonly selectedLineId: Line['id'] | null;
  readonly vehicleNetworkProjection: LineVehicleNetworkProjection;
  readonly osmStopCandidateGroups: readonly OsmStopCandidateGroup[];
  readonly layerVisibility: MapLayerVisibilityById;
  readonly setFeatureDiagnostics: React.Dispatch<React.SetStateAction<MapWorkspaceFeatureDiagnostics>>;
}

/**
 * Keeps workspace-owned MapLibre sources and rendered feature diagnostics synchronized.
 * 
 * @param input Inputs required for synchronization.
 */
export function useMapWorkspaceSourceSync(input: UseMapWorkspaceSourceSyncInput): void {
  const {
    mapRef,
    activeToolMode,
    placedStops,
    selectedStopId,
    draftStopIds,
    draftStopIdSet,
    sessionLines,
    selectedLineId,
    vehicleNetworkProjection,
    osmStopCandidateGroups,
    layerVisibility,
    setFeatureDiagnostics
  } = input;

  const layerVisibilityRef = useRef(layerVisibility);
  useEffect(() => {
    layerVisibilityRef.current = layerVisibility;
  }, [layerVisibility]);

  // 1. Stop source sync
  useEffect(() => {
    const mapInstance = mapRef.current;

    if (!mapInstance) {
      return;
    }

    const sourceSyncDiagnostics = syncExistingMapWorkspaceSourceData({
      map: mapInstance,
      stopSync: {
        stops: placedStops,
        selectedStopId,
        draftStopIds: draftStopIdSet,
        isBuildLineModeActive: activeToolMode === 'build-line',
        selectedLine: sessionLines.find(l => l.id === selectedLineId) ?? null
      }
    });

    if (sourceSyncDiagnostics) {
      return;
    }

    return runWhenMapStyleReady(mapInstance, () => {
      applyBasemapSemanticReadabilityOverrides(mapInstance);
      syncAllMapWorkspaceSources({
        map: mapInstance,
        stopSync: {
          stops: placedStops,
          selectedStopId,
          draftStopIds: draftStopIdSet,
          isBuildLineModeActive: activeToolMode === 'build-line',
          selectedLine: sessionLines.find(l => l.id === selectedLineId) ?? null
        }
      });
      applyMapLayerVisibility(mapInstance, layerVisibilityRef.current);
    });
  }, [activeToolMode, draftStopIdSet, placedStops, selectedStopId, sessionLines, selectedLineId, mapRef.current]);

  // 2. Line source sync
  useEffect(() => {
    const mapInstance = mapRef.current;

    if (!mapInstance) {
      return;
    }

    const sourceSyncDiagnostics = syncExistingMapWorkspaceSourceData({
      map: mapInstance,
      lineSync: {
        sessionLines,
        selectedLineId,
        draftStopIds,
        stopsById: new Map(placedStops.map((stop) => [stop.id, stop] as const))
      }
    });

    if (sourceSyncDiagnostics) {
      setFeatureDiagnostics((currentDiagnostics) => ({
        ...currentDiagnostics,
        lines: {
          ...currentDiagnostics.lines,
          builderFeatureCount: sourceSyncDiagnostics.lineBuilderFeatureCount ?? currentDiagnostics.lines.builderFeatureCount,
          sourceFeatureCount: sourceSyncDiagnostics.lineSourceFeatureCount
        }
      }));
      return;
    }

    return runWhenMapStyleReady(mapInstance, () => {
      applyBasemapSemanticReadabilityOverrides(mapInstance);
      const styleReadySyncDiagnostics = syncAllMapWorkspaceSources({
        map: mapInstance,
        lineSync: {
          sessionLines,
          selectedLineId,
          draftStopIds,
          stopsById: new Map(placedStops.map((stop) => [stop.id, stop] as const))
        }
      });
      applyMapLayerVisibility(mapInstance, layerVisibilityRef.current);

      setFeatureDiagnostics((currentDiagnostics) => ({
        ...currentDiagnostics,
        lines: {
          ...currentDiagnostics.lines,
          builderFeatureCount:
            styleReadySyncDiagnostics.lineBuilderFeatureCount ?? currentDiagnostics.lines.builderFeatureCount,
          sourceFeatureCount: styleReadySyncDiagnostics.lineSourceFeatureCount
        }
      }));
    });
  }, [draftStopIds, placedStops, selectedLineId, sessionLines, mapRef.current]);

  // 3. Vehicle source sync
  useEffect(() => {
    const mapInstance = mapRef.current;

    if (!mapInstance) {
      return;
    }

    const sourceSyncDiagnostics = syncExistingMapWorkspaceSourceData({
      map: mapInstance,
      vehicleSync: {
        vehicleNetworkProjection
      }
    });

    if (sourceSyncDiagnostics) {
      setFeatureDiagnostics((currentDiagnostics) => ({
        ...currentDiagnostics,
        vehicles: {
          ...currentDiagnostics.vehicles,
          builderFeatureCount: sourceSyncDiagnostics.vehicleBuilderFeatureCount ?? currentDiagnostics.vehicles.builderFeatureCount,
          sourceFeatureCount: sourceSyncDiagnostics.vehicleSourceFeatureCount
        }
      }));
      return;
    }

    return runWhenMapStyleReady(mapInstance, () => {
      applyBasemapSemanticReadabilityOverrides(mapInstance);
      const styleReadySyncDiagnostics = syncAllMapWorkspaceSources({
        map: mapInstance,
        vehicleSync: {
          vehicleNetworkProjection
        }
      });
      applyMapLayerVisibility(mapInstance, layerVisibilityRef.current);

      setFeatureDiagnostics((currentDiagnostics) => ({
        ...currentDiagnostics,
        vehicles: {
          ...currentDiagnostics.vehicles,
          builderFeatureCount:
            styleReadySyncDiagnostics.vehicleBuilderFeatureCount ?? currentDiagnostics.vehicles.builderFeatureCount,
          sourceFeatureCount: styleReadySyncDiagnostics.vehicleSourceFeatureCount
        }
      }));
    });
  }, [vehicleNetworkProjection, mapRef.current]);

  // 4. OSM candidate source sync
  useEffect(() => {
    const mapInstance = mapRef.current;

    if (!mapInstance) {
      return;
    }

    const sourceSyncDiagnostics = syncExistingMapWorkspaceSourceData({
      map: mapInstance,
      osmStopCandidateSync: osmStopCandidateGroups
    });

    if (sourceSyncDiagnostics) {
      return;
    }

    return runWhenMapStyleReady(mapInstance, () => {
      applyBasemapSemanticReadabilityOverrides(mapInstance);
      syncAllMapWorkspaceSources({
        map: mapInstance,
        osmStopCandidateSync: osmStopCandidateGroups
      });
      applyMapLayerVisibility(mapInstance, layerVisibilityRef.current);
    });
  }, [osmStopCandidateGroups, mapRef.current]);



  // 5. Visibility application effect
  useEffect(() => {
    const mapInstance = mapRef.current;
    if (!mapInstance) {
      return;
    }

    applyMapLayerVisibility(mapInstance, layerVisibility);
  }, [layerVisibility, mapRef.current]);

  // 6. Rendered feature diagnostics refresh

  useEffect(() => {
    const mapInstance = mapRef.current;

    if (!mapInstance) {
      return;
    }

    const refreshRenderedFeatureDiagnostics = (): void => {
      const lineRenderedFeatureCount = countRenderedFeaturesForLayers(mapInstance, [
        MAP_LAYER_ID_COMPLETED_LINES,
        MAP_LAYER_ID_DRAFT_LINE
      ]);
      const vehicleRenderedFeatureCount = countRenderedFeaturesForLayers(mapInstance, [MAP_LAYER_ID_VEHICLES]);

      setFeatureDiagnostics((currentDiagnostics) => {
        if (
          currentDiagnostics.lines.renderedFeatureCount === lineRenderedFeatureCount &&
          currentDiagnostics.vehicles.renderedFeatureCount === vehicleRenderedFeatureCount
        ) {
          return currentDiagnostics;
        }

        return {
          ...currentDiagnostics,
          lines: {
            ...currentDiagnostics.lines,
            renderedFeatureCount: lineRenderedFeatureCount
          },
          vehicles: {
            ...currentDiagnostics.vehicles,
            renderedFeatureCount: vehicleRenderedFeatureCount
          }
        };
      });
    };

    refreshRenderedFeatureDiagnostics();
    mapInstance.on('render', refreshRenderedFeatureDiagnostics);
    mapInstance.on('idle', refreshRenderedFeatureDiagnostics);

    return () => {
      mapInstance.off('render', refreshRenderedFeatureDiagnostics);
      mapInstance.off('idle', refreshRenderedFeatureDiagnostics);
    };
  }, [mapRef.current]);
}
