import type { Line } from '../domain/types/line';
import type { Stop, StopId } from '../domain/types/stop';
import { createLineId } from '../domain/types/line';
import { createStopId } from '../domain/types/stop';
import type { WorkspaceToolMode } from '../App';
import {
  MAP_LAYER_ID_COMPLETED_LINES,
  MAP_LAYER_ID_STOPS_CIRCLE
} from './mapRenderConstants';
import {
  type MapLibreInteractionEvent,
  type MapLibreMap
} from './maplibreGlobal';
import {
  isEligibleStopPlacementClickForLayers,
  resolveSnappedStreetPosition,
  resolveStreetLayerIdsFromStyle
} from './mapWorkspaceStreetSnap';

/** Canonical single-stop selection contract shared by marker highlighting and shell inspector state. */
export interface StopSelectionState {
  readonly selectedStopId: StopId;
}

/** UI-visible interaction status used by the map workspace telemetry HUD. */
export type MapSurfaceInteractionStatus = 'idle' | 'pointer-active' | 'click-captured' | 'placement-rejected';

/** Placement attempt outcome used to project placement-mode feedback copy. */
export type PlacementAttemptResult = 'none' | 'placed' | 'invalid-target';

interface MapSurfacePointerState {
  readonly screenX: number;
  readonly screenY: number;
  readonly lng?: number;
  readonly lat?: number;
}

/** Local pointer telemetry contract emitted from map interactions. */
export interface MapSurfaceInteractionState {
  readonly status: MapSurfaceInteractionStatus;
  readonly pointer: MapSurfacePointerState | null;
}

/** Callback contracts for neutral map telemetry handlers. */
export interface NeutralMapTelemetryContracts {
  readonly setInteractionState: (nextState: MapSurfaceInteractionState) => void;
}

/** Pointer and click handlers for neutral telemetry updates independent of tool mode. */
export interface NeutralMapTelemetryHandlers {
  readonly onPointerMove: (event: MapLibreInteractionEvent) => void;
  readonly onMapClick: (event: MapLibreInteractionEvent) => void;
}

interface PlacementGameplayContracts {
  readonly map: MapLibreMap;
  readonly setInteractionState: (nextState: MapSurfaceInteractionState) => void;
  readonly setPlacementAttemptResult: (nextState: PlacementAttemptResult) => void;
  readonly onStopSelectionChange: (nextSelection: StopSelectionState | null) => void;
  readonly onValidPlacement: (lng: number, lat: number) => Stop;
}

interface BuildLineModeMapClickContracts {
  readonly onInspectModeNonFeatureMapClick: () => void;
}

/** Contract for wiring tool-mode specific map click behavior without owning session state. */
export interface MapWorkspaceSurfaceInteractionsContracts {
  readonly map: MapLibreMap;
  readonly activeToolMode: WorkspaceToolMode;
  readonly setInteractionState: (nextState: MapSurfaceInteractionState) => void;
  readonly setPlacementAttemptResult: (nextState: PlacementAttemptResult) => void;
  readonly onStopSelectionChange: (nextSelection: StopSelectionState | null) => void;
  readonly onValidPlacement: (lng: number, lat: number) => Stop;
  readonly buildLineContracts: BuildLineModeMapClickContracts;
}

/** Disposable interaction binding returned by workspace map setup helpers. */
export interface MapWorkspaceInteractionBinding {
  readonly dispose: () => void;
}

/** Context contract for resolving stop-feature clicks across inspect and build-line modes. */
export interface StopFeatureInteractionContext {
  readonly activeToolMode: WorkspaceToolMode;
  readonly sessionLineCount: number;
  readonly stopsById: ReadonlyMap<StopId, Stop>;
  readonly onStopSelectionChange: (nextSelection: StopSelectionState | null) => void;
  readonly clearSelectedCompletedLine: () => void;
  readonly appendStopToDraftLine: (stopId: StopId, sessionLineCount: number) => void;
}

const toStopSelectionState = (stop: Stop): StopSelectionState => ({ selectedStopId: stop.id });

const createPointerState = (screenX: number, screenY: number, lng?: number, lat?: number): MapSurfacePointerState => {
  const baseState: MapSurfacePointerState = { screenX, screenY };

  if (lng !== undefined && lat !== undefined) {
    return { ...baseState, lng, lat };
  }

  return baseState;
};

/** Creates mode-agnostic pointer and map click telemetry handlers for the workspace HUD. */
export const createNeutralMapTelemetryHandlers = ({ setInteractionState }: NeutralMapTelemetryContracts): NeutralMapTelemetryHandlers => ({
  onPointerMove: (event) => {
    setInteractionState({
      status: 'pointer-active',
      pointer: createPointerState(event.point.x, event.point.y, event.lngLat?.lng, event.lngLat?.lat)
    });
  },
  onMapClick: (event) => {
    setInteractionState({
      status: 'idle',
      pointer: createPointerState(event.point.x, event.point.y, event.lngLat?.lng, event.lngLat?.lat)
    });
  }
});

/** Applies inspect-mode empty-map click behavior by clearing the currently selected stop. */
export const resolveInspectModeMapClickSelection = (): StopSelectionState | null => null;

