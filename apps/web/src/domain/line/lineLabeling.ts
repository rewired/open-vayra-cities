import type { Line, LineServicePattern, LineTopology } from '../types/line';
import type { Stop } from '../types/stop';

/**
 * Generates a player-facing label for a line based on its stop sequence, topology, and service pattern.
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

  if (topology === 'loop') {
    return `${firstStop.label} Loop`;
  }

  if (servicePattern === 'bidirectional') {
    return `${firstStop.label} ↔ ${lastStop.label}`;
  }

  return `${firstStop.label} → ${lastStop.label}`;
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
