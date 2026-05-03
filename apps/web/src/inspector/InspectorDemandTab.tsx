import type { ReactElement } from 'react';
import { MaterialIcon } from '../ui/icons/MaterialIcon';
import { InspectorDisclosure } from '../ui/InspectorDisclosure';
import { TIME_BAND_DISPLAY_LABELS } from '../domain/constants/timeBands';

import type { ScenarioDemandCaptureProjection } from '../domain/projection/scenarioDemandCaptureProjection';
import type { ServedDemandProjection } from '../domain/projection/servedDemandProjection';
import type { DemandGapRankingProjection, DemandGapRankingItem } from '../domain/projection/demandGapProjection';
import type { DemandGapOdContextProjection } from '../domain/projection/demandGapOdContextProjection';
import type { DemandGapOdCandidateListProjection } from '../domain/projection/demandGapOdCandidateListProjection';
import type { FocusedDemandGapPlanningProjection } from '../domain/projection/focusedDemandGapPlanningProjection';

import type { FocusedDemandGapPlanningEntrypointKind, FocusedDemandGapPlanningEntrypointRequest } from '../app/focusedDemandGapPlanningEntrypoint';

interface InspectorDemandTabProps {
  readonly scenarioDemandCaptureProjection: ScenarioDemandCaptureProjection;
  readonly servedDemandProjection: ServedDemandProjection;
  readonly demandGapRankingProjection: DemandGapRankingProjection;
  readonly demandGapOdContextProjection: DemandGapOdContextProjection;
  readonly demandGapOdCandidateListProjection: DemandGapOdCandidateListProjection;
  readonly focusedDemandGapPlanningProjection: FocusedDemandGapPlanningProjection;
  readonly onPositionFocus: (position: { lng: number; lat: number }) => void;
  readonly onDemandGapFocus: (gap: DemandGapRankingItem | null) => void;
  readonly focusedDemandGapId: string | null;
  readonly onPlanningEntrypoint: (request: FocusedDemandGapPlanningEntrypointRequest) => void;
}



/**
 * Renders demand-related projections, including capture summaries, served demand, and identified gaps.
 */
