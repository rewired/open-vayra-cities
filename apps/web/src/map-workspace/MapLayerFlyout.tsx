import { useState, type ReactElement } from 'react';
import { MaterialIcon } from '../ui/icons/MaterialIcon';
import {
  MAP_LAYER_UI_LABELS,
  INITIAL_REGISTERED_MAP_LAYERS,
  type MapLayerId,
  type MapLayerVisibilityById
} from '../ui/constants/mapLayerUiConstants';

/**
 * Props for the MapLayerFlyout component.
 */
export interface MapLayerFlyoutProps {
  /** Current visibility state mapped by layer ID. */
  readonly visibility: MapLayerVisibilityById;
  /** Callback invoked when a layer's visibility is toggled. */
  readonly onToggleLayer: (layerId: MapLayerId) => void;
}

/**
 * A desktop-first reusable overlay control for toggling optional map layers.
 */
export function MapLayerFlyout({
  visibility,
  onToggleLayer
}: MapLayerFlyoutProps): ReactElement {
  const [isOpen, setIsOpen] = useState<boolean>(false);

  const openFlyout = (): void => {
    setIsOpen(true);
  };

  const closeFlyout = (): void => {
    setIsOpen(false);
  };

  return (
    <div className="map-workspace-layers" aria-label="Map layer controller">
      {!isOpen ? (
        <button
          type="button"
          className="map-workspace-layers__button"
          onClick={openFlyout}
          aria-expanded={isOpen}
          aria-label={MAP_LAYER_UI_LABELS.BUTTON_ARIA_LABEL}
          title={MAP_LAYER_UI_LABELS.BUTTON_ARIA_LABEL}
        >
          <MaterialIcon name="stacks" />
        </button>
      ) : null}

      {isOpen ? (
        <div className="map-workspace-layers__flyout" role="dialog" aria-label={MAP_LAYER_UI_LABELS.FLYOUT_HEADING}>
          <header className="map-workspace-layers__flyout-header">
            <h4>{MAP_LAYER_UI_LABELS.FLYOUT_HEADING}</h4>
            <button
              type="button"
              className="map-workspace-layers__close-button"
              onClick={closeFlyout}
              aria-label={MAP_LAYER_UI_LABELS.CLOSE_BUTTON_ARIA_LABEL}
              title={MAP_LAYER_UI_LABELS.CLOSE_BUTTON_ARIA_LABEL}
            >
              <MaterialIcon name="close" />
            </button>
          </header>

          <div className="map-workspace-layers__flyout-content">
            {INITIAL_REGISTERED_MAP_LAYERS.length === 0 ? (
              <p className="map-workspace-layers__empty">{MAP_LAYER_UI_LABELS.EMPTY_STATE}</p>
            ) : (
              <ul className="map-workspace-layers__list">
                {INITIAL_REGISTERED_MAP_LAYERS.map((item) => {
                  const isChecked = visibility[item.id] ?? false;
                  return (
                    <li key={item.id} className={`map-workspace-layers__item ${item.disabled ? 'map-workspace-layers__item--disabled' : ''}`}>
                      <label className="map-workspace-layers__label">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          disabled={item.disabled}
                          onChange={() => onToggleLayer(item.id)}
                          className="map-workspace-layers__checkbox"
                          aria-label={`Toggle ${item.label}`}
                        />
                        <div className="map-workspace-layers__item-info">
                          <span className="map-workspace-layers__item-title">{item.label}</span>
                          {item.description ? (
                            <span className="map-workspace-layers__item-desc">{item.description}</span>
                          ) : null}
                        </div>
                      </label>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}
