import { useEffect, useMemo, useState, type ChangeEvent, type Dispatch, type SetStateAction } from 'react';

import { MVP_TIME_BAND_IDS } from '../domain/constants/timeBands';
import {
  createLineFrequencyMinutes,
  resolveLineServiceBandHeadwayMinutes,
  type Line,
  type LineServiceBandPlan
} from '../domain/types/line';
import { parseSelectedLineExportFile } from '../domain/export/selectedLineExportFileLoader';
import { validateSelectedLineExportPayload } from '../domain/export/selectedLineExportValidation';
import { convertSelectedLineExportPayloadToSession } from '../domain/export/selectedLineExportSessionLoader';
import type { Stop } from '../domain/types/stop';
import type { TimeBandId } from '../domain/types/timeBand';
import type { StopSelectionState } from '../map-workspace/MapWorkspaceSurface';
import type { LineBuildSelectionState, WorkspaceToolMode } from './sessionTypes';

/** Feedback contract for selected-line JSON import actions. */
export interface SelectedLineImportFeedback {
  readonly kind: 'success' | 'error';
  readonly title: string;
  readonly detail: string;
}

/** Text-input state for frequency editing fields keyed by canonical MVP time bands. */
export type LineFrequencyInputByTimeBand = Readonly<Record<TimeBandId, string>>;

/** Validation text for frequency editing fields keyed by canonical MVP time bands. */
export type LineFrequencyValidationByTimeBand = Readonly<Record<TimeBandId, string | null>>;

/** Explicit editor control mode for a canonical time-band service plan. */
export type LineFrequencyControlState = 'unset' | 'frequency' | 'no-service';

/** Control-mode state for frequency editing fields keyed by canonical MVP time bands. */
export type LineFrequencyControlByTimeBand = Readonly<Record<TimeBandId, LineFrequencyControlState>>;

/** Explicit action contract for selected-line frequency updates. */
export type SelectedLineFrequencyUpdateAction = 'set-unset' | 'set-frequency' | 'set-no-service' | 'input-change';

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
  readonly selectedLineImportFeedback: SelectedLineImportFeedback | null;
  readonly handleToolModeSelection: (nextMode: WorkspaceToolMode) => void;
  readonly setSessionStops: Dispatch<SetStateAction<readonly Stop[]>>;
  readonly setSelectedStop: Dispatch<SetStateAction<StopSelectionState | null>>;
  readonly setLineBuildSelection: Dispatch<SetStateAction<LineBuildSelectionState>>;
  readonly setSessionLines: Dispatch<SetStateAction<readonly Line[]>>;
  readonly setSelectedLineId: Dispatch<SetStateAction<Line['id'] | null>>;
  readonly updateSelectedCompletedLineFrequency: (
    timeBandId: TimeBandId,
    rawInputValue: string,
    action?: SelectedLineFrequencyUpdateAction
  ) => void;
  readonly handleLineJsonFileSelection: (event: ChangeEvent<HTMLInputElement>) => Promise<void>;
  readonly clearSelectedLineImportFeedback: () => void;
}

const INITIAL_LINE_BUILD_SELECTION_STATE: LineBuildSelectionState = {
  selectedStopIds: []
};

const createEmptyLineFrequencyInputByTimeBand = (): LineFrequencyInputByTimeBand =>
  Object.fromEntries(MVP_TIME_BAND_IDS.map((timeBandId) => [timeBandId, ''])) as LineFrequencyInputByTimeBand;

const createEmptyLineFrequencyValidationByTimeBand = (): LineFrequencyValidationByTimeBand =>
  Object.fromEntries(MVP_TIME_BAND_IDS.map((timeBandId) => [timeBandId, null])) as LineFrequencyValidationByTimeBand;

