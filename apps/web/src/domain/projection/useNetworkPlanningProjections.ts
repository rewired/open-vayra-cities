import { MVP_TIME_BAND_IDS } from '../constants/timeBands';
import { projectScenarioDemandCapture, type ScenarioDemandCaptureProjection } from './scenarioDemandCaptureProjection';
import { projectServedDemand, type ServedDemandProjection } from './servedDemandProjection';
import type { ScenarioDemandArtifact } from '../types/scenarioDemand';
import { projectLineDepartureScheduleForLine, projectLineDepartureScheduleNetwork } from './lineDepartureScheduleProjection';
import { projectLineServicePlan, projectLineServicePlanForLine, projectLineSelectedServiceInspector } from './lineServicePlanProjection';
import { projectLineVehicleNetwork } from './lineVehicleProjection';
import { projectLinePlanningVehicles, projectNetworkPlanningVehicles } from './linePlanningVehicleProjection';
import { resolveLineServiceBandHeadwayMinutes, type Line } from '../types/line';
import { projectServicePressure, type ServicePressureProjection } from './servicePressureProjection';
import type { Stop } from '../types/stop';
import type { TimeBandId } from '../types/timeBand';
import type { SimulationMinuteOfDay, SimulationSecondOfDay } from '../types/simulationClock';
import type { LineRouteSegment, RouteStatus } from '../types/lineRoute';
import { projectSelectedLineDemandContribution, type SelectedLineDemandContributionProjection } from './selectedLineDemandContributionProjection';
import { projectDemandGapRanking, type DemandGapRankingProjection } from './demandGapProjection';
import { projectDemandGapOdContext, type DemandGapOdContextProjection } from './demandGapOdContextProjection';
import { projectFocusedDemandGapPlanningSummary, type FocusedDemandGapPlanningProjection } from './focusedDemandGapPlanningProjection';
import { projectDemandGapOdCandidateList, type DemandGapOdCandidateListProjection } from './demandGapOdCandidateListProjection';
import { projectFocusedDemandGapLifecycle, type FocusedDemandGapLifecycleProjection } from './focusedDemandGapLifecycleProjection';
import { projectScenarioDemandProvenance, type ScenarioDemandProvenanceProjection } from './scenarioDemandProvenanceProjection';

const MAX_READINESS_ISSUES_VISIBLE = 5;

interface SelectedLineStructureSummary {
  readonly stopCount: number;
  readonly configuredTimeBandCount: number;
  readonly unconfiguredTimeBandCount: number;
}

/** Structural network summary displayed in the shell inspector independent from dynamic clock state. */
export interface StaticNetworkSummaryKpis {
  readonly totalStopCount: number;
  readonly completedLineCount: number;
  readonly selectedCompletedLine: SelectedLineStructureSummary | null;
}

import { resolveLineRouteBaseline } from './routeBaselineProjection';

/** Aggregate route-baseline metrics projected for selected-line inspector rendering. */
export interface RouteBaselineAggregateMetrics {
  readonly segmentCount: number;
  readonly totalDistanceMeters: number;
  readonly totalInMotionMinutes: number;
  readonly totalDwellMinutes: number;
  readonly totalLineMinutes: number;
  readonly hasFallbackSegments: boolean;
}

/** Label mapping used by route-baseline tables for compact status display in the inspector. */
export const ROUTE_STATUS_LABELS: Readonly<Record<RouteStatus, string>> = {
  'not-routed': 'Not routed',
  routed: 'Routed',
  'fallback-routed': 'Fallback routed',
  'routing-failed': 'Routing failed'
};

import type { StopId } from '../types/stop';

