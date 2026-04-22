import { useState, type ReactElement } from 'react';

import { MapWorkspaceSurface } from './map-workspace/MapWorkspaceSurface';

import './App.css';

/**
 * Defines the workspace tool modes available in the desktop shell.
 */
export type WorkspaceToolMode = 'inspect' | 'place-stop';

/**
 * Renders the initial desktop-only CityOps application shell layout.
 */
export default function App(): ReactElement {
  const [activeToolMode, setActiveToolMode] = useState<WorkspaceToolMode>('inspect');
  const isStopPlacementModeActive = activeToolMode === 'place-stop';

  const handleStopPlacementModeToggle = (): void => {
    setActiveToolMode((currentMode) => (currentMode === 'place-stop' ? 'inspect' : 'place-stop'));
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
          <button
            type="button"
            className="tool-mode-control__button"
            aria-pressed={isStopPlacementModeActive}
            onClick={handleStopPlacementModeToggle}
          >
            {isStopPlacementModeActive ? 'Exit stop placement' : 'Enter stop placement'}
          </button>
        </div>
      </aside>

      <main className="workspace" aria-label="Main workspace">
        <MapWorkspaceSurface activeToolMode={activeToolMode} />
      </main>

      <aside className="right-panel" aria-label="Inspector panel">
        <h2>Inspector</h2>
        <p>Selection details and metrics will appear here.</p>
      </aside>

      <footer className="status-bar" aria-label="Status bar">
        <span>Status: Shell initialized</span>
        <span>Time: --:--</span>
        <span>Speed: 1x</span>
      </footer>
    </div>
  );
}