const createEmptyLineFrequencyControlByTimeBand = (): LineFrequencyControlByTimeBand =>
  Object.fromEntries(MVP_TIME_BAND_IDS.map((timeBandId) => [timeBandId, 'unset'])) as LineFrequencyControlByTimeBand;

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
  const [selectedLineImportFeedback, setSelectedLineImportFeedback] = useState<SelectedLineImportFeedback | null>(null);

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
    selectedLineImportFeedback,
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
    updateSelectedCompletedLineFrequency: (timeBandId, rawInputValue, action = 'input-change') => {
      setLineFrequencyInputByTimeBand((currentInputs) => ({
        ...currentInputs,
        [timeBandId]: rawInputValue
      }));

      if (!selectedLine) {
        return;
      }

      if (action === 'set-no-service') {
        setLineFrequencyControlByTimeBand((currentControls) => ({
          ...currentControls,
          [timeBandId]: 'no-service'
        }));
        setLineFrequencyValidationByTimeBand((currentValidation) => ({
          ...currentValidation,
          [timeBandId]: null
        }));
        setSessionLines((currentLines) =>
          currentLines.map((line) =>
            line.id === selectedLine.id
              ? {
                  ...line,
                  frequencyByTimeBand: {
                    ...line.frequencyByTimeBand,
                    [timeBandId]: { kind: 'no-service' } satisfies LineServiceBandPlan
                  }
                }
              : line
          )
        );
        return;
      }

      if (action === 'set-unset') {
        setLineFrequencyInputByTimeBand((currentInputs) => ({
          ...currentInputs,
          [timeBandId]: ''
        }));
        setLineFrequencyControlByTimeBand((currentControls) => ({
          ...currentControls,
          [timeBandId]: 'unset'
        }));
        setLineFrequencyValidationByTimeBand((currentValidation) => ({
          ...currentValidation,
          [timeBandId]: null
        }));
        setSessionLines((currentLines) =>
          currentLines.map((line) =>
            line.id === selectedLine.id
              ? {
                  ...line,
                  frequencyByTimeBand: {
                    ...line.frequencyByTimeBand,
                    [timeBandId]: { kind: 'unset' } satisfies LineServiceBandPlan
                  }
                }
              : line
          )
        );
        return;
      }

      setLineFrequencyControlByTimeBand((currentControls) => ({
        ...currentControls,
        [timeBandId]: 'frequency'
      }));

      const trimmedValue = rawInputValue.trim();
      if (trimmedValue.length === 0) {
        setLineFrequencyValidationByTimeBand((currentValidation) => ({
          ...currentValidation,
          [timeBandId]: null
        }));
        setSessionLines((currentLines) =>
          currentLines.map((line) =>
            line.id === selectedLine.id
              ? {
                  ...line,
                  frequencyByTimeBand: {
                    ...line.frequencyByTimeBand,
                    [timeBandId]: { kind: 'unset' } satisfies LineServiceBandPlan
                  }
                }
              : line
          )
        );
        return;
      }

      const parsedFrequencyMinutes = Number(trimmedValue);
      if (!Number.isFinite(parsedFrequencyMinutes) || parsedFrequencyMinutes <= 0) {
        setLineFrequencyValidationByTimeBand((currentValidation) => ({
          ...currentValidation,
          [timeBandId]: 'Enter a positive minute interval.'
        }));
        return;
      }

      setLineFrequencyValidationByTimeBand((currentValidation) => ({
        ...currentValidation,
        [timeBandId]: null
      }));
      setSessionLines((currentLines) =>
        currentLines.map((line) =>
          line.id === selectedLine.id
            ? {
                ...line,
                frequencyByTimeBand: {
                  ...line.frequencyByTimeBand,
                  [timeBandId]: {
                    kind: 'frequency',
                    headwayMinutes: createLineFrequencyMinutes(parsedFrequencyMinutes)
                  } satisfies LineServiceBandPlan
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
        setSelectedLineImportFeedback({
          kind: 'error',
          title: 'Line JSON could not be loaded',
          detail: parsedResult.issue.message
        });
        return;
      }

      const validationResult = validateSelectedLineExportPayload(parsedResult.parsed);
      if (!validationResult.ok) {
        const firstIssue = validationResult.issues[0];
        setSelectedLineImportFeedback({
          kind: 'error',
          title: 'Line JSON could not be loaded',
          detail: firstIssue
            ? `${firstIssue.message}${validationResult.issues.length > 1 ? ` (${validationResult.issues.length} issues)` : ''}`
            : 'The selected line JSON failed validation.'
        });
        return;
      }

      const conversionResult = convertSelectedLineExportPayloadToSession(validationResult.payload);
      if (!conversionResult.ok) {
        setSelectedLineImportFeedback({
          kind: 'error',
          title: 'Line JSON could not be loaded',
          detail: conversionResult.issue.message
        });
        return;
      }

      setSessionStops(conversionResult.session.placedStops);
      setSessionLines(conversionResult.session.sessionLines);
      setSelectedLineId(conversionResult.session.selectedLineId);
      setSelectedStop(null);
      setLineBuildSelection(INITIAL_LINE_BUILD_SELECTION_STATE);
      setSelectedLineImportFeedback({
        kind: 'success',
        title: 'Line JSON loaded',
        detail: `Loaded line ${conversionResult.session.selectedLineId} and replaced the current in-memory network.`
      });
    },
    clearSelectedLineImportFeedback: () => {
      setSelectedLineImportFeedback(null);
    }
  };
};
