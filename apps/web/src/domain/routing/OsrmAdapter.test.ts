import { describe, expect, it } from "vitest";
import { OSRM_PROVIDER_ID_VALUE } from "../constants/routing";
import { OsrmAdapter, RoutingFetch } from "./OsrmAdapter";

describe("OsrmAdapter", () => {
    const mockRequest = {
        originLng: 9.9,
        originLat: 53.5,
        destinationLng: 10.0,
        destinationLat: 53.6,
    };

    /**
     * Helper to create a mock fetch implementation.
     */
    const createMockFetch = (status: number, body: unknown, ok: boolean = true): RoutingFetch => {
        return async (_url: string) => ({
            ok,
            status,
            statusText: ok ? "OK" : "Error",
            json: async () => body,
        } as Response);
    };

    it("resolves a valid OSRM response", async () => {
        const mockResponse = {
            code: "Ok",
            routes: [{
                distance: 1234.5,
                duration: 67.8,
                geometry: {
                    type: "LineString",
                    coordinates: [[9.9, 53.5], [10.0, 53.6]],
                },
            }],
        };

        const adapter = new OsrmAdapter({ fetch: createMockFetch(200, mockResponse) });
        const result = await adapter.resolveSegment(mockRequest);

        expect(result.type).toBe("resolved");
        if (result.type === "resolved") {
            expect(result.distanceMeters).toBe(1234.5);
            expect(result.durationSeconds).toBe(67.8);
            expect(result.geometry.type).toBe("LineString");
            expect(result.geometry.coordinates).toEqual([[9.9, 53.5], [10.0, 53.6]]);
            expect(result.provider).toBe(OSRM_PROVIDER_ID_VALUE);
        }
    });

    it("maps NoRoute code to a typed NoRoute failure", async () => {
        const mockResponse = { code: "NoRoute" };
        const adapter = new OsrmAdapter({ fetch: createMockFetch(200, mockResponse) });
        const result = await adapter.resolveSegment(mockRequest);

        expect(result.type).toBe("failed");
        if (result.type === "failed") {
            expect(result.reason).toBe("NoRoute");
            expect(result.provider).toBe(OSRM_PROVIDER_ID_VALUE);
        }
    });

    it("maps HTTP error to InvalidResponse failure", async () => {
        const adapter = new OsrmAdapter({ fetch: createMockFetch(500, {}, false) });
        const result = await adapter.resolveSegment(mockRequest);

        expect(result.type).toBe("failed");
        if (result.type === "failed") {
            expect(result.reason).toBe("InvalidResponse");
            expect(result.message).toContain("HTTP 500");
        }
    });

    it("maps malformed JSON to InvalidResponse failure (empty routes)", async () => {
        const mockResponse = { code: "Ok", routes: [] };
        const adapter = new OsrmAdapter({ fetch: createMockFetch(200, mockResponse) });
        const result = await adapter.resolveSegment(mockRequest);

        expect(result.type).toBe("failed");
        if (result.type === "failed") {
            expect(result.reason).toBe("InvalidResponse");
            expect(result.message).toContain("missing routes array");
        }
    });

    it("maps network rejection to NetworkError failure", async () => {
        const mockFetch: RoutingFetch = async () => { throw new Error("AbortError: Signal timed out."); };
        const adapter = new OsrmAdapter({ fetch: mockFetch });
        const result = await adapter.resolveSegment(mockRequest);

        expect(result.type).toBe("failed");
        if (result.type === "failed") {
            expect(result.reason).toBe("NetworkError");
            expect(result.message).toBe("AbortError: Signal timed out.");
        }
    });

    it("validates coordinate values deeply (rejects non-finite numbers)", async () => {
        const mockResponse = {
            code: "Ok",
            routes: [{
                distance: 100,
                duration: 10,
                geometry: {
                    type: "LineString",
                    coordinates: [[9.9, NaN], [10.0, Infinity]],
                },
            }],
        };

        const adapter = new OsrmAdapter({ fetch: createMockFetch(200, mockResponse) });
        const result = await adapter.resolveSegment(mockRequest);

        expect(result.type).toBe("failed");
        if (result.type === "failed") {
            expect(result.reason).toBe("InvalidResponse");
            expect(result.message).toContain("contains non-finite numbers");
        }
    });

    it("requests the correct URL structure with coordinate order lng,lat", async () => {
        let capturedUrl = "";
        const mockFetch: RoutingFetch = async (url) => {
            capturedUrl = url;
            return {
                ok: true,
                json: async () => ({ code: "Ok", routes: [] }),
            } as Response;
        };

        const adapter = new OsrmAdapter({ fetch: mockFetch });
        await adapter.resolveSegment({
            originLng: 1.23,
            originLat: 4.56,
            destinationLng: 7.89,
            destinationLat: 0.12,
        });

        // URL format: /route/v1/{profile}/{lng,lat;lng,lat}?geometries=geojson&overview=full
        expect(capturedUrl).toContain("/route/v1/driving/1.23,4.56;7.89,0.12");
        expect(capturedUrl).toContain("geometries=geojson");
        expect(capturedUrl).toContain("overview=full");
    });
});
