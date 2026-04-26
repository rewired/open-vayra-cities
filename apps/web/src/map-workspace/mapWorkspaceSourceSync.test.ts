import { describe, expect, it } from 'vitest';

import {
  getMapWorkspaceCustomLayerOrder,
  listPresentMapWorkspaceCustomLayerIds
} from './mapWorkspaceSourceSync';
import {
  MAP_LAYER_ID_COMPLETED_LINES,
  MAP_LAYER_ID_COMPLETED_LINES_CASING,
  MAP_LAYER_ID_DRAFT_LINE,
  MAP_LAYER_ID_STOPS_CIRCLE,
  MAP_LAYER_ID_STOPS_LABEL,
  MAP_LAYER_ID_VEHICLES
} from './mapRenderConstants';
import type { MapLibreLayerSpecification, MapLibreMap } from './maplibreGlobal';

const createMapWithPresentLayers = (presentLayerIds: readonly string[]): MapLibreMap => {
  const layerSet = new Set(presentLayerIds);

  return {
    remove: () => undefined,
    resize: () => undefined,
    addControl: () => undefined,
    on: () => undefined,
    off: () => undefined,
    getStyle: () => undefined,
    queryRenderedFeatures: () => [],
    querySourceFeatures: () => [],
    project: () => ({ x: 0, y: 0 }),
    getSource: () => undefined,
    addSource: () => undefined,
    getLayer: (layerId: string): MapLibreLayerSpecification | undefined =>
      layerSet.has(layerId)
        ? {
            id: layerId,
            source: 'unused-test-source',
            type: 'line'
          }
        : undefined,
    addLayer: () => undefined,
    moveLayer: () => undefined,
    isStyleLoaded: () => true,
    easeTo: () => undefined,
    fitBounds: () => undefined
  };
};

describe('mapWorkspaceSourceSync custom-layer helpers', () => {
  it('returns the canonical deterministic custom-layer order list', () => {
    expect(getMapWorkspaceCustomLayerOrder()).toEqual([
      MAP_LAYER_ID_COMPLETED_LINES_CASING,
      MAP_LAYER_ID_COMPLETED_LINES,
      MAP_LAYER_ID_DRAFT_LINE,
      MAP_LAYER_ID_STOPS_CIRCLE,
      MAP_LAYER_ID_STOPS_LABEL,
      MAP_LAYER_ID_VEHICLES
    ]);
  });

  it('returns a defensive custom-layer order copy so callers cannot mutate canonical ordering', () => {
    const first = getMapWorkspaceCustomLayerOrder();
    const mutated = [...first];
    mutated.reverse();

    expect(mutated).not.toEqual(getMapWorkspaceCustomLayerOrder());
    expect(getMapWorkspaceCustomLayerOrder()).toEqual(first);
  });

  it('lists only present custom-layer ids in canonical order', () => {
    const map = createMapWithPresentLayers([
      MAP_LAYER_ID_STOPS_LABEL,
      MAP_LAYER_ID_COMPLETED_LINES,
      MAP_LAYER_ID_VEHICLES
    ]);

    expect(listPresentMapWorkspaceCustomLayerIds(map)).toEqual([
      MAP_LAYER_ID_COMPLETED_LINES,
      MAP_LAYER_ID_STOPS_LABEL,
      MAP_LAYER_ID_VEHICLES
    ]);
  });
});
