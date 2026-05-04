import { describe, expect, it, vi } from 'vitest';
import { createOsmStopCandidateGroupId } from '../domain/types/osmStopCandidate';
import {
  MAP_ENTITY_HOVER_EMPTY_FILTER,
  MAP_LAYER_ID_OSM_STOP_CANDIDATES_HOVER,
  MAP_LAYER_ID_SCENARIO_DEMAND_PREVIEW_HOVER,
  MAP_OSM_STOP_CANDIDATE_CIRCLE_LAYER_PAINT,
  MAP_SCENARIO_DEMAND_PREVIEW_CIRCLE_LAYER_PAINT
} from './mapRenderConstants';
import {
  createMapEntityHoverAffordanceController,
  decodeMapEntityHoverTargetFromFeatureProperties,
  syncMapEntityHoverAffordance,
  type MapEntityHoverAffordanceMap
} from './mapEntityHoverTarget';
import type { MapLibreLayerSpecification } from './maplibreGlobal';

const createAffordanceMap = (
  presentLayerIds: readonly string[] = [
    MAP_LAYER_ID_SCENARIO_DEMAND_PREVIEW_HOVER,
    MAP_LAYER_ID_OSM_STOP_CANDIDATES_HOVER
  ]
): MapEntityHoverAffordanceMap & { readonly canvas: { readonly style: { cursor: string } }; readonly setFilter: ReturnType<typeof vi.fn> } => {
  const layerIds = new Set(presentLayerIds);
  const canvas = { style: { cursor: '' } };

  return {
    canvas,
    getCanvas: () => canvas,
    getLayer: (layerId: string): MapLibreLayerSpecification | undefined =>
      layerIds.has(layerId)
        ? {
            id: layerId,
            type: 'circle',
            source: 'test-source'
          }
        : undefined,
    setFilter: vi.fn()
  };
};

describe('decodeMapEntityHoverTargetFromFeatureProperties', () => {
  it('accepts valid demand node feature properties', () => {
    expect(
      decodeMapEntityHoverTargetFromFeatureProperties({
        entityId: 'node-1',
        entityKind: 'node'
      })
    ).toEqual({
      kind: 'demand-node',
      id: 'node-1'
    });
  });

  it('accepts valid OSM stop candidate group feature properties', () => {
    expect(
      decodeMapEntityHoverTargetFromFeatureProperties({
        candidateGroupId: 'osm-group:1',
        label: 'Candidate'
      })
    ).toEqual({
      kind: 'osm-stop-candidate',
      id: createOsmStopCandidateGroupId('osm-group:1')
    });
  });

  it('rejects missing or malformed feature properties without throwing', () => {
    expect(decodeMapEntityHoverTargetFromFeatureProperties(undefined)).toBeNull();
    expect(decodeMapEntityHoverTargetFromFeatureProperties({ entityId: '' })).toBeNull();
    expect(decodeMapEntityHoverTargetFromFeatureProperties({ entityId: 1 })).toBeNull();
    expect(decodeMapEntityHoverTargetFromFeatureProperties({ candidateGroupId: '' })).toBeNull();
    expect(decodeMapEntityHoverTargetFromFeatureProperties({ candidateGroupId: false })).toBeNull();
  });
});

