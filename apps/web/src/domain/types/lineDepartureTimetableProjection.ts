import type { TimeBandId } from './timeBand';

/** Supported per-cell timetable rendering states for stop/hour departure values. */
export type TimetableCellState = 'departures' | 'no-service' | 'unavailable' | 'unconfigured';

/** One hourly timetable cell for one stop row. */
export interface LineDepartureTimetableCell {
  /** Hour-of-day index (`0..23`) represented by this cell. */
  readonly hour: number;
  /** Ordered minute values (`0..59`) for departures in this hour. */
  readonly departureMinutes: readonly number[];
  /** Player-facing rendering state for this stop/hour cell. */
  readonly state: TimetableCellState;
  /** Optional concise explanation when the cell has no departures. */
  readonly note: string | null;
}

/** One stop row in the 24-hour departure timetable matrix. */
export interface LineDepartureTimetableRow {
  /** Stop identifier label shown in the first timetable column. */
  readonly stopLabel: string;
  /** Ordered 24-hour cells from `00` through `23`. */
  readonly cells: readonly LineDepartureTimetableCell[];
}

/** Compact service-state summary for the currently active canonical time band. */
export interface ActiveServiceBandSummary {
  /** Active time-band id resolved from simulation state. */
  readonly activeTimeBandId: TimeBandId;
  /** Display label for the active canonical time band. */
  readonly activeTimeBandLabel: string;
  /** Display window (`HH:MM–HH:MM`) for the active canonical time band. */
  readonly activeWindowLabel: string;
  /** Player-facing service state summary for the active time band. */
  readonly activeServiceLabel: string;
}

/** Compact route baseline support block for timetable rendering. */
export interface TimetableRouteBaselineSummary {
  /** Route segment count from selected-line baseline data. */
  readonly segmentCount: number;
  /** Total selected-line route runtime in minutes. */
  readonly totalLineMinutes: number;
  /** Compact route timing/routing status label. */
  readonly routingStatusLabel: string;
  /** Optional fallback warning shown when baseline includes fallback-routed segments. */
  readonly fallbackWarning: string | null;
}

/** Projection-wide notice surfaced only when player-facing clarification is required. */
export interface LineDepartureTimetableNotice {
  /** Compact notice string for the departures modal note area. */
  readonly message: string;
}

/** Deterministic timetable matrix projection consumed by the Departures dialog. */
export interface LineDepartureTimetableProjection {
  /** Selected line display label. */
  readonly lineLabel: string;
  /** Active service band summary from current simulation state. */
  readonly activeServiceSummary: ActiveServiceBandSummary;
  /** Ordered timetable rows, one per selected-line stop. */
  readonly rows: readonly LineDepartureTimetableRow[];
  /** Route baseline summary shown when route data is available. */
  readonly routeBaselineSummary: TimetableRouteBaselineSummary | null;
  /** Optional concise notes for no-service/unavailable/unconfigured constraints. */
  readonly notices: readonly LineDepartureTimetableNotice[];
  /** True when segment timing cannot provide truthful downstream stop offsets. */
  readonly hasUnavailableDownstreamStopTiming: boolean;
}

/** Compact route timing status aggregate for selected-line baseline segments. */
export type RouteTimingStatus = 'routed' | 'fallback-routed' | 'not-routed' | 'routing-failed';

