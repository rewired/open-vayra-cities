import { useEffect, useState, type ReactElement } from 'react';

import { MVP_TIME_BAND_IDS, TIME_BAND_DISPLAY_LABELS } from './domain/constants/timeBands';
import { createLineFrequencyMinutes, type Line } from './domain/types/line';
import type { StopId } from './domain/types/stop';
import type { TimeBandId } from './domain/types/timeBand';
import {
  MapWorkspaceSurface,
  type StopSelectionState
} from './map-workspace/MapWorkspaceSurface';
import { MaterialIcon } from './ui/icons/MaterialIcon';
import { WORKSPACE_MODE_ICONS } from './ui/icons/materialIcons';

import './App.css';

/**
 * Defines the workspace tool modes available in the desktop shell.
 */
export type WorkspaceToolMode = 'inspect' | 'place-stop' | 'build-line';

/**
 * Carries the active line-building draft selection as an ordered stop-id list.
 */
export interface LineBuildSelectionState {
  readonly selectedStopIds: readonly StopId[];
}

/**
 * Carries the currently selected completed line for structural inspector rendering.
 */
export interface LineSelectionState {
  readonly selectedLine: Line | null;
}

type LineFrequencyInputByTimeBand = Readonly<Record<TimeBandId, string>>;

type LineFrequencyValidationByTimeBand = Readonly<Record<TimeBandId, string | null>>;

/**
 * Enumerates the inspector's mutually exclusive visual states.
 */
export type InspectorPanelMode = 'line-selected' | 'stop-selected' | 'empty';

/**
 * Carries inspector data when a completed line is the active selection context.
 */
export interface LineSelectedInspectorPanelState {
  readonly mode: 'line-selected';
  readonly selectedLine: Line;
}

/**
 * Carries inspector data when a stop is the active selection context.
 */
export interface StopSelectedInspectorPanelState {
  readonly mode: 'stop-selected';
  readonly selectedStop: StopSelectionState;
}

/**
 * Carries inspector data when neither a line nor stop is selected.
 */
export interface EmptyInspectorPanelState {
  readonly mode: 'empty';
}

/**
 * Represents the resolved inspector view model after applying selection priority rules.
 */
export type InspectorPanelState =
  | LineSelectedInspectorPanelState
  | StopSelectedInspectorPanelState
  | EmptyInspectorPanelState;

const INITIAL_LINE_BUILD_SELECTION_STATE: LineBuildSelectionState = {
  selectedStopIds: []
};

const createEmptyLineFrequencyInputByTimeBand = (): LineFrequencyInputByTimeBand =>
  Object.fromEntries(MVP_TIME_BAND_IDS.map((timeBandId) => [timeBandId, ''])) as LineFrequencyInputByTimeBand;

const createEmptyLineFrequencyValidationByTimeBand = (): LineFrequencyValidationByTimeBand =>
  Object.fromEntries(MVP_TIME_BAND_IDS.map((timeBandId) => [timeBandId, null])) as LineFrequencyValidationByTimeBand;

/**
 * Resolves the inspector panel state with explicit selection priority:
 * selected line first, then selected stop, else neutral empty state.
 */
function resolveInspectorPanelState(
  selectedLine: Line | null,
  selectedStop: StopSelectionState | null
): InspectorPanelState {
  if (selectedLine) {
    return {
      mode: 'line-selected',
      selectedLine
    };
  }

  if (selectedStop) {
    return {
      mode: 'stop-selected',
      selectedStop
    };
  }

  return {
    mode: 'empty'
  };
}

/**
 * Renders the initial desktop-only CityOps application shell layout.
 */
