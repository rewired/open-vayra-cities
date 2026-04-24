# ADR 0082: Slice 024 map workspace surface boundary refactor

## Status

Accepted (2026-04-24)

## Context

`apps/web/src/map-workspace/MapWorkspaceSurface.tsx` had accumulated map lifecycle setup, street snap resolution, placement validation, feature-interaction binding, UI feedback projection, diagnostics, and React rendering in one mixed-responsibility surface.

That boundary increased regression risk for the bus-first MVP map workspace because behavior-preserving updates required touching a large file that mixed MapLibre mechanics with React JSX concerns.

## Decision

1. Extract street snapping and placement-target helpers to `apps/web/src/map-workspace/mapWorkspaceStreetSnap.ts`.
   - Keep direct-hit/fallback snap ranking, geometry guards, and street-layer/source hint resolution in one map-workspace helper module.
2. Extract map interaction wiring to `apps/web/src/map-workspace/mapWorkspaceInteractions.ts`.
   - Keep interaction helpers callback-driven; they receive typed callbacks/contracts from `MapWorkspaceSurface` and do not own session truth.
3. Extract lifecycle-only map helpers to `apps/web/src/map-workspace/mapWorkspaceLifecycle.ts`.
   - Keep map instance creation, resize binding, style-ready scheduling, and rendered-feature counting outside React JSX.
4. Extract overlay UI copy/projection helpers to `apps/web/src/map-workspace/mapWorkspaceUiFeedback.ts`.
   - Preserve existing copy wording and behavior while reducing component-local helper noise.
5. Keep React state ownership and session/domain ownership in `MapWorkspaceSurface.tsx` and shell/domain layers.

## Consequences

- `MapWorkspaceSurface.tsx` becomes materially smaller and focused on React state/effects/rendering orchestration.
- Street snapping semantics are preserved while moved to a pure map-workspace helper boundary.
- Stop and completed-line feature interactions remain feature-first and callback-driven without moving session truth into MapLibre helpers.
- Existing stop placement, draft-line completion, completed-line rendering, vehicle rendering, diagnostics, and selected-line integration behavior remains unchanged.
- Tests remain structurally stable; only import fallout/fixes are needed when module boundaries move.

## Why street snapping stays outside JSX

Street snapping is geometry/query/ranking logic over MapLibre rendered/source features. Keeping this logic in a focused non-React module improves maintainability and testability while avoiding UI-layer leakage of map query semantics.

## Why interactions stay callback-driven

Map interaction modules should translate map events into typed callbacks, not own session/domain state. This preserves architecture boundaries where React/shell state remains canonical and MapLibre helpers remain glue logic.

## Explicit non-goals (Slice 024)

- no UI redesign
- no inspector declutter
- no `App.tsx` refactor
- no simulation changes
- no routing semantics changes
- no route recalculation changes
- no persistence
- no backend
- no savegame loading
- no scenario loading
- no fixture replay
- no demand/economy/passenger/vehicle/fleet/depot/layover behavior
- no multimodal expansion
- no mobile behavior
