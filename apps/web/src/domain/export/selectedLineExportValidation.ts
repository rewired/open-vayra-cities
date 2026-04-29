import { MVP_TIME_BAND_IDS } from '../constants/timeBands';
import { NETWORK_SAVE_SCHEMA, NETWORK_SAVE_SCHEMA_VERSION } from '../types/networkSave';
import {
  SELECTED_LINE_EXPORT_KIND,
  SELECTED_LINE_EXPORT_SCHEMA_VERSION_V4,
  type SelectedLineExportCountsMetadata,
  type SelectedLineExportLineV4,
  type SelectedLineExportPayload,
  type SelectedLineExportPayloadV4,
  type SelectedLineExportSourceMetadata,
  type SelectedLineExportStop
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
  | 'invalid-line-topology'
  | 'invalid-line-service-pattern'
  | 'invalid-line-frequency-map'
  | 'invalid-frequency-time-band-id'
  | 'invalid-frequency-value'
  | 'invalid-route-segments'
  | 'invalid-stops'
  | 'invalid-stop-shape'
  | 'invalid-stop-id'
  | 'duplicate-stop-id'
  | 'invalid-stop-position'
  | 'stop-reference-mismatch'
  | 'invalid-metadata'
  | 'invalid-metadata-counts'
  | 'invalid-metadata-included-time-band-ids'
  | 'metadata-included-time-band-order-mismatch'
  | 'unsupported-legacy-v3'
  | 'invalid-envelope'
  | 'invalid-envelope-exported-at'
  | 'invalid-envelope-app'
  | 'invalid-envelope-app-name'
  | 'invalid-envelope-app-build';

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

/** Legacy v3 schema version string for explicit rejection. */
const SELECTED_LINE_EXPORT_SCHEMA_VERSION_V3 = 'openvayra-cities-selected-line-export-v3';

/** Human-readable message for unsupported v3 imports. */
export const UNSUPPORTED_LEGACY_V3_MESSAGE = 'This CityOps save format is no longer supported.';

const isRecord = (value: unknown): value is Record<string, unknown> => typeof value === 'object' && value !== null && !Array.isArray(value);

const isFiniteNumber = (value: unknown): value is number => typeof value === 'number' && Number.isFinite(value);

const isStopCoordinateInRange = (lng: number, lat: number): boolean =>
  lng >= -180 && lng <= 180 && lat >= -90 && lat <= 90;

const parseIsoTimestamp = (value: unknown): value is string => {
  if (typeof value !== 'string') {
    return false;
  }

  const parsed = Date.parse(value);
  return Number.isFinite(parsed);
};

/**
 * Validates unknown JSON payload input against the selected-line export domain contract.
 * Strictly requires a wrapped NetworkSaveEnvelope root.
 * Explicitly rejects raw payloads and legacy v3 payloads.
 */
export const validateSelectedLineExportPayload = (payloadCandidate: unknown): SelectedLineExportValidationResult => {
  const issues: SelectedLineExportValidationIssue[] = [];
  const addIssue = (code: SelectedLineExportValidationIssueCode, path: string, message: string): void => {
    issues.push({ code, path, message });
  };

  if (!isRecord(payloadCandidate)) {
    addIssue('invalid-root', '$', 'Payload root must be an object.');
    return { ok: false, issues };
  }

  // Strictly require NetworkSaveEnvelope
  if (payloadCandidate.schema !== NETWORK_SAVE_SCHEMA) {
    // If it looks like a raw selected-line payload, we can give a more specific message
    const isRawPayload = isRecord(payloadCandidate) && ('schemaVersion' in payloadCandidate || 'exportKind' in payloadCandidate);
    if (isRawPayload && payloadCandidate.schemaVersion === SELECTED_LINE_EXPORT_SCHEMA_VERSION_V3) {
      addIssue('unsupported-legacy-v3', '$.schemaVersion', UNSUPPORTED_LEGACY_V3_MESSAGE);
    } else {
      addIssue('invalid-envelope', '$.schema', `Payload must be wrapped in a "${NETWORK_SAVE_SCHEMA}" envelope.`);
    }
    return { ok: false, issues };
  }

  if (payloadCandidate.schemaVersion !== NETWORK_SAVE_SCHEMA_VERSION) {
    addIssue('invalid-envelope', '$.schemaVersion', `Unsupported envelope version ${payloadCandidate.schemaVersion}.`);
    return { ok: false, issues };
  }

  if (!parseIsoTimestamp(payloadCandidate.exportedAt)) {
    addIssue('invalid-envelope-exported-at', '$.exportedAt', 'exportedAt must be a parseable ISO timestamp string.');
  }

  const app = payloadCandidate.app;
  if (!isRecord(app)) {
    addIssue('invalid-envelope-app', '$.app', 'Envelope app metadata must be an object.');
  } else {
    if (app.name !== 'CityOps') {
      addIssue('invalid-envelope-app-name', '$.app.name', 'app.name must equal "CityOps".');
    }
    if (app.build !== undefined && typeof app.build !== 'string') {
      addIssue('invalid-envelope-app-build', '$.app.build', 'app.build must be a string when present.');
    }
  }

  if (!isRecord(payloadCandidate.payload)) {
    addIssue('invalid-envelope', '$.payload', 'Envelope payload must be an object.');
  }

  if (issues.length > 0) {
    return { ok: false, issues };
  }

  const payload = payloadCandidate.payload as Record<string, unknown>;
  const pathPrefix = '$.payload';

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
      addIssue('missing-required-field', `${pathPrefix}.${fieldName}`, `Missing required field "${fieldName}".`);
    }
  }

  if (payload.schemaVersion === SELECTED_LINE_EXPORT_SCHEMA_VERSION_V3) {
    addIssue('unsupported-legacy-v3', `${pathPrefix}.schemaVersion`, UNSUPPORTED_LEGACY_V3_MESSAGE);
    return { ok: false, issues };
  }

  if (payload.schemaVersion !== SELECTED_LINE_EXPORT_SCHEMA_VERSION_V4) {
    addIssue(
      'invalid-schema-version',
      `${pathPrefix}.schemaVersion`,
      `schemaVersion must equal ${SELECTED_LINE_EXPORT_SCHEMA_VERSION_V4}.`
    );
  }

  const isV4 = payload.schemaVersion === SELECTED_LINE_EXPORT_SCHEMA_VERSION_V4;

  if (payload.exportKind !== SELECTED_LINE_EXPORT_KIND) {
    addIssue('invalid-export-kind', `${pathPrefix}.exportKind`, `exportKind must equal ${SELECTED_LINE_EXPORT_KIND}.`);
  }

  if (!parseIsoTimestamp(payload.createdAtIsoUtc)) {
    addIssue('invalid-created-at-iso-utc', `${pathPrefix}.createdAtIsoUtc`, 'createdAtIsoUtc must be a parseable ISO timestamp string.');
  }

  const sourceMetadata = payload.sourceMetadata;
  if (!isRecord(sourceMetadata)) {
    addIssue('invalid-source-metadata', `${pathPrefix}.sourceMetadata`, 'sourceMetadata must be an object.');
  } else {
    const source = sourceMetadata.source;
    if (typeof source !== 'string' || source.trim().length === 0) {
      addIssue(
        'invalid-source-metadata-source',
        `${pathPrefix}.sourceMetadata.source`,
        'sourceMetadata.source must be a non-empty string.'
      );
    }
  }

  const stopsById = new Map<string, readonly [number, number]>();
  const stops = payload.stops;
  if (!Array.isArray(stops)) {
    addIssue('invalid-stops', `${pathPrefix}.stops`, 'stops must be an array.');
  } else {
    for (let stopIndex = 0; stopIndex < stops.length; stopIndex += 1) {
      const stop = stops[stopIndex];
      const stopPath = `${pathPrefix}.stops[${stopIndex}]`;

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
  let configuredTimeBandIds: readonly TimeBandId[] = [];

  if (!isRecord(line)) {
    addIssue('invalid-line', `${pathPrefix}.line`, 'line must be an object.');
  } else {
    if (typeof line.id !== 'string' || line.id.length === 0) {
      addIssue('invalid-line-id', `${pathPrefix}.line.id`, 'line.id must be a non-empty string.');
    }

    if (typeof line.label !== 'string' || line.label.length === 0) {
      addIssue('invalid-line-label', `${pathPrefix}.line.label`, 'line.label must be a non-empty string.');
    }

    if (!Array.isArray(line.orderedStopIds)) {
      addIssue('invalid-line-ordered-stop-ids', `${pathPrefix}.line.orderedStopIds`, 'line.orderedStopIds must be an array.');
    } else {
      const duplicateOrderedStopIds = new Set<string>();
      orderedStopIds = line.orderedStopIds.filter((stopId, stopIndex) => {
        const stopIdPath = `${pathPrefix}.line.orderedStopIds[${stopIndex}]`;
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

    if (line.topology !== 'linear' && line.topology !== 'loop') {
      addIssue('invalid-line-topology', `${pathPrefix}.line.topology`, 'line.topology must be "linear" or "loop".');
    }

    if (line.servicePattern !== 'one-way' && line.servicePattern !== 'bidirectional') {
      addIssue('invalid-line-service-pattern', `${pathPrefix}.line.servicePattern`, 'line.servicePattern must be "one-way" or "bidirectional".');
    }

    if (!isRecord(line.frequencyByTimeBand)) {
      addIssue('invalid-line-frequency-map', `${pathPrefix}.line.frequencyByTimeBand`, 'line.frequencyByTimeBand must be an object.');
    } else {
      const included: TimeBandId[] = [];
      for (const [timeBandId, servicePlan] of Object.entries(line.frequencyByTimeBand)) {
        if (!CANONICAL_TIME_BAND_IDS_SET.has(timeBandId)) {
          addIssue(
            'invalid-frequency-time-band-id',
            `${pathPrefix}.line.frequencyByTimeBand.${timeBandId}`,
            `Unsupported time-band id "${timeBandId}" in frequencyByTimeBand.`
          );
          continue;
        }

        if (!isRecord(servicePlan)) {
          addIssue(
            'invalid-frequency-value',
            `${pathPrefix}.line.frequencyByTimeBand.${timeBandId}`,
            'Each frequencyByTimeBand entry must be an object service plan.'
          );
          continue;
        }

        if (servicePlan.kind === 'no-service') {
          included.push(timeBandId as TimeBandId);
          continue;
        }

        if (servicePlan.kind === 'frequency') {
          if (!isFiniteNumber(servicePlan.headwayMinutes) || servicePlan.headwayMinutes <= 0) {
            addIssue(
              'invalid-frequency-value',
              `${pathPrefix}.line.frequencyByTimeBand.${timeBandId}.headwayMinutes`,
              'frequency.headwayMinutes must be a positive finite number.'
            );
          } else {
            included.push(timeBandId as TimeBandId);
          }
          continue;
        }

        addIssue(
          'invalid-frequency-value',
          `${pathPrefix}.line.frequencyByTimeBand.${timeBandId}.kind`,
          'Service plan kind must be "frequency" or "no-service".'
        );
      }

      configuredTimeBandIds = MVP_TIME_BAND_IDS.filter((timeBandId) => included.includes(timeBandId));
    }



    if (isV4) {
      if (line.routeSegments !== undefined) {
        addIssue('invalid-route-segments', `${pathPrefix}.line.routeSegments`, 'v4 exports must not include routeSegments.');
      }
      if (line.reverseRouteSegments !== undefined) {
        addIssue('invalid-route-segments', `${pathPrefix}.line.reverseRouteSegments`, 'v4 exports must not include reverseRouteSegments.');
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
          `${pathPrefix}.line.orderedStopIds[${stopOrderIndex}]`,
          `ordered stop id "${stopId}" is missing from stops array.`
        );
      }
    }

    for (const stopId of stopsById.keys()) {
      if (!referencedStopIdSet.has(stopId)) {
        addIssue('stop-reference-mismatch', `${pathPrefix}.stops`, `stops contains unreferenced stop id "${stopId}".`);
      }
    }
  }

  const metadata = payload.metadata;
  if (!isRecord(metadata)) {
    addIssue('invalid-metadata', `${pathPrefix}.metadata`, 'metadata must be an object.');
  } else {
    if (metadata.lineCount !== 1) {
      addIssue('invalid-metadata-counts', `${pathPrefix}.metadata.lineCount`, 'metadata.lineCount must equal 1.');
    }

    const stopCount = metadata.stopCount;
    if (typeof stopCount !== 'number' || !Number.isInteger(stopCount) || stopCount < 0) {
      addIssue('invalid-metadata-counts', `${pathPrefix}.metadata.stopCount`, 'metadata.stopCount must be a non-negative integer.');
    } else if (Array.isArray(stops) && stopCount !== stops.length) {
      addIssue('invalid-metadata-counts', `${pathPrefix}.metadata.stopCount`, 'metadata.stopCount must match stops.length.');
    }

    const routeSegmentCount = metadata.routeSegmentCount;
    if (typeof routeSegmentCount !== 'number' || !Number.isInteger(routeSegmentCount) || routeSegmentCount < 0) {
      addIssue(
        'invalid-metadata-counts',
        `${pathPrefix}.metadata.routeSegmentCount`,
        'metadata.routeSegmentCount must be a non-negative integer.'
      );
    } else if (isRecord(line)) {
      if (!isV4) {
        const actualRouteSegmentCount = Array.isArray(line.routeSegments) ? line.routeSegments.length : 0;
        if (routeSegmentCount !== actualRouteSegmentCount) {
          addIssue(
            'invalid-metadata-counts',
            '$.metadata.routeSegmentCount',
            `metadata.routeSegmentCount (${routeSegmentCount}) must match actual routeSegments.length (${actualRouteSegmentCount}).`
          );
        }
      } else if (routeSegmentCount !== 0) {
        addIssue(
          'invalid-metadata-counts',
          `${pathPrefix}.metadata.routeSegmentCount`,
          'metadata.routeSegmentCount must be 0 for v4 exports.'
        );
      }
    }

    if (!Array.isArray(metadata.includedTimeBandIds)) {
      addIssue(
        'invalid-metadata-included-time-band-ids',
        `${pathPrefix}.metadata.includedTimeBandIds`,
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
          `${pathPrefix}.metadata.includedTimeBandIds`,
          'includedTimeBandIds must contain only canonical TimeBandId values.'
        );
      }

      if (
        invalidTimeBandId === undefined &&
        includedTimeBandIds.length !== configuredTimeBandIds.length
      ) {
        addIssue(
          'metadata-included-time-band-order-mismatch',
          `${pathPrefix}.metadata.includedTimeBandIds`,
          'includedTimeBandIds must list exactly the configured service-plan bands in canonical order.'
        );
      } else if (invalidTimeBandId === undefined) {
        for (let index = 0; index < includedTimeBandIds.length; index += 1) {
          if (includedTimeBandIds[index] !== configuredTimeBandIds[index]) {
            addIssue(
              'metadata-included-time-band-order-mismatch',
              `${pathPrefix}.metadata.includedTimeBandIds`,
              'includedTimeBandIds must list exactly the configured service-plan bands in canonical order.'
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

  // At this point, the payload has been fully validated against the domain contract.
  // We reconstruct the typed payload object to avoid broad root-level casts.
  const validatedPayloadBase = {
    exportKind: SELECTED_LINE_EXPORT_KIND,
    createdAtIsoUtc: payload.createdAtIsoUtc as string,
    sourceMetadata: payload.sourceMetadata as SelectedLineExportSourceMetadata,
    stops: payload.stops as readonly SelectedLineExportStop[],
    metadata: payload.metadata as SelectedLineExportCountsMetadata
  };

  return {
    ok: true,
    payload: {
      ...validatedPayloadBase,
      schemaVersion: SELECTED_LINE_EXPORT_SCHEMA_VERSION_V4,
      line: payload.line as SelectedLineExportLineV4
    }
  };
};

