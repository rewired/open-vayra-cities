import type { ReactElement } from 'react';

import './App.css';

/**
 * Renders the initial desktop-only CityOps application shell layout.
 */
export default function App(): ReactElement {
  return (
    <div className="app-shell" data-app-surface="desktop-shell">
      <header className="app-header" aria-label="Application header">
        <h1>CityOps</h1>
        <p>Desktop transit planning shell (bus-first MVP).</p>
      </header>

      <aside className="left-panel" aria-label="Tools and navigation panel">
        <h2>Tools</h2>
        <ul>
          <li>Build</li>
          <li>Lines</li>
          <li>Inspect</li>
        </ul>
      </aside>

      <main className="workspace" aria-label="Main workspace">
        <h2>Workspace</h2>
        <p>Future map and planning surface will be integrated here in later slices.</p>
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
