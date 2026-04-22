import type { ReactElement } from 'react';

/**
 * Renders the central CityOps workspace scaffold reserved for future map integration.
 */
export function MapWorkspaceSurface(): ReactElement {
  return (
    <section className="map-workspace" aria-label="Map workspace surface">
      <div className="map-workspace__surface" aria-hidden="true" />

      <div className="map-workspace__overlay map-workspace__overlay--hud" aria-label="Future map HUD region">
        HUD region reserved
      </div>

      <div
        className="map-workspace__overlay map-workspace__overlay--info"
        aria-label="Future info and overlay region"
      >
        Overlay region reserved
      </div>

      <div className="map-workspace__empty-state" aria-label="Map workspace empty state">
        <h2>CityOps workspace</h2>
        <p>Map surface is intentionally not connected in this slice.</p>
        <p>Future interaction and overlay layers are structurally reserved.</p>
      </div>
    </section>
  );
}
