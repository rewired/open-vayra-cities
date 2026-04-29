import type { ReactElement } from 'react';
import type { ScenarioRegistryEntry } from '../domain/scenario/scenarioRegistry';
import { MaterialIcon } from '../ui/icons/MaterialIcon';

/**
 * Component properties for starting discrete sandbox gameplay sessions.
 */
interface ScenarioSelectionScreenProps {
  /** Fully aggregated scenarios ready for display metrics. */
  readonly scenarios: readonly ScenarioRegistryEntry[];
  /** Handler passing selected criteria forward. */
  readonly onSelectScenario: (entry: ScenarioRegistryEntry) => void;
  /** Optional reloading hook for developer retry cycles. */
  readonly onReloadRegistry?: () => void;
}

/**
 * Dashboard layout supporting game state selection workflows.
 */
export function ScenarioSelectionScreen({
  scenarios,
  onSelectScenario,
  onReloadRegistry
}: ScenarioSelectionScreenProps): ReactElement {
  return (
    <div className="scenario-selection-screen" aria-label="Scenario Selection Workspace">
      <div className="scenario-selection-screen__shell">
        <div className="scenario-selection-screen__splash-container">
          <img
            src="/images/openvayra-cities-splash.png"
            alt="CityOps Splash"
            className="scenario-selection-screen__splash-image"
          />
        </div>

        <div className="scenario-selection-screen__content">
          <header className="scenario-selection-screen__header">
            <div className="scenario-selection-screen__brand">
              <strong>City</strong>Ops
            </div>
            <h1 className="scenario-selection-screen__title">Choose Scenario</h1>
            <p className="scenario-selection-screen__subtitle">
              Local asset readiness determines scenario accessibility. Build robust transit connections.
            </p>
          </header>

          <main className="scenario-selection-screen__grid" role="list">
            {scenarios.map((entry) => {
              const isReady = entry.status === 'ready';

              return (
                <article
                  key={entry.scenarioId}
                  className={`scenario-card ${!isReady ? 'scenario-card--missing-assets' : ''}`}
                  role="listitem"
                >
                  <div className="scenario-card__content">
                    <header className="scenario-card__header">
                      <h2 className="scenario-card__title">{entry.title}</h2>
                      <span className="scenario-card__area-tag u-technical-numeric" title={`Area Identifier: ${entry.areaId}`}>
                        {entry.areaId}
                      </span>
                    </header>

                    <p className="scenario-card__description">{entry.description}</p>

                    {entry.missingRequirements.length > 0 && (
                      <div className="scenario-card__missing-box" aria-label="Missing requirement details">
                        <h3 className="scenario-card__missing-title">
                          <MaterialIcon name="warning" /> Missing Infrastructure Requirements:
                        </h3>
                        <ul className="scenario-card__missing-list">
                          {entry.missingRequirements.map((req, reqIdx) => (
                            <li key={reqIdx} className="scenario-card__missing-item u-technical-numeric">
                              {req}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>

                  <footer className="scenario-card__footer">
                    {isReady ? (
                      <button
                        type="button"
                        className="scenario-card__action-button scenario-card__action-button--ready"
                        aria-label={`Launch ${entry.title} scenario`}
                        onClick={() => onSelectScenario(entry)}
                      >
                        <MaterialIcon name="play_arrow" />
                        <span>Start Scenario</span>
                      </button>
                    ) : (
                      <div className="scenario-card__fallback-actions">
                        <span className="scenario-card__status-badge" aria-hidden="true">
                          Missing Assets
                        </span>
                        <button
                          type="button"
                          className="scenario-card__action-button scenario-card__action-button--escape"
                          aria-label={`Developer escape hatch: Launch ${entry.title} despite missing assets`}
                          onClick={() => onSelectScenario(entry)}
                        >
                          <span>Start anyway</span>
                          <MaterialIcon name="play_arrow" />
                        </button>
                      </div>
                    )}
                  </footer>
                </article>
              );
            })}
          </main>

          {onReloadRegistry && (
            <footer className="scenario-selection-screen__footer">
              <button
                type="button"
                className="scenario-selection-screen__reload-button"
                onClick={onReloadRegistry}
                aria-label="Refresh scenario definitions"
              >
                <MaterialIcon name="restart_alt" />
                <span>Reload Registry</span>
              </button>
            </footer>
          )}
        </div>
      </div>
    </div>
  );
}
