import {
  SCENARIO_DEMAND_STOP_ACCESS_RADIUS_METERS,
  SELECTED_DEMAND_NODE_SERVICE_COVERAGE_MAX_CANDIDATE_MATCHES,
  SELECTED_DEMAND_NODE_SERVICE_COVERAGE_MAX_LINES,
  SELECTED_DEMAND_NODE_SERVICE_COVERAGE_MAX_STOPS
} from '../constants/scenarioDemand';
import { TIME_BAND_DISPLAY_LABELS } from '../constants/timeBands';
import type { Line, LineServicePattern, LineTopology } from '../types/line';
import type { Stop, StopId } from '../types/stop';
import type { TimeBandId } from '../types/timeBand';
import type {
  DemandNodeInspectionContextCandidate,
  DemandNodeInspectionProjection
} from './demandNodeInspectionProjection';
import { calculateGreatCircleDistanceMeters } from '../../lib/geometry';
import { projectLineServicePlanForLine } from './lineServicePlanProjection';

/** Status of selected-demand-node network coverage for the inspected time band. */
export type SelectedDemandNodeServiceCoverageStatus =
  | 'unavailable'
  | 'no-selected-node'
  | 'no-stop-coverage'
  | 'covered-no-line'
  | 'line-no-opposite-context'
  | 'line-no-active-service'
  | 'served-by-active-line';

/** Compact stop row for selected-demand-node coverage display. */
export interface SelectedDemandNodeCoverageStopSummary {
  /** Stable stop id for diagnostics and deterministic rendering keys. */
  readonly stopId: StopId;
  /** Player-facing stop label, falling back to the stop id. */
  readonly label: string;
  /** Canonical stop position used by display-only map projections. */
  readonly position: Stop['position'];
  /** Great-circle distance from the demand node or candidate to the stop. */
  readonly distanceMeters: number;
  /** Compact distance label for inspector rendering. */
  readonly distanceLabel: string;
}

/** Compact opposite-side candidate row with nearby stop and connecting-line context. */
export interface SelectedDemandNodeCoverageCandidateMatchSummary {
  /** Opposite-side context candidate id from the selected demand node inspection projection. */
  readonly candidateId: string;
  /** Player-facing candidate label. */
  readonly label: string;
  /** Candidate distance from the selected demand node, as already projected by inspection. */
  readonly distanceLabel: string;
  /** Nearby placed stops covering this candidate side, capped for display. */
  readonly coveringStops: readonly SelectedDemandNodeCoverageStopSummary[];
  /** Completed lines that structurally connect this candidate side with the selected side. */
  readonly connectingLineLabels: readonly string[];
}

/** Compact line row for selected-demand-node structural coverage display. */
export interface SelectedDemandNodeCoverageLineSummary {
  /** Stable line id for diagnostics and deterministic rendering keys. */
  readonly lineId: Line['id'];
  /** Player-facing line label, falling back to the line id. */
  readonly label: string;
  /** Topology label based on canonical line topology. */
  readonly topologyLabel: string;
  /** Service pattern label based on canonical line service pattern. */
  readonly servicePatternLabel: string;
  /** Current inspected-band service label for this line. */
  readonly serviceLabel: string;
  /** Covering selected-side stop ids participating in the connection. */
  readonly selectedSideStopIds: readonly StopId[];
  /** Covering selected-side stop labels participating in the connection. */
  readonly selectedSideStopLabels: readonly string[];
  /** Covering opposite-side stop ids participating in the connection. */
  readonly oppositeSideStopIds: readonly StopId[];
  /** Covering opposite-side stop labels participating in the connection. */
  readonly oppositeSideStopLabels: readonly string[];
}

/** Diagnostic counters for hidden selected-demand-node coverage details. */
export interface SelectedDemandNodeServiceCoverageDiagnostics {
  /** Total selected-side covering stops before display capping. */
  readonly selectedSideCoveringStopCount: number;
  /** Hidden selected-side covering stops after display capping. */
  readonly hiddenSelectedSideCoveringStopCount: number;
  /** Total opposite-side context candidates with at least one covering stop. */
  readonly oppositeCandidateWithStopCoverageCount: number;
  /** Hidden opposite-side candidate matches after display capping. */
  readonly hiddenOppositeCandidateMatchCount: number;
  /** Total completed lines containing at least one selected-side covering stop. */
  readonly lineWithSelectedSideStopCount: number;
  /** Total completed lines structurally connecting selected and opposite sides. */
  readonly structurallyConnectingLineCount: number;
  /** Hidden structurally connecting lines after display capping. */
  readonly hiddenStructurallyConnectingLineCount: number;
  /** Total structurally connecting lines with active inspected-band service. */
  readonly activeConnectingLineCount: number;
  /** Hidden active connecting lines after display capping. */
  readonly hiddenActiveConnectingLineCount: number;
}

