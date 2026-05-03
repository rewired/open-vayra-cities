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
import type { ScenarioDemandProvenanceProjection } from '../domain/projection/scenarioDemandProvenanceProjection';

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
  }
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
      onPositionFocus: vi.fn(),
      onDemandGapFocus: vi.fn(),
      focusedDemandGapId: 'gap-999',
      scenarioDemandProvenanceProjection: MOCK_PROVENANCE_UNAVAILABLE,
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
      onPositionFocus: vi.fn(),
      onDemandGapFocus: vi.fn(),
      focusedDemandGapId: null,
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
});
