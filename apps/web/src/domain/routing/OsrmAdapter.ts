import {
    createRouteDistanceMeters,
    createRouteDurationSeconds,
    createRoutingProviderId,
    ResolvedRouteSegment,
    RouteGeometry,
    RouteSegmentRequest,
    RoutingAdapter,
    RoutingFailure,
} from "./RoutingAdapter";

const OSRM_PROVIDER_ID = createRoutingProviderId("osrm-local");

interface OsrmRouteOptions {
    readonly baseUrl?: string;
}

/**
 * An adapter for a local Dockerized OSRM instance.
 * Provides street-routed segments for MVP purposes.
 */
export class OsrmAdapter implements RoutingAdapter {
    private readonly baseUrl: string;

    constructor(options?: OsrmRouteOptions) {
        this.baseUrl = options?.baseUrl || "http://localhost:5000";
    }

    /**
     * Resolves a route segment using the OSRM HTTP API.
     * Validates response status and shape to ensure untyped data does not leak into the domain.
     */
    async resolveSegment(request: RouteSegmentRequest): Promise<ResolvedRouteSegment | RoutingFailure> {
        try {
            // OSRM expects coordinates in {longitude},{latitude} order
            const coordinates = `${request.originLng},${request.originLat};${request.destinationLng},${request.destinationLat}`;
            
            // geometries=geojson returns a LineString directly
            // overview=full returns the full geometry instead of a simplified one
            const url = `${this.baseUrl}/route/v1/driving/${coordinates}?geometries=geojson&overview=full`;
            
            const response = await fetch(url);
            
            if (!response.ok) {
                return {
                    type: "failed",
                    provider: OSRM_PROVIDER_ID,
                    reason: "InvalidResponse",
                    message: `OSRM returned HTTP ${response.status}: ${response.statusText}`,
                };
            }

            const data = await response.json();

            if (data.code !== "Ok") {
                if (data.code === "NoRoute") {
                    return {
                        type: "failed",
                        provider: OSRM_PROVIDER_ID,
                        reason: "NoRoute",
                        message: "OSRM could not find a route between these coordinates.",
                    };
                }
                return {
                    type: "failed",
                    provider: OSRM_PROVIDER_ID,
                    reason: "ProviderError",
                    message: `OSRM returned error code: ${data.code}`,
                };
            }

            if (!data.routes || !Array.isArray(data.routes) || data.routes.length === 0) {
                return {
                    type: "failed",
                    provider: OSRM_PROVIDER_ID,
                    reason: "InvalidResponse",
                    message: "OSRM response missing routes array.",
                };
            }

            const route = data.routes[0];

            if (typeof route.distance !== "number" || route.distance <= 0) {
                return {
                    type: "failed",
                    provider: OSRM_PROVIDER_ID,
                    reason: "InvalidResponse",
                    message: "OSRM returned invalid or zero distance.",
                };
            }

            if (typeof route.duration !== "number" || route.duration <= 0) {
                return {
                    type: "failed",
                    provider: OSRM_PROVIDER_ID,
                    reason: "InvalidResponse",
                    message: "OSRM returned invalid or zero duration.",
                };
            }

            if (!route.geometry || route.geometry.type !== "LineString" || !Array.isArray(route.geometry.coordinates)) {
                return {
                    type: "failed",
                    provider: OSRM_PROVIDER_ID,
                    reason: "InvalidResponse",
                    message: "OSRM returned missing or invalid GeoJSON geometry.",
                };
            }

            return {
                type: "resolved",
                provider: OSRM_PROVIDER_ID,
                distanceMeters: createRouteDistanceMeters(route.distance),
                durationSeconds: createRouteDurationSeconds(route.duration),
                geometry: route.geometry as RouteGeometry,
            };
        } catch (error) {
            return {
                type: "failed",
                provider: OSRM_PROVIDER_ID,
                reason: "NetworkError",
                message: error instanceof Error ? error.message : String(error),
            };
        }
    }
}
