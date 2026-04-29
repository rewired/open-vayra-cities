import { describe, it, expect, vi } from 'vitest';
import { applyMapLayerVisibility } from './mapLayerVisibility';
import { MAP_OSM_STOP_CANDIDATE_LAYER_IDS } from './mapRenderConstants';
import type { VisibilityApplicableMap } from './mapLayerVisibility';
import { INITIAL_REGISTERED_MAP_LAYERS, INITIAL_MAP_LAYER_VISIBILITY } from '../ui/constants/mapLayerUiConstants';

describe('applyMapLayerVisibility', () => {
  it('sets visible state to every OSM candidate layer', () => {
    const mockSetLayoutProperty = vi.fn();
    const mockGetLayer = vi.fn().mockReturnValue({});
    const mockMap: VisibilityApplicableMap = {
      getLayer: mockGetLayer,
      setLayoutProperty: mockSetLayoutProperty,
    };

    applyMapLayerVisibility(mockMap, { 'osm-stop-candidates': true });

    for (const layerId of MAP_OSM_STOP_CANDIDATE_LAYER_IDS) {
      expect(mockGetLayer).toHaveBeenCalledWith(layerId);
      expect(mockSetLayoutProperty).toHaveBeenCalledWith(layerId, 'visibility', 'visible');
    }
  });

  it('sets hidden state to every OSM candidate layer', () => {
    const mockSetLayoutProperty = vi.fn();
    const mockGetLayer = vi.fn().mockReturnValue({});
    const mockMap: VisibilityApplicableMap = {
      getLayer: mockGetLayer,
      setLayoutProperty: mockSetLayoutProperty,
    };

    applyMapLayerVisibility(mockMap, { 'osm-stop-candidates': false });

    for (const layerId of MAP_OSM_STOP_CANDIDATE_LAYER_IDS) {
      expect(mockGetLayer).toHaveBeenCalledWith(layerId);
      expect(mockSetLayoutProperty).toHaveBeenCalledWith(layerId, 'visibility', 'none');
    }
  });

  it('skips missing layer ids without throwing', () => {
    const mockSetLayoutProperty = vi.fn();
    const mockGetLayer = vi.fn().mockReturnValue(undefined);
    const mockMap: VisibilityApplicableMap = {
      getLayer: mockGetLayer,
      setLayoutProperty: mockSetLayoutProperty,
    };

    expect(() => {
      applyMapLayerVisibility(mockMap, { 'osm-stop-candidates': true });
    }).not.toThrow();

    expect(mockSetLayoutProperty).not.toHaveBeenCalled();
  });

  it('does not invent unknown or future layer ids', () => {
    const mockSetLayoutProperty = vi.fn();
    const mockGetLayer = vi.fn().mockReturnValue({});
    const mockMap: VisibilityApplicableMap = {
      getLayer: mockGetLayer,
      setLayoutProperty: mockSetLayoutProperty,
    };

    applyMapLayerVisibility(mockMap, { 'osm-stop-candidates': true });

    expect(mockGetLayer).toHaveBeenCalledTimes(MAP_OSM_STOP_CANDIDATE_LAYER_IDS.length);
  });

  it('keeps registered layer list and initial visibility map aligned', () => {
    const registeredIds = INITIAL_REGISTERED_MAP_LAYERS.map(item => item.id);
    const visibilityKeys = Object.keys(INITIAL_MAP_LAYER_VISIBILITY);

    expect(registeredIds.length).toBe(visibilityKeys.length);
    for (const id of registeredIds) {
      expect(visibilityKeys).toContain(id);
    }
  });
});
