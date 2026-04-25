# ADR 0115: Selected-Line Exports Preserve Line Intent with Derived Route Cache

## Status

Accepted (Slice 058)

## Context

Selected-line JSON exports are used to share and store individual line designs. Previously, these exports were heavily dependent on the presence and strict validity of `routeSegments` (geometry and metrics). 

As we introduced more complex routing (loops, bidirectional support, OSRM coordinate rounding), the strict validation of these derived segments became brittle. A mismatch of a few microdegrees between OSRM-rounded coordinates and stop positions would cause an entire import to fail, even if the underlying stop sequence was perfectly valid.

Furthermore, relying solely on exported route segments as canonical truth prevents the system from re-routing when better data is available or when a line is imported into a context where the original routing cache is stale.

## Decision

We decouple canonical line intent from derived route geometry in the selected-line export contract.

### 1. Canonical Line Intent
The following fields are considered canonical and required for a valid import:
- Line ID and label
- Ordered stop IDs
- Topology (linear/loop)
- Service pattern (one-way/bidirectional)
- Frequency/service plan by time band
- Referenced stops with their positions and labels

### 2. Derived Route Cache
- `routeSegments` and `reverseRouteSegments` are now optional fields.
- If present, they are treated as a **derived cache**.
- They are still validated if provided, but with a relaxed coordinate tolerance (`1e-5` degrees) to account for common routing-engine coordinate rounding (e.g., OSRM GeoJSON).

### 3. Import Behavior
- When loading a line, the system **prefers re-resolving route segments** through the standard routing boundary (`completeLineRouting`).
- This ensures that every imported line receives fresh geometry and metrics that are consistent with the current session's routing environment.
- If OSRM is unavailable during load, the system falls back to deterministic straight-line segments.
- This approach ensures that a valid stop sequence can always be imported, regardless of whether a routing cache is present or perfectly matched.

## Consequences

- **Robustness**: Imports no longer fail due to minor coordinate rounding differences.
- **Offline Continuity**: Lines can be exported/imported even when the routing service is offline (using fallbacks).
- **Flexibility**: Future improvements to the routing engine will automatically apply to imported lines.
- **Data Integrity**: Canonical line state is protected from being corrupted by invalid or inconsistent route-segment data.
