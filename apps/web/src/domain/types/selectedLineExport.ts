import type { Line, LineFrequencyByTimeBand, LineId } from './line';
import type { LineRouteSegment } from './lineRoute';
import type { Stop, StopId, StopPosition } from './stop';

/**
 * Canonical schema version identifier for selected-line export payloads.
 */
export const SELECTED_LINE_EXPORT_SCHEMA_VERSION = 'cityops-selected-line-export-v1' as const;

/**
 * Discriminator literal for payloads that export one selected line.
 */
export type SelectedLineExportKind = 'selected-line';

/**
 * Lightweight metadata for traceability of one selected-line export payload.
 */
export interface SelectedLineExportMetadata {
  readonly exportedAtIsoUtc: string;
  readonly source: 'cityops-web';
}

/**
 * Exported stop shape used by selected-line payloads.
 */
export interface SelectedLineExportedStop {
  readonly id: StopId;
  readonly label?: Stop['label'];
  readonly position: StopPosition;
}

/**
 * Exported route segment shape kept field-for-field aligned with canonical `LineRouteSegment` truth.
 */
export interface SelectedLineExportedRouteSegment {
  readonly id: LineRouteSegment['id'];
  readonly lineId: LineRouteSegment['lineId'];
  readonly fromStopId: LineRouteSegment['fromStopId'];
  readonly toStopId: LineRouteSegment['toStopId'];
  readonly orderedGeometry: LineRouteSegment['orderedGeometry'];
  readonly distanceMeters: LineRouteSegment['distanceMeters'];
  readonly inMotionTravelMinutes: LineRouteSegment['inMotionTravelMinutes'];
  readonly dwellMinutes: LineRouteSegment['dwellMinutes'];
  readonly totalTravelMinutes: LineRouteSegment['totalTravelMinutes'];
  readonly status: LineRouteSegment['status'];
}

/**
 * Exported selected-line block containing structural line truth plus selected stop and segment payloads.
 */
export interface SelectedLineExportedLine {
  readonly id: LineId;
  readonly label: Line['label'];
  readonly stopIds: readonly StopId[];
  readonly frequencyByTimeBand: LineFrequencyByTimeBand;
  readonly routeSegments: readonly SelectedLineExportedRouteSegment[];
  readonly stops: readonly SelectedLineExportedStop[];
}

/**
 * Root payload shape for selected-line exports, including schema versioning and typed discriminator.
 */
export interface SelectedLineExportPayload {
  readonly schemaVersion: typeof SELECTED_LINE_EXPORT_SCHEMA_VERSION;
  readonly kind: SelectedLineExportKind;
  readonly metadata: SelectedLineExportMetadata;
  readonly selectedLine: SelectedLineExportedLine;
}
