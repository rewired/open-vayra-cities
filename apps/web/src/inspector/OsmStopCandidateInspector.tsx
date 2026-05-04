import type { ReactElement } from 'react';
import { MaterialIcon } from '../ui/icons/MaterialIcon';
import type { OsmStopCandidateGroup } from '../domain/types/osmStopCandidate';
import type { OsmStopCandidateStreetAnchorResolution } from '../domain/osm/osmStopCandidateAnchorTypes';
import type { OsmStopCandidateInspectionProjection } from '../domain/projection/osmStopCandidateInspectionProjection';

interface OsmStopCandidateInspectorProps {
  readonly projection: OsmStopCandidateInspectionProjection;
  readonly candidateGroup: OsmStopCandidateGroup | null;
  readonly anchorResolution: OsmStopCandidateStreetAnchorResolution | null;
  readonly onAdopt: (group: OsmStopCandidateGroup, anchor: OsmStopCandidateStreetAnchorResolution) => void;
}

/**
 * Renders inspection-only details and an explicit adoption action for a selected OSM stop candidate group.
 */
export function OsmStopCandidateInspector({
  projection,
  candidateGroup,
  anchorResolution,
  onAdopt
}: OsmStopCandidateInspectorProps): ReactElement {
  if (projection.status !== 'ready') {
    return (
      <div className="inspector-panel__content inspector-panel__content--osm-candidate">
        <header className="inspector-panel__header">
          <div className="inspector-panel__header-main">
            <div className="inspector-panel__title-row">
              <MaterialIcon name="add_location_alt" className="inspector-panel__title-icon" />
              <h2 className="inspector-panel__title">OSM stop candidate</h2>
            </div>
            <p className="inspector-panel__subtitle">Not yet a game stop</p>
          </div>
        </header>

        <div className="inspector-panel__body">
          <section className="inspector-panel__section">
            <h3 className="inspector-panel__section-title">Selection</h3>
            <p className="inspector-panel__summary">{projection.summaryLabel}</p>
            <p className="inspector-panel__caveat">{projection.caveat}</p>
          </section>
        </div>
      </div>
    );
  }

  const canRunAdoption = projection.canAdopt && candidateGroup !== null && anchorResolution !== null;

  return (
    <div className="inspector-panel__content inspector-panel__content--osm-candidate">
      <header className="inspector-panel__header">
        <div className="inspector-panel__header-main">
          <div className="inspector-panel__title-row">
            <MaterialIcon name="add_location_alt" className="inspector-panel__title-icon" />
            <h2 className="inspector-panel__title">{projection.displayLabel}</h2>
          </div>
          <p className="inspector-panel__subtitle">OSM stop candidate</p>
        </div>
      </header>

      <div className="inspector-panel__body">
        <section className="inspector-panel__section">
          <h3 className="inspector-panel__section-title">Status</h3>
          <div className="inspector-panel__osm-readiness">
            <span className={`status-badge status-badge--${projection.adoptionReadiness}`}>
              {projection.adoptionReadinessLabel}
            </span>
            <strong>{projection.summaryLabel}</strong>
            <p>{projection.caveat}</p>
          </div>
        </section>

        <section className="inspector-panel__section">
          <h3 className="inspector-panel__section-title">Candidate Details</h3>
          <table className="inspector-panel__table">
            <tbody>
              {projection.detailRows.map((row) => (
                <tr key={row.label}>
                  <th>{row.label}</th>
                  <td>{row.value}</td>
                </tr>
              ))}
              <tr>
                <th>Anchor Status</th>
                <td>
                  <span className={`status-badge status-badge--${anchorResolution?.status ?? 'blocked'}`}>
                    {projection.streetAnchorStatusLabel}
                  </span>
                </td>
              </tr>
              {anchorResolution?.distanceMeters !== null && anchorResolution?.distanceMeters !== undefined && (
                <tr>
                  <th>Anchor Offset</th>
                  <td>{Math.round(anchorResolution.distanceMeters)}m</td>
                </tr>
              )}
              {anchorResolution?.streetLabelCandidate && (
                <tr>
                  <th>Street</th>
                  <td>{anchorResolution.streetLabelCandidate}</td>
                </tr>
              )}
            </tbody>
          </table>
        </section>

        <section className="inspector-panel__section">
          <h3 className="inspector-panel__section-title">Next action</h3>
          <div className="inspector-panel__adoption-actions">
            <p className="inspector-panel__next-action">{projection.nextActionGuidance}</p>
            {projection.blockedReason && (
              <div className="inspector-panel__adoption-blocked-reason">
                <MaterialIcon name="info" />
                <span>{projection.blockedReason}</span>
              </div>
            )}
            <button
              type="button"
              className="inspector-panel__action-button inspector-panel__action-button--primary"
              disabled={!canRunAdoption}
              onClick={() => {
                if (canRunAdoption) {
                  onAdopt(candidateGroup, anchorResolution);
                }
              }}
            >
              <MaterialIcon name="add_location_alt" />
              <span>Adopt stop</span>
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}
