import { useEffect, type Dispatch, type RefObject, type SetStateAction } from 'react';
import type { Line } from '../domain/types/line';
import type { OsmStopCandidateGroup, OsmStopCandidateGroupId } from '../domain/types/osmStopCandidate';
import type { Stop, StopId } from '../domain/types/stop';
import type { WorkspaceToolMode } from '../session/sessionTypes';
import type { MapLibreMap } from './maplibreGlobal';
import type { MapSurfaceInteractionState, PlacementAttemptResult, StopSelectionState } from './mapWorkspaceInteractions';
import type { DraftLineState } from './mapWorkspaceDraftState';
import type {
  OsmStopCandidateAnchorResolutionCache
} from './mapWorkspaceOsmCandidateHover';

import {
  bindCompletedLineFeatureInteractions,
  bindStopFeatureInteractions,
  bindOsmCandidateFeatureInteractions,
  bindDemandGapFeatureInteractions,
  bindDemandNodeFeatureInteractions,
  decodeLineIdFromFeatureProperties,
  decodeStopIdFromFeatureProperties,
  handleStopFeatureInteraction,
  resolveOsmCandidateFeatureInteractionSelection,
  resolveInspectModeMapClickSelection,
  setupMapWorkspaceInteractions
} from './mapWorkspaceInteractions';

import {
  decodeDemandGapIdFromFeatureProperties
} from './demandGapFeatureInteraction';

import { resolveCachedOsmStopCandidateStreetAnchor } from './mapWorkspaceOsmCandidateHover';
import { 
  decodeDemandNodeIdFromFeatureProperties 
} from './demandNodeFeatureInteraction';

/** Inputs required to bind map workspace feature and map-surface interactions. */
export interface UseMapWorkspaceInteractionBindingsInput {
  readonly mapRef: RefObject<MapLibreMap | null>;
  readonly activeToolMode: WorkspaceToolMode;
  readonly activeToolModeRef: RefObject<WorkspaceToolMode>;
  readonly sessionLineCountRef: RefObject<number>;
  readonly onStopSelectionChangeRef: RefObject<(nextSelection: StopSelectionState | null) => void>;
  readonly stopsByIdRef: RefObject<ReadonlyMap<StopId, Stop>>;
  readonly anchorResolutionCacheRef: RefObject<OsmStopCandidateAnchorResolutionCache>;
  readonly osmStopCandidateGroups: readonly OsmStopCandidateGroup[];
  readonly setInteractionState: Dispatch<SetStateAction<MapSurfaceInteractionState>>;
  readonly setPlacementAttemptResult: Dispatch<SetStateAction<PlacementAttemptResult>>;
  readonly setHoveredStop: Dispatch<SetStateAction<{ readonly stopId: StopId; readonly x: number; readonly y: number } | null>>;
  readonly setDraftLineState: Dispatch<SetStateAction<DraftLineState>>;
  readonly onPlacedStopsChange: (updater: (currentStops: readonly Stop[]) => readonly Stop[]) => void;
  readonly onStopSelectionChange: (nextSelection: StopSelectionState | null) => void;
  readonly onSelectedLineIdChange: (nextSelectedLineId: Line['id'] | null) => void;
  readonly onOsmCandidateSelectionChange: (nextSelectionId: OsmStopCandidateGroupId | null) => void;
  readonly onOsmCandidateAnchorResolved: (resolution: import('../domain/osm/osmStopCandidateAnchorTypes').OsmStopCandidateStreetAnchorResolution | null) => void;
  readonly onDemandGapFocus: (gapId: string | null) => void;
  readonly onDemandNodeSelectionChange: (nodeId: string | null) => void;
  readonly createStop: (
    nextOrdinal: number,
    lng: number,
    lat: number,
    labelCandidate: string | null,
    existingStops: readonly Stop[]
  ) => Stop;
  readonly onStopCreated: (stop: Stop) => void;
  readonly isMapStyleReady: boolean;
  readonly routingCoverage: import('../domain/scenario/scenarioRegistry').ScenarioRoutingCoverage | null;
}

/**
 * Binds and disposes map workspace interaction handlers for the active MapLibre instance.
 * 
 * This hook orchestrates map-wide interactions including stop placement, OSM candidate
 * inspection, stop feature clicks, and completed line selections.
 */
