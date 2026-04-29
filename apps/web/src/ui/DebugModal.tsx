import { useState, type ReactElement } from 'react';

import type { MapWorkspaceDebugSnapshot } from '../map-workspace/mapWorkspaceDebugSnapshot';
import type { WorkspaceToolMode } from '../session/sessionTypes';

/** Ordered debug-tab identifiers for the shell-owned diagnostics modal. */
type DebugModalTabId = 'overview' | 'routing' | 'service' | 'raw-state';

import { MaterialIcon } from './icons/MaterialIcon';

/** Immutable shell/session identity and count diagnostics for debug overview rendering. */
export interface DebugModalOverviewDiagnostics {
  readonly activeToolMode: WorkspaceToolMode;
  readonly selectedStopId: string | null;
  readonly selectedLineId: string | null;
  readonly totalStopCount: number;
  readonly completedLineCount: number;
  readonly totalProjectedVehicleCount: number;
  readonly draftOrderedStopIds: readonly string[];
  readonly completedLineIds: readonly string[];
  readonly selectedOsmCandidateGroupId: string | null;
  readonly scenarioDemandArtifactStatus: 'unloaded' | 'loaded' | 'failed';
  readonly scenarioDemandNodeCount: number | null;
  readonly scenarioDemandAttractorCount: number | null;
  readonly scenarioDemandGatewayCount: number | null;
  readonly scenarioDemandArtifactErrorMessage: string | null;
}

/** Immutable selected-line segment detail for debug inspection. */
export interface DebugModalRoutingSegment {
  readonly index: number;
  readonly fromStopId: string;
  readonly toStopId: string;
  readonly distanceMeters: number;
  readonly travelTimeSeconds: number;
  readonly status: string;
  readonly warnings: readonly string[];
}

/** Immutable selected-line routing diagnostics forwarded without recomputation. */
export interface DebugModalRoutingDiagnostics {
  readonly selectedLineOrderedStopIds: readonly string[];
  readonly selectedLineSegmentCount: number | null;
  readonly selectedLineHasFallbackSegments: boolean;
  readonly selectedLineFallbackSegmentCount: number;
  readonly selectedLineRouteFallbackNote: string;
  readonly completedOverlayNote: string;
  readonly draftOverlayNote: string;
  readonly selectedLineSegments: readonly DebugModalRoutingSegment[];
}

/** Immutable selected-line and network service readiness diagnostics for debug review. */
export interface DebugModalServiceDiagnostics {
  readonly selectedLineReadinessStatus: string | null;
  readonly selectedLineConfiguredTimeBandCount: number | null;
  readonly selectedLineRouteSegmentCount: number | null;
  readonly selectedLineReadinessIssueCount: number;
  readonly selectedLineReadinessIssueSummaries: readonly string[];
  readonly networkBlockedLineCount: number;
  readonly networkDegradedLineCount: number;
}

/** Structured raw-state payload echoed in the Raw state tab for copy/paste diagnostics. */
export interface DebugModalRawStateDiagnostics {
  readonly mapWorkspaceDebugSnapshot: MapWorkspaceDebugSnapshot;
  readonly overview: DebugModalOverviewDiagnostics;
  readonly routing: DebugModalRoutingDiagnostics;
  readonly service: DebugModalServiceDiagnostics;
}

/** Read-only props for the shell-owned debug modal. */
export interface DebugModalProps {
  readonly open: boolean;
  readonly onClose: () => void;
  readonly mapWorkspaceDebugSnapshot: MapWorkspaceDebugSnapshot;
  readonly overviewDiagnostics: DebugModalOverviewDiagnostics;
  readonly routingDiagnostics: DebugModalRoutingDiagnostics;
  readonly serviceDiagnostics: DebugModalServiceDiagnostics;
  readonly rawStateDiagnostics: DebugModalRawStateDiagnostics;
}

const DEBUG_MODAL_TAB_LABELS: Readonly<Record<DebugModalTabId, string>> = {
  overview: 'Overview',
  routing: 'Routing',
  service: 'Service',
  'raw-state': 'Raw state'
};

const DEBUG_MODAL_TAB_IDS: readonly DebugModalTabId[] = ['overview', 'routing', 'service', 'raw-state'];

/**
 * Renders a shell-owned presentation-only debug modal that groups existing diagnostics into focused tabs.
 */
