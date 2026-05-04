import type {
  SelectedDemandNodeCoverageStopSummary,
  SelectedDemandNodeServiceCoverageProjection
} from '../domain/projection/selectedDemandNodeServiceCoverageProjection';
import type { StopId } from '../domain/types/stop';
import type { MapLibreGeoJsonFeatureCollection } from './maplibreGlobal';

/** Map-facing role for a stop highlighted by selected demand node service coverage. */
export type SelectedDemandNodeServiceCoverageStopRole = 'selected-side-stop' | 'opposite-side-stop';

/** Map-facing service context classification for a highlighted coverage stop. */
export type SelectedDemandNodeServiceCoverageStopStatus =
  | 'coverage-only'
  | 'structural-connection'
  | 'active-service';

/** Properties emitted for selected demand node service coverage stop highlight features. */
export interface SelectedDemandNodeServiceCoverageFeatureProperties {
  /** Stable stop id for deterministic feature identity and diagnostics. */
  readonly stopId: StopId;
  /** Player-facing stop label from the service coverage projection. */
  readonly label: string;
  /** Whether this stop covers the selected demand node side or an opposite-side context candidate. */
  readonly role: SelectedDemandNodeServiceCoverageStopRole;
  /** Highest projected service context status involving this stop. */
  readonly coverageStatus: SelectedDemandNodeServiceCoverageStopStatus;
  /** One-based deterministic display ordinal after deduplication. */
  readonly ordinal: number;
}

interface PendingCoverageStopFeature {
  readonly stop: SelectedDemandNodeCoverageStopSummary;
  readonly role: SelectedDemandNodeServiceCoverageStopRole;
  readonly coverageStatus: SelectedDemandNodeServiceCoverageStopStatus;
  readonly firstSeenIndex: number;
}

const STATUS_RANK: Readonly<Record<SelectedDemandNodeServiceCoverageStopStatus, number>> = {
  'coverage-only': 0,
  'structural-connection': 1,
  'active-service': 2
};

const ROLE_RANK: Readonly<Record<SelectedDemandNodeServiceCoverageStopRole, number>> = {
  'selected-side-stop': 0,
  'opposite-side-stop': 1
};

const emptySelectedDemandNodeServiceCoverageFeatureCollection =
  (): MapLibreGeoJsonFeatureCollection<SelectedDemandNodeServiceCoverageFeatureProperties> => ({
    type: 'FeatureCollection',
    features: []
  });

const hasStopId = (stopIds: ReadonlySet<StopId>, stopId: StopId): boolean => stopIds.has(stopId);

const resolveStatusForStop = (
  stopId: StopId,
  structuralStopIds: ReadonlySet<StopId>,
  activeStopIds: ReadonlySet<StopId>
): SelectedDemandNodeServiceCoverageStopStatus => {
  if (hasStopId(activeStopIds, stopId)) {
    return 'active-service';
  }

  if (hasStopId(structuralStopIds, stopId)) {
    return 'structural-connection';
  }

  return 'coverage-only';
};

const preferCoverageFeature = (
  current: PendingCoverageStopFeature,
  next: PendingCoverageStopFeature
): PendingCoverageStopFeature => {
  const currentStatusRank = STATUS_RANK[current.coverageStatus];
  const nextStatusRank = STATUS_RANK[next.coverageStatus];
  const coverageStatus = nextStatusRank > currentStatusRank ? next.coverageStatus : current.coverageStatus;
  const role = ROLE_RANK[next.role] < ROLE_RANK[current.role] ? next.role : current.role;
  const stop = ROLE_RANK[next.role] < ROLE_RANK[current.role] ? next.stop : current.stop;

  return {
    stop,
    role,
    coverageStatus,
    firstSeenIndex: Math.min(current.firstSeenIndex, next.firstSeenIndex)
  };
};

const collectStopIds = (
  projection: SelectedDemandNodeServiceCoverageProjection,
  lineKind: 'connectingLines' | 'activeLines',
  stopKind: 'selectedSideStopIds' | 'oppositeSideStopIds'
): ReadonlySet<StopId> =>
  new Set(projection[lineKind].flatMap((line) => line[stopKind]));

/**
 * Builds deterministic point highlights for stops involved in selected demand node service coverage.
 *
 * The builder consumes Slice 183 projection output only. It does not calculate coverage, compute routes,
 * assign passengers, call routing services, or mutate network/simulation state.
 */
export function buildSelectedDemandNodeServiceCoverageFeatureCollection(
  projection: SelectedDemandNodeServiceCoverageProjection | null
): MapLibreGeoJsonFeatureCollection<SelectedDemandNodeServiceCoverageFeatureProperties> {
  if (
    !projection ||
    projection.status === 'unavailable' ||
    projection.status === 'no-selected-node' ||
    projection.status === 'no-stop-coverage'
  ) {
    return emptySelectedDemandNodeServiceCoverageFeatureCollection();
  }

  const structuralSelectedSideStopIds = collectStopIds(projection, 'connectingLines', 'selectedSideStopIds');
  const structuralOppositeSideStopIds = collectStopIds(projection, 'connectingLines', 'oppositeSideStopIds');
  const activeSelectedSideStopIds = collectStopIds(projection, 'activeLines', 'selectedSideStopIds');
  const activeOppositeSideStopIds = collectStopIds(projection, 'activeLines', 'oppositeSideStopIds');
  const dedupedFeaturesByStopId = new Map<StopId, PendingCoverageStopFeature>();
  let firstSeenIndex = 0;

  const addStop = (
    stop: SelectedDemandNodeCoverageStopSummary,
    role: SelectedDemandNodeServiceCoverageStopRole,
    coverageStatus: SelectedDemandNodeServiceCoverageStopStatus
  ): void => {
    const nextFeature: PendingCoverageStopFeature = {
      stop,
      role,
      coverageStatus,
      firstSeenIndex
    };
    firstSeenIndex += 1;

    const currentFeature = dedupedFeaturesByStopId.get(stop.stopId);
    dedupedFeaturesByStopId.set(
      stop.stopId,
      currentFeature ? preferCoverageFeature(currentFeature, nextFeature) : nextFeature
    );
  };

  for (const stop of projection.coveringStops) {
    addStop(
      stop,
      'selected-side-stop',
      resolveStatusForStop(stop.stopId, structuralSelectedSideStopIds, activeSelectedSideStopIds)
    );
  }

  for (const candidateMatch of projection.candidateMatches) {
    for (const stop of candidateMatch.coveringStops) {
      addStop(
        stop,
        'opposite-side-stop',
        resolveStatusForStop(stop.stopId, structuralOppositeSideStopIds, activeOppositeSideStopIds)
      );
    }
  }

  const dedupedFeatures = [...dedupedFeaturesByStopId.values()].sort((a, b) => {
    if (ROLE_RANK[a.role] !== ROLE_RANK[b.role]) {
      return ROLE_RANK[a.role] - ROLE_RANK[b.role];
    }

    return a.firstSeenIndex - b.firstSeenIndex;
  });

  return {
    type: 'FeatureCollection',
    features: dedupedFeatures.map((item, index) => ({
      type: 'Feature',
      geometry: {
        type: 'Point',
        coordinates: [item.stop.position.lng, item.stop.position.lat]
      },
      properties: {
        stopId: item.stop.stopId,
        label: item.stop.label,
        role: item.role,
        coverageStatus: item.coverageStatus,
        ordinal: index + 1
      }
    }))
  };
}
