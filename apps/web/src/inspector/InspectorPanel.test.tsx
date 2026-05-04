// @vitest-environment jsdom

import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { InspectorPanel } from './InspectorPanel';
import type { InspectorPanelState } from './types';
import type { TimeBandId } from '../domain/types/timeBand';
import { MVP_TIME_BAND_IDS } from '../domain/constants/timeBands';
import type { StaticNetworkSummaryKpis } from '../domain/projection/useNetworkPlanningProjections';
import type { LineVehicleNetworkProjection } from '../domain/types/lineVehicleProjection';
import type { LineServicePlanProjection } from '../domain/types/lineServicePlanProjection';
import type { ScenarioDemandCaptureProjection, CapturedEntitySummary } from '../domain/projection/scenarioDemandCaptureProjection';
import { createEmptyCapturedEntitySummary } from '../domain/projection/scenarioDemandCaptureProjection';
import type { ServedDemandProjection } from '../domain/projection/servedDemandProjection';
import type { ServicePressureProjection } from '../domain/projection/servicePressureProjection';
import type { DemandGapRankingProjection } from '../domain/projection/demandGapProjection';
import type { DemandGapOdContextProjection } from '../domain/projection/demandGapOdContextProjection';
import type { FocusedDemandGapPlanningProjection } from '../domain/projection/focusedDemandGapPlanningProjection';
import type { LineFrequencyInputByTimeBand, LineFrequencyControlByTimeBand, LineFrequencyValidationByTimeBand, LineFrequencyControlState } from '../session/useNetworkSessionState';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

// Minimal mock data
const mockPanelState: InspectorPanelState = {
  mode: 'empty'
};

const mockKpis: StaticNetworkSummaryKpis = {
  totalStopCount: 10,
  completedLineCount: 5,
  selectedCompletedLine: null
};

const mockVehicleProjection: LineVehicleNetworkProjection = {
  summary: { 
    totalProjectedVehicleCount: 15,
    totalDegradedProjectedVehicleCount: 0,
    linesWithProjectedVehiclesCount: 1,
    activeTimeBandId: 'morning-rush'
  },
  lines: []
};

const mockServicePlanProjection: LineServicePlanProjection = {
  summary: { 
    activeTimeBandId: 'morning-rush', 
    degradedLineCount: 0, 
    blockedLineCount: 0,
    configuredLineCount: 0,
    totalLineCount: 0,
    totalCompletedLineCount: 0,
    availableLineCount: 0,
    unavailableLineCount: 0,
    totalRouteSegmentCount: 0,
    totalRouteTravelMinutes: 0,
    totalTheoreticalDeparturesPerHour: 0
  },
  lines: []
};

const mockDemandCaptureProjection: ScenarioDemandCaptureProjection = { 
  status: 'unavailable',
  accessRadiusMeters: 400,
  stopCount: 0,
  activeTimeBandId: 'morning-rush',
  nodeSummary: createEmptyCapturedEntitySummary(),
  attractorSummary: createEmptyCapturedEntitySummary(),
  gatewaySummary: createEmptyCapturedEntitySummary(),
  residentialSummary: createEmptyCapturedEntitySummary(),
  workplaceSummary: createEmptyCapturedEntitySummary(),
  nearestStopByEntityId: new Map()
};

const mockServedDemandProjection: ServedDemandProjection = { 
  status: 'unavailable',
  activeTimeBandId: 'morning-rush',
  capturedResidentialActiveWeight: 0,
  capturedWorkplaceActiveWeight: 0,
  servedResidentialActiveWeight: 0,
  unservedResidentialActiveWeight: 0,
  reachableWorkplaceActiveWeight: 250,
  activeServiceLineCount: 0,
  inactiveOrNoServiceLineCount: 0,
  blockedLineCount: 0,
  reasons: {
    residentialCapturedButNoReachableWorkplace: 0,
    residentialCapturedButNoActiveService: 0,
    residentialNotCaptured: 0,
    workplaceCapturedButUnreachable: 0
  },
  servedResidentialNodeIds: new Set(),
  reachableWorkplaceNodeIds: new Set()
};