/** Pure input for selected-demand-node network coverage projection. */
export interface SelectedDemandNodeServiceCoverageProjectionInput {
  /** Selected node inspection projection, including selected node position and context candidates. */
  readonly demandNodeInspectionProjection: DemandNodeInspectionProjection;
  /** Current player-placed stops. */
  readonly placedStops: readonly Stop[];
  /** Current completed player-created bus lines. */
  readonly completedLines: readonly Line[];
  /** Optional access radius override; defaults to the canonical scenario demand stop-access radius. */
  readonly accessRadiusMeters?: number;
}

/** Read-only selected-demand-node network coverage projection consumed by the inspector. */
export interface SelectedDemandNodeServiceCoverageProjection {
  /** Projection status for the selected demand node and inspected time band. */
  readonly status: SelectedDemandNodeServiceCoverageStatus;
  /** Selected demand node id, when one is available. */
  readonly selectedNodeId: string | null;
  /** Selected demand node role, when the inspected node is available. */
  readonly selectedNodeRole: DemandNodeInspectionProjection['selectedNodeRole'];
  /** Inspected time band used for service availability checks. */
  readonly inspectedTimeBandId: TimeBandId | null;
  /** Player-facing inspected time-band label. */
  readonly inspectedTimeBandLabel: string | null;
  /** Effective stop-access radius used for coverage checks. */
  readonly accessRadiusMeters: number;
  /** Concise player-facing status label. */
  readonly summaryLabel: string;
  /** Short player-facing reason for the current status. */
  readonly reason: string;
  /** Selected-side placed stops within the access radius, capped for display. */
  readonly coveringStops: readonly SelectedDemandNodeCoverageStopSummary[];
  /** Opposite-side context candidates with placed stop coverage, capped for display. */
  readonly candidateMatches: readonly SelectedDemandNodeCoverageCandidateMatchSummary[];
  /** Structurally connecting lines, capped for display. */
  readonly connectingLines: readonly SelectedDemandNodeCoverageLineSummary[];
  /** Structurally connecting lines with active inspected-band service, capped for display. */
  readonly activeLines: readonly SelectedDemandNodeCoverageLineSummary[];
  /** Deterministic counters for hidden and uncapped details. */
  readonly diagnostics: SelectedDemandNodeServiceCoverageDiagnostics;
  /** Boundary note explaining that this projection is not observed travel behavior. */
  readonly caveat: string;
}

interface StopDistanceSummary {
  readonly stop: Stop;
  readonly distanceMeters: number;
}

interface CandidateStopCoverage {
  readonly candidate: DemandNodeInspectionContextCandidate;
  readonly coveringStops: readonly StopDistanceSummary[];
}

interface StructuralLineMatch {
  readonly line: Line;
  readonly selectedSideStops: readonly StopDistanceSummary[];
  readonly oppositeSideStops: readonly StopDistanceSummary[];
  readonly candidateIds: readonly string[];
  readonly serviceLabel: string;
  readonly hasActiveService: boolean;
}

const COVERAGE_CAVEAT = 'This is a planning projection, not observed travel behavior.';

