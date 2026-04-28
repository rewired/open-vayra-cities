import type { MapLibreGeoJsonFeatureCollection } from './maplibreGlobal';
import type { DemandNode } from '../domain/types/demandNode';
import type { TimeBandId } from '../domain/types/timeBand';

/**
 * Translates internal static demand datasets into standard map rendering payload structures.
 * 
 * @param demandNodes Evaluated locations generating passenger intent.
 * @param activeTimeBandId The active time band context.
 */
export function buildDemandNodeGeoJson(
  demandNodes: readonly DemandNode[],
  activeTimeBandId: TimeBandId
): MapLibreGeoJsonFeatureCollection {
  return {
    type: 'FeatureCollection',

    features: demandNodes.map((node) => ({
      type: 'Feature',
      geometry: {
        type: 'Point',
        coordinates: [node.position.lng, node.position.lat]
      },
      properties: {
        demandNodeId: node.id,
        role: node.role,
        demandClass: node.demandClass,
        label: node.label,
        activeWeight: node.weightByTimeBand[activeTimeBandId] ?? 0
      }
    }))
  };
}