const mockServicePressureProjection: ServicePressureProjection = { 
  activeTimeBandId: 'morning-rush',
  activeDeparturesPerHourEstimate: 0,
  averageHeadwayMinutes: null,
  servicePressureRatio: 0,
  servicePressureStatus: 'none',
  servedResidentialActiveWeight: 0
};

const mockDemandGapRankingProjection: DemandGapRankingProjection = { 
  status: 'unavailable',
  activeTimeBandId: 'morning-rush',
  uncapturedResidentialGaps: [],
  capturedButUnservedResidentialGaps: [],
  capturedButUnreachableWorkplaceGaps: [],
  summary: { totalGapCount: 0 }
};

const mockDemandGapOdContextProjection: DemandGapOdContextProjection = {
  status: 'unavailable',
  activeTimeBandId: 'morning-rush',
  focusedGapId: null,
  focusedGapKind: null,
  problemSide: null,
  focusedPosition: null,
  candidates: [],
  summary: { candidateCount: 0, topActiveWeight: 0 },
  guidance: null
};

const mockFocusedDemandGapPlanningProjection: FocusedDemandGapPlanningProjection = {
  status: 'unavailable',
  focusedGapId: null,
  actionKind: null,
  title: null,
  primaryAction: null,
  supportingContext: null,
  caveat: null,
  evidence: []
};

const mockFocusedDemandGapLifecycleProjection: import('../domain/projection/focusedDemandGapLifecycleProjection').FocusedDemandGapLifecycleProjection = {
  status: 'unfocused',
  focusedGapId: null,
  title: null,
  message: null,
  shouldOfferClearFocus: false
};

const mockDemandGapOdCandidateListProjection: import('../domain/projection/demandGapOdCandidateListProjection').DemandGapOdCandidateListProjection = {
  status: 'unavailable',
  heading: null,
  rows: []
};
 
const mockScenarioDemandProvenanceProjection: import('../domain/projection/scenarioDemandProvenanceProjection').ScenarioDemandProvenanceProjection = {
  status: 'unavailable',
  title: null,
  summary: null,
  modelCaveat: null,
  stopBoundaryNote: null,
  generatorLabel: null,
  sourceRows: []
};
const mockDemandNodeInspectionProjection: import('../domain/projection/demandNodeInspectionProjection').DemandNodeInspectionProjection = {
  status: 'unavailable',
  selectedNodeId: null,
  inspectedTimeBandId: null,
  inspectedTimeBandLabel: null,
  followsSimulationTimeBand: true,
  title: null,
  summary: null,
  problemStatus: null,
  primaryAction: null,
  caveat: null,
  evidence: [],
  contextCandidates: [],
  selectedNodePosition: null,
  selectedNodeRole: null
};

const mockSelectedDemandNodeServiceCoverageProjection: import('../domain/projection/selectedDemandNodeServiceCoverageProjection').SelectedDemandNodeServiceCoverageProjection = {
  status: 'no-selected-node',
  selectedNodeId: null,
  selectedNodeRole: null,
  inspectedTimeBandId: null,
  inspectedTimeBandLabel: null,
  accessRadiusMeters: 400,
  summaryLabel: 'No demand node selected',
  reason: 'Select a demand node on the map to inspect network coverage.',
  coveringStops: [],
  candidateMatches: [],
  connectingLines: [],
  activeLines: [],
  diagnostics: {
    selectedSideCoveringStopCount: 0,
    hiddenSelectedSideCoveringStopCount: 0,
    oppositeCandidateWithStopCoverageCount: 0,
    hiddenOppositeCandidateMatchCount: 0,
    lineWithSelectedSideStopCount: 0,
    structurallyConnectingLineCount: 0,
    hiddenStructurallyConnectingLineCount: 0,
    activeConnectingLineCount: 0,
    hiddenActiveConnectingLineCount: 0
  },
  caveat: 'This is a planning projection, not observed travel behavior.'
};

const mockLineFrequencyInput: LineFrequencyInputByTimeBand = {
  'morning-rush': '',
  'late-morning': '',
  'midday': '',
  'afternoon': '',
  'evening-rush': '',
  'evening': '',
  'night': ''
};

const mockLineFrequencyControl: LineFrequencyControlByTimeBand = {
  'morning-rush': 'no-service',
  'late-morning': 'no-service',
  'midday': 'no-service',
  'afternoon': 'no-service',
  'evening-rush': 'no-service',
  'evening': 'no-service',
  'night': 'no-service'
};

