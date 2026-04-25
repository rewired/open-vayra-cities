# ADR 0108: Departures timetable matrix and route-baseline integration

- Date: 2026-04-25
- Status: Accepted

## Context

The selected-line `Departures` dialog still presented mostly debug-style active-band summary values and upcoming raster text. A separate player-facing `Route baseline` modal also duplicated selected-line route context in a diagnostics-heavy presentation.

This did not match player-facing timetable expectations for MVP line operations.

## Decision

1. Replace the departures modal content with a player-facing timetable matrix:
   - rows by ordered stop;
   - columns `00..23`;
   - cells containing per-hour departure minutes.
2. Keep timetable generation in a pure projection helper outside React rendering.
3. Generate departures only from canonical `frequency` service-band plans.
4. Render `no-service` cells as quiet dashes and never fabricate departures.
5. Compute downstream stop times only from truthful segment-level route timing offsets.
6. If downstream segment timing is incomplete, show origin departures and mark downstream timing as unavailable.
7. Integrate compact route-baseline support info (runtime, segment count, routing-status pill, fallback warning) into Departures.
8. Remove separate player-facing `Route baseline` action/modal; deep diagnostics remain in Debug surfaces only.

## Consequences

- Departures is now player-facing and timetable-oriented while preserving truthful projection constraints.
- Route baseline details are available in-context inside Departures without a separate inspector action.
- No scheduling micro-simulation, routing algorithm changes, or fabricated stop-level timing were introduced.

## Non-goals

- No demand/economy changes.
- No persistence/backend scope.
- No mobile layout support.
- No full vehicle duty scheduling or microscopic operations.
