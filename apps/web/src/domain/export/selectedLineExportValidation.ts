import {
  SELECTED_LINE_EXPORT_ENDPOINT_COORDINATE_TOLERANCE_DEGREES,
  SELECTED_LINE_EXPORT_TRAVEL_MINUTES_TOLERANCE
} from '../constants/selectedLineExportValidation';
import { MVP_TIME_BAND_IDS } from '../constants/timeBands';
import { ROUTE_STATUSES } from '../types/lineRoute';
import {
  SELECTED_LINE_EXPORT_KIND,
  SELECTED_LINE_EXPORT_SCHEMA_VERSION,
  type SelectedLineExportPayload
} from '../types/selectedLineExport';
import type { TimeBandId } from '../types/timeBand';

/**
 * Stable machine-readable code describing one selected-line export payload validation failure.
 */
export type SelectedLineExportValidationIssueCode =
  | 'invalid-root'
  | 'missing-required-field'
  | 'invalid-schema-version'
  | 'invalid-export-kind'
  | 'invalid-created-at-iso-utc'
  | 'invalid-source-metadata'
  | 'invalid-source-metadata-source'
  | 'invalid-line'
  | 'invalid-line-id'
  | 'invalid-line-label'
  | 'invalid-line-ordered-stop-ids'
  | 'invalid-line-frequency-map'
  | 'invalid-frequency-time-band-id'
  | 'invalid-frequency-value'
  | 'invalid-route-segments'
  | 'invalid-route-segment-shape'
  | 'invalid-route-segment-id'
  | 'duplicate-route-segment-id'
  | 'invalid-route-segment-line-id'
  | 'invalid-route-segment-stop-reference'
  | 'route-segment-line-id-mismatch'
  | 'route-segment-count-mismatch'
  | 'route-segment-adjacency-mismatch'
  | 'route-segment-endpoint-mismatch'
  | 'route-segment-total-travel-minutes-mismatch'
  | 'invalid-route-status'
  | 'invalid-geometry'
  | 'invalid-geometry-coordinate'
  | 'invalid-stops'
  | 'invalid-stop-shape'
  | 'invalid-stop-id'
  | 'duplicate-stop-id'
  | 'invalid-stop-position'
  | 'stop-reference-mismatch'
  | 'invalid-metadata'
  | 'invalid-metadata-counts'
  | 'invalid-metadata-included-time-band-ids'
  | 'metadata-included-time-band-order-mismatch';

/**
 * One typed issue produced while validating a selected-line export payload candidate.
 */
export interface SelectedLineExportValidationIssue {
  /** Machine-readable issue code for branching on failure categories. */
  readonly code: SelectedLineExportValidationIssueCode;
  /** JSON-pointer-like path identifying where the issue was found. */
  readonly path: string;
  /** Human-readable explanation suitable for logs and debugging output. */
  readonly message: string;
}

/**
 * Discriminated result of selected-line export payload validation.
 */
export type SelectedLineExportValidationResult =
  | {
      readonly ok: true;
      readonly payload: SelectedLineExportPayload;
    }
  | {
      readonly ok: false;
      readonly issues: readonly SelectedLineExportValidationIssue[];
    };

const CANONICAL_TIME_BAND_IDS_SET = new Set<string>(MVP_TIME_BAND_IDS);
const ROUTE_STATUS_SET = new Set<string>(ROUTE_STATUSES);

const isRecord = (value: unknown): value is Record<string, unknown> => typeof value === 'object' && value !== null;

const isFiniteNumber = (value: unknown): value is number => typeof value === 'number' && Number.isFinite(value);

const isStopCoordinateInRange = (lng: number, lat: number): boolean =>
  lng >= -180 && lng <= 180 && lat >= -90 && lat <= 90;

const numbersCloseEnough = (left: number, right: number, tolerance: number): boolean =>
  Math.abs(left - right) <= tolerance;

const coordinatesCloseEnough = (
  left: readonly [number, number],
  right: readonly [number, number],
  tolerance: number
): boolean => numbersCloseEnough(left[0], right[0], tolerance) && numbersCloseEnough(left[1], right[1], tolerance);

const parseIsoTimestamp = (value: unknown): value is string => {
  if (typeof value !== 'string') {
    return false;
  }

  const parsed = Date.parse(value);
  return Number.isFinite(parsed);
};

/**
 * Validates unknown JSON payload input against the selected-line export domain contract.
 */
