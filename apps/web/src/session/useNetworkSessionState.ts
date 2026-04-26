import { useEffect, useMemo, useState, type ChangeEvent, type Dispatch, type SetStateAction } from 'react';
import { useToast } from '../ui/toast/ToastProvider';

import { MVP_TIME_BAND_IDS } from '../domain/constants/timeBands';
import { normalizeAcceptedLineLabel } from '../domain/line/lineLabeling';
import { applyLineFrequencyEditorAction } from './lineFrequencyEditorState';
import { resolveLineServiceBandHeadwayMinutes, type Line, type LineServiceBandPlan } from '../domain/types/line';
import { parseSelectedLineExportFile } from '../domain/export/selectedLineExportFileLoader';
import { validateSelectedLineExportPayload } from '../domain/export/selectedLineExportValidation';
import { convertSelectedLineExportPayloadToSession } from '../domain/export/selectedLineExportSessionLoader';
import { SELECTED_LINE_EXPORT_SCHEMA_VERSION_V4 } from '../domain/types/selectedLineExport';
import type { Stop } from '../domain/types/stop';
import type { TimeBandId } from '../domain/types/timeBand';
import type { StopSelectionState } from '../map-workspace/MapWorkspaceSurface';
import { completeLineRouting } from '../domain/routing/completeLineRouting';
import { getDefaultRoutingAdapter } from '../domain/routing/defaultRoutingAdapter';
import type { LineBuildSelectionState, SelectedLineDialogOpenIntent, WorkspaceToolMode } from './sessionTypes';


/** Text-input state for frequency editing fields keyed by canonical MVP time bands. */
export type LineFrequencyInputByTimeBand = Readonly<Record<TimeBandId, string>>;

/** Validation text for frequency editing fields keyed by canonical MVP time bands. */
export type LineFrequencyValidationByTimeBand = Readonly<Record<TimeBandId, string | null>>;

/** Explicit editor control mode for a canonical time-band service plan. */
export type LineFrequencyControlState = 'frequency' | 'no-service';

/** Control-mode state for frequency editing fields keyed by canonical MVP time bands. */
export type LineFrequencyControlByTimeBand = Readonly<Record<TimeBandId, LineFrequencyControlState>>;

/** Explicit action contract for selected-line frequency updates. */
export type SelectedLineFrequencyUpdateAction = 'activate-frequency' | 'set-no-service' | 'input-change';

/** Exposes shell-owned in-memory session state and command callbacks. */
export interface NetworkSessionStateController {
  readonly activeToolMode: WorkspaceToolMode;
  readonly sessionStops: readonly Stop[];
  readonly selectedStop: StopSelectionState | null;
  readonly lineBuildSelection: LineBuildSelectionState;
  readonly sessionLines: readonly Line[];
  readonly selectedLineId: Line['id'] | null;
  readonly selectedLine: Line | null;
  readonly selectedStopId: Stop['id'] | null;
  readonly lineFrequencyInputByTimeBand: LineFrequencyInputByTimeBand;
  readonly lineFrequencyControlByTimeBand: LineFrequencyControlByTimeBand;
  readonly lineFrequencyValidationByTimeBand: LineFrequencyValidationByTimeBand;
  readonly selectedLineDialogOpenIntent: SelectedLineDialogOpenIntent | null;
  readonly handleToolModeSelection: (nextMode: WorkspaceToolMode) => void;
  readonly setSessionStops: Dispatch<SetStateAction<readonly Stop[]>>;
  readonly setSelectedStop: Dispatch<SetStateAction<StopSelectionState | null>>;
  readonly setLineBuildSelection: Dispatch<SetStateAction<LineBuildSelectionState>>;
  readonly setSessionLines: Dispatch<SetStateAction<readonly Line[]>>;
  readonly setSelectedLineId: Dispatch<SetStateAction<Line['id'] | null>>;
  readonly setSelectedLineDialogOpenIntent: Dispatch<SetStateAction<SelectedLineDialogOpenIntent | null>>;
  /** Commits a stop label rename for one stop id. */
  readonly renameStopLabel: (stopId: Stop['id'], nextLabel: string) => void;
  /** Commits a line label rename for one line id with accepted-symbol normalization. */
  readonly renameLineLabel: (lineId: Line['id'], nextLabel: string) => void;
  readonly updateSelectedCompletedLineFrequency: (
    timeBandId: TimeBandId,
    rawInputValue: string,
    action?: SelectedLineFrequencyUpdateAction
  ) => void;
  readonly handleLineJsonFileSelection: (event: ChangeEvent<HTMLInputElement>) => Promise<void>;
}

