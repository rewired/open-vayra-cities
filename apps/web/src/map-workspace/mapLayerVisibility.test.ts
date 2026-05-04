import { describe, it, expect, vi } from 'vitest';
import { applyMapLayerVisibility } from './mapLayerVisibility';
import {
  MAP_OSM_STOP_CANDIDATE_LAYER_IDS,
  MAP_LAYER_ID_OSM_STOP_CANDIDATES_HOVER,
  MAP_SCENARIO_DEMAND_PREVIEW_LAYER_IDS,
  MAP_LAYER_ID_SCENARIO_DEMAND_PREVIEW_HOVER,
  MAP_DEMAND_GAP_OVERLAY_LAYER_IDS,
  MAP_DEMAND_GAP_OD_CONTEXT_LAYER_IDS,
  MAP_SELECTED_DEMAND_NODE_SERVICE_COVERAGE_LAYER_IDS
} from './mapRenderConstants';
import type { VisibilityApplicableMap } from './mapLayerVisibility';
import { INITIAL_REGISTERED_MAP_LAYERS, INITIAL_MAP_LAYER_VISIBILITY } from '../ui/constants/mapLayerUiConstants';

describe('applyMapLayerVisibility', () => {
  it('sets visible state to every OSM candidate layer', () => {
    const mockSetLayoutProperty = vi.fn();
    const mockGetLayer = vi.fn().mockReturnValue({ id: 'test-layer', type: 'circle', source: 'test-source' });
    const mockMap: VisibilityApplicableMap = {
      getLayer: mockGetLayer,
      setLayoutProperty: mockSetLayoutProperty,
    };

    applyMapLayerVisibility(mockMap, { 'osm-stop-candidates': true, 'scenario-demand-preview': false, 'scenario-routing-coverage': false, 'demand-gap-overlay': false, 'demand-gap-od-context': false, 'selected-demand-node-service-coverage': false });

    for (const layerId of MAP_OSM_STOP_CANDIDATE_LAYER_IDS) {
      expect(mockGetLayer).toHaveBeenCalledWith(layerId);
      expect(mockSetLayoutProperty).toHaveBeenCalledWith(layerId, 'visibility', 'visible');
    }
    expect(MAP_OSM_STOP_CANDIDATE_LAYER_IDS).toContain(MAP_LAYER_ID_OSM_STOP_CANDIDATES_HOVER);
  });

  it('sets hidden state to every OSM candidate layer', () => {
    const mockSetLayoutProperty = vi.fn();
    const mockGetLayer = vi.fn().mockReturnValue({ id: 'test-layer', type: 'circle', source: 'test-source' });
    const mockMap: VisibilityApplicableMap = {
      getLayer: mockGetLayer,
      setLayoutProperty: mockSetLayoutProperty,
    };

    applyMapLayerVisibility(mockMap, { 'osm-stop-candidates': false, 'scenario-demand-preview': false, 'scenario-routing-coverage': false, 'demand-gap-overlay': false, 'demand-gap-od-context': false, 'selected-demand-node-service-coverage': false });

    for (const layerId of MAP_OSM_STOP_CANDIDATE_LAYER_IDS) {
      expect(mockGetLayer).toHaveBeenCalledWith(layerId);
      expect(mockSetLayoutProperty).toHaveBeenCalledWith(layerId, 'visibility', 'none');
    }
  });

  it('sets visible state to every demand preview layer', () => {
    const mockSetLayoutProperty = vi.fn();
    const mockGetLayer = vi.fn().mockReturnValue({ id: 'test-layer', type: 'circle', source: 'test-source' });
    const mockMap: VisibilityApplicableMap = {
      getLayer: mockGetLayer,
      setLayoutProperty: mockSetLayoutProperty,
    };

    applyMapLayerVisibility(mockMap, { 'osm-stop-candidates': false, 'scenario-demand-preview': true, 'scenario-routing-coverage': false, 'demand-gap-overlay': false, 'demand-gap-od-context': false, 'selected-demand-node-service-coverage': false });

    for (const layerId of MAP_SCENARIO_DEMAND_PREVIEW_LAYER_IDS) {
      expect(mockGetLayer).toHaveBeenCalledWith(layerId);
      expect(mockSetLayoutProperty).toHaveBeenCalledWith(layerId, 'visibility', 'visible');
    }
    expect(MAP_SCENARIO_DEMAND_PREVIEW_LAYER_IDS).toContain(MAP_LAYER_ID_SCENARIO_DEMAND_PREVIEW_HOVER);
  });

  it('sets hidden state to every demand preview layer', () => {
    const mockSetLayoutProperty = vi.fn();
    const mockGetLayer = vi.fn().mockReturnValue({ id: 'test-layer', type: 'circle', source: 'test-source' });
    const mockMap: VisibilityApplicableMap = {
      getLayer: mockGetLayer,
      setLayoutProperty: mockSetLayoutProperty,
    };

    applyMapLayerVisibility(mockMap, { 'osm-stop-candidates': false, 'scenario-demand-preview': false, 'scenario-routing-coverage': false, 'demand-gap-overlay': false, 'demand-gap-od-context': false, 'selected-demand-node-service-coverage': false });

    for (const layerId of MAP_SCENARIO_DEMAND_PREVIEW_LAYER_IDS) {
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
      applyMapLayerVisibility(mockMap, { 'osm-stop-candidates': true, 'scenario-demand-preview': true, 'scenario-routing-coverage': true, 'demand-gap-overlay': true, 'demand-gap-od-context': true, 'selected-demand-node-service-coverage': true });
    }).not.toThrow();

    expect(mockSetLayoutProperty).not.toHaveBeenCalled();
  });

  it('sets visible state to every demand gap overlay layer', () => {
    const mockSetLayoutProperty = vi.fn();
    const mockGetLayer = vi.fn().mockReturnValue({ id: 'test-layer', type: 'circle', source: 'test-source' });
    const mockMap: VisibilityApplicableMap = {
      getLayer: mockGetLayer,
      setLayoutProperty: mockSetLayoutProperty,
    };

    applyMapLayerVisibility(mockMap, {
      'osm-stop-candidates': false,
      'scenario-demand-preview': false,
      'scenario-routing-coverage': false,
      'demand-gap-overlay': true,
      'demand-gap-od-context': false,
      'selected-demand-node-service-coverage': false
    });

    for (const layerId of MAP_DEMAND_GAP_OVERLAY_LAYER_IDS) {
      expect(mockGetLayer).toHaveBeenCalledWith(layerId);
      expect(mockSetLayoutProperty).toHaveBeenCalledWith(layerId, 'visibility', 'visible');
    }
  });

  it('sets hidden state to every demand gap overlay layer', () => {
    const mockSetLayoutProperty = vi.fn();
    const mockGetLayer = vi.fn().mockReturnValue({ id: 'test-layer', type: 'circle', source: 'test-source' });
    const mockMap: VisibilityApplicableMap = {
      getLayer: mockGetLayer,
      setLayoutProperty: mockSetLayoutProperty,
    };

    applyMapLayerVisibility(mockMap, {
      'osm-stop-candidates': false,
      'scenario-demand-preview': false,
      'scenario-routing-coverage': false,
      'demand-gap-overlay': false,
      'demand-gap-od-context': false,
      'selected-demand-node-service-coverage': false
    });

    for (const layerId of MAP_DEMAND_GAP_OVERLAY_LAYER_IDS) {
      expect(mockGetLayer).toHaveBeenCalledWith(layerId);
      expect(mockSetLayoutProperty).toHaveBeenCalledWith(layerId, 'visibility', 'none');
    }
  });

  it('sets visible state to every demand gap od context layer', () => {
    const mockSetLayoutProperty = vi.fn();
    const mockGetLayer = vi.fn().mockReturnValue({ id: 'test-layer', type: 'line', source: 'test-source' });
    const mockMap: VisibilityApplicableMap = {
      getLayer: mockGetLayer,
      setLayoutProperty: mockSetLayoutProperty,
    };

    applyMapLayerVisibility(mockMap, {
      'osm-stop-candidates': false,
      'scenario-demand-preview': false,
      'scenario-routing-coverage': false,
      'demand-gap-overlay': false,
      'demand-gap-od-context': true,
      'selected-demand-node-service-coverage': false
    });

    for (const layerId of MAP_DEMAND_GAP_OD_CONTEXT_LAYER_IDS) {
      expect(mockGetLayer).toHaveBeenCalledWith(layerId);
      expect(mockSetLayoutProperty).toHaveBeenCalledWith(layerId, 'visibility', 'visible');
    }
  });

  it('sets hidden state to every demand gap od context layer', () => {
    const mockSetLayoutProperty = vi.fn();
    const mockGetLayer = vi.fn().mockReturnValue({ id: 'test-layer', type: 'line', source: 'test-source' });
    const mockMap: VisibilityApplicableMap = {
      getLayer: mockGetLayer,
      setLayoutProperty: mockSetLayoutProperty,
    };

    applyMapLayerVisibility(mockMap, {
      'osm-stop-candidates': false,
      'scenario-demand-preview': false,
      'scenario-routing-coverage': false,
      'demand-gap-overlay': false,
      'demand-gap-od-context': false,
      'selected-demand-node-service-coverage': false
    });

    for (const layerId of MAP_DEMAND_GAP_OD_CONTEXT_LAYER_IDS) {
      expect(mockGetLayer).toHaveBeenCalledWith(layerId);
      expect(mockSetLayoutProperty).toHaveBeenCalledWith(layerId, 'visibility', 'none');
    }
  });

  it('sets visible state to selected demand node service coverage layers only through the registry mapping', () => {
    const mockSetLayoutProperty = vi.fn();
    const mockGetLayer = vi.fn().mockReturnValue({ id: 'test-layer', type: 'circle', source: 'test-source' });
    const mockMap: VisibilityApplicableMap = {
      getLayer: mockGetLayer,
      setLayoutProperty: mockSetLayoutProperty,
    };

    applyMapLayerVisibility(mockMap, {
      'osm-stop-candidates': false,
      'scenario-demand-preview': false,
      'scenario-routing-coverage': false,
      'demand-gap-overlay': false,
      'demand-gap-od-context': false,
      'selected-demand-node-service-coverage': true
    });

    for (const layerId of MAP_SELECTED_DEMAND_NODE_SERVICE_COVERAGE_LAYER_IDS) {
      expect(mockGetLayer).toHaveBeenCalledWith(layerId);
      expect(mockSetLayoutProperty).toHaveBeenCalledWith(layerId, 'visibility', 'visible');
    }
  });

  it('sets hidden state to selected demand node service coverage layers', () => {
    const mockSetLayoutProperty = vi.fn();
    const mockGetLayer = vi.fn().mockReturnValue({ id: 'test-layer', type: 'circle', source: 'test-source' });
    const mockMap: VisibilityApplicableMap = {
      getLayer: mockGetLayer,
      setLayoutProperty: mockSetLayoutProperty,
    };

    applyMapLayerVisibility(mockMap, {
      'osm-stop-candidates': false,
      'scenario-demand-preview': false,
      'scenario-routing-coverage': false,
      'demand-gap-overlay': false,
      'demand-gap-od-context': false,
      'selected-demand-node-service-coverage': false
    });

    for (const layerId of MAP_SELECTED_DEMAND_NODE_SERVICE_COVERAGE_LAYER_IDS) {
      expect(mockGetLayer).toHaveBeenCalledWith(layerId);
      expect(mockSetLayoutProperty).toHaveBeenCalledWith(layerId, 'visibility', 'none');
    }
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
