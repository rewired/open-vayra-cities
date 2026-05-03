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
import type { ServedDemandProjection } from '../domain/projection/servedDemandProjection';
import type { ServicePressureProjection } from '../domain/projection/servicePressureProjection';
import type { DemandGapRankingProjection } from '../domain/projection/demandGapProjection';
import type { DemandGapOdContextProjection } from '../domain/projection/demandGapOdContextProjection';
import type { FocusedDemandGapPlanningProjection } from '../domain/projection/focusedDemandGapPlanningProjection';
import type { LineFrequencyInputByTimeBand, LineFrequencyControlByTimeBand, LineFrequencyValidationByTimeBand, LineFrequencyControlState } from '../session/useNetworkSessionState';

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

const renderInspectorPanel = (): RenderResult => {
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
        focusedDemandGapPlanningProjection={mockFocusedDemandGapPlanningProjection}
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
    mounted = renderInspectorPanel();

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
    expect(demandTab?.getAttribute('aria-selected')).toBe('true');
    expect(overviewTab?.getAttribute('aria-selected')).toBe('false');
    expect(mounted.container.textContent).toContain('Demand capture');

    // Click Service tab
    const serviceTab = mounted.container.querySelector('button[aria-label="Service"]');
    expect(serviceTab).not.toBeNull();
    act(() => {
      (serviceTab as HTMLElement).click();
    });
    expect(serviceTab?.getAttribute('aria-selected')).toBe('true');
    expect(mounted.container.textContent).toContain('Service pressure');
    
    // Click Lines tab
    const linesTab = mounted.container.querySelector('button[aria-label="Lines"]');
    expect(linesTab).not.toBeNull();
    act(() => {
      (linesTab as HTMLElement).click();
    });
    expect(linesTab?.getAttribute('aria-selected')).toBe('true');
    expect(mounted.container.textContent).toContain('Lines');
  });
});