export function DebugModal({
  open,
  onClose,
  mapWorkspaceDebugSnapshot,
  overviewDiagnostics,
  routingDiagnostics,
  serviceDiagnostics,
  rawStateDiagnostics
}: DebugModalProps): ReactElement | null {
  const [activeTabId, setActiveTabId] = useState<DebugModalTabId>('overview');

  if (!open) {
    return null;
  }

  return (
    <div className="app-debug-modal" role="dialog" aria-modal="true" aria-label="Map workspace debug details">
      <div className="app-debug-modal__backdrop" onClick={onClose} />
      <section className="app-debug-modal__panel">
        <header className="app-debug-modal__header">
          <h2>Map workspace debug details</h2>
          <button type="button" className="inspector-dialog__close" onClick={onClose} aria-label="Close debug modal" title="Close debug modal">
            <MaterialIcon name="close" />
          </button>
        </header>

        <nav className="app-debug-modal__tabs" role="tablist" aria-label="Debug modal tabs">
          {DEBUG_MODAL_TAB_IDS.map((tabId) => (
            <button
              key={tabId}
              type="button"
              role="tab"
              aria-selected={activeTabId === tabId}
              className="app-debug-modal__tab"
              onClick={() => {
                setActiveTabId(tabId);
              }}
            >
              {DEBUG_MODAL_TAB_LABELS[tabId]}
            </button>
          ))}
        </nav>

        {activeTabId === 'overview' ? (
          <section aria-label="Debug overview" className="app-debug-modal__section">
            <table className="inspector-compact-table">
              <tbody>
                <tr><th scope="row">Tool mode</th><td>{overviewDiagnostics.activeToolMode}</td></tr>
                <tr><th scope="row">Selected stop id</th><td>{overviewDiagnostics.selectedStopId ?? 'none'}</td></tr>
                <tr><th scope="row">Selected line id</th><td>{overviewDiagnostics.selectedLineId ?? 'none'}</td></tr>
                <tr><th scope="row">Stop count</th><td>{overviewDiagnostics.totalStopCount}</td></tr>
                <tr><th scope="row">Completed line count</th><td>{overviewDiagnostics.completedLineCount}</td></tr>
                <tr><th scope="row">Projected vehicle count</th><td>{overviewDiagnostics.totalProjectedVehicleCount}</td></tr>
                <tr><th scope="row">Selected OSM candidate id</th><td>{overviewDiagnostics.selectedOsmCandidateGroupId ?? 'none'}</td></tr>
                <tr>
                  <th scope="row">Draft ordered stop ids</th>
                  <td>{overviewDiagnostics.draftOrderedStopIds.length > 0 ? overviewDiagnostics.draftOrderedStopIds.join(' → ') : 'none'}</td>
                </tr>
                <tr>
                  <th scope="row">Completed line ids</th>
                  <td>{overviewDiagnostics.completedLineIds.length > 0 ? overviewDiagnostics.completedLineIds.join(', ') : 'none'}</td>
                </tr>
                <tr><th scope="row">OSM stop candidates (raw)</th><td>{mapWorkspaceDebugSnapshot.osmStopCandidateRawCount ?? 0}</td></tr>
                <tr><th scope="row">OSM stop candidates (grouped)</th><td>{mapWorkspaceDebugSnapshot.osmStopCandidateGroupCount ?? 0}</td></tr>
                <tr><th scope="row">Demand artifact status</th><td>{overviewDiagnostics.scenarioDemandArtifactStatus}</td></tr>
                <tr><th scope="row">Demand node count</th><td>{overviewDiagnostics.scenarioDemandNodeCount ?? 0}</td></tr>
                <tr><th scope="row">Demand attractor count</th><td>{overviewDiagnostics.scenarioDemandAttractorCount ?? 0}</td></tr>
                <tr><th scope="row">Demand gateway count</th><td>{overviewDiagnostics.scenarioDemandGatewayCount ?? 0}</td></tr>
                <tr><th scope="row">Demand artifact error</th><td>{overviewDiagnostics.scenarioDemandArtifactErrorMessage ?? 'none'}</td></tr>
              </tbody>
            </table>
            <ul className="app-debug-modal__list">
              <li>{`Interaction status: ${mapWorkspaceDebugSnapshot.interactionStatus}`}</li>
              <li>{`Pointer: ${mapWorkspaceDebugSnapshot.pointerSummary}`}</li>
              <li>{`Geo: ${mapWorkspaceDebugSnapshot.geographicSummary}`}</li>
              <li>{mapWorkspaceDebugSnapshot.stopSelectionSummary}</li>
            </ul>
          </section>
        ) : null}

        {activeTabId === 'routing' ? (
          <section aria-label="Debug routing" className="app-debug-modal__section">
            <ul className="app-debug-modal__list">
              <li>{mapWorkspaceDebugSnapshot.lineDiagnosticsSummary}</li>
              <li>{`Build-line instruction: ${mapWorkspaceDebugSnapshot.buildLineInstruction}`}</li>
              <li>{`Build-line minimum requirement: ${mapWorkspaceDebugSnapshot.buildLineMinimumRequirement}`}</li>
              <li>{`Selected line segment count: ${routingDiagnostics.selectedLineSegmentCount ?? 0}`}</li>
              <li>{`Selected line ordered stop ids: ${routingDiagnostics.selectedLineOrderedStopIds.length > 0 ? routingDiagnostics.selectedLineOrderedStopIds.join(' → ') : 'none'}`}</li>
              <li>{`Fallback segments: ${routingDiagnostics.selectedLineFallbackSegmentCount}`}</li>
              <li>{`Has fallback segments: ${routingDiagnostics.selectedLineHasFallbackSegments ? 'yes' : 'no'}`}</li>
              <li>{routingDiagnostics.selectedLineRouteFallbackNote}</li>
              <li>{`Completed overlay note: ${routingDiagnostics.completedOverlayNote}`}</li>
              <li>{`Draft overlay note: ${routingDiagnostics.draftOverlayNote}`}</li>
              <li>{mapWorkspaceDebugSnapshot.draftMetadataSummary}</li>
            </ul>

            {routingDiagnostics.selectedLineSegments.length > 0 ? (
              <div className="app-debug-modal__table-container">
                <table className="inspector-compact-table app-debug-modal__table">
                  <thead>
                    <tr>
                      <th>Idx</th>
                      <th>From</th>
                      <th>To</th>
                      <th>Dist (m)</th>
                      <th>Time (s)</th>
                      <th>Status</th>
                      <th>Warnings</th>
                    </tr>
                  </thead>
                  <tbody>
                    {routingDiagnostics.selectedLineSegments.map((segment) => (
                      <tr key={segment.index}>
                        <td>{segment.index}</td>
                        <td>{segment.fromStopId}</td>
                        <td>{segment.toStopId}</td>
                        <td>{segment.distanceMeters.toFixed(1)}</td>
                        <td>{segment.travelTimeSeconds.toFixed(1)}</td>
                        <td>{segment.status}</td>
                        <td>{segment.warnings.join(', ') || 'none'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="inspector-dialog__note">No route baseline segments resolved.</p>
            )}
          </section>
        ) : null}

        {activeTabId === 'service' ? (
          <section aria-label="Debug service" className="app-debug-modal__section">
            <ul className="app-debug-modal__list">
              <li>{mapWorkspaceDebugSnapshot.vehicleDiagnosticsSummary}</li>
              <li>{`Placement instruction: ${mapWorkspaceDebugSnapshot.placementInstruction}`}</li>
              <li>{`Placement street rule hint: ${mapWorkspaceDebugSnapshot.placementStreetRuleHint}`}</li>
              <li>{`Readiness status: ${serviceDiagnostics.selectedLineReadinessStatus ?? 'none'}`}</li>
              <li>{`Configured time bands: ${serviceDiagnostics.selectedLineConfiguredTimeBandCount ?? 0}`}</li>
              <li>{`Readiness route segments: ${serviceDiagnostics.selectedLineRouteSegmentCount ?? 0}`}</li>
              <li>{`Readiness issues: ${serviceDiagnostics.selectedLineReadinessIssueCount}`}</li>
              <li>{`Network blocked lines: ${serviceDiagnostics.networkBlockedLineCount}`}</li>
              <li>{`Network degraded lines: ${serviceDiagnostics.networkDegradedLineCount}`}</li>
            </ul>
            {serviceDiagnostics.selectedLineReadinessIssueSummaries.length > 0 ? (
              <details className="inspector-details" aria-label="Selected-line readiness issue details">
                <summary>Show selected-line readiness issue details</summary>
                <ul className="app-debug-modal__list app-debug-modal__list--compact">
                  {serviceDiagnostics.selectedLineReadinessIssueSummaries.map((issueSummary) => (
                    <li key={issueSummary}>{issueSummary}</li>
                  ))}
                </ul>
              </details>
            ) : (
              <p className="inspector-dialog__note">No readiness issues.</p>
            )}
          </section>
        ) : null}

        {activeTabId === 'raw-state' ? (
          <section aria-label="Debug raw state" className="app-debug-modal__section">
            <pre className="app-debug-modal__raw-state">{JSON.stringify(rawStateDiagnostics, null, 2)}</pre>
          </section>
        ) : null}
      </section>
    </div>
  );
}
