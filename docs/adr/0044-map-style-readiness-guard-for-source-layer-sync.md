# ADR 0044: Map style-readiness guard for source/layer sync

## Status

Accepted

## Date

2026-04-23

## Context

`MapWorkspaceSurface` refreshes stop and line GeoJSON sources from React effects whenever local state changes.

In practice, those effects can run before MapLibre reports the style as fully loaded, especially during initial mount or after style lifecycle transitions. Calling `addSource(...)` / `addLayer(...)` before style readiness causes a runtime crash:

- `Error: Style is not done loading.`

That crash terminates the React subtree and surfaces as an error in `<MapWorkspaceSurface>`.

## Decision

Keep rendering architecture unchanged, and add a small style-readiness gate around reactive source/layer synchronization:

- extend the local MapLibre adapter typing with:
  - `isStyleLoaded(): boolean`
  - render lifecycle event support for `'styledata'`
- add a local helper in `MapWorkspaceSurface` that:
  - runs sync immediately when `map.isStyleLoaded()` is true
  - otherwise subscribes once to `'styledata'` and runs sync only after the style becomes ready
  - unregisters listener on cleanup
- use this gate for both:
  - stop source/layer ensure + stop source data sync
  - line source/layer ensure + line source data sync

## Consequences

- Stop/line sync effects no longer attempt style mutations before readiness.
- The `Style is not done loading` crash path is eliminated for this map workspace sync flow.
- Existing gameplay semantics and UI behavior remain unchanged (placement, inspect, build-line, selection).

## Non-goals

- No changes to stop placement rules or street snapping.
- No changes to line drafting/completion behavior.
- No simulation/economy/persistence/mobile scope changes.
