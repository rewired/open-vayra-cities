import { useEffect, useRef, useState, type ReactElement } from 'react';

import { MAP_WORKSPACE_BOOTSTRAP_CONFIG } from './mapBootstrapConfig';
import type { MapLibreMap } from './maplibreGlobal';

type MapSurfaceInteractionStatus = 'idle' | 'pointer-active' | 'click-captured';

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

interface NeutralMapInteractionHandlers {
  readonly onPointerMove: (event: {
    readonly point: { readonly x: number; readonly y: number };
    readonly lngLat?: { readonly lng: number; readonly lat: number };
  }) => void;
  readonly onMapClick: (event: {
    readonly point: { readonly x: number; readonly y: number };
    readonly lngLat?: { readonly lng: number; readonly lat: number };
  }) => void;
}

interface NeutralMapInteractionContracts {
  readonly map: MapLibreMap;
  readonly setInteractionState: (nextState: MapSurfaceInteractionState) => void;
}

interface MapWorkspaceResizeBinding {
  readonly dispose: () => void;
}

const createPointerState = (screenX: number, screenY: number, lng?: number, lat?: number): MapSurfacePointerState => {
  const baseState: MapSurfacePointerState = { screenX, screenY };

  if (lng !== undefined && lat !== undefined) {
    return { ...baseState, lng, lat };
  }

  return baseState;
};

const setupNeutralMapInteractions = ({
  map,
  setInteractionState
}: NeutralMapInteractionContracts): { readonly dispose: () => void } => {
  const handlers: NeutralMapInteractionHandlers = {
    onPointerMove: (event) => {
      setInteractionState({
        status: 'pointer-active',
        pointer: createPointerState(event.point.x, event.point.y, event.lngLat?.lng, event.lngLat?.lat)
      });
    },
    onMapClick: (event) => {
      setInteractionState({
        status: 'click-captured',
        pointer: createPointerState(event.point.x, event.point.y, event.lngLat?.lng, event.lngLat?.lat)
      });
    }
  };

  map.on('mousemove', handlers.onPointerMove);
  map.on('click', handlers.onMapClick);

  return {
    dispose: () => {
      map.off('mousemove', handlers.onPointerMove);
      map.off('click', handlers.onMapClick);
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

/**
 * Renders the CityOps workspace as a real MapLibre map surface without gameplay semantics.
 */
export function MapWorkspaceSurface(): ReactElement {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<MapLibreMap | null>(null);
  const [interactionState, setInteractionState] = useState<MapSurfaceInteractionState>({
    status: 'idle',
    pointer: null
  });

  useEffect(() => {
    const containerElement = mapContainerRef.current;

    if (!containerElement || mapInstanceRef.current) {
      return;
    }

    const mapInstance = createMapWorkspaceInstance(containerElement);
    mapInstanceRef.current = mapInstance;
    const neutralInteractions = setupNeutralMapInteractions({ map: mapInstance, setInteractionState });
    const mapResizeBinding = setupMapResizeBinding(containerElement, mapInstanceRef);

    return () => {
      neutralInteractions.dispose();
      mapResizeBinding.dispose();
      mapInstanceRef.current?.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  const pointerSummary = interactionState.pointer
    ? `x:${interactionState.pointer.screenX.toFixed(1)} y:${interactionState.pointer.screenY.toFixed(1)}`
    : 'none';
  const geographicSummary =
    interactionState.pointer?.lng !== undefined && interactionState.pointer.lat !== undefined
      ? `lng:${interactionState.pointer.lng.toFixed(5)} lat:${interactionState.pointer.lat.toFixed(5)}`
      : 'lng/lat unavailable';

  return (
    <section className="map-workspace" aria-label="Map workspace surface">
      <div ref={mapContainerRef} className="map-workspace__map" aria-label="CityOps baseline map" />

      <div className="map-workspace__overlay map-workspace__overlay--hud" aria-label="Map workspace status">
        Interaction status: {interactionState.status} | Pointer: {pointerSummary} | Geo: {geographicSummary}
      </div>
    </section>
  );
}
