import { type ReactElement } from 'react';

interface DemandMapLegendProps {
  /** Indicates if the demand gap heatmap/overlay is currently visible. */
  readonly isGapOverlayVisible: boolean;
  /** Indicates if the OD hint lines are currently visible. */
  readonly isOdHintVisible: boolean;
}

/**
 * A compact, non-interactive map legend explaining the demand overlays.
 * 
 * Frames visible data as generated scenario-demand planning context and
 * explicitly disclaims observed passenger flows or exact OD truth.
 */
export function DemandMapLegend({
  isGapOverlayVisible,
  isOdHintVisible
}: DemandMapLegendProps): ReactElement {
  return (
    <div className="demand-gap-legend" aria-label="Demand map legend">
      {isGapOverlayVisible && (
        <section className="demand-gap-legend__section" aria-label="Demand gap pressure">
          <header className="demand-gap-legend__header">
            <h4>Demand Gap Pressure</h4>
          </header>
          <ul className="demand-gap-legend__list">
            <li className="demand-gap-legend__item">
              <div className="demand-gap-legend__swatch demand-gap-legend__swatch--uncaptured" />
              <span className="demand-gap-legend__label">Uncaptured Residential</span>
            </li>
            <li className="demand-gap-legend__item">
              <div className="demand-gap-legend__swatch demand-gap-legend__swatch--unserved" />
              <span className="demand-gap-legend__label">Captured but Unserved</span>
            </li>
            <li className="demand-gap-legend__item">
              <div className="demand-gap-legend__swatch demand-gap-legend__swatch--unreachable" />
              <span className="demand-gap-legend__label">Unreachable Workplace</span>
            </li>
          </ul>
        </section>
      )}

      {isOdHintVisible && (
        <section className="demand-gap-legend__section" aria-label="OD hints">
          <header className="demand-gap-legend__header">
            <h4>OD Hints</h4>
          </header>
          <ul className="demand-gap-legend__list">
            <li className="demand-gap-legend__item">
              <div className="demand-gap-legend__swatch demand-gap-legend__swatch--od-hint" />
              <span className="demand-gap-legend__label">Straight planning hints</span>
            </li>
          </ul>
        </section>
      )}

      <div className="demand-gap-legend__hint">
        Generated scenario demand. Planning context only, not observed passenger flows.
      </div>
    </div>
  );
}