describe('syncMapEntityHoverAffordance', () => {
  it('applies pointer cursor and demand node hover filter without mutating base paint constants', () => {
    const map = createAffordanceMap();

    syncMapEntityHoverAffordance(map, {
      kind: 'demand-node',
      id: 'node-1'
    });

    expect(map.canvas.style.cursor).toBe('pointer');
    expect(map.setFilter).toHaveBeenCalledWith(
      MAP_LAYER_ID_SCENARIO_DEMAND_PREVIEW_HOVER,
      ['==', ['get', 'entityId'], 'node-1']
    );
    expect(map.setFilter).toHaveBeenCalledWith(
      MAP_LAYER_ID_OSM_STOP_CANDIDATES_HOVER,
      MAP_ENTITY_HOVER_EMPTY_FILTER
    );
    expect(MAP_SCENARIO_DEMAND_PREVIEW_CIRCLE_LAYER_PAINT['circle-radius']).toEqual([
      'case',
      ['==', ['get', 'entityKind'], 'node'], 4,
      ['==', ['get', 'entityKind'], 'attractor'], 6,
      8
    ]);
  });

  it('applies pointer cursor and OSM candidate hover filter without mutating base paint constants', () => {
    const map = createAffordanceMap();

    syncMapEntityHoverAffordance(map, {
      kind: 'osm-stop-candidate',
      id: createOsmStopCandidateGroupId('osm-group:1')
    });

    expect(map.canvas.style.cursor).toBe('pointer');
    expect(map.setFilter).toHaveBeenCalledWith(
      MAP_LAYER_ID_OSM_STOP_CANDIDATES_HOVER,
      ['==', ['get', 'candidateGroupId'], 'osm-group:1']
    );
    expect(map.setFilter).toHaveBeenCalledWith(
      MAP_LAYER_ID_SCENARIO_DEMAND_PREVIEW_HOVER,
      MAP_ENTITY_HOVER_EMPTY_FILTER
    );
    expect(MAP_OSM_STOP_CANDIDATE_CIRCLE_LAYER_PAINT['circle-radius']).toEqual([
      'interpolate',
      ['linear'],
      ['zoom'],
      12,
      4,
      14,
      8
    ]);
  });

  it('clears cursor and restores idle hover filters deterministically', () => {
    const map = createAffordanceMap();

    syncMapEntityHoverAffordance(map, null);

    expect(map.canvas.style.cursor).toBe('');
    expect(map.setFilter).toHaveBeenCalledWith(
      MAP_LAYER_ID_SCENARIO_DEMAND_PREVIEW_HOVER,
      MAP_ENTITY_HOVER_EMPTY_FILTER
    );
    expect(map.setFilter).toHaveBeenCalledWith(
      MAP_LAYER_ID_OSM_STOP_CANDIDATES_HOVER,
      MAP_ENTITY_HOVER_EMPTY_FILTER
    );
  });

  it('does not throw when supported hover layers are absent', () => {
    const map = createAffordanceMap([]);

    expect(() => {
      syncMapEntityHoverAffordance(map, {
        kind: 'demand-node',
        id: 'node-1'
      });
    }).not.toThrow();

    expect(map.canvas.style.cursor).toBe('pointer');
    expect(map.setFilter).not.toHaveBeenCalled();
  });
});

describe('createMapEntityHoverAffordanceController', () => {
  it('does not repeatedly mutate filters for the same hover target', () => {
    const map = createAffordanceMap();
    const controller = createMapEntityHoverAffordanceController(map);

    controller.sync({ kind: 'demand-node', id: 'node-1' });
    controller.sync({ kind: 'demand-node', id: 'node-1' });

    expect(map.setFilter).toHaveBeenCalledTimes(3);
  });

  it('updates filters when the hover target changes', () => {
    const map = createAffordanceMap();
    const controller = createMapEntityHoverAffordanceController(map);

    controller.sync({ kind: 'demand-node', id: 'node-1' });
    controller.sync({ kind: 'demand-node', id: 'node-2' });

    expect(map.setFilter).toHaveBeenCalledWith(
      MAP_LAYER_ID_SCENARIO_DEMAND_PREVIEW_HOVER,
      ['==', ['get', 'entityId'], 'node-2']
    );
    expect(map.setFilter).toHaveBeenCalledTimes(6);
  });

  it('clears hover filters once and skips repeated clears', () => {
    const map = createAffordanceMap();
    const controller = createMapEntityHoverAffordanceController(map);

    controller.sync({ kind: 'osm-stop-candidate', id: createOsmStopCandidateGroupId('osm-group:1') });
    controller.clear();
    controller.clear();

    expect(map.canvas.style.cursor).toBe('');
    expect(map.setFilter).toHaveBeenCalledTimes(5);
  });
});
