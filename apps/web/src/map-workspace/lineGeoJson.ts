import type { Line } from '../domain/types/line';
import type { RouteGeometryCoordinate } from '../domain/types/lineRoute';
import type { Stop, StopId } from '../domain/types/stop';
import type { MapLibreGeoJsonFeatureCollection } from './maplibreGlobal';

/**
 * Public completed-line feature property contract projected into MapLibre GeoJSON sources.
 */
export interface CompletedLineFeatureProperties {
  readonly lineId: Line['id'];
  readonly travelDirection: 'forward' | 'reverse';
  readonly selected: boolean;
}

/**
 * Public draft-line feature property contract projected into MapLibre GeoJSON sources.
 */
export interface DraftLineFeatureProperties {
  readonly draft: true;
}

const areCoordinatesEqual = (
  left: RouteGeometryCoordinate,
  right: RouteGeometryCoordinate
): boolean => left[0] === right[0] && left[1] === right[1];

const buildLineCoordinatesFromRouteSegments = (segments: readonly LineRouteSegment[]): readonly RouteGeometryCoordinate[] =>
  segments.reduce<readonly RouteGeometryCoordinate[]>((flattenedCoordinates, segment) => {
    if (segment.orderedGeometry.length === 0) {
      return flattenedCoordinates;
    }

    if (flattenedCoordinates.length === 0) {
      return [...flattenedCoordinates, ...segment.orderedGeometry];
    }

    const lastCoordinate = flattenedCoordinates[flattenedCoordinates.length - 1];
    const firstCoordinate = segment.orderedGeometry[0];

    if (lastCoordinate === undefined || firstCoordinate === undefined) {
      return [...flattenedCoordinates, ...segment.orderedGeometry];
    }

    const segmentCoordinates = areCoordinatesEqual(lastCoordinate, firstCoordinate)
      ? segment.orderedGeometry.slice(1)
      : segment.orderedGeometry;

    return [...flattenedCoordinates, ...segmentCoordinates];
  }, []);

const buildLineCoordinatesFromStops = ({
  line,
  stopsById,
  reverse = false
}: {
  readonly line: Line;
  readonly stopsById: ReadonlyMap<StopId, Stop>;
  readonly reverse?: boolean;
}): readonly RouteGeometryCoordinate[] => {
  const baseStopIds = reverse ? [...line.stopIds].reverse() : line.stopIds;
  return baseStopIds
    .map((stopId) => stopsById.get(stopId))
    .filter((stop): stop is Stop => stop !== undefined)
    .map((stop) => [stop.position.lng, stop.position.lat] as const);
};

/**
 * Builds a typed GeoJSON feature collection for completed session line paths.
 *
 * Route-segment geometry is preferred and flattened in segment order with shared
 * segment-boundary coordinate de-duplication. Stop-order coordinates remain as
 * a fallback when routed segment geometry is unavailable.
 *
 * For bidirectional lines, separate features are emitted for forward and reverse directions.
 */
export const buildCompletedLineFeatureCollection = ({
  lines,
  stopsById,
  selectedLineId
}: {
  readonly lines: readonly Line[];
  readonly stopsById: ReadonlyMap<StopId, Stop>;
  readonly selectedLineId: Line['id'] | null;
}): MapLibreGeoJsonFeatureCollection<CompletedLineFeatureProperties> => {
  const features: any[] = [];

  for (const line of lines) {
    // 1. Forward direction
    const forwardRouteSegmentCoordinates = buildLineCoordinatesFromRouteSegments(line.routeSegments);
    const forwardCoordinates =
      forwardRouteSegmentCoordinates.length >= 2
        ? forwardRouteSegmentCoordinates
        : buildLineCoordinatesFromStops({ line, stopsById });

    if (forwardCoordinates.length >= 2) {
      features.push({
        type: 'Feature' as const,
        geometry: {
          type: 'LineString' as const,
          coordinates: forwardCoordinates
        },
        properties: {
          lineId: line.id,
          travelDirection: 'forward',
          selected: selectedLineId === line.id
        }
      });
    }

    // 2. Reverse direction (only for bidirectional lines)
    if (line.servicePattern === 'bidirectional') {
      const reverseRouteSegmentCoordinates = buildLineCoordinatesFromRouteSegments(line.reverseRouteSegments ?? []);
      const reverseCoordinates =
        reverseRouteSegmentCoordinates.length >= 2
          ? reverseRouteSegmentCoordinates
          : buildLineCoordinatesFromStops({ line, stopsById, reverse: true });

      if (reverseCoordinates.length >= 2) {
        features.push({
          type: 'Feature' as const,
          geometry: {
            type: 'LineString' as const,
            coordinates: reverseCoordinates
          },
          properties: {
            lineId: line.id,
            travelDirection: 'reverse',
            selected: selectedLineId === line.id
          }
        });
      }
    }
  }

  return {
    type: 'FeatureCollection',
    features
  };
};

/**
 * Builds a typed GeoJSON feature collection for the active draft line stop-order preview.
 */
export const buildDraftLineFeatureCollection = ({
  draftStopIds,
  stopsById
}: {
  readonly draftStopIds: readonly StopId[];
  readonly stopsById: ReadonlyMap<StopId, Stop>;
}): MapLibreGeoJsonFeatureCollection<DraftLineFeatureProperties> => {
  const coordinates = draftStopIds
    .map((stopId) => stopsById.get(stopId))
    .filter((stop): stop is Stop => stop !== undefined)
    .map((stop) => [stop.position.lng, stop.position.lat] as const);

  return {
    type: 'FeatureCollection',
    features:
      coordinates.length < 2
        ? []
        : [
            {
              type: 'Feature',
              geometry: {
                type: 'LineString',
                coordinates
              },
              properties: {
                draft: true
              }
            }
          ]
  };
};
