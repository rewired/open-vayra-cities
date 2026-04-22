# Changelog

All notable changes to this project will be documented in this file.

## 2026-04-22

- Bootstrap pnpm workspace configuration and strict TypeScript base settings.
- Add `apps/web` React + TypeScript + Vite baseline with structural source boundaries.
- Add initial repository structural directories for docs and data partitions.
- Add onboarding-focused `README.md` that points contributors to canonical root docs and ADR location.
- Add ADR 0002 documenting documentation governance and `docs/adr/` as the ADR location.
- Add the initial desktop shell UI with header, left tools panel, workspace, right inspector panel, and bottom status bar placeholders.
- Add ADR 0003 documenting the initial desktop shell layout decision and scope boundaries.
- Prepare a dedicated map workspace surface scaffold with explicit empty-state and structural overlay regions, without map logic or dependencies.
- Add ADR 0004 documenting the map workspace surface scaffold decision and constraints.
- Integrate a real MapLibre-powered workspace baseline in the central shell area with lifecycle-safe React map setup/cleanup and neutral map-ready overlay status.
- Add ADR 0005 documenting the initial MapLibre workspace baseline decision and runtime-source constraints.
- Add local typed pointer interaction state and MapLibre move/click handler plumbing in the map workspace with cleanup-safe unsubscribe behavior and neutral developer-facing overlay text.
- Add ADR 0006 documenting neutral map workspace interaction plumbing and its non-goal constraints.
- Add explicit map workspace resize handling with `ResizeObserver`-first wiring, window resize fallback, and cleanup-safe registration lifecycle.
- Extend the typed MapLibre global surface with `resize(): void` to keep map runtime contracts explicit.
- Add ADR 0007 documenting explicit map workspace resize handling decisions and constraints.
- Refactor map workspace internals into lightweight local helpers that separate map instance lifecycle setup, neutral interaction subscriptions, and resize bindings with explicit typed contracts.
- Add ADR 0008 documenting map workspace internal lifecycle separation and lightweight boundary constraints.
- Add typed workspace tool mode state (`inspect` / `place-stop`) in the shell and replace the static tool list with a minimal stop-placement toggle control.
- Pass active workspace tool mode into the map workspace and gate click capture behavior by mode to support explicit placement-intent interactions.
- Add ADR 0009 documenting workspace tool mode gating at the shell-to-map boundary and associated scope constraints.
- Split map workspace click telemetry from stop-placement click handling so neutral click state remains independent from gameplay mode.
- Add local stop-placement click eligibility validation using street-related style layer/source hints with rendered-feature checks, and block invalid non-street targets with minimal HUD feedback.
- Extend the typed MapLibre workspace contract with `getStyle()` and `queryRenderedFeatures(...)` to keep placement-validation boundaries explicit.
- Add ADR 0010 documenting the telemetry/placement split and local validation guardrails.
- Add canonical minimal stop domain types (`StopId`, `StopPosition`, `Stop`) and a `createStopId` helper under `apps/web/src/domain/types/stop.ts`.
- Extend the local MapLibre type surface with marker contracts to support lightweight in-memory stop marker rendering.
- Persist valid stop placements in local `MapWorkspaceSurface` state with deterministic placeholder naming (`Stop 1`, `Stop 2`, ...).
- Render visible map stop markers from local state and clean them up safely with map lifecycle teardown.
- Add ADR 0011 documenting local stop state and marker rendering boundaries.
- Narrow the MapLibre workspace typing around click-location feature queries with explicit rendered/source feature and geometry contracts.
- Add a typed source-reference helper for style-layer-derived source queries used by stop-placement validation.
- Update stop-placement eligibility checks to use line-geometry-aware rendered query checks with typed source-feature fallback.
- Add ADR 0012 documenting the minimal MapLibre feature-query contract decision for stop-placement validation.
- Slice 008: finalize stop placement with explicit mode gating, street-based click validation, and minimal local stop creation boundaries.
- Slice 008 constraints: no line editing, routing/pathfinding, simulation/economy behavior, or persistence introduced in this slice.
- Add a narrow stop-only selection state (`none` or one `StopId`) in `MapWorkspaceSurface` and keep it independent from pointer telemetry and placement feedback state.
- Keep stop selection slice-local to placement interactions, selecting newly placed stops and clearing selection on invalid placement attempts.
- Add ADR 0014 documenting local stop-only selection boundaries and explicit non-goals against generalized entity-selection frameworks.
- Lift stop selection ownership to `App.tsx` via a typed map-to-shell callback contract for inspector rendering.
- Add a minimal selected-stop inspector view in the right panel with empty state and stop id/label/lng-lat details only.
- Add ADR 0015 documenting stop selection projection boundaries from map workspace to shell inspector.
- Refine stop selection transitions to a strict single-source contract (`null | { selectedStopId }`) shared by marker highlighting and inspector state.
- Clear stop selection when clicking non-stop map area in inspect mode, while keeping marker-click stop selection deterministic.
- Simplify the right-panel inspector to the stop-id contract and add ADR 0016 documenting the updated selection transition rules.
- Refine map placement-mode feedback with a typed UI contract, centralized feedback copy constants, and an always-visible placement-mode indicator while `place-stop` is active.
- Add ADR 0017 documenting placement-feedback UI contract boundaries and explicit non-goals.
- Set the startup viewport baseline to Hamburg so the map opens in a city-scale planning context.
- Correct the bootstrap basemap to a street-legible MapLibre-compatible style for stop-placement readability.
- Preserve street-based stop-placement constraints while updating only map bootstrap style/viewport baseline values.
- Add ADR 0018 documenting Hamburg-focused map bootstrap centralization and city-scale readability constraints.

