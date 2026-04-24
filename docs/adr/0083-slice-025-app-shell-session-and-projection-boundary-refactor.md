# ADR 0083: Slice 025 App shell session and projection boundary refactor

## Status

Accepted (2026-04-24)

## Context

`apps/web/src/App.tsx` had grown into a mixed shell boundary that held tool mode/session state ownership, selected-line JSON load/export actions, simulation clock lifecycle ticking, projection assembly, and large inspector rendering blocks in one file.

That structure made behavior-preserving changes hard to review and raised regression risk because session truth, projection wiring, and presentational rendering were tightly interleaved.

## Decision

1. Extract shell-owned in-memory planning session state and commands to `apps/web/src/session/useNetworkSessionState.ts`.
   - Keep placed stops, completed lines, draft selection, selected stop/line, frequency editing input/validation, and replacement selected-line JSON load behavior in one hook.
   - Keep session state in memory only; do not add persistence, localStorage, or savegame/session restore behavior.
2. Extract simulation clock lifecycle ownership to `apps/web/src/simulation/useSimulationClockController.ts`.
   - Reuse canonical clock command helpers and constants.
   - Preserve pause/resume/reset and canonical speeds (`1x`, `5x`, `10x`, `20x`) with paused as running state.
3. Extract projection aggregation to `apps/web/src/domain/projection/useNetworkPlanningProjections.ts`.
   - Reuse existing readiness/service/departure/vehicle projection helpers without duplicating domain semantics.
   - Keep projection aggregation separate from inspector rendering concerns.
4. Extract inspector rendering boundaries to `apps/web/src/inspector/*`.
   - Use `InspectorPanel`, `SelectedLineInspector`, `SelectedStopInspector`, and `EmptyInspector` as presentational/interaction-boundary components.
   - Keep canonical session truth outside inspector components.
5. Extract session action rendering to `apps/web/src/session/SessionActions.tsx`.
   - Preserve `Load line JSON` replacement semantics, export action, and existing success/error feedback behavior.

## Consequences

- `App.tsx` becomes materially smaller and focused on shell composition.
- Session and clock truth remain shell-owned through hooks, not through map/inspector components.
- Projection assembly is centralized in a focused helper boundary and remains based on existing domain projection modules.
- Inspector components are easier to maintain because they are presentational and callback-driven.
- Behavior remains equivalent for stop placement, line creation/editing, selected-line load/export, clock controls, map integration, projections, and inspector content.
- Tests were not broadly reorganized in this slice; only module-boundary consumption changed.

## Why this remains a behavior-preserving refactor

This slice only relocates responsibilities to narrower module boundaries. It does not introduce new gameplay features, change projection semantics, or modify visible workflow behavior beyond necessary code movement.

## Explicit non-goals (Slice 025)

- no UI declutter/redesign
- no MapWorkspaceSurface refactor (beyond import/type fallout)
- no persistence
- no localStorage/session restore
- no savegame loading
- no scenario loading
- no fixture replay
- no simulation execution changes
- no routing semantics changes
- no route recalculation changes
- no demand/economy/passenger/vehicle/fleet/depot/layover behavior
- no backend
- no multimodal expansion
- no mobile behavior
