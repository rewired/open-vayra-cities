# ADR 0076: Loaded-session map source synchronization fix

## Status

Accepted (2026-04-24)

## Context

Slice 023 introduced validated selected-line export loading into in-memory session state. After load, stop features could appear on the map while completed line geometry and derived vehicle markers remained invisible in some lifecycle orders.

The root issue was render-lifecycle synchronization:

- the map `load` handler ensured line/stop/vehicle sources and layers
- but it only synchronized stop and vehicle source data at load time
- completed line source data was not synchronized inside `load`
- some `load`-time synchronization relied on closure-captured render values instead of current session refs

This created a visible mismatch when session data changed before or around map/style readiness.

## Decision

Keep session/domain truth in React state and fix map synchronization timing in `MapWorkspaceSurface.tsx` only.

### Included

- ensure and synchronize all map-owned visual sources in load lifecycle:
  - stop source
  - completed line source
  - draft line source
  - vehicle source
- keep current-value refs for load-time synchronization inputs:
  - placed stops
  - selected stop id
  - draft stop ids
  - active tool mode
  - session lines
  - selected line id
  - vehicle network projection
- use those refs inside the map `load` handler to avoid stale closure state
- add compact HUD diagnostic count for completed line features (`Line features: X`) alongside existing vehicle feature count

## Rationale

### Why stops could appear while lines/vehicles stayed invisible

Stops were already synchronized in load and reactive effects, so they recovered more consistently. Completed line source data was missing from load-time sync, and vehicle sync risked stale closure values if projection changed before `load` executed.

### Why load-time sync must include stop, line, draft-line, and vehicle sources

MapLibre source/layer availability is lifecycle-bound. A complete load-time sync guarantees that current in-memory state becomes visible even when state changes happened before map/style readiness.

### Why refs are used

Map `load` callbacks are long-lived closures. Ref-backed reads provide current session values without moving state ownership into map internals.

### Why line feature count diagnostics were added

A compact line feature count distinguishes data-shape issues (session line exists but no line feature) from rendering/lifecycle sync issues (line feature exists but map not showing it).

### Why this remains rendering/lifecycle synchronization only

No loader semantics, route data semantics, or projection semantics are changed. The fix targets map source synchronization timing and closure safety.

## Consequences

- loaded selected-line sessions now synchronize stops, completed lines, draft lines, and vehicles consistently across map/style readiness timing
- line click selection and selected-line rendering continue through existing map-native line layers
- vehicle markers remain map-native GeoJSON circle features and now reliably appear when projection features exist
- diagnostics improve troubleshooting without expanding telemetry scope

## Explicit non-goals

- no persistence
- no savegame loading
- no scenario loading
- no fixture replay
- no demand simulation
- no economy simulation
- no passenger assignment
- no vehicle operation model
- no fleet management
- no depot logic
- no layover logic
- no route recalculation
- no backend
- no multimodal expansion
- no mobile behavior
