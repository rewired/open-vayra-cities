import { useEffect, useRef, useState, type ReactElement } from 'react';

import type { Stop } from '../domain/types/stop';
import { createStopId } from '../domain/types/stop';
import type { WorkspaceToolMode } from '../App';
import { MAP_WORKSPACE_BOOTSTRAP_CONFIG } from './mapBootstrapConfig';
import type { MapLibreInteractionEvent, MapLibreMap, MapLibreMarker } from './maplibreGlobal';

type MapSurfaceInteractionStatus = 'idle' | 'pointer-active' | 'click-captured' | 'placement-rejected';

type PlacementFeedbackState = 'none' | 'invalid-target';

interface MapSurfacePointerState {
  readonly screenX: number;
  readonly screenY: number;
  readonly lng?: number;
  readonly lat?: number;
}

interface MapSurfaceInteractionState {
  readonly status: MapSurfaceInteractionStatus;
  readonly pointer: MapSurfacePointerState | null;
}

interface NeutralMapTelemetryHandlers {
  readonly onPointerMove: (event: MapLibreInteractionEvent) => void;
  readonly onMapClick: (event: MapLibreInteractionEvent) => void;
}

interface NeutralMapTelemetryContracts {
  readonly setInteractionState: (nextState: MapSurfaceInteractionState) => void;
}

interface PlacementGameplayContracts {
  readonly map: MapLibreMap;
  readonly setInteractionState: (nextState: MapSurfaceInteractionState) => void;
  readonly setPlacementFeedback: (nextState: PlacementFeedbackState) => void;
  readonly onValidPlacement: (event: MapLibreInteractionEvent) => void;
}

interface MapWorkspaceSurfaceInteractionsContracts {
  readonly map: MapLibreMap;
  readonly activeToolMode: WorkspaceToolMode;
  readonly setInteractionState: (nextState: MapSurfaceInteractionState) => void;
  readonly setPlacementFeedback: (nextState: PlacementFeedbackState) => void;
  readonly onValidPlacement: (event: MapLibreInteractionEvent) => void;
}

interface MapWorkspaceResizeBinding {
  readonly dispose: () => void;
}

interface MapWorkspaceSurfaceProps {
  readonly activeToolMode: WorkspaceToolMode;
}

const STREET_LAYER_HINTS = ['road', 'street', 'highway', 'bridge', 'tunnel', 'transport', 'path'] as const;
const STREET_SOURCE_HINTS = ['road', 'street', 'transport', 'highway'] as const;
const STOP_LABEL_PREFIX = 'Stop';

const createPointerState = (screenX: number, screenY: number, lng?: number, lat?: number): MapSurfacePointerState => {
  const baseState: MapSurfacePointerState = { screenX, screenY };

  if (lng !== undefined && lat !== undefined) {
    return { ...baseState, lng, lat };
  }

  return baseState;
};

const includesHint = (value: string | undefined, hints: readonly string[]): boolean => {
  if (!value) {
    return false;
  }

  const lowered = value.toLowerCase();
  return hints.some((hint) => lowered.includes(hint));
};

const resolveStreetLayerIdsFromStyle = (map: MapLibreMap): readonly string[] => {
  const styleDefinition = map.getStyle();

  if (!styleDefinition?.layers) {
    return [];
  }

  return styleDefinition.layers
    .filter((layer) => {
      const isLineLikeLayer = layer.type === 'line';
      const hasStreetLayerHint = includesHint(layer.id, STREET_LAYER_HINTS);
      const hasStreetSourceHint =
        includesHint(layer.source, STREET_SOURCE_HINTS) ||
        includesHint(layer.sourceLayer ?? layer['source-layer'], STREET_SOURCE_HINTS);

      return isLineLikeLayer && (hasStreetLayerHint || hasStreetSourceHint);
    })
    .map((layer) => layer.id);
};

const isEligibleStopPlacementClick = (map: MapLibreMap, event: MapLibreInteractionEvent): boolean => {
  const streetLayerIds = resolveStreetLayerIdsFromStyle(map);

  if (streetLayerIds.length === 0) {
    return false;
  }

  const renderedFeatures = map.queryRenderedFeatures(event.point, { layers: streetLayerIds });
  return renderedFeatures.length > 0;
};