export default function App(): ReactElement {
  const [activeToolMode, setActiveToolMode] = useState<WorkspaceToolMode>('inspect');
  const [selectedStop, setSelectedStop] = useState<StopSelectionState | null>(null);
  const [lineBuildSelection, setLineBuildSelection] =
    useState<LineBuildSelectionState>(INITIAL_LINE_BUILD_SELECTION_STATE);
  const [sessionLines, setSessionLines] = useState<readonly Line[]>([]);
  const [selectedLineId, setSelectedLineId] = useState<Line['id'] | null>(null);
  const [lineFrequencyInputByTimeBand, setLineFrequencyInputByTimeBand] =
    useState<LineFrequencyInputByTimeBand>(createEmptyLineFrequencyInputByTimeBand);
  const [lineFrequencyValidationByTimeBand, setLineFrequencyValidationByTimeBand] =
    useState<LineFrequencyValidationByTimeBand>(createEmptyLineFrequencyValidationByTimeBand);

  const handleToolModeSelection = (nextMode: WorkspaceToolMode): void => {
    setActiveToolMode(nextMode);

    if (nextMode !== 'build-line') {
      setLineBuildSelection(INITIAL_LINE_BUILD_SELECTION_STATE);
    }
  };

  const selectedLine = sessionLines.find((line) => line.id === selectedLineId) ?? null;
  const selectedStopId: StopId | null = selectedStop?.selectedStopId ?? null;
  const inspectorPanelState = resolveInspectorPanelState(selectedLine, selectedStop);

  useEffect(() => {
    if (!selectedLine) {
      setLineFrequencyInputByTimeBand(createEmptyLineFrequencyInputByTimeBand());
      setLineFrequencyValidationByTimeBand(createEmptyLineFrequencyValidationByTimeBand());
      return;
    }

    setLineFrequencyInputByTimeBand(
      Object.fromEntries(
        MVP_TIME_BAND_IDS.map((timeBandId) => [
          timeBandId,
          selectedLine.frequencyByTimeBand[timeBandId] === null ||
          selectedLine.frequencyByTimeBand[timeBandId] === undefined
            ? ''
            : String(selectedLine.frequencyByTimeBand[timeBandId])
        ])
      ) as LineFrequencyInputByTimeBand
    );
    setLineFrequencyValidationByTimeBand(createEmptyLineFrequencyValidationByTimeBand());
  }, [selectedLine]);

  const updateSelectedCompletedLineFrequency = (
    timeBandId: TimeBandId,
    rawInputValue: string
  ): void => {
    setLineFrequencyInputByTimeBand((currentInputs) => ({
      ...currentInputs,
      [timeBandId]: rawInputValue
    }));

    if (!selectedLine) {
      return;
    }

    const trimmedValue = rawInputValue.trim();
    if (trimmedValue.length === 0) {
      setLineFrequencyValidationByTimeBand((currentValidation) => ({
        ...currentValidation,
        [timeBandId]: null
      }));
      setSessionLines((currentLines) =>
        currentLines.map((line) =>
          line.id === selectedLine.id
            ? {
                ...line,
                frequencyByTimeBand: {
                  ...line.frequencyByTimeBand,
                  [timeBandId]: null
                }
              }
            : line
        )
      );
      return;
    }

    const parsedFrequencyMinutes = Number(trimmedValue);
    if (!Number.isFinite(parsedFrequencyMinutes) || parsedFrequencyMinutes <= 0) {
      setLineFrequencyValidationByTimeBand((currentValidation) => ({
        ...currentValidation,
        [timeBandId]: 'Enter a positive minute interval.'
      }));
      return;
    }

    setLineFrequencyValidationByTimeBand((currentValidation) => ({
      ...currentValidation,
      [timeBandId]: null
    }));
    setSessionLines((currentLines) =>
      currentLines.map((line) =>
        line.id === selectedLine.id
          ? {
              ...line,
              frequencyByTimeBand: {
                ...line.frequencyByTimeBand,
                [timeBandId]: createLineFrequencyMinutes(parsedFrequencyMinutes)
              }
            }
          : line
      )
    );
  };

  return (
    <div className="app-shell" data-app-surface="desktop-shell">
      <header className="app-header" aria-label="Application header">
        <h1>CityOps</h1>
        <p>Desktop transit planning shell (bus-first MVP).</p>
      </header>

      <aside className="left-panel" aria-label="Tools and navigation panel">
        <h2>Tools</h2>
        <div className="tool-mode-control" aria-label="Active workspace tool">
          <p>Current mode: {activeToolMode}</p>
          <div className="tool-mode-control__button-row" role="group" aria-label="Workspace mode selection">
            <button
              type="button"
              className="tool-mode-control__button"
              aria-pressed={activeToolMode === 'inspect'}
              onClick={() => {
                handleToolModeSelection('inspect');
              }}
            >
              <MaterialIcon name={WORKSPACE_MODE_ICONS.inspect} />
              <span>Inspect</span>
            </button>
            <button
              type="button"
              className="tool-mode-control__button"
              aria-pressed={activeToolMode === 'place-stop'}
              onClick={() => {
                handleToolModeSelection('place-stop');
              }}
            >
              <MaterialIcon name={WORKSPACE_MODE_ICONS['place-stop']} />
              <span>Place stop</span>
            </button>
            <button
              type="button"
              className="tool-mode-control__button"
              aria-pressed={activeToolMode === 'build-line'}
              onClick={() => {
                handleToolModeSelection('build-line');
              }}
            >
              <MaterialIcon name={WORKSPACE_MODE_ICONS['build-line']} />
              <span>Build line</span>
            </button>
          </div>
        </div>
      </aside>

      <main className="workspace" aria-label="Main workspace">
        <MapWorkspaceSurface
          activeToolMode={activeToolMode}
          selectedStopId={selectedStopId}
          lineBuildSelection={lineBuildSelection}
          sessionLines={sessionLines}
          selectedLineId={selectedLineId}
          onStopSelectionChange={setSelectedStop}
          onLineBuildSelectionChange={setLineBuildSelection}
          onSessionLinesChange={setSessionLines}
          onSelectedLineIdChange={setSelectedLineId}
        />
      </main>

      <aside className="right-panel" aria-label="Inspector panel">
        <h2>Inspector</h2>
        <p>Active mode: {activeToolMode}</p>
        <p>MVP time bands: {MVP_TIME_BAND_IDS.map((timeBandId) => TIME_BAND_DISPLAY_LABELS[timeBandId]).join(', ')}</p>
        {inspectorPanelState.mode === 'line-selected' ? (
          <div>
            <p>Selected line</p>
            <p>ID/Label: {`${inspectorPanelState.selectedLine.id} / ${inspectorPanelState.selectedLine.label}`}</p>
            <p>Stop count: {inspectorPanelState.selectedLine.stopIds.length}</p>
            <p>Ordered stops: {inspectorPanelState.selectedLine.stopIds.join(' → ')}</p>
            <div className="inspector-frequency-editor">
              {MVP_TIME_BAND_IDS.map((timeBandId) => (
                <label key={timeBandId} className="inspector-frequency-editor__row">
                  <span>{TIME_BAND_DISPLAY_LABELS[timeBandId]} interval (minutes)</span>
                  <input
                    type="number"
                    min={1}
                    value={lineFrequencyInputByTimeBand[timeBandId] ?? ''}
                    onChange={(event) => {
                      updateSelectedCompletedLineFrequency(timeBandId, event.currentTarget.value);
                    }}
                  />
                  {lineFrequencyValidationByTimeBand[timeBandId] ? (
                    <span className="inspector-frequency-editor__error">
                      {lineFrequencyValidationByTimeBand[timeBandId]}
                    </span>
                  ) : null}
                </label>
              ))}
            </div>
          </div>
        ) : null}

        {inspectorPanelState.mode === 'stop-selected' ? (
          <div>
            <p>Selected stop</p>
            <p>ID: {inspectorPanelState.selectedStop.selectedStopId}</p>
          </div>
        ) : null}

        {inspectorPanelState.mode === 'empty' ? <p>No stop or line selected.</p> : null}
      </aside>

      <footer className="status-bar" aria-label="Status bar">
        <span>Status: Shell initialized</span>
        <span>Time: --:--</span>
        <span>Speed: 1x</span>
      </footer>
    </div>
  );
}
