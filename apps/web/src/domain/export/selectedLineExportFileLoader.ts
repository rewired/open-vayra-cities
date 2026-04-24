/**
 * Failure returned while parsing a selected-line export JSON file prior to schema validation.
 */
export interface SelectedLineExportFileParseFailure {
  /** Stable parse failure code for compact UI state handling. */
  readonly code: 'invalid-file-type' | 'file-read-failed' | 'invalid-json';
  /** Human-readable parse failure message. */
  readonly message: string;
}

/**
 * Discriminated result for selected-line export file parsing before domain validation.
 */
export type SelectedLineExportFileParseResult =
  | {
      readonly ok: true;
      readonly parsed: unknown;
    }
  | {
      readonly ok: false;
      readonly issue: SelectedLineExportFileParseFailure;
    };

const JSON_FILE_EXTENSION = '.json';
const JSON_MIME_TYPE = 'application/json';

const isLikelyJsonFile = (file: File): boolean => {
  const normalizedName = file.name.toLowerCase();
  const normalizedType = file.type.toLowerCase();
  return normalizedName.endsWith(JSON_FILE_EXTENSION) || normalizedType === JSON_MIME_TYPE;
};

/**
 * Parses raw selected-line export JSON text with deterministic parse error handling.
 */
export const parseSelectedLineExportJsonText = (rawJsonText: string): SelectedLineExportFileParseResult => {
  try {
    return {
      ok: true,
      parsed: JSON.parse(rawJsonText) as unknown
    };
  } catch {
    return {
      ok: false,
      issue: {
        code: 'invalid-json',
        message: 'The selected file is not valid JSON.'
      }
    };
  }
};

/**
 * Reads a browser-selected file and parses its JSON payload before schema validation.
 */
export const parseSelectedLineExportFile = async (file: File): Promise<SelectedLineExportFileParseResult> => {
  if (!isLikelyJsonFile(file)) {
    return {
      ok: false,
      issue: {
        code: 'invalid-file-type',
        message: 'Choose a .json file exported from CityOps.'
      }
    };
  }

  try {
    const rawJsonText = await file.text();
    return parseSelectedLineExportJsonText(rawJsonText);
  } catch {
    return {
      ok: false,
      issue: {
        code: 'file-read-failed',
        message: 'The selected file could not be read.'
      }
    };
  }
};