const createDiagnostics = (
  selectedSideCoveringStopCount: number,
  oppositeCandidateWithStopCoverageCount: number,
  lineWithSelectedSideStopCount: number,
  structurallyConnectingLineCount: number,
  activeConnectingLineCount: number
): SelectedDemandNodeServiceCoverageDiagnostics => ({
  selectedSideCoveringStopCount,
  hiddenSelectedSideCoveringStopCount: Math.max(
    0,
    selectedSideCoveringStopCount - SELECTED_DEMAND_NODE_SERVICE_COVERAGE_MAX_STOPS
  ),
  oppositeCandidateWithStopCoverageCount,
  hiddenOppositeCandidateMatchCount: Math.max(
    0,
    oppositeCandidateWithStopCoverageCount - SELECTED_DEMAND_NODE_SERVICE_COVERAGE_MAX_CANDIDATE_MATCHES
  ),
  lineWithSelectedSideStopCount,
  structurallyConnectingLineCount,
  hiddenStructurallyConnectingLineCount: Math.max(
    0,
    structurallyConnectingLineCount - SELECTED_DEMAND_NODE_SERVICE_COVERAGE_MAX_LINES
  ),
  activeConnectingLineCount,
  hiddenActiveConnectingLineCount: Math.max(
    0,
    activeConnectingLineCount - SELECTED_DEMAND_NODE_SERVICE_COVERAGE_MAX_LINES
  )
});

const createProjection = (
  input: Omit<SelectedDemandNodeServiceCoverageProjection, 'caveat'>
): SelectedDemandNodeServiceCoverageProjection => ({
  ...input,
  caveat: COVERAGE_CAVEAT
});

const createEmptyProjection = (
  status: SelectedDemandNodeServiceCoverageStatus,
  selectedNodeId: string | null,
  selectedNodeRole: DemandNodeInspectionProjection['selectedNodeRole'],
  inspectedTimeBandId: TimeBandId | null,
  accessRadiusMeters: number,
  summaryLabel: string,
  reason: string
): SelectedDemandNodeServiceCoverageProjection =>
  createProjection({
    status,
    selectedNodeId,
    selectedNodeRole,
    inspectedTimeBandId,
    inspectedTimeBandLabel: inspectedTimeBandId === null ? null : TIME_BAND_DISPLAY_LABELS[inspectedTimeBandId],
    accessRadiusMeters,
    summaryLabel,
    reason,
    coveringStops: [],
    candidateMatches: [],
    connectingLines: [],
    activeLines: [],
    diagnostics: createDiagnostics(0, 0, 0, 0, 0)
  });

const formatDistanceLabel = (distanceMeters: number): string =>
  distanceMeters < 1000 ? `${Math.round(distanceMeters)}m` : `${(distanceMeters / 1000).toFixed(1)}km`;

const resolveStopLabel = (stop: Stop): string => stop.label ?? stop.id;

const sortStopDistances = (items: readonly StopDistanceSummary[]): readonly StopDistanceSummary[] =>
  [...items].sort((a, b) => {
    if (a.distanceMeters !== b.distanceMeters) {
      return a.distanceMeters - b.distanceMeters;
    }

    return resolveStopLabel(a.stop).localeCompare(resolveStopLabel(b.stop)) || a.stop.id.localeCompare(b.stop.id);
  });

const toStopSummary = (item: StopDistanceSummary): SelectedDemandNodeCoverageStopSummary => ({
  stopId: item.stop.id,
  label: resolveStopLabel(item.stop),
  position: item.stop.position,
  distanceMeters: item.distanceMeters,
  distanceLabel: formatDistanceLabel(item.distanceMeters)
});

const findCoveringStops = (
  position: { readonly lng: number; readonly lat: number },
  stops: readonly Stop[],
  accessRadiusMeters: number
): readonly StopDistanceSummary[] => {
  const coveringStops: StopDistanceSummary[] = [];

  for (const stop of stops) {
    const distanceMeters = calculateGreatCircleDistanceMeters(
      [position.lng, position.lat],
      [stop.position.lng, stop.position.lat]
    );

    if (distanceMeters <= accessRadiusMeters) {
      coveringStops.push({ stop, distanceMeters });
    }
  }

  return sortStopDistances(coveringStops);
};

const doesLineAllowTravel = (
  line: Pick<Line, 'topology' | 'servicePattern' | 'stopIds'>,
  originStopId: StopId,
  destinationStopId: StopId
): boolean => {
  if (originStopId === destinationStopId) {
    return false;
  }

  const originIndex = line.stopIds.indexOf(originStopId);
  const destinationIndex = line.stopIds.indexOf(destinationStopId);
  if (originIndex < 0 || destinationIndex < 0) {
    return false;
  }

  if (line.topology === 'loop') {
    return line.stopIds.length >= 2;
  }

  if (line.servicePattern === 'bidirectional') {
    return line.stopIds.length >= 2;
  }

  return originIndex < destinationIndex;
};

