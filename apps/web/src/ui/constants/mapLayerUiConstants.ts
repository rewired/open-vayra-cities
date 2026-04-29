export type MapLayerId = 'osm-stop-candidates';

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
export const INITIAL_REGISTERED_MAP_LAYERS: readonly MapLayerControlItem[] = [];

export const INITIAL_MAP_LAYER_VISIBILITY: MapLayerVisibilityById = {
  'osm-stop-candidates': false
};
