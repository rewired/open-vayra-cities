import type { Line } from '../types/line';
import type { StopId } from '../types/stop';

/**
 * Calculates the expected number of forward route segments for a line based on its topology and stop count.
 * - linear: N stops require N - 1 segments.
 * - loop: N stops require N segments (the last segment returns to the first stop).
 */
export const getExpectedForwardRouteSegmentCount = (line: Pick<Line, 'topology' | 'stopIds'>): number => {
  const stopCount = line.stopIds.length;
  if (stopCount === 0) {
    return 0;
  }

  return line.topology === 'loop' ? stopCount : Math.max(0, stopCount - 1);
};

/**
 * Returns the expected from/to stop pair for a given segment index, accounting for line topology.
 * Returns null if the index is out of bounds for the line's topology and stop count.
 */
export const getExpectedForwardRouteSegmentStopPair = (
  line: Pick<Line, 'topology' | 'stopIds'>,
  segmentIndex: number
): { fromStopId: StopId; toStopId: StopId } | null => {
  const { stopIds, topology } = line;
  const stopCount = stopIds.length;

  if (segmentIndex < 0 || stopCount < 2) {
    return null;
  }

  const expectedCount = getExpectedForwardRouteSegmentCount(line);
  if (segmentIndex >= expectedCount) {
    return null;
  }

  const fromStopId = stopIds[segmentIndex];
  if (fromStopId === undefined) {
    return null;
  }

  // Handle loop closing segment
  if (topology === 'loop' && segmentIndex === stopCount - 1) {
    const firstStopId = stopIds[0];
    if (firstStopId === undefined) {
      return null;
    }
    return { fromStopId, toStopId: firstStopId };
  }

  const toStopId = stopIds[segmentIndex + 1];
  if (toStopId === undefined) {
    return null;
  }

  return { fromStopId, toStopId };
};
