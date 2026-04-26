import { type ReactElement } from 'react';
import type { Line } from '../domain/types/line';
import type { Stop } from '../domain/types/stop';
import { InlineRenameField } from './InlineRenameField';

const STOP_DEBUG_LIST_LIMIT = 8;

interface NetworkInventoryProps {
  /** List of all placed stops in the current session. */
  readonly placedStops: readonly Stop[];
  /** List of all completed lines in the current session. */
  readonly completedLines: readonly Line[];
  /** Callback triggered when a stop is selected from the inventory. */
  readonly onStopSelect: (stopId: Stop['id']) => void;
  /** Callback triggered when a line is selected from the inventory. */
  readonly onLineSelect: (lineId: Line['id']) => void;
  /** Callback triggered when a line rename is accepted. */
  readonly onLineRename: (lineId: Line['id'], nextLabel: string) => void;
}

/**
 * Renders a network-oriented inspector summary with compact secondary selection lists.
 * Keeps line actions available while preventing stop rename from becoming a global primary workflow.
 */
export function NetworkInventory({
  placedStops,
  completedLines,
  onStopSelect,
  onLineSelect,
  onLineRename
}: NetworkInventoryProps): ReactElement {
  const stopDebugSelectionList = placedStops.slice(0, STOP_DEBUG_LIST_LIMIT);
  const hiddenStopCount = placedStops.length - stopDebugSelectionList.length;

  return (
    <div className="network-inventory">
      <div className="network-inventory__section">
        <h4 className="network-inventory__title">Stop summary</h4>
        <table className="inspector-compact-table">
          <tbody>
            <tr>
              <th scope="row">Placed stops</th>
              <td>{placedStops.length}</td>
            </tr>
            <tr>
              <th scope="row">Selection list</th>
              <td>{`${stopDebugSelectionList.length} shown`}</td>
            </tr>
          </tbody>
        </table>

        {stopDebugSelectionList.length > 0 ? (
          <ul className="inspector-simple-list network-inventory__list" aria-label="Stop selection list">
            {stopDebugSelectionList.map((stop) => (
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
                  <span className="network-inventory__item-id">{stop.id}</span>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p className="network-inventory__empty">No stops placed yet.</p>
        )}

        {hiddenStopCount > 0 ? (
          <p className="network-inventory__empty">{`${hiddenStopCount} additional stops hidden in compact mode.`}</p>
        ) : null}
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