const topologyLabel = (topology: LineTopology): string => (topology === 'loop' ? 'Loop' : 'Linear');

const servicePatternLabel = (servicePattern: LineServicePattern): string =>
  servicePattern === 'bidirectional' ? 'Bidirectional' : 'One-way';

const toLineSummary = (match: StructuralLineMatch): SelectedDemandNodeCoverageLineSummary => ({
  lineId: match.line.id,
  label: match.line.label,
  topologyLabel: topologyLabel(match.line.topology),
  servicePatternLabel: servicePatternLabel(match.line.servicePattern),
  serviceLabel: match.serviceLabel,
  selectedSideStopIds: sortStopDistances(match.selectedSideStops).map((item) => item.stop.id),
  selectedSideStopLabels: sortStopDistances(match.selectedSideStops).map((item) => resolveStopLabel(item.stop)),
  oppositeSideStopIds: sortStopDistances(match.oppositeSideStops).map((item) => item.stop.id),
  oppositeSideStopLabels: sortStopDistances(match.oppositeSideStops).map((item) => resolveStopLabel(item.stop))
});

const compareLineMatches = (a: StructuralLineMatch, b: StructuralLineMatch): number =>
  a.line.label.localeCompare(b.line.label) || a.line.id.localeCompare(b.line.id);

const createCandidateMatches = (
  candidateCoverages: readonly CandidateStopCoverage[],
  structuralMatches: readonly StructuralLineMatch[]
): readonly SelectedDemandNodeCoverageCandidateMatchSummary[] =>
  candidateCoverages
    .map((candidateCoverage) => {
      const connectingLineLabels = structuralMatches
        .filter((match) => match.candidateIds.includes(candidateCoverage.candidate.candidateId))
        .sort(compareLineMatches)
        .slice(0, SELECTED_DEMAND_NODE_SERVICE_COVERAGE_MAX_LINES)
        .map((match) => match.line.label);

      return {
        candidateId: candidateCoverage.candidate.candidateId,
        label: candidateCoverage.candidate.label,
        distanceLabel: candidateCoverage.candidate.distanceLabel,
        coveringStops: sortStopDistances(candidateCoverage.coveringStops)
          .slice(0, SELECTED_DEMAND_NODE_SERVICE_COVERAGE_MAX_STOPS)
          .map(toStopSummary),
        connectingLineLabels
      };
    })
    .slice(0, SELECTED_DEMAND_NODE_SERVICE_COVERAGE_MAX_CANDIDATE_MATCHES);

const hasActiveLineService = (line: Line, placedStops: readonly Stop[], inspectedTimeBandId: TimeBandId): boolean => {
  const serviceProjection = projectLineServicePlanForLine(line, placedStops, inspectedTimeBandId);
  return (
    serviceProjection.status !== 'blocked' &&
    serviceProjection.activeBandState === 'frequency' &&
    serviceProjection.currentBandHeadwayMinutes !== null
  );
};

const resolveServiceLabel = (line: Line, placedStops: readonly Stop[], inspectedTimeBandId: TimeBandId): string => {
  const serviceProjection = projectLineServicePlanForLine(line, placedStops, inspectedTimeBandId);
  if (serviceProjection.status === 'blocked') {
    return 'Service blocked';
  }

  if (serviceProjection.activeBandState === 'no-service' || serviceProjection.currentBandHeadwayMinutes === null) {
    return 'No service';
  }

  return `${serviceProjection.currentBandHeadwayMinutes} min headway`;
};

