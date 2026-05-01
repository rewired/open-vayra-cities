import { useMemo, useState, type ReactElement } from 'react';
import type { Line } from '../domain/types/line';
import { OsmStopCandidateInspector } from './OsmStopCandidateInspector';
import type { InspectorPanelState } from './types';
import type {
  LineFrequencyControlByTimeBand,
  LineFrequencyInputByTimeBand,
  LineFrequencyValidationByTimeBand,
  SelectedLineFrequencyUpdateAction
} from '../session/useNetworkSessionState';
import type { TimeBandId } from '../domain/types/timeBand';
import type { InspectorTabId } from './inspectorTabs';

import { InspectorTabBar } from './InspectorTabBar';
import { InspectorScrollArea } from './InspectorScrollArea';
import { InspectorOverviewTab } from './InspectorOverviewTab';
import { InspectorDemandTab } from './InspectorDemandTab';
import { InspectorServiceTab } from './InspectorServiceTab';
import { InspectorLinesTab } from './InspectorLinesTab';

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
  readonly onDemandGapFocus: (gap: import('../domain/projection/demandGapProjection').DemandGapRankingItem | null) => void;
  readonly focusedDemandGapId: string | null;
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

/**
 * Acts as a coordinator for the inspector panel, managing tab state and delegating
 * rendering to specialized tab components.
 */
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
  onPositionFocus,
  onDemandGapFocus,
  focusedDemandGapId
}: InspectorPanelProps): ReactElement {
  const [activeTabId, setActiveTabId] = useState<InspectorTabId>('overview');
  const globalStateLabel = useMemo(() => resolveGlobalStateLabel(inspectorPanelState), [inspectorPanelState]);

  return (
    <aside 
      className="right-panel" 
      aria-label="Inspector panel" 
      style={{ display: 'flex', flexDirection: 'column', height: '100%' }}
    >
      {inspectorPanelState.mode === 'osm-candidate-selected' ? (
        (() => {
          const candidateGroup = osmStopCandidateGroups.find((g) => g.id === inspectorPanelState.candidateGroupId);
          if (!candidateGroup) return null;

          return (
            <InspectorScrollArea>
              <OsmStopCandidateInspector
                candidateGroup={candidateGroup}
                anchorResolution={selectedOsmCandidateAnchor}
                existingStops={placedStops}
                adoptedCandidateGroupIds={adoptedOsmCandidateGroupIds}
                onAdopt={onOsmCandidateAdopt}
              />
            </InspectorScrollArea>
          );
        })()
      ) : (
        <>
          <InspectorTabBar 
            activeTabId={activeTabId} 
            onTabChange={setActiveTabId} 
          />

          <InspectorScrollArea>
            {activeTabId === 'overview' && (
              <InspectorOverviewTab
                staticNetworkSummaryKpis={staticNetworkSummaryKpis}
                networkServicePlanProjection={networkServicePlanProjection}
                vehicleNetworkProjection={vehicleNetworkProjection}
                globalStateLabel={globalStateLabel}
                placedStops={placedStops}
                completedLines={completedLines}
                onStopSelectionChange={onStopSelectionChange}
                onSelectedLineIdChange={onSelectedLineIdChange}
                onLineRename={onLineRename}
              />
            )}

            {activeTabId === 'demand' && (
              <InspectorDemandTab
                scenarioDemandCaptureProjection={scenarioDemandCaptureProjection}
                servedDemandProjection={servedDemandProjection}
                demandGapRankingProjection={demandGapRankingProjection}
                onPositionFocus={onPositionFocus}
                onDemandGapFocus={onDemandGapFocus}
                focusedDemandGapId={focusedDemandGapId}
              />
            )}

            {activeTabId === 'service' && (
              <InspectorServiceTab
                servicePressureProjection={servicePressureProjection}
              />
            )}

            {activeTabId === 'lines' && (
              <InspectorLinesTab
                inspectorPanelState={inspectorPanelState}
                completedLines={completedLines}
                selectedLineRouteBaseline={selectedLineRouteBaseline}
                placedStops={placedStops}
                activeTimeBandId={activeTimeBandId}
                selectedLineServiceProjection={selectedLineServiceProjection}
                selectedLineServiceInspectorProjection={selectedLineServiceInspectorProjection}
                selectedLinePlanningVehicleProjection={selectedLinePlanningVehicleProjection}
                lineFrequencyInputByTimeBand={lineFrequencyInputByTimeBand}
                lineFrequencyControlByTimeBand={lineFrequencyControlByTimeBand}
                lineFrequencyValidationByTimeBand={lineFrequencyValidationByTimeBand}
                onFrequencyChange={onFrequencyChange}
                onSelectedLineIdChange={onSelectedLineIdChange}
                onStopSelectionChange={onStopSelectionChange}
                onLineSequenceStopFocus={onLineSequenceStopFocus}
                onStopRename={onStopRename}
                onLineRename={onLineRename}
                openDialogIntent={openDialogIntent}
                onOpenDialogIntentConsumed={onOpenDialogIntentConsumed}
                selectedLineDemandContribution={selectedLineDemandContribution}
              />
            )}
          </InspectorScrollArea>
        </>
      )}
    </aside>
  );
}