const createNeutralMapTelemetryHandlers = ({ setInteractionState }: NeutralMapTelemetryContracts): NeutralMapTelemetryHandlers => ({
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

const handleStopPlacementClick = (
  { map, setInteractionState, setPlacementFeedback, onValidPlacement }: PlacementGameplayContracts,
  event: MapLibreInteractionEvent
): void => {
  if (!event.lngLat || !isEligibleStopPlacementClick(map, event)) {
    setPlacementFeedback('invalid-target');
    setInteractionState({
      status: 'placement-rejected',
      pointer: createPointerState(event.point.x, event.point.y, event.lngLat?.lng, event.lngLat?.lat)
    });

    return;
  }

  onValidPlacement(event);
  setPlacementFeedback('none');
  setInteractionState({
    status: 'click-captured',
    pointer: createPointerState(event.point.x, event.point.y, event.lngLat.lng, event.lngLat.lat)
  });
};

const setupMapWorkspaceInteractions = ({
  map,
  activeToolMode,
  setInteractionState,
  setPlacementFeedback,
  onValidPlacement
}: MapWorkspaceSurfaceInteractionsContracts): { readonly dispose: () => void } => {
  const neutralTelemetryHandlers = createNeutralMapTelemetryHandlers({ setInteractionState });

  const onMapClick = (event: MapLibreInteractionEvent): void => {
    neutralTelemetryHandlers.onMapClick(event);

    if (activeToolMode !== 'place-stop') {
      setPlacementFeedback('none');
      return;
    }

    handleStopPlacementClick({ map, setInteractionState, setPlacementFeedback, onValidPlacement }, event);
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

const setupMapResizeBinding = (containerElement: HTMLDivElement, mapRef: { readonly current: MapLibreMap | null }): MapWorkspaceResizeBinding => {
  const handleMapResize = (): void => {
    mapRef.current?.resize();
  };
  const resizeObserver =
    typeof ResizeObserver !== 'undefined'
      ? new ResizeObserver(() => {
          handleMapResize();
        })
      : null;

  if (resizeObserver) {
    resizeObserver.observe(containerElement);
  } else {
    window.addEventListener('resize', handleMapResize);
  }

  return {
    dispose: () => {
      if (resizeObserver) {
        resizeObserver.disconnect();
      } else {
        window.removeEventListener('resize', handleMapResize);
      }
    }
  };
};

const createMapWorkspaceInstance = (containerElement: HTMLDivElement): MapLibreMap => {
  const mapInstance = new window.maplibregl.Map({
    container: containerElement,
    style: MAP_WORKSPACE_BOOTSTRAP_CONFIG.styleUrl,
    center: MAP_WORKSPACE_BOOTSTRAP_CONFIG.center,
    zoom: MAP_WORKSPACE_BOOTSTRAP_CONFIG.zoom,
    minZoom: MAP_WORKSPACE_BOOTSTRAP_CONFIG.minZoom,
    maxZoom: MAP_WORKSPACE_BOOTSTRAP_CONFIG.maxZoom,
    attributionControl: true
  });

  mapInstance.addControl(new window.maplibregl.NavigationControl({ visualizePitch: false }), 'top-left');
  return mapInstance;
};

const createStopMarker = (stop: Stop): MapLibreMarker => {
  const markerElement = document.createElement('div');
  markerElement.className = 'map-workspace__stop-marker';
  markerElement.title = stop.label ?? stop.id;

  return new window.maplibregl.Marker({ element: markerElement }).setLngLat([stop.position.lng, stop.position.lat]);
};

const buildDeterministicStop = (nextOrdinal: number, lng: number, lat: number): Stop => ({
  id: createStopId(`stop-${nextOrdinal}`),
  position: { lng, lat },
  label: `${STOP_LABEL_PREFIX} ${nextOrdinal}`
});

const syncStopMarkers = ({
  map,
  stops,
  markerByStopId
}: {
  readonly map: MapLibreMap;
  readonly stops: readonly Stop[];
  readonly markerByStopId: Map<Stop['id'], MapLibreMarker>;
}): void => {
  const activeStopIds = new Set(stops.map((stop) => stop.id));

  stops.forEach((stop) => {
    if (markerByStopId.has(stop.id)) {
      return;
    }

    const marker = createStopMarker(stop).addTo(map);
    markerByStopId.set(stop.id, marker);
  });

  markerByStopId.forEach((marker, stopId) => {
    if (activeStopIds.has(stopId)) {
      return;
    }

    marker.remove();
    markerByStopId.delete(stopId);
  });
};

/**
 * Renders the CityOps workspace as a real MapLibre map surface with local click telemetry and minimal stop-placement validation.
 */
export function MapWorkspaceSurface({ activeToolMode }: MapWorkspaceSurfaceProps): ReactElement {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<MapLibreMap | null>(null);
  const stopMarkerRef = useRef<Map<Stop['id'], MapLibreMarker>>(new Map());
  const [interactionState, setInteractionState] = useState<MapSurfaceInteractionState>({
    status: 'idle',
    pointer: null
  });
  const [placementFeedback, setPlacementFeedback] = useState<PlacementFeedbackState>('none');
  const [placedStops, setPlacedStops] = useState<readonly Stop[]>([]);

  useEffect(() => {
    const containerElement = mapContainerRef.current;

    if (!containerElement || mapInstanceRef.current) {
      return;
    }

    const mapInstance = createMapWorkspaceInstance(containerElement);
    mapInstanceRef.current = mapInstance;
    const mapResizeBinding = setupMapResizeBinding(containerElement, mapInstanceRef);

    return () => {
      mapResizeBinding.dispose();
      stopMarkerRef.current.forEach((marker) => marker.remove());
      stopMarkerRef.current.clear();
      mapInstanceRef.current?.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  useEffect(() => {
    const mapInstance = mapInstanceRef.current;

    if (!mapInstance) {
      return;
    }

    const interactions = setupMapWorkspaceInteractions({
      map: mapInstance,
      activeToolMode,
      setInteractionState,
      setPlacementFeedback,
      onValidPlacement: (event) => {
        if (!event.lngLat) {
          return;
        }

        const { lng, lat } = event.lngLat;
        setPlacedStops((currentStops) => {
          const nextOrdinal = currentStops.length + 1;
          const nextStop = buildDeterministicStop(nextOrdinal, lng, lat);
          return [...currentStops, nextStop];
        });
      }
    });

    return () => {
      interactions.dispose();
    };
  }, [activeToolMode]);

  useEffect(() => {
    const mapInstance = mapInstanceRef.current;

    if (!mapInstance) {
      return;
    }

    syncStopMarkers({ map: mapInstance, stops: placedStops, markerByStopId: stopMarkerRef.current });
  }, [placedStops]);

  const pointerSummary = interactionState.pointer
    ? `x:${interactionState.pointer.screenX.toFixed(1)} y:${interactionState.pointer.screenY.toFixed(1)}`
    : 'none';
  const geographicSummary =
    interactionState.pointer?.lng !== undefined && interactionState.pointer.lat !== undefined
      ? `lng:${interactionState.pointer.lng.toFixed(5)} lat:${interactionState.pointer.lat.toFixed(5)}`
      : 'lng/lat unavailable';
  const placementFeedbackSummary =
    placementFeedback === 'invalid-target' ? 'Stop placement blocked: choose a street segment.' : 'Stop placement target: ready.';

  return (
    <section className="map-workspace" aria-label="Map workspace surface">
      <div ref={mapContainerRef} className="map-workspace__map" aria-label="CityOps baseline map" />

      <div className="map-workspace__overlay map-workspace__overlay--hud" aria-label="Map workspace status">
        Mode: {activeToolMode} | Interaction status: {interactionState.status} | Pointer: {pointerSummary} | Geo: {geographicSummary}
        {activeToolMode === 'place-stop' ? ` | ${placementFeedbackSummary}` : ''}
        {` | Placed stops: ${placedStops.length}`}
      </div>
    </section>
  );
}