const mockLineFrequencyValidation: LineFrequencyValidationByTimeBand = {
  'morning-rush': null,
  'late-morning': null,
  'midday': null,
  'afternoon': null,
  'evening-rush': null,
  'evening': null,
  'night': null
};

interface RenderResult {
  readonly container: HTMLDivElement;
  readonly root: Root;
}

const renderInspectorPanel = (activeTabId: import('./inspectorTabs').InspectorTabId = 'overview', onTabChange: (id: import('./inspectorTabs').InspectorTabId) => void = vi.fn()): RenderResult => {
  const container = document.createElement('div');
  document.body.appendChild(container);
  const root = createRoot(container);

  act(() => {
    root.render(
      <InspectorPanel
        inspectorPanelState={mockPanelState}
        staticNetworkSummaryKpis={mockKpis}
        placedStops={[]}
        completedLines={[]}
        activeTimeBandId="morning-rush"
        onStopSelectionChange={vi.fn()}
        onSelectedLineIdChange={vi.fn()}
        onLineRename={vi.fn()}
        onStopRename={vi.fn()}
        onLineSequenceStopFocus={vi.fn()}
        onPositionFocus={vi.fn()}
        vehicleNetworkProjection={mockVehicleProjection}
        networkServicePlanProjection={mockServicePlanProjection}
        scenarioDemandCaptureProjection={mockDemandCaptureProjection}
        servedDemandProjection={mockServedDemandProjection}
        servicePressureProjection={mockServicePressureProjection}
        demandGapRankingProjection={mockDemandGapRankingProjection}
        demandGapOdContextProjection={mockDemandGapOdContextProjection}
        demandGapOdCandidateListProjection={mockDemandGapOdCandidateListProjection}
        focusedDemandGapPlanningProjection={mockFocusedDemandGapPlanningProjection}
        focusedDemandGapLifecycleProjection={mockFocusedDemandGapLifecycleProjection}
        scenarioDemandProvenanceProjection={mockScenarioDemandProvenanceProjection}
        demandNodeInspectionProjection={mockDemandNodeInspectionProjection}
        selectedDemandNodeServiceCoverageProjection={mockSelectedDemandNodeServiceCoverageProjection}
        selectedLineRouteBaseline={null}
        selectedLineServiceProjection={null}
        selectedLineServiceInspectorProjection={null}
        selectedLinePlanningVehicleProjection={null}
        lineFrequencyInputByTimeBand={mockLineFrequencyInput}
        lineFrequencyControlByTimeBand={mockLineFrequencyControl}
        lineFrequencyValidationByTimeBand={mockLineFrequencyValidation}
        onFrequencyChange={vi.fn()}
        openDialogIntent={null}
        onOpenDialogIntentConsumed={vi.fn()}
        onOsmCandidateAdopt={vi.fn()}
        osmStopCandidateGroups={[]}
        selectedOsmCandidateAnchor={null}
        adoptedOsmCandidateGroupIds={new Set()}
        selectedLineDemandContribution={null}
        onDemandGapFocus={vi.fn()}
        focusedDemandGapId={null}
        onDemandNodeSelectionChange={vi.fn()}
        onInspectDemandTimeBandSelectionChange={vi.fn()}
        inspectDemandTimeBandSelection="follow-simulation"
        onPlanningEntrypoint={vi.fn()}
        activeTabId={activeTabId}
        onTabChange={onTabChange}
      />
    );
  });

  return { container, root };
};

let mounted: RenderResult | null = null;

afterEach(() => {
  if (!mounted) {
    return;
  }

  act(() => {
    mounted?.root.unmount();
  });
  mounted.container.remove();
  mounted = null;
});

