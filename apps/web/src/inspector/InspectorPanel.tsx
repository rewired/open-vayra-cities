import { useEffect, useMemo, useState, type ReactElement } from 'react';
import { MaterialIcon } from '../ui/icons/MaterialIcon';

import { TIME_BAND_DISPLAY_LABELS } from '../domain/constants/timeBands';
import type { Line } from '../domain/types/line';
import { InlineRenameField } from './InlineRenameField';
import { SelectedLineInspector } from './SelectedLineInspector';
import { NetworkInventory } from './NetworkInventory';
import { InspectorDisclosure } from '../ui/InspectorDisclosure';
import { INSPECTOR_TAB_IDS, INSPECTOR_TAB_LABELS, type InspectorTabId } from './inspectorTabs';
import { OsmStopCandidateInspector } from './OsmStopCandidateInspector';
import type { InspectorPanelState } from './types';
import type {
  LineFrequencyControlByTimeBand,
  LineFrequencyInputByTimeBand,
  LineFrequencyValidationByTimeBand,
  SelectedLineFrequencyUpdateAction
} from '../session/useNetworkSessionState';
import type { TimeBandId } from '../domain/types/timeBand';

interface InspectorPanelProps {
  readonly inspectorPanelState: InspectorPanelState;
  readonly completedLines: readonly Line[];
  readonly staticNetworkSummaryKpis: import('../domain/projection/useNetworkPlanningProjections').StaticNetworkSummaryKpis;
  readonly networkServicePlanProjection: ReturnType<typeof import('../domain/projection/lineServicePlanProjection').projectLineServicePlan>;
  readonly vehicleNetworkProjection: ReturnType<typeof import('../domain/projection/lineVehicleProjection').projectLineVehicleNetwork>;
  readonly selectedLineRouteBaseline: import('../domain/types/routeBaseline').LineRouteBaseline | null;
  readonly placedStops: readonly import('../domain/types/stop').Stop[];
  readonly activeTimeBandId: TimeBandId;
  readonly selectedLineServiceProjection: ReturnType<typeof import('../domain/projection/lineServicePlanProjection').projectLineServicePlanForLine> | null;
  readonly selectedLineServiceInspectorProjection: ReturnType<typeof import('../domain/projection/lineServicePlanProjection').projectLineSelectedServiceInspector> | null;
  readonly selectedLinePlanningVehicleProjection: ReturnType<typeof import('../domain/projection/linePlanningVehicleProjection').projectLinePlanningVehicles> | null;
  readonly lineFrequencyInputByTimeBand: LineFrequencyInputByTimeBand;
  readonly lineFrequencyControlByTimeBand: LineFrequencyControlByTimeBand;
  readonly lineFrequencyValidationByTimeBand: LineFrequencyValidationByTimeBand;
  readonly onFrequencyChange: (
    timeBandId: TimeBandId,
    rawInputValue: string,
    action?: SelectedLineFrequencyUpdateAction
  ) => void;
  readonly onSelectedLineIdChange: (lineId: Line['id']) => void;
  readonly onStopSelectionChange: (stopId: import('../domain/types/stop').StopId) => void;
  /** Callback for line-context stop focus (focuses on map without leaving selected-line inspector). */
  readonly onLineSequenceStopFocus: (stopId: import('../domain/types/stop').StopId) => void;
  readonly onStopRename: (stopId: import('../domain/types/stop').StopId, nextLabel: string) => void;
  readonly onLineRename: (lineId: Line['id'], nextLabel: string) => void;
  readonly openDialogIntent: import('../session/sessionTypes').SelectedLineDialogOpenIntent | null;
  readonly onOpenDialogIntentConsumed: (intent: import('../session/sessionTypes').SelectedLineDialogOpenIntent | null) => void;
  readonly onOsmCandidateAdopt: (group: import('../domain/types/osmStopCandidate').OsmStopCandidateGroup, anchor: import('../domain/osm/osmStopCandidateAnchorTypes').OsmStopCandidateStreetAnchorResolution) => void;
  readonly osmStopCandidateGroups: readonly import('../domain/types/osmStopCandidate').OsmStopCandidateGroup[];
  readonly selectedOsmCandidateAnchor: import('../domain/osm/osmStopCandidateAnchorTypes').OsmStopCandidateStreetAnchorResolution | null;
  readonly adoptedOsmCandidateGroupIds: ReadonlySet<import('../domain/types/osmStopCandidate').OsmStopCandidateGroupId>;
  readonly scenarioDemandCaptureProjection: import('../domain/projection/scenarioDemandCaptureProjection').ScenarioDemandCaptureProjection;
  readonly servedDemandProjection: import('../domain/projection/servedDemandProjection').ServedDemandProjection;
  readonly servicePressureProjection: import('../domain/projection/servicePressureProjection').ServicePressureProjection;
  readonly selectedLineDemandContribution: import('../domain/projection/selectedLineDemandContributionProjection').SelectedLineDemandContributionProjection | null;
  readonly demandGapRankingProjection: import('../domain/projection/demandGapProjection').DemandGapRankingProjection;
  readonly onPositionFocus: (position: { lng: number; lat: number }) => void;
}

