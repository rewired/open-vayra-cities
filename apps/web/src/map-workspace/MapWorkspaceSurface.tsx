import { useEffect, useRef, type ReactElement } from 'react';

import { MAP_WORKSPACE_BOOTSTRAP_CONFIG } from './mapBootstrapConfig';
import type { MapLibreMap } from './maplibreGlobal';

/**
 * Renders the CityOps workspace as a real MapLibre map surface without gameplay semantics.
 */
export function MapWorkspaceSurface(): ReactElement {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<MapLibreMap | null>(null);

  useEffect(() => {
    const containerElement = mapContainerRef.current;

    if (!containerElement || mapInstanceRef.current) {
      return;
    }

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
    mapInstanceRef.current = mapInstance;

    return () => {
      mapInstanceRef.current?.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  return (
    <section className="map-workspace" aria-label="Map workspace surface">
      <div ref={mapContainerRef} className="map-workspace__map" aria-label="CityOps baseline map" />

      <div className="map-workspace__overlay map-workspace__overlay--hud" aria-label="Map workspace status">
        Map workspace baseline active
      </div>
    </section>
  );
}
