import { createLineId, createLineFrequencyMinutes, type Line } from '../types/line';
import {
  createLineSegmentId,
  createRouteDistanceMeters,
  createRouteTravelMinutes,
  type LineRouteSegment
} from '../types/lineRoute';
import {
  SELECTED_LINE_EXPORT_SCHEMA_VERSION_V3,
  type SelectedLineExportPayload
} from '../types/selectedLineExport';
import { createStopId, type Stop } from '../types/stop';

/**
 * Structured in-memory session network replacement built from one validated selected-line export payload.
 */
export interface SelectedLineExportSessionLoad {
  /** Reconstructed placed stop list for current in-memory session state. */
  readonly placedStops: readonly Stop[];
  /** Reconstructed completed line list; always exactly one line for this payload kind. */
  readonly sessionLines: readonly [Line];
  /** Canonical selected line id to set after a successful load. */
  readonly selectedLineId: Line['id'];
}

/**
 * Typed conversion failure returned when a validated payload cannot be mapped into canonical session state.
 */
export interface SelectedLineExportSessionLoadFailure {
  /** Stable conversion failure code for compact UI and test assertions. */
  readonly code: 'missing-referenced-stop';
  /** Human-readable conversion failure message. */
  readonly message: string;
}

/**
 * Discriminated result for selected-line export payload to in-memory session conversion.
 */
export type SelectedLineExportSessionLoadResult =
  | {
      readonly ok: true;
      readonly session: SelectedLineExportSessionLoad;
    }
  | {
      readonly ok: false;
      readonly issue: SelectedLineExportSessionLoadFailure;
    };

const convertLineRouteSegments = (segments: readonly LineRouteSegment[]): readonly LineRouteSegment[] =>
  segments.map((segment) => ({
    id: createLineSegmentId(segment.id),
    lineId: createLineId(segment.lineId),
    fromStopId: createStopId(segment.fromStopId),
    toStopId: createStopId(segment.toStopId),
    orderedGeometry: segment.orderedGeometry,
    distanceMeters: createRouteDistanceMeters(segment.distanceMeters),
    inMotionTravelMinutes: createRouteTravelMinutes(segment.inMotionTravelMinutes),
    dwellMinutes: createRouteTravelMinutes(segment.dwellMinutes),
    totalTravelMinutes: createRouteTravelMinutes(segment.totalTravelMinutes),
    status: segment.status
  }));

const convertLineServiceByTimeBand = (payload: SelectedLineExportPayload): Line['frequencyByTimeBand'] =>
  Object.fromEntries(
    Object.entries(payload.line.frequencyByTimeBand).map(([timeBandId, servicePlan]) => {
      if (servicePlan.kind === 'no-service') {
        return [timeBandId, { kind: 'no-service' }] as const;
      }

      return [
        timeBandId,
        {
          kind: 'frequency',
          headwayMinutes: createLineFrequencyMinutes(servicePlan.headwayMinutes)
        }
      ] as const;
    })
  ) as Line['frequencyByTimeBand'];

/**
 * Converts one validated selected-line export payload into canonical in-memory session entities.
 */
export const convertSelectedLineExportPayloadToSession = (
  payload: SelectedLineExportPayload
): SelectedLineExportSessionLoadResult => {
  const placedStops: readonly Stop[] = payload.stops.map((stop) => ({
    id: createStopId(stop.id),
    position: {
      lng: stop.position.lng,
      lat: stop.position.lat
    },
    ...(stop.label === undefined ? {} : { label: stop.label })
  }));

  const stopIdsById = new Set(placedStops.map((stop) => stop.id));
  for (const orderedStopId of payload.line.orderedStopIds) {
    if (!stopIdsById.has(createStopId(orderedStopId))) {
      return {
        ok: false,
        issue: {
          code: 'missing-referenced-stop',
          message: `Line references ordered stop id "${orderedStopId}" that is missing from exported stops.`
        }
      };
    }
  }

  let routeSegments: readonly LineRouteSegment[] = [];
  let reverseRouteSegments: readonly LineRouteSegment[] | undefined = undefined;

  if (payload.schemaVersion === SELECTED_LINE_EXPORT_SCHEMA_VERSION_V3) {
    if (payload.line.routeSegments) {
      routeSegments = convertLineRouteSegments(payload.line.routeSegments);
    }
    if (payload.line.reverseRouteSegments) {
      reverseRouteSegments = convertLineRouteSegments(payload.line.reverseRouteSegments);
    }
  }

  const line: Line = {
    id: createLineId(payload.line.id),
    label: payload.line.label,
    stopIds: payload.line.orderedStopIds.map((stopId) => createStopId(stopId)),
    topology: payload.line.topology,
    servicePattern: payload.line.servicePattern,
    frequencyByTimeBand: convertLineServiceByTimeBand(payload),
    routeSegments,
    reverseRouteSegments
  };

  return {
    ok: true,
    session: {
      placedStops,
      sessionLines: [line],
      selectedLineId: line.id
    }
  };
};
