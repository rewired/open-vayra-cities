# ADR 0112: Completed Line Creation Uses Best-Available Routed Segments

## Status

Accepted

## Context

CityOps initially used straight-line "fallback" route segments for completed bus lines.
With the introduction of Slice 051 (OSRM Adapter) and Slice 052 (Routing Helper), the infrastructure exists to use real-world street-routed geometry.
The goal is to integrate these tools into the line completion flow while ensuring the UI remains responsive and the system is robust against routing failures.

## Decision

Newly completed bus lines will now attempt to use street-routed geometry through the routing adapter boundary.

1.  **Framework-Independent Integration**: A new command/helper `completeLineRouting` orchestrates the transition from ordered stops to routed segments.
2.  **Asynchronous Completion**: Line completion in `MapWorkspaceSurface.tsx` is now asynchronous. It snapshots the draft state at the start of the request to prevent UI race conditions.
3.  **Best-Available Routing**:
    *   If the local OSRM service is available and returns a valid route, segments use `status: 'routed'`.
    *   If OSRM is unavailable, returns an error, or times out, the system falls back to explicit `status: 'fallback-routed'` segments (straight lines).
4.  **Centralized Timeout**: A `ROUTING_REQUEST_TIMEOUT_MS` (2000ms) is enforced to ensure the player is never blocked by a hanging routing request.
5.  **Duplicate Prevention**: A pending flag (`isCompletingLine`) prevents multiple concurrent completion requests for the same draft.
6.  **Immutable Snapshots**: Draft stop IDs are cloned at the moment of submission to ensure the in-flight routing request is decoupled from any immediate UI changes.

## Consequences

*   **Improved Visuals**: Completed lines now follow street paths when OSRM is running.
*   **Realistic Metrics**: Line distance and in-motion travel time are now derived from real street routing data.
*   **UI Complexity**: The line completion button now has a "Creating..." pending state.
*   **Safety**: The system remains fully functional even if OSRM is not installed or running, maintaining the "offline-first" development baseline.
*   **No Logic Leak**: React components remain unaware of OSRM URL structures, fetch details, or coordinate validation logic.