export const validateSelectedLineExportPayload = (payload: unknown): SelectedLineExportValidationResult => {
  const issues: SelectedLineExportValidationIssue[] = [];
  const addIssue = (code: SelectedLineExportValidationIssueCode, path: string, message: string): void => {
    issues.push({ code, path, message });
  };

  if (!isRecord(payload)) {
    addIssue('invalid-root', '$', 'Payload root must be an object.');
    return { ok: false, issues };
  }

  const requiredRootFields = [
    'schemaVersion',
    'exportKind',
    'createdAtIsoUtc',
    'sourceMetadata',
    'line',
    'stops',
    'metadata'
  ] as const;

  for (const fieldName of requiredRootFields) {
    if (!(fieldName in payload)) {
      addIssue('missing-required-field', `$.${fieldName}`, `Missing required root field "${fieldName}".`);
    }
  }

  if (payload.schemaVersion !== SELECTED_LINE_EXPORT_SCHEMA_VERSION) {
    addIssue(
      'invalid-schema-version',
      '$.schemaVersion',
      `schemaVersion must equal ${SELECTED_LINE_EXPORT_SCHEMA_VERSION}.`
    );
  }

  if (payload.exportKind !== SELECTED_LINE_EXPORT_KIND) {
    addIssue('invalid-export-kind', '$.exportKind', `exportKind must equal ${SELECTED_LINE_EXPORT_KIND}.`);
  }

  if (!parseIsoTimestamp(payload.createdAtIsoUtc)) {
    addIssue('invalid-created-at-iso-utc', '$.createdAtIsoUtc', 'createdAtIsoUtc must be a parseable ISO timestamp string.');
  }

  const sourceMetadata = payload.sourceMetadata;
  if (!isRecord(sourceMetadata)) {
    addIssue('invalid-source-metadata', '$.sourceMetadata', 'sourceMetadata must be an object.');
  } else {
    const source = sourceMetadata.source;
    if (typeof source !== 'string' || source.trim().length === 0) {
      addIssue(
        'invalid-source-metadata-source',
        '$.sourceMetadata.source',
        'sourceMetadata.source must be a non-empty string.'
      );
    }
  }

  const stopsById = new Map<string, readonly [number, number]>();
  const stops = payload.stops;
  if (!Array.isArray(stops)) {
    addIssue('invalid-stops', '$.stops', 'stops must be an array.');
  } else {
    for (let stopIndex = 0; stopIndex < stops.length; stopIndex += 1) {
      const stop = stops[stopIndex];
      const stopPath = `$.stops[${stopIndex}]`;

      if (!isRecord(stop)) {
        addIssue('invalid-stop-shape', stopPath, 'Each stop entry must be an object.');
        continue;
      }

      if (typeof stop.id !== 'string' || stop.id.length === 0) {
        addIssue('invalid-stop-id', `${stopPath}.id`, 'stop.id must be a non-empty string.');
      }

      if (!isRecord(stop.position)) {
        addIssue('invalid-stop-position', `${stopPath}.position`, 'stop.position must be an object with lng/lat numbers.');
        continue;
      }

      const lng = stop.position.lng;
      const lat = stop.position.lat;
      if (!isFiniteNumber(lng) || !isFiniteNumber(lat) || !isStopCoordinateInRange(lng, lat)) {
        addIssue(
          'invalid-stop-position',
          `${stopPath}.position`,
          'stop.position.lng/lat must be finite WGS84 coordinates within valid ranges.'
        );
      }

      if (typeof stop.id === 'string' && stop.id.length > 0) {
        if (stopsById.has(stop.id)) {
          addIssue('duplicate-stop-id', `${stopPath}.id`, `Duplicate stop id "${stop.id}".`);
        } else if (isFiniteNumber(lng) && isFiniteNumber(lat) && isStopCoordinateInRange(lng, lat)) {
          stopsById.set(stop.id, [lng, lat]);
        }
      }
    }
  }

  const line = payload.line;
  let orderedStopIds: readonly string[] = [];
  let nonNullTimeBandIds: readonly TimeBandId[] = [];

  if (!isRecord(line)) {
    addIssue('invalid-line', '$.line', 'line must be an object.');
  } else {
    if (typeof line.id !== 'string' || line.id.length === 0) {
      addIssue('invalid-line-id', '$.line.id', 'line.id must be a non-empty string.');
    }

    if (typeof line.label !== 'string' || line.label.length === 0) {
      addIssue('invalid-line-label', '$.line.label', 'line.label must be a non-empty string.');
    }

    if (!Array.isArray(line.orderedStopIds)) {
      addIssue('invalid-line-ordered-stop-ids', '$.line.orderedStopIds', 'line.orderedStopIds must be an array.');
    } else {
      const duplicateOrderedStopIds = new Set<string>();
      orderedStopIds = line.orderedStopIds.filter((stopId, stopIndex) => {
        const stopIdPath = `$.line.orderedStopIds[${stopIndex}]`;
        if (typeof stopId !== 'string' || stopId.length === 0) {
          addIssue('invalid-line-ordered-stop-ids', stopIdPath, 'orderedStopIds entries must be non-empty strings.');
          return false;
        }

        if (duplicateOrderedStopIds.has(stopId)) {
          addIssue('invalid-line-ordered-stop-ids', stopIdPath, `orderedStopIds contains duplicate stop id "${stopId}".`);
          return true;
        }

        duplicateOrderedStopIds.add(stopId);
        return true;
      });
    }

    if (!isRecord(line.frequencyByTimeBand)) {
      addIssue('invalid-line-frequency-map', '$.line.frequencyByTimeBand', 'line.frequencyByTimeBand must be an object.');
    } else {
      const included: TimeBandId[] = [];
      for (const [timeBandId, frequency] of Object.entries(line.frequencyByTimeBand)) {
        if (!CANONICAL_TIME_BAND_IDS_SET.has(timeBandId)) {
          addIssue(
            'invalid-frequency-time-band-id',
            `$.line.frequencyByTimeBand.${timeBandId}`,
            `Unsupported time-band id "${timeBandId}" in frequencyByTimeBand.`
          );
          continue;
        }

        if (frequency !== null && (!isFiniteNumber(frequency) || frequency <= 0)) {
          addIssue(
            'invalid-frequency-value',
            `$.line.frequencyByTimeBand.${timeBandId}`,
            'Frequency values must be null or positive finite numbers.'
          );
        }

        if (isFiniteNumber(frequency) && frequency > 0) {
          included.push(timeBandId as TimeBandId);
        }
      }

      nonNullTimeBandIds = MVP_TIME_BAND_IDS.filter((timeBandId) => included.includes(timeBandId));
    }

    if (!Array.isArray(line.routeSegments)) {
      addIssue('invalid-route-segments', '$.line.routeSegments', 'line.routeSegments must be an array.');
    } else {
      const segmentIds = new Set<string>();
      const stopOrderIndex = new Map<string, number>();
      orderedStopIds.forEach((stopId, index) => stopOrderIndex.set(stopId, index));

      for (let segmentIndex = 0; segmentIndex < line.routeSegments.length; segmentIndex += 1) {
        const segment = line.routeSegments[segmentIndex];
        const segmentPath = `$.line.routeSegments[${segmentIndex}]`;

        if (!isRecord(segment)) {
          addIssue('invalid-route-segment-shape', segmentPath, 'Each route segment must be an object.');
          continue;
        }

        if (typeof segment.id !== 'string' || segment.id.length === 0) {
          addIssue('invalid-route-segment-id', `${segmentPath}.id`, 'route segment id must be a non-empty string.');
        } else if (segmentIds.has(segment.id)) {
          addIssue('duplicate-route-segment-id', `${segmentPath}.id`, `Duplicate route segment id "${segment.id}".`);
        } else {
          segmentIds.add(segment.id);
        }

        if (typeof segment.lineId !== 'string' || segment.lineId.length === 0) {
          addIssue('invalid-route-segment-line-id', `${segmentPath}.lineId`, 'route segment lineId must be a non-empty string.');
        } else if (typeof line.id === 'string' && line.id.length > 0 && segment.lineId !== line.id) {
          addIssue(
            'route-segment-line-id-mismatch',
            `${segmentPath}.lineId`,
            `route segment lineId "${segment.lineId}" does not match line.id "${line.id}".`
          );
        }

        if (typeof segment.fromStopId !== 'string' || segment.fromStopId.length === 0) {
          addIssue('invalid-route-segment-stop-reference', `${segmentPath}.fromStopId`, 'fromStopId must be a non-empty string.');
        }

        if (typeof segment.toStopId !== 'string' || segment.toStopId.length === 0) {
          addIssue('invalid-route-segment-stop-reference', `${segmentPath}.toStopId`, 'toStopId must be a non-empty string.');
        }

        if (typeof segment.fromStopId === 'string' && typeof segment.toStopId === 'string') {
          const fromIndex = stopOrderIndex.get(segment.fromStopId);
          const toIndex = stopOrderIndex.get(segment.toStopId);

          if (fromIndex === undefined || toIndex === undefined) {
            addIssue(
              'route-segment-endpoint-mismatch',
              segmentPath,
              'Route segment endpoints must reference stops from line.orderedStopIds.'
            );
          } else if (toIndex - fromIndex !== 1) {
            addIssue(
              'route-segment-adjacency-mismatch',
              segmentPath,
              'Route segments must connect adjacent stops in orderedStopIds order.'
            );
          }
        }

        const orderedGeometry = segment.orderedGeometry;
        if (!Array.isArray(orderedGeometry) || orderedGeometry.length < 2) {
          addIssue(
            'invalid-geometry',
            `${segmentPath}.orderedGeometry`,
            'orderedGeometry must be an array with at least two [lng, lat] coordinates.'
          );
        } else {
          let geometryCoordinatesAreValid = true;
          for (let coordinateIndex = 0; coordinateIndex < orderedGeometry.length; coordinateIndex += 1) {
            const coordinate = orderedGeometry[coordinateIndex];
            if (!Array.isArray(coordinate) || coordinate.length !== 2) {
              geometryCoordinatesAreValid = false;
              addIssue(
                'invalid-geometry-coordinate',
                `${segmentPath}.orderedGeometry[${coordinateIndex}]`,
                'Each geometry coordinate must be a [lng, lat] tuple.'
              );
              continue;
            }

            const [lng, lat] = coordinate;
            if (!isFiniteNumber(lng) || !isFiniteNumber(lat) || !isStopCoordinateInRange(lng, lat)) {
              geometryCoordinatesAreValid = false;
              addIssue(
                'invalid-geometry-coordinate',
                `${segmentPath}.orderedGeometry[${coordinateIndex}]`,
                'Geometry coordinates must be finite WGS84 lng/lat values.'
              );
            }
          }

          if (
            geometryCoordinatesAreValid &&
            typeof segment.fromStopId === 'string' &&
            typeof segment.toStopId === 'string' &&
            stopsById.has(segment.fromStopId) &&
            stopsById.has(segment.toStopId)
          ) {
            const start = orderedGeometry[0] as readonly [number, number];
            const end = orderedGeometry[orderedGeometry.length - 1] as readonly [number, number];
            const fromStopPosition = stopsById.get(segment.fromStopId);
            const toStopPosition = stopsById.get(segment.toStopId);

            if (fromStopPosition && !coordinatesCloseEnough(start, fromStopPosition, SELECTED_LINE_EXPORT_ENDPOINT_COORDINATE_TOLERANCE_DEGREES)) {
              addIssue(
                'route-segment-endpoint-mismatch',
                `${segmentPath}.orderedGeometry[0]`,
                'First orderedGeometry coordinate must match fromStopId position within tolerance.'
              );
            }

            if (toStopPosition && !coordinatesCloseEnough(end, toStopPosition, SELECTED_LINE_EXPORT_ENDPOINT_COORDINATE_TOLERANCE_DEGREES)) {
              addIssue(
                'route-segment-endpoint-mismatch',
                `${segmentPath}.orderedGeometry[last]`,
                'Last orderedGeometry coordinate must match toStopId position within tolerance.'
              );
            }
          }
        }

        const inMotion = segment.inMotionTravelMinutes;
        const dwell = segment.dwellMinutes;
        const total = segment.totalTravelMinutes;
        if (!isFiniteNumber(inMotion) || inMotion < 0 || !isFiniteNumber(dwell) || dwell < 0 || !isFiniteNumber(total) || total < 0) {
          addIssue(
            'invalid-route-segment-shape',
            segmentPath,
            'Route segment travel-minute fields must be non-negative finite numbers.'
          );
        } else {
          const expectedTotal = inMotion + dwell;
          if (!numbersCloseEnough(total, expectedTotal, SELECTED_LINE_EXPORT_TRAVEL_MINUTES_TOLERANCE)) {
            addIssue(
              'route-segment-total-travel-minutes-mismatch',
              `${segmentPath}.totalTravelMinutes`,
              'totalTravelMinutes must equal inMotionTravelMinutes + dwellMinutes within tolerance.'
            );
          }
        }

        if (!isFiniteNumber(segment.distanceMeters) || segment.distanceMeters < 0) {
          addIssue(
            'invalid-route-segment-shape',
            `${segmentPath}.distanceMeters`,
            'distanceMeters must be a non-negative finite number.'
          );
        }

        if (typeof segment.status !== 'string' || !ROUTE_STATUS_SET.has(segment.status)) {
          addIssue('invalid-route-status', `${segmentPath}.status`, 'status must be a canonical RouteStatus value.');
        }
      }
      const expectedRouteSegmentCount = Math.max(orderedStopIds.length - 1, 0);
      if (line.routeSegments.length !== expectedRouteSegmentCount) {
        addIssue(
          'route-segment-count-mismatch',
          '$.line.routeSegments',
          'line.routeSegments length must equal orderedStopIds.length - 1.'
        );
      }

    }
  }

  if (Array.isArray(orderedStopIds) && orderedStopIds.length > 0) {
    const referencedStopIdSet = new Set(orderedStopIds);
    for (let stopOrderIndex = 0; stopOrderIndex < orderedStopIds.length; stopOrderIndex += 1) {
      const stopId = orderedStopIds[stopOrderIndex];
      if (!stopsById.has(stopId)) {
        addIssue(
          'stop-reference-mismatch',
          `$.line.orderedStopIds[${stopOrderIndex}]`,
          `ordered stop id "${stopId}" is missing from stops array.`
        );
      }
    }

    for (const stopId of stopsById.keys()) {
      if (!referencedStopIdSet.has(stopId)) {
        addIssue('stop-reference-mismatch', '$.stops', `stops contains unreferenced stop id "${stopId}".`);
      }
    }
  }

  const metadata = payload.metadata;
  if (!isRecord(metadata)) {
    addIssue('invalid-metadata', '$.metadata', 'metadata must be an object.');
  } else {
    if (metadata.lineCount !== 1) {
      addIssue('invalid-metadata-counts', '$.metadata.lineCount', 'metadata.lineCount must equal 1.');
    }

    const stopCount = metadata.stopCount;
    if (typeof stopCount !== 'number' || !Number.isInteger(stopCount) || stopCount < 0) {
      addIssue('invalid-metadata-counts', '$.metadata.stopCount', 'metadata.stopCount must be a non-negative integer.');
    } else if (Array.isArray(stops) && stopCount !== stops.length) {
      addIssue('invalid-metadata-counts', '$.metadata.stopCount', 'metadata.stopCount must match stops.length.');
    }

    const routeSegmentCount = metadata.routeSegmentCount;
    if (typeof routeSegmentCount !== 'number' || !Number.isInteger(routeSegmentCount) || routeSegmentCount < 0) {
      addIssue(
        'invalid-metadata-counts',
        '$.metadata.routeSegmentCount',
        'metadata.routeSegmentCount must be a non-negative integer.'
      );
    } else if (isRecord(line) && Array.isArray(line.routeSegments) && routeSegmentCount !== line.routeSegments.length) {
      addIssue(
        'invalid-metadata-counts',
        '$.metadata.routeSegmentCount',
        'metadata.routeSegmentCount must match line.routeSegments.length.'
      );
    }

    if (!Array.isArray(metadata.includedTimeBandIds)) {
      addIssue(
        'invalid-metadata-included-time-band-ids',
        '$.metadata.includedTimeBandIds',
        'metadata.includedTimeBandIds must be an array.'
      );
    } else {
      const includedTimeBandIds = metadata.includedTimeBandIds;
      const invalidTimeBandId = includedTimeBandIds.find(
        (timeBandId): boolean => typeof timeBandId !== 'string' || !CANONICAL_TIME_BAND_IDS_SET.has(timeBandId)
      );

      if (invalidTimeBandId !== undefined) {
        addIssue(
          'invalid-metadata-included-time-band-ids',
          '$.metadata.includedTimeBandIds',
          'includedTimeBandIds must contain only canonical TimeBandId values.'
        );
      }

      if (
        invalidTimeBandId === undefined &&
        includedTimeBandIds.length !== nonNullTimeBandIds.length
      ) {
        addIssue(
          'metadata-included-time-band-order-mismatch',
          '$.metadata.includedTimeBandIds',
          'includedTimeBandIds must list exactly the non-null frequency bands in canonical order.'
        );
      } else if (invalidTimeBandId === undefined) {
        for (let index = 0; index < includedTimeBandIds.length; index += 1) {
          if (includedTimeBandIds[index] !== nonNullTimeBandIds[index]) {
            addIssue(
              'metadata-included-time-band-order-mismatch',
              '$.metadata.includedTimeBandIds',
              'includedTimeBandIds must list exactly the non-null frequency bands in canonical order.'
            );
            break;
          }
        }
      }
    }
  }

  if (issues.length > 0) {
    return {
      ok: false,
      issues
    };
  }

  return {
    ok: true,
    payload: payload as unknown as SelectedLineExportPayload
  };
};