/** Shared projection bundle consumed by shell inspector and workspace map boundaries. */
export interface NetworkPlanningProjections {
  readonly staticNetworkSummaryKpis: StaticNetworkSummaryKpis;
  readonly selectedLineRouteBaseline: import('../types/routeBaseline').LineRouteBaseline | null;
  readonly selectedLineServiceProjection: ReturnType<typeof projectLineServicePlanForLine> | null;
  readonly selectedLineDepartureProjection: ReturnType<typeof projectLineDepartureScheduleForLine> | null;
  readonly networkDepartureScheduleProjection: ReturnType<typeof projectLineDepartureScheduleNetwork>;
  readonly vehicleNetworkProjection: ReturnType<typeof projectLineVehicleNetwork>;
  readonly selectedLineVehicleProjection: ReturnType<typeof projectLineVehicleNetwork>['lines'][number] | null;
  readonly selectedLinePlanningVehicleProjection: ReturnType<typeof projectLinePlanningVehicles> | null;
  readonly networkServicePlanProjection: ReturnType<typeof projectLineServicePlan>;
  readonly selectedLineServiceInspectorProjection: ReturnType<typeof projectLineSelectedServiceInspector> | null;
  readonly scenarioDemandCaptureProjection: ScenarioDemandCaptureProjection;
  readonly servedDemandProjection: ServedDemandProjection;
  readonly servicePressureProjection: ServicePressureProjection;
  readonly selectedLineDemandContribution: SelectedLineDemandContributionProjection | null;
  readonly demandGapRankingProjection: DemandGapRankingProjection;
  readonly demandGapOdContextProjection: DemandGapOdContextProjection;
  readonly demandGapOdCandidateListProjection: DemandGapOdCandidateListProjection;
  readonly focusedDemandGapPlanningProjection: FocusedDemandGapPlanningProjection;
  readonly focusedDemandGapLifecycleProjection: FocusedDemandGapLifecycleProjection;
  readonly scenarioDemandProvenanceProjection: ScenarioDemandProvenanceProjection;
}


const projectStaticNetworkSummaryKpis = (
  totalStopCount: number,
  sessionLines: readonly Line[],
  selectedLine: Line | null
): StaticNetworkSummaryKpis => {
  if (!selectedLine) {
    return {
      totalStopCount,
      completedLineCount: sessionLines.length,
      selectedCompletedLine: null
    };
  }

  const configuredTimeBandCount = MVP_TIME_BAND_IDS.filter((timeBandId) => {
    const frequencyValue = resolveLineServiceBandHeadwayMinutes(selectedLine.frequencyByTimeBand[timeBandId]);
    return frequencyValue !== null;
  }).length;

  return {
    totalStopCount,
    completedLineCount: sessionLines.length,
    selectedCompletedLine: {
      stopCount: selectedLine.stopIds.length,
      configuredTimeBandCount,
      unconfiguredTimeBandCount: MVP_TIME_BAND_IDS.length - configuredTimeBandCount
    }
  };
};



