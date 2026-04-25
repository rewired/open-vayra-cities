import { describe, expect, it } from 'vitest';

import {
  parseSelectedLineExportFile,
  parseSelectedLineExportJsonText
} from './selectedLineExportFileLoader';

describe('selectedLineExportFileLoader', () => {
  it('parses valid JSON text safely', () => {
    const result = parseSelectedLineExportJsonText('{"schemaVersion":"cityops-selected-line-export-v3"}');

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.parsed).toEqual({ schemaVersion: 'cityops-selected-line-export-v3' });
    }
  });

  it('returns invalid-json for malformed JSON text', () => {
    const result = parseSelectedLineExportJsonText('{"schemaVersion":');

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.issue.code).toBe('invalid-json');
    }
  });

  it('rejects non-json file names and mime types as a friendly guard', async () => {
    const file = new File(['hello'], 'line.txt', { type: 'text/plain' });

    const result = await parseSelectedLineExportFile(file);

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.issue.code).toBe('invalid-file-type');
    }
  });
});