const findStructuralLineMatches = (
  completedLines: readonly Line[],
  placedStops: readonly Stop[],
  selectedNodeRole: 'origin' | 'destination',
  selectedSideCoveringStops: readonly StopDistanceSummary[],
  candidateCoverages: readonly CandidateStopCoverage[],
  inspectedTimeBandId: TimeBandId
): {
  readonly lineWithSelectedSideStopCount: number;
  readonly structuralMatches: readonly StructuralLineMatch[];
} => {
  let lineWithSelectedSideStopCount = 0;
  const structuralMatches: StructuralLineMatch[] = [];

  for (const line of completedLines) {
    const selectedLineStops = selectedSideCoveringStops.filter((item) => line.stopIds.includes(item.stop.id));
    if (selectedLineStops.length === 0) {
      continue;
    }

    lineWithSelectedSideStopCount++;

    const oppositeLineStopsById = new Map<StopId, StopDistanceSummary>();
    const candidateIds = new Set<string>();

    for (const candidateCoverage of candidateCoverages) {
      for (const candidateStop of candidateCoverage.coveringStops) {
        if (!line.stopIds.includes(candidateStop.stop.id)) {
          continue;
        }

        const canTravel = selectedNodeRole === 'origin'
          ? selectedLineStops.some((selectedStop) => doesLineAllowTravel(line, selectedStop.stop.id, candidateStop.stop.id))
          : selectedLineStops.some((selectedStop) => doesLineAllowTravel(line, candidateStop.stop.id, selectedStop.stop.id));

        if (canTravel) {
          oppositeLineStopsById.set(candidateStop.stop.id, candidateStop);
          candidateIds.add(candidateCoverage.candidate.candidateId);
        }
      }
    }

    if (oppositeLineStopsById.size === 0) {
      continue;
    }

    structuralMatches.push({
      line,
      selectedSideStops: selectedLineStops,
      oppositeSideStops: sortStopDistances([...oppositeLineStopsById.values()]),
      candidateIds: [...candidateIds].sort((a, b) => a.localeCompare(b)),
      serviceLabel: resolveServiceLabel(line, placedStops, inspectedTimeBandId),
      hasActiveService: hasActiveLineService(line, placedStops, inspectedTimeBandId)
    });
  }

  return {
    lineWithSelectedSideStopCount,
    structuralMatches: structuralMatches.sort(compareLineMatches)
  };
};

const resolveStatusCopy = (
  status: SelectedDemandNodeServiceCoverageStatus,
  accessRadiusMeters: number,
  inspectedTimeBandId: TimeBandId,
  diagnostics: SelectedDemandNodeServiceCoverageDiagnostics
): Pick<SelectedDemandNodeServiceCoverageProjection, 'summaryLabel' | 'reason'> => {
  if (status === 'no-stop-coverage') {
    return {
      summaryLabel: 'No nearby stop coverage',
      reason: `No placed stop is within ${accessRadiusMeters}m of this selected demand node.`
    };
  }

  if (status === 'covered-no-line') {
    return {
      summaryLabel: 'Covered by stops, but no connecting line',
      reason: 'Nearby stops cover this node, but no completed bus line includes a covering stop.'
    };
  }

  if (status === 'line-no-opposite-context') {
    const noCandidateStops = diagnostics.oppositeCandidateWithStopCoverageCount === 0;
    return {
      summaryLabel: 'Line exists, but no opposite-side stop connection',
      reason: noCandidateStops
        ? 'A line includes this side, but no listed opposite-side context candidate has nearby stop coverage.'
        : 'A line includes this side, but line direction or stop order does not connect it to covered opposite-side candidates.'
    };
  }

  if (status === 'line-no-active-service') {
    return {
      summaryLabel: 'Line exists, but no active service in this time band',
      reason: `A completed line structurally connects both sides, but it has no active service in ${TIME_BAND_DISPLAY_LABELS[inspectedTimeBandId]}.`
    };
  }

  if (status === 'served-by-active-line') {
    return {
      summaryLabel: 'Active structural service available',
      reason: 'At least one completed bus line structurally connects this selected side with a covered context-candidate side and has active service.'
    };
  }

  return {
    summaryLabel: 'Network coverage unavailable',
    reason: 'Selected demand node service coverage is unavailable.'
  };
};

/**
 * Projects whether the selected demand node is covered by stops and structurally connected by active bus service.
 *
 * This helper is read-only and does not perform passenger assignment, exact OD matching, route computation,
 * automatic edits, or mutation of simulation/service state.
 */