/** Aggregates shell planning projections from canonical domain projection helpers without owning session state. */
export const useNetworkPlanningProjections = (
  sessionLines: readonly Line[],
  sessionStops: readonly Stop[],
  selectedLine: Line | null,
  selectedStopId: StopId | null,
  activeSimulationTimeBandId: TimeBandId,
  currentSimulationMinuteOfDay: SimulationMinuteOfDay,
  currentSimulationSecondOfDay: SimulationSecondOfDay,
  scenarioDemandArtifact: ScenarioDemandArtifact | null,
  focusedDemandGapId: string | null
): NetworkPlanningProjections => {
  const staticNetworkSummaryKpis = projectStaticNetworkSummaryKpis(sessionStops.length, sessionLines, selectedLine);
  const routeBaselinesByLineId = new Map(
    sessionLines.map((line) => [line.id, resolveLineRouteBaseline(line, sessionStops)])
  );
  const selectedLineRouteBaseline = selectedLine ? (routeBaselinesByLineId.get(selectedLine.id) ?? null) : null;
  const networkPlanningVehicleProjections = projectNetworkPlanningVehicles(sessionLines, routeBaselinesByLineId);

  const selectedLineServiceProjection = selectedLine
    ? projectLineServicePlanForLine(selectedLine, sessionStops, activeSimulationTimeBandId)
    : null;
  const selectedLineDepartureProjection = selectedLine
    ? projectLineDepartureScheduleForLine(
        selectedLine,
        sessionStops,
        activeSimulationTimeBandId,
        currentSimulationMinuteOfDay
      )
    : null;
  const networkDepartureScheduleProjection = projectLineDepartureScheduleNetwork(
    sessionLines,
    sessionStops,
    activeSimulationTimeBandId,
    currentSimulationMinuteOfDay
  );
  const vehicleNetworkProjection = projectLineVehicleNetwork(
    sessionLines,
    routeBaselinesByLineId,
    networkPlanningVehicleProjections,
    currentSimulationSecondOfDay,
    activeSimulationTimeBandId
  );
  const selectedLineVehicleProjection = selectedLine
    ? vehicleNetworkProjection.lines.find((lineProjection) => lineProjection.lineId === selectedLine.id) ?? null
    : null;
  const networkServicePlanProjection = projectLineServicePlan(
    sessionLines,
    sessionStops,
    activeSimulationTimeBandId
  );
  const selectedLineServiceInspectorProjection = selectedLineServiceProjection
    ? projectLineSelectedServiceInspector(selectedLineServiceProjection, MAX_READINESS_ISSUES_VISIBLE)
    : null;


  const selectedLinePlanningVehicleProjection = selectedLine
    ? projectLinePlanningVehicles(selectedLine, selectedLineRouteBaseline)
    : null;



  const scenarioDemandCaptureProjection = projectScenarioDemandCapture({
    artifact: scenarioDemandArtifact,
    stops: sessionStops,
    activeTimeBandId: activeSimulationTimeBandId
  });

  const servedDemandProjection = projectServedDemand(
    scenarioDemandArtifact,
    sessionStops,
    sessionLines,
    activeSimulationTimeBandId
  );

  const servicePressureProjection = projectServicePressure(
    servedDemandProjection,
    networkServicePlanProjection
  );

  const selectedLineDemandContribution = projectSelectedLineDemandContribution(
    selectedLine,
    sessionStops,
    scenarioDemandArtifact,
    activeSimulationTimeBandId
  );

  const demandGapRankingProjection = projectDemandGapRanking(
    scenarioDemandArtifact,
    sessionStops,
    sessionLines,
    activeSimulationTimeBandId
  );

  const demandGapOdContextProjection = projectDemandGapOdContext(
    scenarioDemandArtifact,
    demandGapRankingProjection,
    focusedDemandGapId,
    activeSimulationTimeBandId
  );

  const focusedDemandGapPlanningProjection = projectFocusedDemandGapPlanningSummary(
    demandGapRankingProjection,
    demandGapOdContextProjection,
    focusedDemandGapId
  );

  const demandGapOdCandidateListProjection = projectDemandGapOdCandidateList(
    demandGapOdContextProjection
  );

  const focusedDemandGapLifecycleProjection = projectFocusedDemandGapLifecycle(
    focusedDemandGapId,
    demandGapRankingProjection
  );

  const scenarioDemandProvenanceProjection = projectScenarioDemandProvenance(
    scenarioDemandArtifact
  );

  return {
    staticNetworkSummaryKpis,
    selectedLineRouteBaseline,
    selectedLineServiceProjection,
    selectedLineDepartureProjection,
    networkDepartureScheduleProjection,
    vehicleNetworkProjection,
    selectedLineVehicleProjection,
    selectedLinePlanningVehicleProjection,
    networkServicePlanProjection,
    selectedLineServiceInspectorProjection,
    scenarioDemandCaptureProjection,
    servedDemandProjection,
    servicePressureProjection,
    selectedLineDemandContribution,
    demandGapRankingProjection,
    demandGapOdContextProjection,
    demandGapOdCandidateListProjection,
    focusedDemandGapPlanningProjection,
    focusedDemandGapLifecycleProjection,
    scenarioDemandProvenanceProjection
  };
};
