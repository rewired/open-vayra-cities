// @vitest-environment jsdom

import { act, type ComponentProps } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { InspectorDemandTab } from './InspectorDemandTab';
import type { DemandGapRankingProjection, DemandGapRankingItem } from '../domain/projection/demandGapProjection';
import type { FocusedDemandGapPlanningProjection } from '../domain/projection/focusedDemandGapPlanningProjection';
import type { DemandGapOdContextProjection } from '../domain/projection/demandGapOdContextProjection';
import type { DemandGapOdCandidateListProjection } from '../domain/projection/demandGapOdCandidateListProjection';
import type { ScenarioDemandCaptureProjection, CapturedEntitySummary } from '../domain/projection/scenarioDemandCaptureProjection';
import type { ServedDemandProjection } from '../domain/projection/servedDemandProjection';
import type { FocusedDemandGapLifecycleProjection } from '../domain/projection/focusedDemandGapLifecycleProjection';
import { type ScenarioDemandProvenanceProjection } from '../domain/projection/scenarioDemandProvenanceProjection';
import { type DemandNodeInspectionProjection } from '../domain/projection/demandNodeInspectionProjection';
import { type SelectedDemandNodeServiceCoverageProjection } from '../domain/projection/selectedDemandNodeServiceCoverageProjection';
import { createLineId } from '../domain/types/line';
import { createStopId } from '../domain/types/stop';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const createEmptyCapturedEntitySummary = (): CapturedEntitySummary => ({
  totalCount: 0,
  capturedCount: 0,
  uncapturedCount: 0,
  totalWeight: 0,
  capturedWeight: 0,
  uncapturedWeight: 0,
  totalActiveWeight: 0,
  capturedActiveWeight: 0,
  uncapturedActiveWeight: 0,
  capturedPercentageByCount: 0,
  capturedPercentageByWeight: 0,
  capturedPercentageByActiveWeight: 0
});

const MOCK_PLANNING_UNAVAILABLE: FocusedDemandGapPlanningProjection = {
  status: 'unavailable',
  focusedGapId: null,
  actionKind: null,
  title: null,
  primaryAction: null,
  supportingContext: null,
  caveat: null,
  evidence: []
};