export function useMapWorkspaceInteractionBindings(input: UseMapWorkspaceInteractionBindingsInput): void {
  useEffect(() => {
    const mapInstance = input.mapRef.current;

    if (!mapInstance || !input.isMapStyleReady) {
      return;
    }

    const interactions = setupMapWorkspaceInteractions({
      map: mapInstance,
      activeToolMode: input.activeToolMode,
      setInteractionState: input.setInteractionState,
      setPlacementAttemptResult: input.setPlacementAttemptResult,
      onStopSelectionChange: input.onStopSelectionChange,
      onStopHoverChange: input.setHoveredStop,
      buildLineContracts: {
        onInspectModeNonFeatureMapClick: () => {
          input.onStopSelectionChange(resolveInspectModeMapClickSelection());
          input.onSelectedLineIdChange(null);
          input.onOsmCandidateSelectionChange(null);
          input.onOsmCandidateAnchorResolved(null);
        }
      },
      onValidPlacement: (lng, lat, labelCandidate) => {
        let createdStop!: Stop;
        input.onPlacedStopsChange((currentStops) => {
          const nextOrdinal = currentStops.length + 1;
          const nextStop = input.createStop(nextOrdinal, lng, lat, labelCandidate, currentStops);
          createdStop = nextStop;
          input.onStopCreated(nextStop);
          return [...currentStops, nextStop];
        });

        return createdStop;
      },
      routingCoverage: input.routingCoverage,
      onDemandGapFocus: (gapId) => {
        if (input.activeToolModeRef.current !== 'inspect') {
          return;
        }
        input.onDemandGapFocus(gapId);
      },
      onDemandNodeSelectionChange: input.onDemandNodeSelectionChange
    });

    const osmCandidateInteractionBinding = bindOsmCandidateFeatureInteractions(mapInstance, (event) => {
      const clickedFeature = event.features?.[0];
      const groupId = resolveOsmCandidateFeatureInteractionSelection(
        clickedFeature?.properties,
        input.activeToolModeRef.current
      );

      if (!groupId) {
        return;
      }

      input.onOsmCandidateSelectionChange(groupId);

      const group = input.osmStopCandidateGroups.find((g) => g.id === groupId);
      if (group) {
        const anchorResolution = resolveCachedOsmStopCandidateStreetAnchor({
          map: mapInstance,
          group,
          cache: input.anchorResolutionCacheRef.current
        });
        input.onOsmCandidateAnchorResolved(anchorResolution);
      } else {
        input.onOsmCandidateAnchorResolved(null);
      }
    });

    const demandGapInteractionBinding = bindDemandGapFeatureInteractions(mapInstance, (event) => {
      if (input.activeToolModeRef.current !== 'inspect') {
        return;
      }

      const clickedFeature = event.features?.[0];
      const target = decodeDemandGapIdFromFeatureProperties(clickedFeature?.properties);

      if (!target) {
        return;
      }

      input.onDemandGapFocus(target.gapId);
    });

    const demandNodeInteractionBinding = bindDemandNodeFeatureInteractions(mapInstance, (event) => {
      if (input.activeToolModeRef.current !== 'inspect') {
        return;
      }

      const nodeId = decodeDemandNodeIdFromFeatureProperties(event.features?.[0]?.properties);

      if (!nodeId) {
        return;
      }

      input.onDemandNodeSelectionChange(nodeId);
    });

    return () => {
      interactions.dispose();
      osmCandidateInteractionBinding.dispose();
      demandGapInteractionBinding.dispose();
      demandNodeInteractionBinding.dispose();
    };
  }, [
    input.activeToolMode,
    input.onPlacedStopsChange,
    input.onStopSelectionChange,
    input.onOsmCandidateSelectionChange,
    input.onDemandNodeSelectionChange,
    input.isMapStyleReady
  ]);

  useEffect(() => {
    const mapInstance = input.mapRef.current;

    if (!mapInstance || !input.isMapStyleReady) {
      return;
    }

    const stopInteractionBinding = bindStopFeatureInteractions(mapInstance, (event) => {
      const clickedFeature = event.features?.[0];
      const stopId = decodeStopIdFromFeatureProperties(clickedFeature?.properties);

      if (!stopId) {
        return;
      }

      handleStopFeatureInteraction(stopId, {
        activeToolMode: input.activeToolModeRef.current,
        sessionLineCount: input.sessionLineCountRef.current,
        stopsById: input.stopsByIdRef.current,
        onStopSelectionChange: input.onStopSelectionChangeRef.current,
        clearSelectedCompletedLine: () => input.onSelectedLineIdChange(null),
        appendStopToDraftLine: (nextStopId, sessionLineCount) => {
          input.setDraftLineState((currentDraft) => {
            const nextMetadata =
              currentDraft.metadata ??
              ({
                draftOrdinal: sessionLineCount + 1,
                startedAtIsoUtc: new Date().toISOString()
              } as const);

            return {
              stopIds: [...currentDraft.stopIds, nextStopId],
              metadata: nextMetadata
            };
          });
        }
      });
      input.onOsmCandidateAnchorResolved(null);
      input.setHoveredStop(null);
    });

    return () => {
      stopInteractionBinding.dispose();
    };
  }, [input.isMapStyleReady]);

  useEffect(() => {
    const mapInstance = input.mapRef.current;

    if (!mapInstance || !input.isMapStyleReady) {
      return;
    }

    const completedLineInteractionBinding = bindCompletedLineFeatureInteractions(mapInstance, (event) => {
      if (input.activeToolModeRef.current === 'build-line') {
        return;
      }

      const clickedFeature = event.features?.[0];
      const clickedLineId = decodeLineIdFromFeatureProperties(clickedFeature?.properties);

      if (!clickedLineId) {
        return;
      }

      input.onStopSelectionChangeRef.current(null);
      input.onSelectedLineIdChange(clickedLineId);
      input.onOsmCandidateAnchorResolved(null);
    });

    return () => {
      completedLineInteractionBinding.dispose();
    };
  }, [input.onSelectedLineIdChange, input.isMapStyleReady]);
}