export function projectSelectedDemandNodeServiceCoverage(
  input: SelectedDemandNodeServiceCoverageProjectionInput
): SelectedDemandNodeServiceCoverageProjection {
  const {
    demandNodeInspectionProjection,
    placedStops,
    completedLines,
    accessRadiusMeters = SCENARIO_DEMAND_STOP_ACCESS_RADIUS_METERS
  } = input;

  if (demandNodeInspectionProjection.status === 'unavailable') {
    if (demandNodeInspectionProjection.selectedNodeId === null) {
      return createEmptyProjection(
        'no-selected-node',
        null,
        null,
        demandNodeInspectionProjection.inspectedTimeBandId,
        accessRadiusMeters,
        'No demand node selected',
        'Select a demand node on the map to inspect network coverage.'
      );
    }

    return createEmptyProjection(
      'unavailable',
      demandNodeInspectionProjection.selectedNodeId,
      demandNodeInspectionProjection.selectedNodeRole,
      demandNodeInspectionProjection.inspectedTimeBandId,
      accessRadiusMeters,
      'Network coverage unavailable',
      'Demand node inspection is unavailable for the selected node.'
    );
  }

  const {
    selectedNodeId,
    selectedNodePosition,
    selectedNodeRole,
    inspectedTimeBandId
  } = demandNodeInspectionProjection;

  if (!selectedNodePosition || !inspectedTimeBandId || (selectedNodeRole !== 'origin' && selectedNodeRole !== 'destination')) {
    return createEmptyProjection(
      'unavailable',
      selectedNodeId,
      selectedNodeRole,
      inspectedTimeBandId,
      accessRadiusMeters,
      'Network coverage unavailable',
      'Selected demand node inspection is missing supported role, position, or time-band context.'
    );
  }

  const selectedSideCoveringStops = findCoveringStops(selectedNodePosition, placedStops, accessRadiusMeters);
  if (selectedSideCoveringStops.length === 0) {
    const diagnostics = createDiagnostics(0, 0, 0, 0, 0);
    const statusCopy = resolveStatusCopy('no-stop-coverage', accessRadiusMeters, inspectedTimeBandId, diagnostics);
    return createProjection({
      status: 'no-stop-coverage',
      selectedNodeId,
      selectedNodeRole,
      inspectedTimeBandId,
      inspectedTimeBandLabel: TIME_BAND_DISPLAY_LABELS[inspectedTimeBandId],
      accessRadiusMeters,
      ...statusCopy,
      coveringStops: [],
      candidateMatches: [],
      connectingLines: [],
      activeLines: [],
      diagnostics
    });
  }

  const candidateCoverages: CandidateStopCoverage[] = demandNodeInspectionProjection.contextCandidates
    .map((candidate) => ({
      candidate,
      coveringStops: findCoveringStops(candidate.position, placedStops, accessRadiusMeters)
    }))
    .filter((candidateCoverage) => candidateCoverage.coveringStops.length > 0);

  const { lineWithSelectedSideStopCount, structuralMatches } = findStructuralLineMatches(
    completedLines,
    placedStops,
    selectedNodeRole,
    selectedSideCoveringStops,
    candidateCoverages,
    inspectedTimeBandId
  );
  const activeMatches = structuralMatches.filter((match) => match.hasActiveService);

  const diagnostics = createDiagnostics(
    selectedSideCoveringStops.length,
    candidateCoverages.length,
    lineWithSelectedSideStopCount,
    structuralMatches.length,
    activeMatches.length
  );

  let status: SelectedDemandNodeServiceCoverageStatus;
  if (lineWithSelectedSideStopCount === 0) {
    status = 'covered-no-line';
  } else if (structuralMatches.length === 0) {
    status = 'line-no-opposite-context';
  } else if (activeMatches.length === 0) {
    status = 'line-no-active-service';
  } else {
    status = 'served-by-active-line';
  }

  const statusCopy = resolveStatusCopy(status, accessRadiusMeters, inspectedTimeBandId, diagnostics);

  return createProjection({
    status,
    selectedNodeId,
    selectedNodeRole,
    inspectedTimeBandId,
    inspectedTimeBandLabel: TIME_BAND_DISPLAY_LABELS[inspectedTimeBandId],
    accessRadiusMeters,
    ...statusCopy,
    coveringStops: selectedSideCoveringStops
      .slice(0, SELECTED_DEMAND_NODE_SERVICE_COVERAGE_MAX_STOPS)
      .map(toStopSummary),
    candidateMatches: createCandidateMatches(candidateCoverages, structuralMatches),
    connectingLines: structuralMatches
      .slice(0, SELECTED_DEMAND_NODE_SERVICE_COVERAGE_MAX_LINES)
      .map(toLineSummary),
    activeLines: activeMatches
      .slice(0, SELECTED_DEMAND_NODE_SERVICE_COVERAGE_MAX_LINES)
      .map(toLineSummary),
    diagnostics
  });
}
