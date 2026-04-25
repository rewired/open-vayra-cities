import {
    OSRM_LOCAL_BASE_URL,
    OSRM_PROVIDER_ID_VALUE,
    OSRM_ROUTE_GEOMETRY_FORMAT,
    OSRM_ROUTE_OVERVIEW_MODE,
    OSRM_ROUTE_PROFILE,
} from "../constants/routing";
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

const OSRM_PROVIDER_ID = createRoutingProviderId(OSRM_PROVIDER_ID_VALUE);

/**
 * Minimal fetch-like signature for routing adapters.
 */
export type RoutingFetch = (input: string, init?: RequestInit) => Promise<Response>;

/**
 * Options for configuring the OSRM adapter.
 */
export interface OsrmRouteOptions {
    /**
     * The base URL of the OSRM service.
     * Defaults to OSRM_LOCAL_BASE_URL.
     */
    readonly baseUrl?: string;
    /**
     * Optional fetch implementation for testing or custom environments.
     * Defaults to global fetch.
     */
    readonly fetch?: RoutingFetch;
}

/**
 * An adapter for a local Dockerized OSRM instance.
 * Provides street-routed segments for MVP purposes.
 */
export class OsrmAdapter implements RoutingAdapter {
    private readonly baseUrl: string;
    private readonly fetch: RoutingFetch;

    constructor(options?: OsrmRouteOptions) {
        this.baseUrl = options?.baseUrl || OSRM_LOCAL_BASE_URL;
        this.fetch = options?.fetch || ((input, init) => fetch(input, init));
    }

    /**
     * Resolves a route segment using the OSRM HTTP API.
     * Validates response status and shape from unknown input to ensure domain safety.
     */
    async resolveSegment(request: RouteSegmentRequest): Promise<ResolvedRouteSegment | RoutingFailure> {
        try {
            // OSRM expects coordinates in {longitude},{latitude} order
            const coordinates = `${request.originLng},${request.originLat};${request.destinationLng},${request.destinationLat}`;
            
            const url = `${this.baseUrl}/route/v1/${OSRM_ROUTE_PROFILE}/${coordinates}?geometries=${OSRM_ROUTE_GEOMETRY_FORMAT}&overview=${OSRM_ROUTE_OVERVIEW_MODE}`;
            
            const response = await this.fetch(url);
            
            if (!response.ok) {
                return {
                    type: "failed",
                    provider: OSRM_PROVIDER_ID,
                    reason: "InvalidResponse",
                    message: `OSRM returned HTTP ${response.status}: ${response.statusText}`,
                };
            }

            const data: unknown = await response.json();

            return this.validateOsrmResponse(data);
        } catch (error) {
            return {
                type: "failed",
                provider: OSRM_PROVIDER_ID,
                reason: "NetworkError",
                message: error instanceof Error ? error.message : String(error),
            };
        }
    }

    /**
     * Validates the raw OSRM response against expected domain shapes.
     * Removes unchecked casts by explicitly reconstructing the typed result.
     */
    private validateOsrmResponse(data: unknown): ResolvedRouteSegment | RoutingFailure {
        if (!data || typeof data !== "object") {
            return this.fail("InvalidResponse", "OSRM response is not an object.");
        }

        const body = data as Record<string, unknown>;

        if (body.code !== "Ok") {
            if (body.code === "NoRoute") {
                return this.fail("NoRoute", "OSRM could not find a route between these coordinates.");
            }
            return this.fail("ProviderError", `OSRM returned error code: ${body.code}`);
        }

        const routes = body.routes;
        if (!Array.isArray(routes) || routes.length === 0) {
            return this.fail("InvalidResponse", "OSRM response missing routes array.");
        }

        const route = routes[0] as Record<string, unknown>;
        if (!route || typeof route !== "object") {
            return this.fail("InvalidResponse", "OSRM route is not an object.");
        }

        const distance = route.distance;
        if (typeof distance !== "number" || !Number.isFinite(distance) || distance < 0) {
            return this.fail("InvalidResponse", "OSRM returned invalid distance.");
        }

        const duration = route.duration;
        if (typeof duration !== "number" || !Number.isFinite(duration) || duration < 0) {
            return this.fail("InvalidResponse", "OSRM returned invalid duration.");
        }

        const geometry = route.geometry as Record<string, unknown>;
        if (!geometry || typeof geometry !== "object" || geometry.type !== "LineString") {
            return this.fail("InvalidResponse", "OSRM returned missing or invalid GeoJSON geometry type.");
        }

        const coordinates = geometry.coordinates;
        if (!Array.isArray(coordinates) || coordinates.length < 2) {
            return this.fail("InvalidResponse", "OSRM geometry coordinates must be an array with at least two points.");
        }

        const validatedCoordinates: [number, number][] = [];
        for (let i = 0; i < coordinates.length; i++) {
            const coord = coordinates[i];
            if (!Array.isArray(coord) || coord.length !== 2) {
                return this.fail("InvalidResponse", `OSRM coordinate at index ${i} is not a [lng, lat] tuple.`);
            }
            const [lng, lat] = coord;
            if (typeof lng !== "number" || !Number.isFinite(lng) || typeof lat !== "number" || !Number.isFinite(lat)) {
                return this.fail("InvalidResponse", `OSRM coordinate at index ${i} contains non-finite numbers.`);
            }
            validatedCoordinates.push([lng, lat]);
        }

        const routeGeometry: RouteGeometry = {
            type: "LineString",
            coordinates: validatedCoordinates,
        };

        return {
            type: "resolved",
            provider: OSRM_PROVIDER_ID,
            distanceMeters: createRouteDistanceMeters(distance),
            durationSeconds: createRouteDurationSeconds(duration),
            geometry: routeGeometry,
        };
    }

    private fail(reason: RoutingFailure["reason"], message: string): RoutingFailure {
        return {
            type: "failed",
            provider: OSRM_PROVIDER_ID,
            reason,
            message,
        };
    }
}
