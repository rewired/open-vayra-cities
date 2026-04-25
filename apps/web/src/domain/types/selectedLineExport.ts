import { MVP_TIME_BAND_IDS } from '../constants/timeBands';
import { type Line, type LineId, type LineServiceBandPlan, type LineServicePattern, type LineTopology } from './line';
import type { LineRouteSegment } from './lineRoute';
import type { Stop, StopId } from './stop';
import type { TimeBandId } from './timeBand';

/**
 * Canonical schema version literal for single-line JSON export payloads.
 */
export const SELECTED_LINE_EXPORT_SCHEMA_VERSION = 'cityops-selected-line-export-v3' as const;

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
 * Selected line block emitted by the export builder with ordered stop ids and stored route segments.
 */
export interface SelectedLineExportLine {
  readonly id: LineId;
  readonly label: Line['label'];
  readonly orderedStopIds: readonly StopId[];
  readonly topology: LineTopology;
  readonly servicePattern: LineServicePattern;
  readonly frequencyByTimeBand: SelectedLineExportServiceByTimeBand;
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
 * Root payload contract for a single selected-line export JSON document.
 */
export interface SelectedLineExportPayload {
  readonly schemaVersion: typeof SELECTED_LINE_EXPORT_SCHEMA_VERSION;
  readonly exportKind: typeof SELECTED_LINE_EXPORT_KIND;
  readonly createdAtIsoUtc: string;
  readonly sourceMetadata: SelectedLineExportSourceMetadata;
  readonly line: SelectedLineExportLine;
  readonly stops: readonly SelectedLineExportStop[];
  readonly metadata: SelectedLineExportCountsMetadata;
}

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
 * Builds a deterministic single-line export payload that excludes unrelated UI or transient shell state.
 */
export const buildSelectedLineExportPayload = ({
  selectedLine,
  placedStops,
  createdAtIsoUtc,
  sourceMetadata
}: BuildSelectedLineExportPayloadInput): SelectedLineExportPayload => {
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
    schemaVersion: SELECTED_LINE_EXPORT_SCHEMA_VERSION,
    exportKind: SELECTED_LINE_EXPORT_KIND,
    createdAtIsoUtc,
    sourceMetadata: sourceMetadata ?? {},
    line: {
      id: selectedLine.id,
      label: selectedLine.label,
      orderedStopIds: selectedLine.stopIds,
      topology: selectedLine.topology,
      servicePattern: selectedLine.servicePattern,
      frequencyByTimeBand,
      routeSegments: selectedLine.routeSegments,
      reverseRouteSegments: selectedLine.reverseRouteSegments
    },
    stops,
    metadata: {
      lineCount: 1,
      stopCount: stops.length,
      routeSegmentCount: selectedLine.routeSegments.length,
      includedTimeBandIds
    }
  };
};