describe('InspectorPanel', () => {
  it('renders with Overview tab by default and switches to other tabs', () => {
    let currentTab: import('./inspectorTabs').InspectorTabId = 'overview';
    const onTabChange = vi.fn((id) => { currentTab = id; rerender(); });
    
    const rerender = () => {
      act(() => {
        mounted?.root.render(
          <InspectorPanel
            inspectorPanelState={mockPanelState}
            staticNetworkSummaryKpis={mockKpis}
            placedStops={[]}
            completedLines={[]}
            activeTimeBandId="morning-rush"
            onStopSelectionChange={vi.fn()}
            onSelectedLineIdChange={vi.fn()}
            onLineRename={vi.fn()}
            onStopRename={vi.fn()}
            onLineSequenceStopFocus={vi.fn()}
            onPositionFocus={vi.fn()}
            vehicleNetworkProjection={mockVehicleProjection}
            networkServicePlanProjection={mockServicePlanProjection}
            scenarioDemandCaptureProjection={mockDemandCaptureProjection}
            servedDemandProjection={mockServedDemandProjection}
            servicePressureProjection={mockServicePressureProjection}
            demandGapRankingProjection={mockDemandGapRankingProjection}
            demandGapOdContextProjection={mockDemandGapOdContextProjection}
            demandGapOdCandidateListProjection={mockDemandGapOdCandidateListProjection}
            focusedDemandGapPlanningProjection={mockFocusedDemandGapPlanningProjection}
            focusedDemandGapLifecycleProjection={mockFocusedDemandGapLifecycleProjection}
            scenarioDemandProvenanceProjection={mockScenarioDemandProvenanceProjection}
            demandNodeInspectionProjection={mockDemandNodeInspectionProjection}
            selectedDemandNodeServiceCoverageProjection={mockSelectedDemandNodeServiceCoverageProjection}
            selectedLineRouteBaseline={null}
            selectedLineServiceProjection={null}
            selectedLineServiceInspectorProjection={null}
            selectedLinePlanningVehicleProjection={null}
            lineFrequencyInputByTimeBand={mockLineFrequencyInput}
            lineFrequencyControlByTimeBand={mockLineFrequencyControl}
            lineFrequencyValidationByTimeBand={mockLineFrequencyValidation}
            onFrequencyChange={vi.fn()}
            openDialogIntent={null}
            onOpenDialogIntentConsumed={vi.fn()}
            onOsmCandidateAdopt={vi.fn()}
            osmStopCandidateGroups={[]}
            selectedOsmCandidateAnchor={null}
            adoptedOsmCandidateGroupIds={new Set()}
            selectedLineDemandContribution={null}
            onDemandGapFocus={vi.fn()}
            focusedDemandGapId={null}
            onDemandNodeSelectionChange={vi.fn()}
            onInspectDemandTimeBandSelectionChange={vi.fn()}
            inspectDemandTimeBandSelection="follow-simulation"
            onPlanningEntrypoint={vi.fn()}
            activeTabId={currentTab}
            onTabChange={onTabChange}
          />
        );
      });
    };

    mounted = renderInspectorPanel(currentTab, onTabChange);

    // Should show Overview content by default
    const overviewTab = mounted.container.querySelector('button[aria-label="Overview"]');
    expect(overviewTab).not.toBeNull();
    expect(overviewTab?.getAttribute('aria-selected')).toBe('true');
    expect(mounted.container.textContent).toContain('Projected vehicles');

    // Click Demand tab
    const demandTab = mounted.container.querySelector('button[aria-label="Demand"]');
    expect(demandTab).not.toBeNull();
    act(() => {
      (demandTab as HTMLElement).click();
    });
    expect(onTabChange).toHaveBeenCalledWith('demand');
    expect(demandTab?.getAttribute('aria-selected')).toBe('true');
    expect(overviewTab?.getAttribute('aria-selected')).toBe('false');
    expect(mounted.container.textContent).toContain('Demand capture');

    // Click Service tab
    const serviceTab = mounted.container.querySelector('button[aria-label="Service"]');
    expect(serviceTab).not.toBeNull();
    act(() => {
      (serviceTab as HTMLElement).click();
    });
    expect(onTabChange).toHaveBeenCalledWith('service');
    expect(serviceTab?.getAttribute('aria-selected')).toBe('true');
    expect(mounted.container.textContent).toContain('Service pressure');
    
    // Click Lines tab
    const linesTab = mounted.container.querySelector('button[aria-label="Lines"]');
    expect(linesTab).not.toBeNull();
    act(() => {
      (linesTab as HTMLElement).click();
    });
    expect(onTabChange).toHaveBeenCalledWith('lines');
    expect(linesTab?.getAttribute('aria-selected')).toBe('true');
    expect(mounted.container.textContent).toContain('Lines');
  });
});
