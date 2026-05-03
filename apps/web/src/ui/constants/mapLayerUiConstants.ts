export type MapLayerId = 'osm-stop-candidates' | 'scenario-demand-preview' | 'scenario-routing-coverage' | 'demand-gap-overlay' | 'demand-gap-od-context';

/**
 * Represents a registered map layer control item for the UI flyout.
 */
export interface MapLayerControlItem {
  /** Unique identifier for the layer toggle. */
  readonly id: MapLayerId;
  /** Human-readable label displayed in the flyout. */
  readonly label: string;
  /** Optional short description providing context for the layer. */
  readonly description?: string;
  /** Indicates if the layer is unavailable or disabled in the current version. */
  readonly disabled?: boolean;
}

/**
 * Mapping of map layer IDs to their current visibility state.
 */
export type MapLayerVisibilityById = Readonly<Record<MapLayerId, boolean>>;

/**
 * Combined state projection for the map layer control flyout.
 */
export interface MapLayerControlState {
  /** List of all registered map layers. */
  readonly items: readonly MapLayerControlItem[];
  /** Visibility state of each registered layer. */
  readonly visibility: MapLayerVisibilityById;
}

/**
 * Centralized display constants and labels for the map layer control UI.
 */
export const MAP_LAYER_UI_LABELS = {
  BUTTON_ARIA_LABEL: 'Map layers',
  FLYOUT_HEADING: 'Map Overlays',
  EMPTY_STATE: 'No optional overlays registered.',
  TOGGLE_ON: 'On',
  TOGGLE_OFF: 'Off'
} as const;

/**
 * Canonical initial registry items.
 */
export const INITIAL_REGISTERED_MAP_LAYERS: readonly MapLayerControlItem[] = [
  {
    id: 'osm-stop-candidates',
    label: 'OSM stop candidates',
    description: 'Show source-material stop candidates before adoption.'
  },
  {
    id: 'scenario-demand-preview',
    label: 'Scenario demand preview',
    description: 'Show generated residential demand, workplace attractors, and gateways.'
  },
  {
    id: 'scenario-routing-coverage',
    label: 'Scenario routing coverage',
    description: 'Dim areas outside the routable scenario boundary.'
  },
  {
    id: 'demand-gap-overlay',
    label: 'Demand gaps',
    description: 'Show spatial pressure from the current demand gap projection.'
  },
  {
    id: 'demand-gap-od-context',
    label: 'Demand gap hints',
    description: 'Show straight planning hints from a focused demand gap to likely OD candidates.'
  }
];

export const INITIAL_MAP_LAYER_VISIBILITY: MapLayerVisibilityById = {
  'osm-stop-candidates': true,
  'scenario-demand-preview': false,
  'scenario-routing-coverage': true,
  'demand-gap-overlay': false,
  'demand-gap-od-context': false
};