const INITIAL_LINE_BUILD_SELECTION_STATE: LineBuildSelectionState = {
  selectedStopIds: []
};

const createEmptyLineFrequencyInputByTimeBand = (): LineFrequencyInputByTimeBand =>
  Object.fromEntries(MVP_TIME_BAND_IDS.map((timeBandId) => [timeBandId, ''])) as LineFrequencyInputByTimeBand;

const createEmptyLineFrequencyValidationByTimeBand = (): LineFrequencyValidationByTimeBand =>
  Object.fromEntries(MVP_TIME_BAND_IDS.map((timeBandId) => [timeBandId, null])) as LineFrequencyValidationByTimeBand;

const createEmptyLineFrequencyControlByTimeBand = (): LineFrequencyControlByTimeBand =>
  Object.fromEntries(MVP_TIME_BAND_IDS.map((timeBandId) => [timeBandId, 'no-service'])) as LineFrequencyControlByTimeBand;

/** Coordinates mutable in-memory session state for shell tools, selection, line editing, and JSON replacement load. */
export const useNetworkSessionState = (): NetworkSessionStateController => {
  const [activeToolMode, setActiveToolMode] = useState<WorkspaceToolMode>('inspect');
  const [sessionStops, setSessionStops] = useState<readonly Stop[]>([]);
  const [selectedStop, setSelectedStop] = useState<StopSelectionState | null>(null);
  const [lineBuildSelection, setLineBuildSelection] = useState<LineBuildSelectionState>(INITIAL_LINE_BUILD_SELECTION_STATE);
  const [sessionLines, setSessionLines] = useState<readonly Line[]>([]);
  const [selectedLineId, setSelectedLineId] = useState<Line['id'] | null>(null);
  const [lineFrequencyInputByTimeBand, setLineFrequencyInputByTimeBand] =
    useState<LineFrequencyInputByTimeBand>(createEmptyLineFrequencyInputByTimeBand);
  const [lineFrequencyControlByTimeBand, setLineFrequencyControlByTimeBand] =
    useState<LineFrequencyControlByTimeBand>(createEmptyLineFrequencyControlByTimeBand);
  const [lineFrequencyValidationByTimeBand, setLineFrequencyValidationByTimeBand] =
    useState<LineFrequencyValidationByTimeBand>(createEmptyLineFrequencyValidationByTimeBand);
  const { pushToast } = useToast();
  const [selectedLineDialogOpenIntent, setSelectedLineDialogOpenIntent] =
    useState<SelectedLineDialogOpenIntent | null>(null);

  const selectedLine = useMemo(
    () => sessionLines.find((line) => line.id === selectedLineId) ?? null,
    [sessionLines, selectedLineId]
  );

  useEffect(() => {
    if (!selectedLine) {
      setLineFrequencyInputByTimeBand(createEmptyLineFrequencyInputByTimeBand());
      setLineFrequencyControlByTimeBand(createEmptyLineFrequencyControlByTimeBand());
      setLineFrequencyValidationByTimeBand(createEmptyLineFrequencyValidationByTimeBand());
      return;
    }

    setLineFrequencyInputByTimeBand(Object.fromEntries(
      MVP_TIME_BAND_IDS.map((timeBandId) => {
        const bandPlan = selectedLine.frequencyByTimeBand[timeBandId];
        const headwayMinutes = resolveLineServiceBandHeadwayMinutes(bandPlan);
        return [timeBandId, headwayMinutes === null ? '' : String(headwayMinutes)];
      })
    ) as LineFrequencyInputByTimeBand);
    setLineFrequencyControlByTimeBand(Object.fromEntries(
      MVP_TIME_BAND_IDS.map((timeBandId) => {
        const bandPlan = selectedLine.frequencyByTimeBand[timeBandId];
        return [timeBandId, bandPlan.kind];
      })
    ) as LineFrequencyControlByTimeBand);
    setLineFrequencyValidationByTimeBand(createEmptyLineFrequencyValidationByTimeBand());
  }, [selectedLine]);

  const selectedStopId = selectedStop?.selectedStopId ?? null;

  return {
    activeToolMode,
    sessionStops,
    selectedStop,
    lineBuildSelection,
    sessionLines,
    selectedLineId,
    selectedLine,
    selectedStopId,
    lineFrequencyInputByTimeBand,
    lineFrequencyControlByTimeBand,
    lineFrequencyValidationByTimeBand,
    selectedLineDialogOpenIntent,
    handleToolModeSelection: (nextMode) => {
      setActiveToolMode(nextMode);
      if (nextMode !== 'build-line') {
        setLineBuildSelection(INITIAL_LINE_BUILD_SELECTION_STATE);
      }
    },
    setSessionStops,
    setSelectedStop,
    setLineBuildSelection,
    setSessionLines,
    setSelectedLineId,
    setSelectedLineDialogOpenIntent,
    renameStopLabel: (stopId, nextLabel) => {
      setSessionStops((currentStops) =>
        currentStops.map((stop) => (stop.id === stopId ? { ...stop, label: nextLabel } : stop))
      );
    },
    renameLineLabel: (lineId, nextLabel) => {
      const normalizedLabel = normalizeAcceptedLineLabel(nextLabel);
      setSessionLines((currentLines) =>
        currentLines.map((line) => (line.id === lineId ? { ...line, label: normalizedLabel } : line))
      );
    },
    updateSelectedCompletedLineFrequency: (timeBandId, rawInputValue, action = 'input-change') => {
      const nextEditorState = applyLineFrequencyEditorAction(rawInputValue, action);

      setLineFrequencyInputByTimeBand((currentInputs) => ({
        ...currentInputs,
        [timeBandId]: nextEditorState.normalizedInputValue
      }));

      setLineFrequencyControlByTimeBand((currentControls) => ({
        ...currentControls,
        [timeBandId]: nextEditorState.controlState
      }));

      setLineFrequencyValidationByTimeBand((currentValidation) => ({
        ...currentValidation,
        [timeBandId]: nextEditorState.validationMessage
      }));

      const nextBandPlan = nextEditorState.nextBandPlan;
      if (!selectedLine || !nextBandPlan) {
        return;
      }

      setSessionLines((currentLines) =>
        currentLines.map((line) =>
          line.id === selectedLine.id
            ? {
                ...line,
                frequencyByTimeBand: {
                  ...line.frequencyByTimeBand,
                  [timeBandId]: nextBandPlan satisfies LineServiceBandPlan
                }
              }
            : line
        )
      );
    },
    handleLineJsonFileSelection: async (event) => {
      const selectedFile = event.currentTarget.files?.[0];
      event.currentTarget.value = '';

      if (!selectedFile) {
        return;
      }

      const parsedResult = await parseSelectedLineExportFile(selectedFile);
      if (!parsedResult.ok) {
        pushToast({
          variant: 'error',
          title: 'Line JSON could not be loaded',
          detail: parsedResult.issue.message
        });
        return;
      }

      const validationResult = validateSelectedLineExportPayload(parsedResult.parsed);
      if (!validationResult.ok) {
        const firstIssue = validationResult.issues[0];
        
        let detail = 'The selected line JSON failed validation.';
        if (firstIssue) {
          if (firstIssue.code === 'unsupported-legacy-v3') {
            detail = firstIssue.message;
          } else {
            detail = `${firstIssue.message} (code: ${firstIssue.code}, path: ${firstIssue.path})${validationResult.issues.length > 1 ? ` plus ${validationResult.issues.length - 1} more issues.` : ''}`;
          }
        }

        pushToast({
          variant: 'error',
          title: 'Line JSON failed validation',
          detail
        });
        return;
      }

      const conversionResult = convertSelectedLineExportPayloadToSession(validationResult.payload);
      if (!conversionResult.ok) {
        pushToast({
          variant: 'error',
          title: 'Line JSON could not be converted',
          detail: conversionResult.issue.message
        });
        return;
      }

      const importedLine = conversionResult.session.sessionLines[0];
      
      // Player-authored network truth is slim; route geometry must always be rebuilt on import.
      const routingResult = await completeLineRouting({
        lineId: importedLine.id,
        orderedStopIds: importedLine.stopIds,
        placedStops: conversionResult.session.placedStops,
        topology: importedLine.topology,
        servicePattern: importedLine.servicePattern,
        routingAdapter: getDefaultRoutingAdapter()
      });

      const finalLine: Line = {
        ...importedLine,
        routeSegments: routingResult.routeSegments,
        reverseRouteSegments: routingResult.reverseRouteSegments
      };

      setSessionStops(conversionResult.session.placedStops);
      setSessionLines([finalLine]);
      setSelectedLineId(finalLine.id);
      setSelectedStop(null);
      setLineBuildSelection(INITIAL_LINE_BUILD_SELECTION_STATE);
      
      const isFallback = finalLine.routeSegments.some(s => s.status === 'fallback-routed');

      pushToast({
        variant: 'success',
        title: 'Line JSON loaded',
        detail: `Loaded line ${finalLine.id} with its stops and service plan. ${isFallback ? 'Fallback route geometry was used.' : 'Route geometry was rebuilt.'}`
      });
    },
  };
};
