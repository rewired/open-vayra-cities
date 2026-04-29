import type { MapLibreMap } from './maplibreGlobal';
import type { MapLayerVisibilityById } from '../ui/constants/mapLayerUiConstants';
import { MAP_OSM_STOP_CANDIDATE_LAYER_IDS } from './mapRenderConstants';

/**
 * Interface representing the minimal MapLibre API needed to apply layer visibility.
 */
export type VisibilityApplicableMap = Pick<MapLibreMap, 'getLayer' | 'setLayoutProperty'>;

/**
 * Applies visibility state to MapLibre layers based on the UI registry contract.
 * 
 * @param map The MapLibre map instance or a compatible narrow interface.
 * @param visibility The current visibility state by layer ID.
 */
export function applyMapLayerVisibility(
  map: VisibilityApplicableMap,
  visibility: MapLayerVisibilityById
): void {
  // osm-stop-candidates
  const osmVisible = visibility['osm-stop-candidates'];
  if (osmVisible !== undefined) {
    const visibilityValue = osmVisible ? 'visible' : 'none';
    for (const layerId of MAP_OSM_STOP_CANDIDATE_LAYER_IDS) {
      // Missing layer handles are ignored safely
      if (map.getLayer(layerId)) {
        map.setLayoutProperty(layerId, 'visibility', visibilityValue);
      }
    }
  }
}
