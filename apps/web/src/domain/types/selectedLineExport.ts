import { MVP_TIME_BAND_IDS } from '../constants/timeBands';
import { type Line, type LineId, type LineServiceBandPlan, type LineServicePattern, type LineTopology } from './line';
import type { LineRouteSegment } from './lineRoute';
import type { Stop, StopId } from './stop';
import type { TimeBandId } from './timeBand';

/**
 * Canonical schema version literal for single-line JSON export payloads.
 */
export const SELECTED_LINE_EXPORT_SCHEMA_VERSION_V3 = 'cityops-selected-line-export-v3' as const;
export const SELECTED_LINE_EXPORT_SCHEMA_VERSION_V4 = 'cityops-selected-line-export-v4' as const;

export const SELECTED_LINE_EXPORT_SCHEMA_VERSION = SELECTED_LINE_EXPORT_SCHEMA_VERSION_V4;

/**
 * Discriminator literal for payloads that export one completed selected line.
 */
export const SELECTED_LINE_EXPORT_KIND = 'single-line' as const;

/**
 * Flexible source metadata object attached to export payloads for origin traceability.
 */
export type SelectedLineExportSourceMetadata = Readonly<Record<string, string | number | boolean | null>>;

/**
 * JSON-serializable service-band state for one exported time band.
 */
export type SelectedLineExportServiceBandPlan =
  | { readonly kind: 'frequency'; readonly headwayMinutes: number }
  | { readonly kind: 'no-service' };

/**
 * JSON-serializable explicit service-plan map keyed by canonical time-band ids.
 */
export type SelectedLineExportServiceByTimeBand = Readonly<Record<TimeBandId, SelectedLineExportServiceBandPlan>>;

/**
 * Base line shape shared across all selected-line export versions.
 */
export interface SelectedLineExportLineBase {
  readonly id: LineId;
  readonly label: Line['label'];
  readonly orderedStopIds: readonly StopId[];
  readonly topology: LineTopology;
  readonly servicePattern: LineServicePattern;
  readonly frequencyByTimeBand: SelectedLineExportServiceByTimeBand;
}

/**
 * Legacy v3 selected-line export line shape with cached route geometry.
 */
export interface SelectedLineExportLineV3 extends SelectedLineExportLineBase {
  /** 
   * Forward route segments from stop to stop. 
   * Optional derived cache; can be reconstructed from canonical line intent on load.
   */
  readonly routeSegments?: readonly LineRouteSegment[] | undefined;
  /** 
   * Reverse route segments for bidirectional lines. 
   * Optional derived cache; can be reconstructed from canonical line intent on load.
   */
  readonly reverseRouteSegments?: readonly LineRouteSegment[] | undefined;
}

/**
 * Modern v4 selected-line export line shape without route geometry.
 */
export type SelectedLineExportLineV4 = SelectedLineExportLineBase;

/**
 * Selected line block emitted by the export builder.
 * @deprecated Use version-specific types where possible.
 */
export type SelectedLineExportLine = SelectedLineExportLineV3 | SelectedLineExportLineV4;

/**
 * Exported stop shape containing only fields needed to reconstruct selected-line references.
 */
export type SelectedLineExportStop = Stop;

/**
 * Summary metadata for payload cardinality and configured time-band coverage.
 */
export interface SelectedLineExportCountsMetadata {
  readonly lineCount: 1;
  readonly stopCount: number;
  readonly routeSegmentCount: number;
  readonly includedTimeBandIds: readonly TimeBandId[];
}

/**
 * Shared root payload fields for all selected-line export versions.
 */
export interface SelectedLineExportPayloadBase {
  readonly exportKind: typeof SELECTED_LINE_EXPORT_KIND;
  readonly createdAtIsoUtc: string;
  readonly sourceMetadata: SelectedLineExportSourceMetadata;
  readonly stops: readonly SelectedLineExportStop[];
  readonly metadata: SelectedLineExportCountsMetadata;
}

/**
 * Legacy v3 selected-line export payload.
 */
export interface SelectedLineExportPayloadV3 extends SelectedLineExportPayloadBase {
  readonly schemaVersion: typeof SELECTED_LINE_EXPORT_SCHEMA_VERSION_V3;
  readonly line: SelectedLineExportLineV3;
}

/**
 * Modern v4 selected-line export payload.
 */
export interface SelectedLineExportPayloadV4 extends SelectedLineExportPayloadBase {
  readonly schemaVersion: typeof SELECTED_LINE_EXPORT_SCHEMA_VERSION_V4;
  readonly line: SelectedLineExportLineV4;
}

/**
 * Discriminated union of supported selected-line export payloads.
 */
export type SelectedLineExportPayload = SelectedLineExportPayloadV3 | SelectedLineExportPayloadV4;

/**
 * Input contract for building a selected-line export payload from canonical in-memory state.
 */
export interface BuildSelectedLineExportPayloadInput {
  readonly selectedLine: Line;
  readonly placedStops: readonly Stop[];
  readonly createdAtIsoUtc: string;
  readonly sourceMetadata?: SelectedLineExportSourceMetadata;
}

/**
 * Builds a deterministic single-line v4 export payload that excludes unrelated UI or transient shell state.
 * Returns a typed v4 payload without cached route geometry.
 */
export const buildSelectedLineExportPayload = ({
  selectedLine,
  placedStops,
  createdAtIsoUtc,
  sourceMetadata
}: BuildSelectedLineExportPayloadInput): SelectedLineExportPayloadV4 => {
  const referencedStopIds = new Set(selectedLine.stopIds);
  const stops = placedStops.filter((stop) => referencedStopIds.has(stop.id));
  const toExportServiceBandPlan = (bandPlan: LineServiceBandPlan): SelectedLineExportServiceBandPlan => {
    switch (bandPlan.kind) {
      case 'no-service':
        return { kind: 'no-service' };
      case 'frequency':
        return { kind: 'frequency', headwayMinutes: bandPlan.headwayMinutes };
    }
  };
  const frequencyByTimeBand = Object.fromEntries(
    MVP_TIME_BAND_IDS.map((timeBandId) => [timeBandId, toExportServiceBandPlan(selectedLine.frequencyByTimeBand[timeBandId])])
  ) as SelectedLineExportServiceByTimeBand;
  const includedTimeBandIds = MVP_TIME_BAND_IDS;

  return {
    schemaVersion: SELECTED_LINE_EXPORT_SCHEMA_VERSION_V4,
    exportKind: SELECTED_LINE_EXPORT_KIND,
    createdAtIsoUtc,
    sourceMetadata: {
      source: 'cityops-web',
      ...sourceMetadata
    },
    line: {
      id: selectedLine.id,
      label: selectedLine.label,
      orderedStopIds: selectedLine.stopIds,
      topology: selectedLine.topology,
      servicePattern: selectedLine.servicePattern,
      frequencyByTimeBand,
      // v4 exports do not include cached route geometry
    },
    stops,
    metadata: {
      lineCount: 1,
      stopCount: stops.length,
      routeSegmentCount: 0,
      includedTimeBandIds
    }
  };
};