const MOCK_SCENARIO_PROJECTION: ScenarioDemandCaptureProjection = {
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

const MOCK_SERVED_PROJECTION: ServedDemandProjection = {
  status: 'unavailable',
  activeTimeBandId: 'morning-rush',
  capturedResidentialActiveWeight: 0,
  capturedWorkplaceActiveWeight: 0,
  servedResidentialActiveWeight: 0,
  unservedResidentialActiveWeight: 0,
  reachableWorkplaceActiveWeight: 0,
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

const MOCK_OD_CONTEXT: DemandGapOdContextProjection = {
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

const MOCK_CANDIDATE_LIST: DemandGapOdCandidateListProjection = {
  status: 'unavailable',
  heading: null,
  rows: []
};

const MOCK_LIFECYCLE_ACTIVE: FocusedDemandGapLifecycleProjection = {
  status: 'active',
  focusedGapId: 'gap-123',
  title: null,
  message: null,
  shouldOfferClearFocus: true
};
 
const MOCK_PROVENANCE_READY: ScenarioDemandProvenanceProjection = {
  status: 'ready',
  title: 'Demand model',
  summary: 'This is generated scenario demand.',
  modelCaveat: 'Demand is planning context, not observed flow.',
  stopBoundaryNote: 'Stops do not generate demand.',
  generatorLabel: 'test-gen 1.0.0',
  sourceRows: [
    {
      sourceKindLabel: 'Population grid',
      label: 'Census 2026',
      sourceDateLabel: '2026-01-01',
      datasetYearLabel: '2026',
      licenseHint: 'ODbL',
      attributionHint: 'Test Author'
    }
  ]
};
 
const MOCK_PROVENANCE_UNAVAILABLE: ScenarioDemandProvenanceProjection = {
  status: 'unavailable',
  title: null,
  summary: null,
  modelCaveat: null,
  stopBoundaryNote: null,
  generatorLabel: null,
  sourceRows: []
};
const MOCK_INSPECTION_READY: DemandNodeInspectionProjection = {
  status: 'ready',
  selectedNodeId: 'node-res-1',
  inspectedTimeBandId: 'morning-rush',
  inspectedTimeBandLabel: 'Morning Rush',
  followsSimulationTimeBand: true,
  title: 'Residential demand node',
  summary: 'Residential demand node "node-res-1" with base weight 100.0.',
  problemStatus: 'not-captured',
  primaryAction: 'Place a stop near this residential demand.',
  caveat: 'Context candidates are planning hints from generated scenario demand, not exact passenger flows.',
  evidence: [
    { label: 'Role', value: 'Residential origin' },
    { label: 'Time band', value: 'Morning Rush' },
    { label: 'Active weight', value: '100.0' },
    { label: 'Capture status', value: 'Uncaptured' }
  ],
  contextCandidates: [
    {
      ordinal: 1,
      candidateId: 'node-work-1',
      label: 'node-work-1',
      roleLabel: 'Destination',
      demandClassLabel: 'workplace',
      activeWeightLabel: '150.0',
      distanceLabel: '500m',
      position: { lng: 0.1, lat: 0.1 }
    }
  ],
  selectedNodePosition: { lng: 0, lat: 0 },
  selectedNodeRole: 'origin'
};

const MOCK_INSPECTION_UNAVAILABLE: DemandNodeInspectionProjection = {
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

const MOCK_NETWORK_COVERAGE_NO_SELECTED: SelectedDemandNodeServiceCoverageProjection = {
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

const MOCK_NETWORK_COVERAGE_NO_STOP: SelectedDemandNodeServiceCoverageProjection = {
  ...MOCK_NETWORK_COVERAGE_NO_SELECTED,
  status: 'no-stop-coverage',
  selectedNodeId: 'node-res-1',
  selectedNodeRole: 'origin',
  inspectedTimeBandId: 'morning-rush',
  inspectedTimeBandLabel: 'Morning rush',
  summaryLabel: 'No nearby stop coverage',
  reason: 'No placed stop is within 400m of this selected demand node.'
};

const MOCK_NETWORK_COVERAGE_ACTIVE: SelectedDemandNodeServiceCoverageProjection = {
  ...MOCK_NETWORK_COVERAGE_NO_STOP,
  status: 'served-by-active-line',
  summaryLabel: 'Active structural service available',
  reason: 'At least one completed bus line structurally connects this selected side with a covered context-candidate side and has active service.',
  coveringStops: [
    {
      stopId: createStopId('stop-origin'),
      label: 'Origin Stop',
      distanceMeters: 100,
      distanceLabel: '100m'
    }
  ],
  candidateMatches: [
    {
      candidateId: 'node-work-1',
      label: 'node-work-1',
      distanceLabel: '500m',
      coveringStops: [
        {
          stopId: createStopId('stop-work'),
          label: 'Work Stop',
          distanceMeters: 120,
          distanceLabel: '120m'
        }
      ],
      connectingLineLabels: ['Line 1']
    }
  ],
  connectingLines: [
    {
      lineId: createLineId('line-1'),
      label: 'Line 1',
      topologyLabel: 'Linear',
      servicePatternLabel: 'One-way',
      serviceLabel: '10 min headway',
      selectedSideStopLabels: ['Origin Stop'],
      oppositeSideStopLabels: ['Work Stop']
    }
  ],
  activeLines: [
    {
      lineId: createLineId('line-1'),
      label: 'Line 1',
      topologyLabel: 'Linear',
      servicePatternLabel: 'One-way',
      serviceLabel: '10 min headway',
      selectedSideStopLabels: ['Origin Stop'],
      oppositeSideStopLabels: ['Work Stop']
    }
  ],
  diagnostics: {
    selectedSideCoveringStopCount: 1,
    hiddenSelectedSideCoveringStopCount: 0,
    oppositeCandidateWithStopCoverageCount: 1,
    hiddenOppositeCandidateMatchCount: 0,
    lineWithSelectedSideStopCount: 1,
    structurallyConnectingLineCount: 1,
    hiddenStructurallyConnectingLineCount: 0,
    activeConnectingLineCount: 1,
    hiddenActiveConnectingLineCount: 0
  }
};

interface RenderResult {
  readonly container: HTMLDivElement;
  readonly root: Root;
}

const renderTab = (props: ComponentProps<typeof InspectorDemandTab>): RenderResult => {
  const container = document.createElement('div');
  document.body.appendChild(container);
  const root = createRoot(container);

  act(() => {
    root.render(<InspectorDemandTab {...props} />);
  });

  return { container, root };
};

let mounted: RenderResult | null = null;

afterEach(() => {
  if (!mounted) return;
  act(() => {
    mounted?.root.unmount();
  });
  mounted.container.remove();
  mounted = null;
});

describe('InspectorDemandTab', () => {
  it('renders planning summary when a gap is focused and projection is ready', () => {
    const mockGap: DemandGapRankingItem = {
      id: 'gap-123',
      kind: 'uncaptured-residential',
      position: { lng: 0, lat: 0 },
      activeWeight: 10,
      baseWeight: 10,
      nearestStopDistanceMeters: 500,
      capturingStopCount: 0,
      note: 'Test note'
    };

    const mockRanking: DemandGapRankingProjection = {
      status: 'ready',
      activeTimeBandId: 'morning-rush',
      uncapturedResidentialGaps: [mockGap],
      capturedButUnservedResidentialGaps: [],
      capturedButUnreachableWorkplaceGaps: [],
      summary: { totalGapCount: 1 }
    };

    const mockPlanning: FocusedDemandGapPlanningProjection = {
      status: 'ready',
      focusedGapId: 'gap-123',
      actionKind: 'add-stop-coverage',
      title: 'Coverage gap',
      primaryAction: 'Place a stop within access range of this residential demand.',
      supportingContext: 'Then connect it toward one of the listed workplace candidates.',
      caveat: 'Hints are planning context, not exact passenger flows.',
      evidence: [
        { label: 'Active pressure', value: '10.0' },
        { label: 'Nearest stop', value: '500m' }
      ]
    };

    mounted = renderTab({
      scenarioDemandCaptureProjection: MOCK_SCENARIO_PROJECTION,
      servedDemandProjection: MOCK_SERVED_PROJECTION,
      demandGapRankingProjection: mockRanking,
      demandGapOdContextProjection: MOCK_OD_CONTEXT,
      demandGapOdCandidateListProjection: MOCK_CANDIDATE_LIST,
      focusedDemandGapPlanningProjection: mockPlanning,
      onPositionFocus: vi.fn(),
      onDemandGapFocus: vi.fn(),
      focusedDemandGapId: 'gap-123',
      focusedDemandGapLifecycleProjection: MOCK_LIFECYCLE_ACTIVE,
      scenarioDemandProvenanceProjection: MOCK_PROVENANCE_UNAVAILABLE,
      demandNodeInspectionProjection: MOCK_INSPECTION_UNAVAILABLE,
      selectedDemandNodeServiceCoverageProjection: MOCK_NETWORK_COVERAGE_NO_SELECTED,
      onDemandNodeSelectionChange: vi.fn(),
      onInspectDemandTimeBandSelectionChange: vi.fn(),
      inspectDemandTimeBandSelection: 'follow-simulation',
      onPlanningEntrypoint: vi.fn()
    });

    const textContent = mounted.container.textContent;
    expect(textContent).toContain('Coverage gap');
    expect(textContent).toContain('Place a stop within access range of this residential demand.');
    expect(textContent).toContain('Hints are planning context, not exact passenger flows.');
    expect(textContent).toContain('Nearest stop');
    expect(textContent).toContain('500m');
  });

  it('calls onDemandGapFocus(null) when Clear focus is clicked', () => {
    const mockGap: DemandGapRankingItem = {
      id: 'gap-123',
      kind: 'uncaptured-residential',
      position: { lng: 0, lat: 0 },
      activeWeight: 10,
      baseWeight: 10,
      nearestStopDistanceMeters: 500,
      capturingStopCount: 0,
      note: 'Test note'
    };

    const mockRanking: DemandGapRankingProjection = {
      status: 'ready',
      activeTimeBandId: 'morning-rush',
      uncapturedResidentialGaps: [mockGap],
      capturedButUnservedResidentialGaps: [],
      capturedButUnreachableWorkplaceGaps: [],
      summary: { totalGapCount: 1 }
    };

    const mockPlanning: FocusedDemandGapPlanningProjection = {
      status: 'ready',
      focusedGapId: 'gap-123',
      actionKind: 'add-stop-coverage',
      title: 'Coverage gap',
      primaryAction: 'Primary action text',
      supportingContext: 'Supporting text',
      caveat: 'Caveat text',
      evidence: []
    };

    const onDemandGapFocus = vi.fn();

    mounted = renderTab({
      scenarioDemandCaptureProjection: MOCK_SCENARIO_PROJECTION,
      servedDemandProjection: MOCK_SERVED_PROJECTION,
      demandGapRankingProjection: mockRanking,
      demandGapOdContextProjection: MOCK_OD_CONTEXT,
      demandGapOdCandidateListProjection: MOCK_CANDIDATE_LIST,
      focusedDemandGapPlanningProjection: mockPlanning,
      onPositionFocus: vi.fn(),
      onDemandGapFocus,
      focusedDemandGapId: 'gap-123',
      focusedDemandGapLifecycleProjection: MOCK_LIFECYCLE_ACTIVE,
      scenarioDemandProvenanceProjection: MOCK_PROVENANCE_UNAVAILABLE,
      demandNodeInspectionProjection: MOCK_INSPECTION_UNAVAILABLE,
      selectedDemandNodeServiceCoverageProjection: MOCK_NETWORK_COVERAGE_NO_SELECTED,
      onDemandNodeSelectionChange: vi.fn(),
      onInspectDemandTimeBandSelectionChange: vi.fn(),
      inspectDemandTimeBandSelection: 'follow-simulation',
      onPlanningEntrypoint: vi.fn()
    });

    const clearButtons = Array.from(mounted.container.querySelectorAll('button')).filter(b => b.textContent === 'Clear focus');
    expect(clearButtons.length).toBe(1);

    act(() => {
      clearButtons[0]?.click();
    });

    expect(onDemandGapFocus).toHaveBeenCalledWith(null);
  });

  it('renders readable candidates and handles focus action', () => {
    const mockGap: DemandGapRankingItem = {
      id: 'gap-123',
      kind: 'uncaptured-residential',
      position: { lng: 0, lat: 0 },
      activeWeight: 10,
      baseWeight: 10,
      nearestStopDistanceMeters: 500,
      capturingStopCount: 0,
      note: 'Test note'
    };

    const mockRanking: DemandGapRankingProjection = {
      status: 'ready',
      activeTimeBandId: 'morning-rush',
      uncapturedResidentialGaps: [mockGap],
      capturedButUnservedResidentialGaps: [],
      capturedButUnreachableWorkplaceGaps: [],
      summary: { totalGapCount: 1 }
    };

    const mockCandidateList: DemandGapOdCandidateListProjection = {
      status: 'ready',
      heading: 'Likely workplace candidates',
      rows: [
        {
          ordinal: 1,
          candidateId: 'cand-456',
          roleLabel: 'destination',
          demandClassLabel: 'workplace',
          displayLabel: '#1 Workplace candidate',
          activeWeightLabel: '15.5',
          distanceLabel: '800m',
          position: { lng: 1, lat: 1 }
        }
      ]
    };

    const onPositionFocus = vi.fn();

    mounted = renderTab({
      scenarioDemandCaptureProjection: MOCK_SCENARIO_PROJECTION,
      servedDemandProjection: MOCK_SERVED_PROJECTION,
      demandGapRankingProjection: mockRanking,
      demandGapOdContextProjection: MOCK_OD_CONTEXT,
      demandGapOdCandidateListProjection: mockCandidateList,
      focusedDemandGapPlanningProjection: {
        status: 'ready',
        focusedGapId: 'gap-123',
        actionKind: 'add-stop-coverage',
        title: 'Title',
        primaryAction: 'Action',
        supportingContext: 'Context',
        caveat: 'Caveat',
        evidence: []
      },
      onPositionFocus,
      onDemandGapFocus: vi.fn(),
      focusedDemandGapId: 'gap-123',
      focusedDemandGapLifecycleProjection: MOCK_LIFECYCLE_ACTIVE,
      scenarioDemandProvenanceProjection: MOCK_PROVENANCE_UNAVAILABLE,
      demandNodeInspectionProjection: MOCK_INSPECTION_UNAVAILABLE,
      selectedDemandNodeServiceCoverageProjection: MOCK_NETWORK_COVERAGE_NO_SELECTED,
      onDemandNodeSelectionChange: vi.fn(),
      onInspectDemandTimeBandSelectionChange: vi.fn(),
      inspectDemandTimeBandSelection: 'follow-simulation',
      onPlanningEntrypoint: vi.fn()
    });

    const textContent = mounted.container.textContent;
    expect(textContent).toContain('Likely workplace candidates');
    expect(textContent).toContain('#1 Workplace candidate');
    expect(textContent).not.toContain('cand-456');
    expect(textContent).toContain('15.5');
    expect(textContent).toContain('800m');

    const focusButton = Array.from(mounted.container.querySelectorAll('button')).find(b => b.title === 'Focus #1 Workplace candidate on map');
    expect(focusButton).toBeDefined();

    act(() => {
      focusButton?.click();
    });

    expect(onPositionFocus).toHaveBeenCalledWith({ lng: 1, lat: 1 });
  });

  it('renders and handles coverage planning action entrypoint', () => {
    const mockGap: DemandGapRankingItem = {
      id: 'gap-123',
      kind: 'uncaptured-residential',
      position: { lng: 10, lat: 20 },
      activeWeight: 10,
      baseWeight: 10,
      nearestStopDistanceMeters: 500,
      capturingStopCount: 0,
      note: 'Test note'
    };

    const mockRanking: DemandGapRankingProjection = {
      status: 'ready',
      activeTimeBandId: 'morning-rush',
      uncapturedResidentialGaps: [mockGap],
      capturedButUnservedResidentialGaps: [],
      capturedButUnreachableWorkplaceGaps: [],
      summary: { totalGapCount: 1 }
    };

    const mockPlanning: FocusedDemandGapPlanningProjection = {
      status: 'ready',
      focusedGapId: 'gap-123',
      actionKind: 'add-stop-coverage',
      title: 'Coverage gap',
      primaryAction: 'Action',
      supportingContext: 'Context',
      caveat: 'Caveat',
      evidence: []
    };

    const onPlanningEntrypoint = vi.fn();

    mounted = renderTab({
      scenarioDemandCaptureProjection: MOCK_SCENARIO_PROJECTION,
      servedDemandProjection: MOCK_SERVED_PROJECTION,
      demandGapRankingProjection: mockRanking,
      demandGapOdContextProjection: MOCK_OD_CONTEXT,
      demandGapOdCandidateListProjection: MOCK_CANDIDATE_LIST,
      focusedDemandGapPlanningProjection: mockPlanning,
      onPositionFocus: vi.fn(),
      onDemandGapFocus: vi.fn(),
      focusedDemandGapId: 'gap-123',
      focusedDemandGapLifecycleProjection: MOCK_LIFECYCLE_ACTIVE,
      scenarioDemandProvenanceProjection: MOCK_PROVENANCE_UNAVAILABLE,
      demandNodeInspectionProjection: MOCK_INSPECTION_UNAVAILABLE,
      selectedDemandNodeServiceCoverageProjection: MOCK_NETWORK_COVERAGE_NO_SELECTED,
      onDemandNodeSelectionChange: vi.fn(),
      onInspectDemandTimeBandSelectionChange: vi.fn(),
      inspectDemandTimeBandSelection: 'follow-simulation',
      onPlanningEntrypoint
    });

    const textContent = mounted.container.textContent;
    expect(textContent).toContain('Start stop placement');
    
    const actionButton = Array.from(mounted.container.querySelectorAll('button')).find(b => b.textContent?.includes('Start stop placement'));
    expect(actionButton).toBeDefined();

    act(() => {
      actionButton?.click();
    });

    expect(onPlanningEntrypoint).toHaveBeenCalledWith({
      kind: 'start-stop-placement-near-gap',
      position: { lng: 10, lat: 20 }
    });
  });

  it('renders and handles line planning action entrypoint', () => {
    const mockGap: DemandGapRankingItem = {
      id: 'gap-456',
      kind: 'captured-unserved-residential',
      position: { lng: 30, lat: 40 },
      activeWeight: 10,
      baseWeight: 10,
      nearestStopDistanceMeters: 500,
      capturingStopCount: 1,
      note: 'Test note'
    };

    const mockRanking: DemandGapRankingProjection = {
      status: 'ready',
      activeTimeBandId: 'morning-rush',
      uncapturedResidentialGaps: [],
      capturedButUnservedResidentialGaps: [mockGap],
      capturedButUnreachableWorkplaceGaps: [],
      summary: { totalGapCount: 1 }
    };

    const mockPlanning: FocusedDemandGapPlanningProjection = {
      status: 'ready',
      focusedGapId: 'gap-456',
      actionKind: 'connect-origin-to-destination',
      title: 'Unserved',
      primaryAction: 'Action',
      supportingContext: 'Context',
      caveat: 'Caveat',
      evidence: []
    };

    const onPlanningEntrypoint = vi.fn();

    mounted = renderTab({
      scenarioDemandCaptureProjection: MOCK_SCENARIO_PROJECTION,
      servedDemandProjection: MOCK_SERVED_PROJECTION,
      demandGapRankingProjection: mockRanking,
      demandGapOdContextProjection: MOCK_OD_CONTEXT,
      demandGapOdCandidateListProjection: MOCK_CANDIDATE_LIST,
      focusedDemandGapPlanningProjection: mockPlanning,
      onPositionFocus: vi.fn(),
      onDemandGapFocus: vi.fn(),
      focusedDemandGapId: 'gap-456',
      focusedDemandGapLifecycleProjection: { 
        status: 'active', 
        focusedGapId: 'gap-456',
        title: null,
        message: null,
        shouldOfferClearFocus: false
      },
      scenarioDemandProvenanceProjection: MOCK_PROVENANCE_UNAVAILABLE,
      demandNodeInspectionProjection: MOCK_INSPECTION_UNAVAILABLE,
      selectedDemandNodeServiceCoverageProjection: MOCK_NETWORK_COVERAGE_NO_SELECTED,
      onDemandNodeSelectionChange: vi.fn(),
      onInspectDemandTimeBandSelectionChange: vi.fn(),
      inspectDemandTimeBandSelection: 'follow-simulation',
      onPlanningEntrypoint
    });

    const textContent = mounted.container.textContent;
    expect(textContent).toContain('Start line planning');
    
    const actionButton = Array.from(mounted.container.querySelectorAll('button')).find(b => b.textContent?.includes('Start line planning'));
    expect(actionButton).toBeDefined();

    act(() => {
      actionButton?.click();
    });

    expect(onPlanningEntrypoint).toHaveBeenCalledWith({
      kind: 'start-line-planning-near-gap',
      position: { lng: 30, lat: 40 }
    });
  });

  it('renders neutral lifecycle feedback when focused gap is no longer ranked', () => {
    const mockRanking: DemandGapRankingProjection = {
      status: 'ready',
      activeTimeBandId: 'morning-rush',
      uncapturedResidentialGaps: [],
      capturedButUnservedResidentialGaps: [],
      capturedButUnreachableWorkplaceGaps: [],
      summary: { totalGapCount: 0 }
    };

    const mockLifecycle: FocusedDemandGapLifecycleProjection = {
      status: 'not-currently-ranked',
      focusedGapId: 'gap-999',
      title: 'This focused gap no longer appears in current gaps.',
      message: 'It may be resolved, filtered, or below threshold in the current time band.',
      shouldOfferClearFocus: true
    };

    mounted = renderTab({
      scenarioDemandCaptureProjection: MOCK_SCENARIO_PROJECTION,
      servedDemandProjection: MOCK_SERVED_PROJECTION,
      demandGapRankingProjection: mockRanking,
      demandGapOdContextProjection: MOCK_OD_CONTEXT,
      demandGapOdCandidateListProjection: MOCK_CANDIDATE_LIST,
      focusedDemandGapPlanningProjection: MOCK_PLANNING_UNAVAILABLE,
      focusedDemandGapLifecycleProjection: mockLifecycle,
      scenarioDemandProvenanceProjection: MOCK_PROVENANCE_UNAVAILABLE,
      demandNodeInspectionProjection: MOCK_INSPECTION_UNAVAILABLE,
      selectedDemandNodeServiceCoverageProjection: MOCK_NETWORK_COVERAGE_NO_SELECTED,
      onPositionFocus: vi.fn(),
      onDemandGapFocus: vi.fn(),
      focusedDemandGapId: 'gap-999',
      onDemandNodeSelectionChange: vi.fn(),
      onInspectDemandTimeBandSelectionChange: vi.fn(),
      inspectDemandTimeBandSelection: 'follow-simulation',
      onPlanningEntrypoint: vi.fn()
    });

    const textContent = mounted.container.textContent;
    expect(textContent).toContain('This focused gap no longer appears in current gaps.');
    expect(textContent).toContain('It may be resolved, filtered, or below threshold in the current time band.');
    
    // Clear focus should still be available
    const clearButton = Array.from(mounted.container.querySelectorAll('button')).find(b => b.textContent === 'Clear focus');
    expect(clearButton).toBeDefined();
  });

  it('renders demand model provenance when projection is ready', () => {
    mounted = renderTab({
      scenarioDemandCaptureProjection: MOCK_SCENARIO_PROJECTION,
      servedDemandProjection: MOCK_SERVED_PROJECTION,
      demandGapRankingProjection: {
        status: 'ready',
        activeTimeBandId: 'morning-rush',
        uncapturedResidentialGaps: [],
        capturedButUnservedResidentialGaps: [],
        capturedButUnreachableWorkplaceGaps: [],
        summary: { totalGapCount: 0 }
      },
      demandGapOdContextProjection: MOCK_OD_CONTEXT,
      demandGapOdCandidateListProjection: MOCK_CANDIDATE_LIST,
      focusedDemandGapPlanningProjection: MOCK_PLANNING_UNAVAILABLE,
      focusedDemandGapLifecycleProjection: {
        status: 'unfocused',
        focusedGapId: null,
        title: null,
        message: null,
        shouldOfferClearFocus: false
      },
      scenarioDemandProvenanceProjection: MOCK_PROVENANCE_READY,
      demandNodeInspectionProjection: MOCK_INSPECTION_UNAVAILABLE,
      selectedDemandNodeServiceCoverageProjection: MOCK_NETWORK_COVERAGE_NO_SELECTED,
      onPositionFocus: vi.fn(),
      onDemandGapFocus: vi.fn(),
      focusedDemandGapId: null,
      onDemandNodeSelectionChange: vi.fn(),
      onInspectDemandTimeBandSelectionChange: vi.fn(),
      inspectDemandTimeBandSelection: 'follow-simulation',
      onPlanningEntrypoint: vi.fn()
    });

    const textContent = mounted.container.textContent;
    expect(textContent).toContain('Demand model');
    expect(textContent).toContain('This is generated scenario demand.');
    expect(textContent).toContain('Demand is planning context, not observed flow.');
    expect(textContent).toContain('Stops do not generate demand.');
    expect(textContent).toContain('Population grid');
    expect(textContent).toContain('Census 2026');
    expect(textContent).toContain('© Test Author');
    expect(textContent).toContain('Generated by: test-gen 1.0.0');
  });

  it('renders selected demand node section when projection is ready', () => {
    const onInspectDemandTimeBandSelectionChange = vi.fn();
    const onDemandNodeSelectionChange = vi.fn();

    mounted = renderTab({
      scenarioDemandCaptureProjection: MOCK_SCENARIO_PROJECTION,
      servedDemandProjection: MOCK_SERVED_PROJECTION,
      demandGapRankingProjection: {
        status: 'ready',
        activeTimeBandId: 'morning-rush',
        uncapturedResidentialGaps: [],
        capturedButUnservedResidentialGaps: [],
        capturedButUnreachableWorkplaceGaps: [],
        summary: { totalGapCount: 0 }
      },
      demandGapOdContextProjection: MOCK_OD_CONTEXT,
      demandGapOdCandidateListProjection: MOCK_CANDIDATE_LIST,
      focusedDemandGapPlanningProjection: MOCK_PLANNING_UNAVAILABLE,
      focusedDemandGapLifecycleProjection: {
        status: 'unfocused',
        focusedGapId: null,
        title: null,
        message: null,
        shouldOfferClearFocus: false
      },
      scenarioDemandProvenanceProjection: MOCK_PROVENANCE_UNAVAILABLE,
      demandNodeInspectionProjection: MOCK_INSPECTION_READY,
      selectedDemandNodeServiceCoverageProjection: MOCK_NETWORK_COVERAGE_NO_STOP,
      onPositionFocus: vi.fn(),
      onDemandGapFocus: vi.fn(),
      focusedDemandGapId: null,
      onDemandNodeSelectionChange,
      onInspectDemandTimeBandSelectionChange,
      inspectDemandTimeBandSelection: 'follow-simulation',
      onPlanningEntrypoint: vi.fn()
    });

    const textContent = mounted.container.textContent;
    expect(textContent).toContain('Residential demand node');
    expect(textContent).toContain('Residential demand node "node-res-1" with base weight 100.0.');
    expect(textContent).toContain('Place a stop near this residential demand.');
    expect(textContent).toContain('100.0');
    expect(textContent).toContain('Uncaptured');
    expect(textContent).toContain('node-work-1');
    expect(textContent).toContain('150.0 weight');
    expect(textContent).toContain('Network coverage');
    expect(textContent).toContain('No nearby stop coverage');

    const clearButton = mounted.container.querySelector('#inspector-demand-clear-node-selection');
    if (!(clearButton instanceof HTMLButtonElement)) {
      throw new Error('Expected selected demand node clear button.');
    }
    act(() => {
      clearButton.click();
    });
    expect(onDemandNodeSelectionChange).toHaveBeenCalledWith(null);

    const select = mounted.container.querySelector('#inspector-demand-timeband-select');
    if (!(select instanceof HTMLSelectElement)) {
      throw new Error('Expected selected demand node time-band select.');
    }
    expect(select.value).toBe('follow-simulation');

    act(() => {
      select.value = 'morning-rush';
      select.dispatchEvent(new Event('change', { bubbles: true }));
    });
    expect(onInspectDemandTimeBandSelectionChange).toHaveBeenCalledWith('morning-rush');
  });

  it('renders active selected demand node network coverage without exact travel claims', () => {
    mounted = renderTab({
      scenarioDemandCaptureProjection: MOCK_SCENARIO_PROJECTION,
      servedDemandProjection: MOCK_SERVED_PROJECTION,
      demandGapRankingProjection: {
        status: 'ready',
        activeTimeBandId: 'morning-rush',
        uncapturedResidentialGaps: [],
        capturedButUnservedResidentialGaps: [],
        capturedButUnreachableWorkplaceGaps: [],
        summary: { totalGapCount: 0 }
      },
      demandGapOdContextProjection: MOCK_OD_CONTEXT,
      demandGapOdCandidateListProjection: MOCK_CANDIDATE_LIST,
      focusedDemandGapPlanningProjection: MOCK_PLANNING_UNAVAILABLE,
      focusedDemandGapLifecycleProjection: {
        status: 'unfocused',
        focusedGapId: null,
        title: null,
        message: null,
        shouldOfferClearFocus: false
      },
      scenarioDemandProvenanceProjection: MOCK_PROVENANCE_UNAVAILABLE,
      demandNodeInspectionProjection: MOCK_INSPECTION_READY,
      selectedDemandNodeServiceCoverageProjection: MOCK_NETWORK_COVERAGE_ACTIVE,
      onPositionFocus: vi.fn(),
      onDemandGapFocus: vi.fn(),
      focusedDemandGapId: null,
      onDemandNodeSelectionChange: vi.fn(),
      onInspectDemandTimeBandSelectionChange: vi.fn(),
      inspectDemandTimeBandSelection: 'follow-simulation',
      onPlanningEntrypoint: vi.fn()
    });

    const textContent = mounted.container.textContent ?? '';
    expect(textContent).toContain('Network coverage');
    expect(textContent).toContain('Active structural service available');
    expect(textContent).toContain('Origin Stop');
    expect(textContent).toContain('Line 1');
    expect(textContent).toContain('10 min headway');
    expect(textContent).toContain('This is a planning projection, not observed travel behavior.');
    expect(textContent).not.toContain('passengers flow');
    expect(textContent).not.toContain('OD route');
    expect(textContent).not.toContain('served trips');
  });

  it('renders selected demand node network coverage unavailable state without crashing', () => {
    mounted = renderTab({
      scenarioDemandCaptureProjection: MOCK_SCENARIO_PROJECTION,
      servedDemandProjection: MOCK_SERVED_PROJECTION,
      demandGapRankingProjection: {
        status: 'ready',
        activeTimeBandId: 'morning-rush',
        uncapturedResidentialGaps: [],
        capturedButUnservedResidentialGaps: [],
        capturedButUnreachableWorkplaceGaps: [],
        summary: { totalGapCount: 0 }
      },
      demandGapOdContextProjection: MOCK_OD_CONTEXT,
      demandGapOdCandidateListProjection: MOCK_CANDIDATE_LIST,
      focusedDemandGapPlanningProjection: MOCK_PLANNING_UNAVAILABLE,
      focusedDemandGapLifecycleProjection: {
        status: 'unfocused',
        focusedGapId: null,
        title: null,
        message: null,
        shouldOfferClearFocus: false
      },
      scenarioDemandProvenanceProjection: MOCK_PROVENANCE_UNAVAILABLE,
      demandNodeInspectionProjection: MOCK_INSPECTION_READY,
      selectedDemandNodeServiceCoverageProjection: {
        ...MOCK_NETWORK_COVERAGE_NO_SELECTED,
        status: 'unavailable',
        selectedNodeId: 'node-res-1',
        selectedNodeRole: 'origin',
        inspectedTimeBandId: 'morning-rush',
        inspectedTimeBandLabel: 'Morning rush',
        summaryLabel: 'Network coverage unavailable',
        reason: 'Demand node inspection is unavailable for the selected node.'
      },
      onPositionFocus: vi.fn(),
      onDemandGapFocus: vi.fn(),
      focusedDemandGapId: null,
      onDemandNodeSelectionChange: vi.fn(),
      onInspectDemandTimeBandSelectionChange: vi.fn(),
      inspectDemandTimeBandSelection: 'follow-simulation',
      onPlanningEntrypoint: vi.fn()
    });

    const textContent = mounted.container.textContent;
    expect(textContent).toContain('Network coverage');
    expect(textContent).toContain('Network coverage unavailable');
  });
});
