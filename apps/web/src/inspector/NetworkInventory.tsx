import { type ReactElement } from 'react';
import type { Line } from '../domain/types/line';
import type { Stop } from '../domain/types/stop';
import { InlineRenameField } from './InlineRenameField';

interface NetworkInventoryProps {
  /** List of all placed stops in the current session. */
  readonly placedStops: readonly Stop[];
  /** List of all completed lines in the current session. */
  readonly completedLines: readonly Line[];
  /** Callback triggered when a stop is selected from the inventory. */
  readonly onStopSelect: (stopId: Stop['id']) => void;
  /** Callback triggered when a line is selected from the inventory. */
  readonly onLineSelect: (lineId: Line['id']) => void;
  /** Callback triggered when a stop rename is accepted. */
  readonly onStopRename: (stopId: Stop['id'], nextLabel: string) => void;
  /** Callback triggered when a line rename is accepted. */
  readonly onLineRename: (lineId: Line['id'], nextLabel: string) => void;
}

/**
 * Renders a compact, read-only inventory of all network entities (stops and lines).
 * Supports selection and map-focus navigation through per-row action triggers.
 */
export function NetworkInventory({
  placedStops,
  completedLines,
  onStopSelect,
  onLineSelect,
  onStopRename,
  onLineRename
}: NetworkInventoryProps): ReactElement {
  return (
    <div className="network-inventory">
      <div className="network-inventory__section">
        <h4 className="network-inventory__title">Stops ({placedStops.length})</h4>
        {placedStops.length > 0 ? (
          <ul className="inspector-simple-list network-inventory__list" aria-label="Placed stops inventory">
            {placedStops.map((stop) => (
              <li key={stop.id} className="network-inventory__list-item">
                <div className="network-inventory__list-row">
                  <button
                    type="button"
                    className="network-inventory__item-button"
                    onClick={() => onStopSelect(stop.id)}
                    title={`Select and focus ${stop.label ?? stop.id}`}
                  >
                    <span className="network-inventory__item-label">{stop.label ?? stop.id}</span>
                  </button>
                  <InlineRenameField
                    value={stop.label ?? stop.id}
                    entityLabel="stop"
                    onAccept={(nextValue) => onStopRename(stop.id, nextValue)}
                  />
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p className="network-inventory__empty">No stops placed yet.</p>
        )}
      </div>

      <div className="network-inventory__section">
        <h4 className="network-inventory__title">Lines ({completedLines.length})</h4>
        {completedLines.length > 0 ? (
          <ul className="inspector-simple-list network-inventory__list" aria-label="Completed lines inventory">
            {completedLines.map((line) => (
              <li key={line.id} className="network-inventory__list-item">
                <div className="network-inventory__list-row">
                  <button
                    type="button"
                    className="network-inventory__item-button"
                    onClick={() => onLineSelect(line.id)}
                    title={`Select and focus ${line.label}`}
                  >
                    <span className="network-inventory__item-label">{line.label}</span>
                  </button>
                  <InlineRenameField
                    value={line.label}
                    entityLabel="line"
                    onAccept={(nextValue) => onLineRename(line.id, nextValue)}
                  />
                  <span className="network-inventory__item-id">{line.id}</span>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p className="network-inventory__empty">No completed lines yet.</p>
        )}
      </div>
    </div>
  );
}
