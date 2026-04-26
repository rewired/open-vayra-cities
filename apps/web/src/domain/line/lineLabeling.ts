import type { Line, LineServicePattern, LineTopology } from '../types/line';
import type { Stop } from '../types/stop';

/**
 * Normalises a raw stop label string by trimming and collapsing inner whitespace.
 * Returns `null` when the result would be empty or whitespace-only.
 */
const normaliseLabel = (raw: string | undefined): string | null => {
  if (raw === undefined) {
    return null;
  }
  const trimmed = raw.trim().replace(/\s+/g, ' ');
  return trimmed.length > 0 ? trimmed : null;
};

/**
 * Generates a player-facing label for a line based on its stop sequence, topology,
 * and service pattern.
 *
 * Returns `null` when the required endpoint stop labels are missing, empty, or
 * whitespace-only — the caller should then fall back to a deterministic placeholder
 * (e.g., `Line <ordinal>`).
 */
export const generateLineLabel = (
  stops: readonly Stop[],
  topology: LineTopology,
  servicePattern: LineServicePattern
): string | null => {
  if (stops.length < 2) {
    return null;
  }

  const firstStop = stops[0];
  const lastStop = stops[stops.length - 1];

  if (!firstStop || !lastStop) {
    return null;
  }

  const firstLabel = normaliseLabel(firstStop.label);

  if (!firstLabel) {
    return null;
  }

  if (topology === 'loop') {
    return `${firstLabel} Loop`;
  }

  const lastLabel = normaliseLabel(lastStop.label);

  if (!lastLabel) {
    return null;
  }

  if (servicePattern === 'bidirectional') {
    return `${firstLabel} ↔ ${lastLabel}`;
  }

  return `${firstLabel} → ${lastLabel}`;
};

/**
 * Ensures a generated line label is unique within the existing session lines by adding a numeric suffix if needed.
 */
export const generateUniqueLineLabel = (options: {
  baseLabel: string;
  existingLines: readonly Line[];
}): string => {
  const { baseLabel, existingLines } = options;
  const existingLabels = new Set(existingLines.map((line) => line.label));

  if (!existingLabels.has(baseLabel)) {
    return baseLabel;
  }

  let suffix = 1;
  while (existingLabels.has(`${baseLabel} ${suffix}`)) {
    suffix += 1;
  }

  return `${baseLabel} ${suffix}`;
};

/**
 * Applies accepted route-name symbol normalization for arrow-like tokens.
 * Replacements are global and order-sensitive to keep bidirectional markers intact.
 */
export const normalizeAcceptedLineLabel = (rawLabel: string): string =>
  rawLabel
    .replaceAll('<->', '↔')
    .replaceAll('<>', '↔')
    .replaceAll('->', '→')
    .replaceAll('>', '→')
    .trim();
