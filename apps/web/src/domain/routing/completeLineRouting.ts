import { ROUTING_REQUEST_TIMEOUT_MS } from '../constants/routing';
import type { LineId } from '../types/line';
import type { LineRouteSegment } from '../types/lineRoute';
import type { Stop, StopId } from '../types/stop';
import {
  buildRoutedLineRouteSegments,
  type BuildRoutedLineRouteSegmentsInput
} from './buildRoutedLineRouteSegments';
import { buildFallbackLineRouteSegments } from './fallbackLineRouting';
import type { RoutingAdapter } from './RoutingAdapter';

/**
 * Input for completing a line with best-available routing.
 */
export interface CompleteLineRoutingInput {
  readonly lineId: LineId;
  readonly orderedStopIds: readonly StopId[];
  readonly placedStops: readonly Stop[];
  readonly routingAdapter: RoutingAdapter;
}

/**
 * Orchestrates the routing of a completed line.
 * Attempts street-routed geometry using the provided adapter with a centralized timeout.
 * Falls back to deterministic straight-line segments if routing fails, times out, or throws.
 *
 * @param input - The line details and adapter to use.
 * @returns A promise resolving to the final array of route segments.
 */
export async function completeLineRouting(
  input: CompleteLineRoutingInput
): Promise<LineRouteSegment[]> {
  const { lineId, orderedStopIds, placedStops, routingAdapter } = input;

  // 1. Prepare the standard fallback as the "last resort" if the entire process hangs or crashes
  const fallbackSegments = buildFallbackLineRouteSegments({
    lineId,
    orderedStopIds,
    placedStops
  });

  try {
    const buildInput: BuildRoutedLineRouteSegmentsInput = {
      lineId,
      orderedStopIds,
      placedStops,
      routingAdapter
    };

    // 2. Create a timeout promise that resolves to the fallback segments
    const timeoutPromise = new Promise<LineRouteSegment[]>((resolve) => {
      setTimeout(() => {
        resolve(fallbackSegments);
      }, ROUTING_REQUEST_TIMEOUT_MS);
    });

    // 3. Race the actual routing against the timeout
    const routedResult = await Promise.race([
      buildRoutedLineRouteSegments(buildInput),
      timeoutPromise
    ]);

    // 4. Return result if it's the routed result, otherwise it's the timeout fallback
    if (Array.isArray(routedResult)) {
      return routedResult;
    }

    return routedResult.routeSegments;
  } catch (error) {
    // 5. Catch-all for any unexpected failures in the routing adapter or helper
    // Ensures line completion never blocks the user.
    console.error(`Routing failed for line ${lineId}, falling back to straight lines:`, error);
    return fallbackSegments;
  }
}
