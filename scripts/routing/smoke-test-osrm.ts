import { OsrmAdapter } from "../../apps/web/src/domain/routing/OsrmAdapter";

/**
 * A minimal smoke test to verify that the local OSRM instance is reachable and returns valid geometries.
 * Uses a fixed coordinate pair in Hamburg (e.g. Altona to Landungsbrücken).
 * 
 * Run with: pnpm tsx scripts/routing/smoke-test-osrm.ts
 */
async function main() {
    console.log("Starting local OSRM smoke test...");

    const adapter = new OsrmAdapter();

    // Hamburg coordinates: Altona (approx) to Landungsbrücken (approx)
    const request = {
        originLng: 9.9351,
        originLat: 53.5521,
        destinationLng: 9.9702,
        destinationLat: 53.5458,
    };

    console.log("Requesting segment:");
    console.log(request);

    try {
        const result = await adapter.resolveSegment(request);

        if (result.type === "failed") {
            console.error("Routing failed:", result);
            process.exit(1);
        }

        console.log("Routing succeeded!");
        console.log(`Provider: ${result.provider}`);
        console.log(`Distance: ${result.distanceMeters} meters`);
        console.log(`Duration: ${result.durationSeconds} seconds`);
        console.log(`Geometry Type: ${result.geometry.type}`);
        console.log(`Geometry Coordinates Count: ${result.geometry.coordinates.length}`);

        if (result.distanceMeters > 0 && result.durationSeconds > 0 && result.geometry.coordinates.length > 0) {
            console.log("\nSmoke test passed.");
            process.exit(0);
        } else {
            console.error("\nSmoke test failed: Returned values are invalid/empty.", result);
            process.exit(1);
        }
    } catch (error) {
        console.error("Smoke test failed with exception:", error);
        process.exit(1);
    }
}

main();
