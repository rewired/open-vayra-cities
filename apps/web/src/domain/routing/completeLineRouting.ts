import { ROUTING_REQUEST_TIMEOUT_MS } from '../constants/routing';
import type { LineId, LineServicePattern, LineTopology } from '../types/line';
import type { LineRouteSegment } from '../types/lineRoute';
import type { Stop, StopId } from '../types/stop';
import {
  buildRoutedLineRouteSegments,
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
  readonly topology: LineTopology;
  readonly servicePattern: LineServicePattern;
  readonly routingAdapter: RoutingAdapter;
}

/**
 * Result of completing a line with best-available routing.
 */
export interface CompleteLineRoutingResult {
  readonly routeSegments: readonly LineRouteSegment[];
  readonly reverseRouteSegments?: readonly LineRouteSegment[] | undefined;
}

/**
 * Orchestrates the routing of a completed line by attempting best-available street routing.
 * 
 * Process:
 * 1. Prepares fallback segments (straight lines) as a reliable last resort.
 * 2. Attempts street-routed geometry via the provided adapter for forward and reverse directions.
 * 3. Enforces a centralized timeout to prevent UI hangs.
 * 4. Catches and gracefully handles any adapter failures or network errors.
 *
 * @param input - The snapshotted line configuration and routing adapter.
 * @returns A promise resolving to the best available route segments (routed or fallback).
 */
export async function completeLineRouting(
  input: CompleteLineRoutingInput
): Promise<CompleteLineRoutingResult> {
  const { lineId, orderedStopIds, placedStops, topology, servicePattern, routingAdapter } = input;
  const closureMode = topology === 'loop' ? 'closed' : 'open';

  // 1. Prepare fallback data for both directions as a baseline
  const forwardFallback = buildFallbackLineRouteSegments({
    lineId,
    orderedStopIds,
    placedStops,
    closureMode
  });

  let reverseFallback: readonly LineRouteSegment[] | undefined = undefined;
  let reverseStopIds: readonly StopId[] = [];
  if (servicePattern === 'bidirectional') {
    reverseStopIds = topology === 'loop'
      ? [orderedStopIds[0]!, ...[...orderedStopIds.slice(1)].reverse()]
      : [...orderedStopIds].reverse();

    reverseFallback = buildFallbackLineRouteSegments({
      lineId,
      orderedStopIds: reverseStopIds,
      placedStops,
      closureMode
    });
  }

  // 2. Execution block for the actual async routing attempts
  const executeRouting = async (): Promise<CompleteLineRoutingResult> => {
    const forwardResult = await buildRoutedLineRouteSegments({
      lineId,
      orderedStopIds,
      placedStops,
      routingAdapter,
      closureMode
    }).catch((error) => {
      console.warn(`Forward routing failed for line ${lineId}, using fallback:`, error);
      return { routeSegments: forwardFallback };
    });

    let reverseRouteSegments: readonly LineRouteSegment[] | undefined = undefined;
    if (servicePattern === 'bidirectional') {
      const reverseResult = await buildRoutedLineRouteSegments({
        lineId,
        orderedStopIds: reverseStopIds,
        placedStops,
        routingAdapter,
        closureMode
      }).catch((error) => {
        console.warn(`Reverse routing failed for line ${lineId}, using fallback:`, error);
        return { routeSegments: reverseFallback! };
      });
      reverseRouteSegments = reverseResult.routeSegments;
    }

    return {
      routeSegments: forwardResult.routeSegments,
      reverseRouteSegments
    };
  };

  // 3. Race the routing execution against a centralized timeout
  try {
    return await Promise.race([
      executeRouting(),
      new Promise<CompleteLineRoutingResult>((resolve) => {
        setTimeout(() => {
          resolve({
            routeSegments: forwardFallback,
            reverseRouteSegments: reverseFallback
          });
        }, ROUTING_REQUEST_TIMEOUT_MS);
      })
    ]);
  } catch (error) {
    // Catch-all for any unexpected failures in the routing adapter or helper
    console.error(`Routing orchestration failed for line ${lineId}, falling back:`, error);
    return {
      routeSegments: forwardFallback,
      reverseRouteSegments: reverseFallback
    };
  }
}
