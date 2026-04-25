# ADR 0099: Shell-owned map workspace debug modal state instead of map overlays

## Status

Accepted (2026-04-25)

## Context

`MapWorkspaceSurface` rendered two non-gameplay overlays directly over the map:

1. A compact HUD block with mode/count diagnostics.
2. A debug disclosure block with interaction telemetry, feature diagnostics, and draft metadata/caveat text.

Those overlays increased map visual noise and mixed developer diagnostics into the same surface as player-facing guidance.
The project still needs those diagnostics for development, but the display should be shell-owned and centralized rather than map-overlay-bound.

## Decision

1. Remove the map-surface HUD/debug overlay blocks from `MapWorkspaceSurface`.
2. Preserve the existing map diagnostics derivations in `MapWorkspaceSurface`:
   - interaction status
   - pointer + geographic summaries
   - line/vehicle feature diagnostics
   - stop selection summary
   - placement/build-line diagnostic copy
   - draft metadata summary
3. Introduce a typed diagnostics snapshot contract emitted from `MapWorkspaceSurface` to the app shell.
4. Store debug visibility + latest diagnostics snapshot in shell-owned (`App.tsx`) modal state.
5. Render diagnostics inside an app-level modal opened from a dedicated left-rail debug control.
6. Keep player-facing actionable overlays (`placement` / `build-line`) on the map surface unchanged.

## Consequences

- Gameplay overlays remain focused on actionable player guidance.
- Debug diagnostics remain available without occupying map viewport space.
- Debug visibility becomes an explicit shell concern, improving boundary clarity between map surface rendering and shell-level tooling UX.

## Explicit non-goals (this slice)

- no changes to map interaction behavior
- no changes to stop placement or line-building gameplay rules
- no simulation/projection semantic changes
- no mobile or multimodal scope expansion