const resolveGlobalStateLabel = (panelState: InspectorPanelState): string => {
  if (panelState.mode === 'line-selected') {
    return `Line selected (${panelState.selectedLine.id})`;
  }

  if (panelState.mode === 'stop-selected') {
    return `Stop selected (${panelState.selection.selectedStopId})`;
  }

  if (panelState.mode === 'osm-candidate-selected') {
    return `OSM candidate selected (${panelState.candidateGroupId})`;
  }

  return 'No active line or stop selection';
};

/** Renders inspector tab sections while keeping projection usage read-only and selection-specific details delegated to child components. */
export function InspectorPanel({
  inspectorPanelState,
  completedLines,
  staticNetworkSummaryKpis,
  networkServicePlanProjection,
  vehicleNetworkProjection,
  selectedLineRouteBaseline,
  placedStops,
  activeTimeBandId,
  selectedLineServiceProjection,
  selectedLineServiceInspectorProjection,
  selectedLinePlanningVehicleProjection,
  lineFrequencyInputByTimeBand,
  lineFrequencyControlByTimeBand,
  lineFrequencyValidationByTimeBand,
  onFrequencyChange,
  onSelectedLineIdChange,
  onStopSelectionChange,
  onLineSequenceStopFocus,
  onStopRename,
  onLineRename,
  openDialogIntent,
  onOpenDialogIntentConsumed,
  onOsmCandidateAdopt,
  osmStopCandidateGroups,
  selectedOsmCandidateAnchor,
  adoptedOsmCandidateGroupIds,
  scenarioDemandCaptureProjection,
  servedDemandProjection,
  servicePressureProjection,
  selectedLineDemandContribution,
  demandGapRankingProjection,
  onPositionFocus
}: InspectorPanelProps): ReactElement {
  const [activeTabId, setActiveTabId] = useState<InspectorTabId>('network');
  const [linesViewMode, setLinesViewMode] = useState<'list' | 'detail'>('list');
  const globalStateLabel = useMemo(() => resolveGlobalStateLabel(inspectorPanelState), [inspectorPanelState]);

  useEffect(() => {
    if (linesViewMode === 'detail' && inspectorPanelState.mode !== 'line-selected') {
      setLinesViewMode('list');
    }
  }, [inspectorPanelState.mode, linesViewMode]);

  useEffect(() => {
    if (
      openDialogIntent &&
      inspectorPanelState.mode === 'line-selected' &&
      openDialogIntent.lineId === inspectorPanelState.selectedLine.id
    ) {
      setActiveTabId('lines');
      setLinesViewMode('detail');
    }
  }, [openDialogIntent, inspectorPanelState]);

  return (
    <aside className="right-panel" aria-label="Inspector panel">
      <h2>Inspector</h2>

      {inspectorPanelState.mode === 'osm-candidate-selected' ? (
        (() => {
          const candidateGroup = osmStopCandidateGroups.find((g) => g.id === inspectorPanelState.candidateGroupId);
          if (!candidateGroup) return null;

          return (
            <OsmStopCandidateInspector
              candidateGroup={candidateGroup}
              anchorResolution={selectedOsmCandidateAnchor}
              existingStops={placedStops}
              adoptedCandidateGroupIds={adoptedOsmCandidateGroupIds}
              onAdopt={onOsmCandidateAdopt}
            />
          );
        })()
      ) : (
        <>
          <nav className="inspector-tabs" aria-label="Inspector tabs" role="tablist">
            {INSPECTOR_TAB_IDS.map((tabId) => (
              <button
                key={tabId}
                type="button"
                role="tab"
                aria-selected={activeTabId === tabId}
                className="inspector-tabs__button"
                onClick={() => {
                  setActiveTabId(tabId);
                }}
              >
                {INSPECTOR_TAB_LABELS[tabId]}
              </button>
            ))}
          </nav>

          {activeTabId === 'network' ? (
            <section className="inspector-network-summary" aria-label="Network">
              <h3>Network</h3>
              <table className="inspector-compact-table inspector-network-summary__primary-table">
                <tbody>
                  <tr>
                    <th scope="row">Stops</th>
                    <td>{staticNetworkSummaryKpis.totalStopCount}</td>
                  </tr>
                  <tr>
                    <th scope="row">Completed lines</th>
                    <td>{staticNetworkSummaryKpis.completedLineCount}</td>
                  </tr>
                  <tr>
                    <th scope="row">Projected vehicles</th>
                    <td>{vehicleNetworkProjection.summary.totalProjectedVehicleCount}</td>
                  </tr>
                  <tr>
                    <th scope="row">Active service band</th>
                    <td className="inspector-compact-table__value--left">
                      {TIME_BAND_DISPLAY_LABELS[networkServicePlanProjection.summary.activeTimeBandId]}
                    </td>
                  </tr>
                  <tr>
                    <th scope="row">Global state</th>
                    <td className="inspector-compact-table__value--left">{globalStateLabel}</td>
                  </tr>
                  <tr>
                    <th scope="row">Degraded service lines</th>
                    <td>{networkServicePlanProjection.summary.degradedLineCount}</td>
                  </tr>
                  <tr>
                    <th scope="row">Blocked service lines</th>
                    <td>{networkServicePlanProjection.summary.blockedLineCount}</td>
                  </tr>
                </tbody>
              </table>

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
                    <p className="inspector-dialog__note">
                      Stops capture and serve demand. They do not generate it.
                    </p>
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

              <h4 className="inspector-section-title">Service pressure</h4>
              {servicePressureProjection.activeDeparturesPerHourEstimate === 0 ? (
                <p className="inspector-dialog__note">No active service frequency in the current time band.</p>
              ) : (
                <>
                  <table className="inspector-compact-table inspector-network-summary__primary-table">
                    <tbody>
                      <tr>
                        <th scope="row">Pressure</th>
                        <td className="inspector-compact-table__value--left">
                          {servicePressureProjection.servicePressureStatus.charAt(0).toUpperCase() +
                            servicePressureProjection.servicePressureStatus.slice(1)}
                        </td>
                      </tr>
                      <tr>
                        <th scope="row">Departures/hour</th>
                        <td>{servicePressureProjection.activeDeparturesPerHourEstimate.toFixed(1)}</td>
                      </tr>
                    </tbody>
                  </table>

                  <InspectorDisclosure summaryText="Pressure details">
                    <table className="inspector-compact-table">
                      <tbody>
                        <tr>
                          <th scope="row">Active band</th>
                          <td className="inspector-compact-table__value--left">
                            {TIME_BAND_DISPLAY_LABELS[servicePressureProjection.activeTimeBandId]}
                          </td>
                        </tr>
                        <tr>
                          <th scope="row">Average headway</th>
                          <td>
                            {servicePressureProjection.averageHeadwayMinutes !== null
                              ? `${servicePressureProjection.averageHeadwayMinutes.toFixed(1)} min`
                              : '—'}
                          </td>
                        </tr>
                        <tr>
                          <th scope="row">Demand per departure</th>
                          <td>{servicePressureProjection.servicePressureRatio.toFixed(1)}</td>
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
                    <InspectorDisclosure
                      summaryText="Identify gaps"
                      summaryBadge={`${demandGapRankingProjection.uncapturedResidentialGaps.length + demandGapRankingProjection.capturedButUnservedResidentialGaps.length + demandGapRankingProjection.capturedButUnreachableWorkplaceGaps.length} areas`}
                    >
                      {[
                        { title: 'Unserved homes', gaps: demandGapRankingProjection.capturedButUnservedResidentialGaps },
                        { title: 'Uncaptured homes', gaps: demandGapRankingProjection.uncapturedResidentialGaps },
                        { title: 'Unreachable workplaces', gaps: demandGapRankingProjection.capturedButUnreachableWorkplaceGaps }
                      ].map(
                        (section) =>
                          section.gaps.length > 0 && (
                            <div key={section.title} className="inspector-demand-gaps__section">
                              <h5 className="inspector-demand-gaps__section-title">{section.title}</h5>
                              <ul className="inspector-simple-list">
                                {section.gaps.map((gap) => (
                                  <li key={gap.id} className="inspector-demand-gaps__item">
                                    <div className="inspector-demand-gaps__item-content">
                                      <span className="inspector-demand-gaps__item-label">
                                        {gap.id} · {gap.activeWeight.toFixed(1)} demand
                                      </span>
                                      <span className="inspector-demand-gaps__item-note">{gap.note}</span>
                                    </div>
                                    <button
                                      type="button"
                                      className="inspector-demand-gaps__focus-button"
                                      title="Focus on map"
                                      onClick={() => onPositionFocus(gap.position)}
                                    >
                                      <MaterialIcon name="center_focus_strong" />
                                    </button>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )
                      )}
                    </InspectorDisclosure>
                  )}
                </div>
              )}

              <InspectorDisclosure summaryText="Network inventory">
                <NetworkInventory
                  placedStops={placedStops}
                  completedLines={completedLines}
                  onStopSelect={onStopSelectionChange}
                  onLineSelect={onSelectedLineIdChange}
                  onLineRename={onLineRename}
                />
              </InspectorDisclosure>


            </section>
          ) : null}

          {activeTabId === 'lines' ? (
            <section className="inspector-lines-tab" aria-label="Lines">
              <h3>Lines</h3>
              {linesViewMode === 'list' ? (
                completedLines.length > 0 ? (
                  <ul className="inspector-simple-list inspector-lines-tab__list" aria-label="Completed line list">
                    {completedLines.map((line) => (
                      <li key={line.id} className="inspector-lines-tab__list-item">
                        <button
                          type="button"
                          className="inspector-lines-tab__line-badge-button"
                          onClick={() => {
                            onSelectedLineIdChange(line.id);
                            setLinesViewMode('detail');
                          }}
                          title={`Select and focus ${line.label}`}
                          aria-label={`Select line ${line.id}: ${line.label}`}
                        >
                          {line.id}
                        </button>
                        <span className="inspector-lines-tab__line-label" title={line.label}>
                          {line.label}
                        </span>
                        <InlineRenameField
                          value={line.label}
                          entityLabel="line"
                          idleDisplayMode="edit-only"
                          onAccept={(nextValue) => onLineRename(line.id, nextValue)}
                        />
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p>No completed lines.</p>
                )
              ) : (
                <>
                  <button
                    type="button"
                    className="inspector-lines-tab__back"
                    onClick={() => {
                      setLinesViewMode('list');
                    }}
                  >
                    Back to completed lines
                  </button>
                  {inspectorPanelState.mode === 'line-selected' ? (
                    <SelectedLineInspector
                      panelState={inspectorPanelState}
                      selectedLineRouteBaseline={selectedLineRouteBaseline}
                      placedStops={placedStops}
                      activeTimeBandId={activeTimeBandId}
                      lineFrequencyInputByTimeBand={lineFrequencyInputByTimeBand}
                      lineFrequencyControlByTimeBand={lineFrequencyControlByTimeBand}
                      lineFrequencyValidationByTimeBand={lineFrequencyValidationByTimeBand}
                      selectedLineServiceProjection={selectedLineServiceProjection}
                      selectedLineServiceInspectorProjection={selectedLineServiceInspectorProjection}
                      selectedLinePlanningVehicleProjection={selectedLinePlanningVehicleProjection}
                      onLineRename={onLineRename}
                      onLineSequenceStopFocus={onLineSequenceStopFocus}
                      onStopRename={onStopRename}
                      onStopSelectionChange={onStopSelectionChange}
                      onFrequencyChange={onFrequencyChange}
                      openDialogIntent={openDialogIntent}
                      onOpenDialogIntentConsumed={onOpenDialogIntentConsumed}
                      selectedLineDemandContribution={selectedLineDemandContribution}
                    />
                  ) : (
                    <p>Select a completed line from the list to open detail.</p>
                  )}
                </>
              )}
            </section>
          ) : null}
        </>
      )}

    </aside>
  );
}
