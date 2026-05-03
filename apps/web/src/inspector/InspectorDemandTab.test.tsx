// @vitest-environment jsdom

import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { InspectorDemandTab } from './InspectorDemandTab';
import type { DemandGapRankingProjection, DemandGapRankingItem } from '../domain/projection/demandGapProjection';
import type { FocusedDemandGapPlanningProjection } from '../domain/projection/focusedDemandGapPlanningProjection';
import type { DemandGapOdContextProjection } from '../domain/projection/demandGapOdContextProjection';
import type { ScenarioDemandCaptureProjection, CapturedEntitySummary } from '../domain/projection/scenarioDemandCaptureProjection';
import type { ServedDemandProjection } from '../domain/projection/servedDemandProjection';

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

interface RenderResult {
  readonly container: HTMLDivElement;
  readonly root: Root;
}

const renderTab = (props: React.ComponentProps<typeof InspectorDemandTab>): RenderResult => {
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
      focusedDemandGapPlanningProjection: mockPlanning,
      onPositionFocus: vi.fn(),
      onDemandGapFocus: vi.fn(),
      focusedDemandGapId: 'gap-123'
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
      focusedDemandGapPlanningProjection: mockPlanning,
      onPositionFocus: vi.fn(),
      onDemandGapFocus,
      focusedDemandGapId: 'gap-123'
    });

    const clearButtons = Array.from(mounted.container.querySelectorAll('button')).filter(b => b.textContent === 'Clear focus');
    expect(clearButtons.length).toBe(1);

    act(() => {
      clearButtons[0]?.click();
    });

    expect(onDemandGapFocus).toHaveBeenCalledWith(null);
  });
});