export function InspectorDemandTab({
  scenarioDemandCaptureProjection,
  servedDemandProjection,
  demandGapRankingProjection,
  demandGapOdContextProjection,
  demandGapOdCandidateListProjection,
  focusedDemandGapPlanningProjection,
  onPositionFocus,
  onDemandGapFocus,
  focusedDemandGapId,
  onPlanningEntrypoint
}: InspectorDemandTabProps): ReactElement {
  const renderGapList = (gaps: readonly DemandGapRankingItem[], title: string): ReactElement | null => {
    if (gaps.length === 0) return null;

    return (
      <div className="inspector-demand-gaps__section">
        <h4 className="inspector-demand-gaps__section-title">{title}</h4>
        {gaps.map((gap) => {
          const isFocused = gap.id === focusedDemandGapId;
          return (
            <div key={gap.id} className={`inspector-demand-gaps__item ${isFocused ? 'inspector-demand-gaps__item--focused' : ''}`}>
              <div className="inspector-demand-gaps__item-content">
                <span className="inspector-demand-gaps__item-label">
                  Pressure: {gap.activeWeight.toFixed(1)}
                </span>
                <span className="inspector-demand-gaps__item-note">{gap.note}</span>
              </div>
              <button
                type="button"
                className={`inspector-demand-gaps__focus-button ${isFocused ? 'inspector-demand-gaps__focus-button--active' : ''}`}
                title="Focus on map"
                onClick={() => onDemandGapFocus(gap)}
              >
                <MaterialIcon name="center_focus_strong" />
              </button>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <section className="inspector-demand-tab" aria-label="Demand">
      <h3>Demand</h3>

      <h4 className="inspector-section-title">Demand capture</h4>
      {scenarioDemandCaptureProjection.status === 'unavailable' ? (
        <p className="inspector-dialog__note">Demand projection unavailable.</p>
      ) : (
        <>
          <p className="inspector-dialog__note">
            Place stops to capture nearby scenario demand.
          </p>
          <table className="inspector-compact-table inspector-network-summary__primary-table">
            <tbody>
              <tr>
                <th scope="row">Residential nodes</th>
                <td>
                  {scenarioDemandCaptureProjection.residentialSummary.capturedCount} / {scenarioDemandCaptureProjection.residentialSummary.totalCount}
                </td>
              </tr>
              <tr>
                <th scope="row">Workplace destinations</th>
                <td>
                  {scenarioDemandCaptureProjection.workplaceSummary.capturedCount} / {scenarioDemandCaptureProjection.workplaceSummary.totalCount}
                </td>
              </tr>
            </tbody>
          </table>

          <InspectorDisclosure summaryText="Capture details">
            <table className="inspector-compact-table">
              <tbody>
                <tr>
                  <th scope="row">Access radius</th>
                  <td>
                    {scenarioDemandCaptureProjection.accessRadiusMeters}m
                  </td>
                </tr>
                {scenarioDemandCaptureProjection.gatewaySummary.totalCount > 0 && (
                  <tr>
                    <th scope="row">Gateways</th>
                    <td>
                      {scenarioDemandCaptureProjection.gatewaySummary.capturedCount} / {scenarioDemandCaptureProjection.gatewaySummary.totalCount}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </InspectorDisclosure>
        </>
      )}

      <h4 className="inspector-section-title">Served demand</h4>
      {servedDemandProjection.status === 'unavailable' ? (
        <p className="inspector-dialog__note">Served demand projection unavailable.</p>
      ) : (
        <>
          <table className="inspector-compact-table inspector-network-summary__primary-table">
            <tbody>
              <tr>
                <th scope="row">Residential served</th>
                <td>
                  {Math.round(servedDemandProjection.servedResidentialActiveWeight)} / {Math.round(servedDemandProjection.capturedResidentialActiveWeight)}
                </td>
              </tr>
              <tr>
                <th scope="row">Workplace reachable</th>
                <td>
                  {Math.round(servedDemandProjection.reachableWorkplaceActiveWeight)} / {Math.round(servedDemandProjection.capturedWorkplaceActiveWeight)}
                </td>
              </tr>
            </tbody>
          </table>

          <InspectorDisclosure summaryText="Service details">
            <table className="inspector-compact-table">
              <tbody>
                <tr>
                  <th scope="row">Active band</th>
                  <td className="inspector-compact-table__value--left">
                    {TIME_BAND_DISPLAY_LABELS[servedDemandProjection.activeTimeBandId]}
                  </td>
                </tr>
                <tr>
                  <th scope="row">Unserved captured res.</th>
                  <td>
                    {Math.round(servedDemandProjection.unservedResidentialActiveWeight)}
                  </td>
                </tr>
                <tr>
                  <th scope="row">Active service lines</th>
                  <td>{servedDemandProjection.activeServiceLineCount}</td>
                </tr>
              </tbody>
            </table>
          </InspectorDisclosure>
        </>
      )}

      <h4 className="inspector-section-title">Demand gaps</h4>
      {demandGapRankingProjection.status === 'unavailable' ? (
        <p className="inspector-dialog__note">Demand gap ranking unavailable.</p>
      ) : (
        <div className="inspector-demand-gaps">
          {demandGapRankingProjection.uncapturedResidentialGaps.length === 0 &&
            demandGapRankingProjection.capturedButUnservedResidentialGaps.length === 0 &&
            demandGapRankingProjection.capturedButUnreachableWorkplaceGaps.length === 0 ? (
            <p className="inspector-dialog__note">No major demand gaps identified.</p>
          ) : (
            <>
              <InspectorDisclosure
                summaryText="Identify gaps"
                summaryBadge={`${demandGapRankingProjection.uncapturedResidentialGaps.length + demandGapRankingProjection.capturedButUnservedResidentialGaps.length + demandGapRankingProjection.capturedButUnreachableWorkplaceGaps.length} areas`}
              >
                {renderGapList(demandGapRankingProjection.capturedButUnservedResidentialGaps, 'Unserved homes')}
                {renderGapList(demandGapRankingProjection.uncapturedResidentialGaps, 'Uncaptured homes')}
                {renderGapList(demandGapRankingProjection.capturedButUnreachableWorkplaceGaps, 'Unreachable workplaces')}
              </InspectorDisclosure>

              {focusedDemandGapId && (
                <div className="inspector-demand-gaps__od-context">
                  <div className="inspector-demand-gaps__od-context-header">
                    <h4 className="inspector-demand-gaps__section-title">Planning context</h4>
                    <button
                      type="button"
                      className="inspector-button-secondary inspector-button-secondary--small"
                      onClick={() => onDemandGapFocus(null)}
                    >
                      Clear focus
                    </button>
                  </div>
                  
                  {focusedDemandGapPlanningProjection.status === 'ready' && (
                    <div className="inspector-demand-gaps__planning-summary">
                      <div className="inspector-demand-gaps__guidance" aria-live="polite">
                        <MaterialIcon name="info" />
                        <div>
                          <strong>{focusedDemandGapPlanningProjection.title}</strong>
                          <p>{focusedDemandGapPlanningProjection.primaryAction}</p>
                          <p className="inspector-demand-gaps__guidance-supporting">{focusedDemandGapPlanningProjection.supportingContext}</p>
                        </div>
                      </div>
                      
                      {focusedDemandGapPlanningProjection.actionKind && (() => {
                        const gap = 
                          demandGapRankingProjection.uncapturedResidentialGaps.find(g => g.id === focusedDemandGapId) ??
                          demandGapRankingProjection.capturedButUnservedResidentialGaps.find(g => g.id === focusedDemandGapId) ??
                          demandGapRankingProjection.capturedButUnreachableWorkplaceGaps.find(g => g.id === focusedDemandGapId);
                        
                        if (!gap) return null;

                        const isCoverage = focusedDemandGapPlanningProjection.actionKind === 'add-stop-coverage';
                        const actionLabel = isCoverage ? 'Start stop placement' : 'Start line planning';
                        const helperCopy = isCoverage
                          ? 'Switches to stop placement and centers this gap. You still choose the street anchor.'
                          : 'Switches to line planning and centers this gap. No line is created automatically.';
                        const requestKind: FocusedDemandGapPlanningEntrypointKind = isCoverage
                          ? 'start-stop-placement-near-gap'
                          : 'start-line-planning-near-gap';

                        return (
                          <div className="inspector-demand-gaps__planning-action-container">
                            <button
                              type="button"
                              className="inspector-button-primary inspector-demand-gaps__planning-action-button"
                              onClick={() => onPlanningEntrypoint({ kind: requestKind, position: gap.position })}
                            >
                              <MaterialIcon name={isCoverage ? 'add_location_alt' : 'route'} />
                              <span>{actionLabel}</span>
                            </button>
                            <p className="inspector-dialog__note inspector-demand-gaps__planning-action-note">
                              {helperCopy}
                            </p>
                          </div>
                        );
                      })()}
                      
                      {focusedDemandGapPlanningProjection.evidence.length > 0 && (
                        <table className="inspector-compact-table inspector-compact-table--evidence">
                          <tbody>
                            {focusedDemandGapPlanningProjection.evidence.map((item, idx) => (
                              <tr key={idx}>
                                <th scope="row">{item.label}</th>
                                <td>{item.value}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      )}
                      
                      <p className="inspector-dialog__note inspector-dialog__note--caveat">
                        {focusedDemandGapPlanningProjection.caveat}
                      </p>
                    </div>
                  )}

                  {demandGapOdCandidateListProjection.status === 'ready' && demandGapOdCandidateListProjection.rows.length > 0 && (
                    <>
                      <h4 className="inspector-demand-gaps__section-title">{demandGapOdCandidateListProjection.heading}</h4>
                    <table className="inspector-compact-table">
                      <thead>
                        <tr>
                          <th scope="col">Candidate</th>
                          <th scope="col">Weight</th>
                          <th scope="col">Dist.</th>
                          <th scope="col" aria-label="Action" />
                        </tr>
                      </thead>
                      <tbody>
                        {demandGapOdCandidateListProjection.rows.map(row => (
                          <tr key={row.candidateId}>
                            <td>
                              <span title={row.candidateId}>{row.displayLabel}</span>
                            </td>
                            <td>{row.activeWeightLabel}</td>
                            <td>{row.distanceLabel}</td>
                            <td className="inspector-demand-gaps__candidate-action-cell">
                              <button
                                type="button"
                                className="inspector-demand-gaps__focus-button"
                                title={`Focus ${row.displayLabel} on map`}
                                aria-label={`Focus ${row.displayLabel} on map`}
                                onClick={() => onPositionFocus(row.position)}
                              >
                                <MaterialIcon name="center_focus_strong" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    </>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      )}
    </section>
  );
}
