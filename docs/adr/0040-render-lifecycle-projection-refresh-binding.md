# ADR 0040: Render-lifecycle projection refresh binding for line overlay

## Status

Accepted

## Date

2026-04-23

## Context

Slice 014f introduced projection refresh ticks triggered by interaction lifecycle events (`move`/`zoom`/`rotate`, including start/end variants).

That approach can miss intermediate visual frames while the map is actively animating, because interaction event cadence is not guaranteed to match every rendered frame. This can make SVG overlay polylines appear to drift briefly relative to the basemap during high-frequency camera updates.

## Decision

Bind projection refresh scheduling to MapLibre render-lifecycle events (`render` and `idle`) instead of relying on interaction-only event wiring.

Keep the existing lightweight coalescing model:

- queue projection refresh via a single `requestAnimationFrame` guard
- avoid introducing new rendering architecture or map-overlay remount mechanics

Preserve line semantics:

- `toProjectedLineSegments` remains a schematic stop-order projection
- no street-routed geometry semantics are introduced

Preserve stop-marker behavior:

- no changes to marker anchor/offset constants
- no marker-root transform animation behavior changes

## Consequences

- Overlay line projection updates track active render frames more reliably during pan/zoom/rotate animation.
- Existing state ownership and overlay rendering architecture remain unchanged.
- Additional implementation complexity is minimal and limited to event typing plus event binding updates.

## Non-goals

- No changes to line drafting/completion rules.
- No routing/pathfinding or simulation/economy behavior changes.
- No changes to stop-marker interaction or styling contracts.
