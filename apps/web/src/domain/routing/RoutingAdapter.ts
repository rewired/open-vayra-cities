/**
 * Branded type for routing provider ID to prevent accidental string mixing.
 */
export type RoutingProviderId = string & { readonly __brand: "RoutingProviderId" };

/**
 * Creates a valid RoutingProviderId.
 */
export function createRoutingProviderId(id: string): RoutingProviderId {
    return id as RoutingProviderId;
}

/**
 * Branded type for route distance in meters.
 */
export type RouteDistanceMeters = number & { readonly __brand: "RouteDistanceMeters" };

/**
 * Creates a valid RouteDistanceMeters.
 */
export function createRouteDistanceMeters(meters: number): RouteDistanceMeters {
    return meters as RouteDistanceMeters;
}

/**
 * Branded type for route duration in seconds.
 * Note: This does not include dwell time.
 */
export type RouteDurationSeconds = number & { readonly __brand: "RouteDurationSeconds" };

/**
 * Creates a valid RouteDurationSeconds.
 */
export function createRouteDurationSeconds(seconds: number): RouteDurationSeconds {
    return seconds as RouteDurationSeconds;
}

/**
 * Represents a GeoJSON LineString geometry for a resolved route.
 */
export type RouteGeometry = {
    readonly type: "LineString";
    readonly coordinates: [number, number][]; // [longitude, latitude][]
};

/**
 * Represents the request payload to resolve a route segment.
 */
export interface RouteSegmentRequest {
    readonly originLng: number;
    readonly originLat: number;
    readonly destinationLng: number;
    readonly destinationLat: number;
}

/**
 * Represents a successfully resolved route segment from an external routing provider.
 */
export interface ResolvedRouteSegment {
    readonly type: "resolved";
    readonly provider: RoutingProviderId;
    readonly distanceMeters: RouteDistanceMeters;
    readonly durationSeconds: RouteDurationSeconds;
    readonly geometry: RouteGeometry;
}

/**
 * Represents a failure to resolve a route segment from an external routing provider.
 */
export interface RoutingFailure {
    readonly type: "failed";
    readonly provider: RoutingProviderId;
    readonly reason: "NoRoute" | "ProviderError" | "InvalidResponse" | "NetworkError";
    readonly message?: string;
}

/**
 * Framework-independent contract for an external routing adapter.
 * The adapter is responsible for bridging domain coordinates into provider-specific routing queries
 * and returning typed domain results.
 */
export interface RoutingAdapter {
    /**
     * Resolves a single route segment between an origin and destination.
     * @param request The origin and destination coordinates.
     * @returns A promise resolving to a successfully resolved segment or a typed routing failure.
     */
    resolveSegment(request: RouteSegmentRequest): Promise<ResolvedRouteSegment | RoutingFailure>;
}