/** Decodes a stop id from map feature properties and returns null when the property is absent or invalid. */
export const decodeStopIdFromFeatureProperties = (properties: Record<string, unknown> | undefined): StopId | null => {
  const stopIdValue = properties?.stopId;

  if (typeof stopIdValue !== 'string') {
    return null;
  }

  return createStopId(stopIdValue);
};

/** Decodes a line id from map feature properties and returns null when the property is absent or invalid. */
export const decodeLineIdFromFeatureProperties = (properties: Record<string, unknown> | undefined): Line['id'] | null => {
  const lineIdValue = properties?.lineId;

  if (typeof lineIdValue !== 'string') {
    return null;
  }

  return createLineId(lineIdValue);
};

/** Returns true when the click point intersects stop or completed-line interactive feature layers. */
export const hasInteractiveSelectionFeatureAtPoint = (map: MapLibreMap, event: MapLibreInteractionEvent): boolean => {
  const interactiveSelectionLayers: readonly string[] = [MAP_LAYER_ID_STOPS_CIRCLE, MAP_LAYER_ID_COMPLETED_LINES];
  const renderedFeatures = map.queryRenderedFeatures(event.point, { layers: interactiveSelectionLayers });

  return renderedFeatures.length > 0;
};

const handleStopPlacementClick = (
  { map, setInteractionState, setPlacementAttemptResult, onStopSelectionChange, onValidPlacement }: PlacementGameplayContracts,
  event: MapLibreInteractionEvent
): void => {
  const streetLayerIds = resolveStreetLayerIdsFromStyle(map);
  const snappedPosition = resolveSnappedStreetPosition(map, event, streetLayerIds);

  if (!event.lngLat || !isEligibleStopPlacementClickForLayers(map, event, streetLayerIds) || !snappedPosition) {
    setPlacementAttemptResult('invalid-target');
    setInteractionState({
      status: 'placement-rejected',
      pointer: createPointerState(event.point.x, event.point.y, event.lngLat?.lng, event.lngLat?.lat)
    });
    onStopSelectionChange(null);

    return;
  }

  const placedStop = onValidPlacement(snappedPosition.lng, snappedPosition.lat);
  onStopSelectionChange(toStopSelectionState(placedStop));
  setPlacementAttemptResult('placed');
  setInteractionState({
    status: 'click-captured',
    pointer: createPointerState(event.point.x, event.point.y, snappedPosition.lng, snappedPosition.lat)
  });
};

/** Binds click and pointer handlers for place-stop and inspect behavior while keeping state/callback ownership external. */
export const setupMapWorkspaceInteractions = ({
  map,
  activeToolMode,
  setInteractionState,
  setPlacementAttemptResult,
  onStopSelectionChange,
  onValidPlacement,
  buildLineContracts
}: MapWorkspaceSurfaceInteractionsContracts): MapWorkspaceInteractionBinding => {
  const neutralTelemetryHandlers = createNeutralMapTelemetryHandlers({ setInteractionState });

  const onMapClick = (event: MapLibreInteractionEvent): void => {
    neutralTelemetryHandlers.onMapClick(event);

    if (activeToolMode === 'place-stop') {
      handleStopPlacementClick({ map, setInteractionState, setPlacementAttemptResult, onStopSelectionChange, onValidPlacement }, event);
      return;
    }

    setPlacementAttemptResult('none');

    if (activeToolMode === 'inspect' && !hasInteractiveSelectionFeatureAtPoint(map, event)) {
      buildLineContracts.onInspectModeNonFeatureMapClick();
    }
  };

  map.on('mousemove', neutralTelemetryHandlers.onPointerMove);
  map.on('click', onMapClick);

  return {
    dispose: () => {
      map.off('mousemove', neutralTelemetryHandlers.onPointerMove);
      map.off('click', onMapClick);
    }
  };
};

/** Handles stop-feature interactions for inspect/build-line modes while leaving draft/session ownership in React state. */
export const handleStopFeatureInteraction = (stopId: StopId, context: StopFeatureInteractionContext): void => {
  const stop = context.stopsById.get(stopId);

  if (!stop) {
    return;
  }

  if (context.activeToolMode === 'build-line') {
    context.appendStopToDraftLine(stop.id, context.sessionLineCount);
    return;
  }

  if (context.activeToolMode === 'inspect') {
    context.clearSelectedCompletedLine();
  }

  context.onStopSelectionChange(toStopSelectionState(stop));
};

/** Binds click interactions for rendered stop features and provides a dispose hook. */
export const bindStopFeatureInteractions = (
  map: MapLibreMap,
  onStopFeatureClick: (event: MapLibreInteractionEvent) => void
): MapWorkspaceInteractionBinding => {
  map.on('click', MAP_LAYER_ID_STOPS_CIRCLE, onStopFeatureClick);

  return {
    dispose: () => {
      map.off('click', MAP_LAYER_ID_STOPS_CIRCLE, onStopFeatureClick);
    }
  };
};

/** Binds click interactions for rendered completed-line features and provides a dispose hook. */
export const bindCompletedLineFeatureInteractions = (
  map: MapLibreMap,
  onCompletedLineClick: (event: MapLibreInteractionEvent) => void
): MapWorkspaceInteractionBinding => {
  map.on('click', MAP_LAYER_ID_COMPLETED_LINES, onCompletedLineClick);

  return {
    dispose: () => {
      map.off('click', MAP_LAYER_ID_COMPLETED_LINES, onCompletedLineClick);
    }
  };
};
