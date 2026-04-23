# Changelog

All notable changes to this project will be documented in this file.

## 2026-04-23

- Slice 014d: align `.app-material-icon` with Material Symbols ligature rendering expectations (`display`, `normal` style/weight, and WebKit ligature feature setting) while preserving the existing Material icon baseline and typed icon name flow.
- Add ADR 0036 documenting Material Symbols ligature rendering contract alignment and accessibility non-goals.

- Slice 014c: fix stale stop-marker mode closures so existing markers always resolve click behavior from the current active tool mode.
- Slice 014c: restore completed-line overlay clickability for practical line selection via rendered completed polylines.
- Slice 014c: fix Material Symbols rendering baseline so ligature names render as icons instead of raw text.
- Add ADR 0035 documenting stale marker interaction ownership, completed-line overlay clickability, and icon rendering corrections.

- Slice 014b: enlarge stop marker hit targets and add stronger pointer/hover/active/focus-visible affordances so desktop build-line marker interaction no longer requires pixel-precise clicks.
- Slice 014b: add build-line draft marker membership styling so stop markers already appended to the current draft line are visually confirmed immediately.
- Slice 014b: thread typed draft stop-id membership (`ReadonlySet<StopId>`) into marker synchronization without weakening line-build state contracts.
- Add ADR 0034 documenting stop-marker interaction affordance boundaries and draft-membership marker-state projection.

- Slice 014a: keep build-line completion strictly user-triggered via `Complete line`, preserving the explicit minimum-stop guard and ordered completion transition (append session line, select it, then reset draft).
- Add ADR 0033 documenting explicit user-triggered line completion boundaries and non-goals against auto-complete side effects.

- Slice 014: add a compact static network summary in the inspector with structural-only KPI counts for total stops and completed lines.
- Slice 014: add selected completed-line structural KPI details (stop count plus configured/unconfigured canonical time-band counts) with explicit empty-state messaging.
- Slice 014: expose placed-stop count from map workspace to shell through a minimal callback boundary to support truthful shell-level structural summaries.
- Add ADR 0032 documenting static-network-summary KPI boundaries and explicit non-goals against simulation/demand/economy analytics.

- Slice 013: add canonical time-band model primitives (`TimeBandId`, `MVP_TIME_BAND_IDS`, `TIME_BAND_DISPLAY_LABELS`) as the single source for MVP service-band semantics.
- Slice 013: store completed-line frequency configuration in session state as explicit per-canonical-band values (including unset state).
- Slice 013: enable line-selected inspector per-band interval editing for completed lines with canonical band ordering/labels.
- Slice 013 validation posture: accept positive minute values, treat empty values as unset, reject non-positive values; non-goals remain simulation/routing/demand/economy/persistence changes.

- Lift completed line session state ownership to `App.tsx` and expose map-surface callbacks for session line and selected-line mutation.
- Extend the `line-selected` inspector with one editable minute-interval input per canonical MVP time band.
- Add minimal frequency validation in inspector editing: empty values remain unset, while zero/negative values show inline feedback and are rejected from session state updates.
- Add ADR 0030 documenting line-selected frequency editing boundaries and the shell-owned session line state decision.
- Add branded line-frequency domain typing (`LineFrequencyMinutes`) and canonical per-time-band line frequency mapping (`LineFrequencyByTimeBand`) on `Line`.
- Initialize newly completed build-line session lines with explicit per-band unset frequency state keyed by canonical MVP time bands.
- Add ADR 0029 documenting completed-line frequency initialization boundaries and non-goals.
- Add canonical `TimeBandId` domain type for MVP service-planning time-band identifiers.
- Add canonical ordered `MVP_TIME_BAND_IDS` and `TIME_BAND_DISPLAY_LABELS` domain constants for UI-safe reuse.
- Update inspector rendering to consume canonical time-band constants instead of local literals.
- Add ADR 0028 documenting the canonical time-band module decision and non-goals.

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
- Extend workspace tool modes with an explicit `build-line` literal and replace the mode toggle with dedicated inspect/place-stop/build-line buttons.
- Keep click handling deterministic by limiting stop placement to `place-stop` mode and preventing placement behavior while `build-line` is active.
- Add shell-owned line-build draft selection state and pass it to map workspace and inspector surfaces.
- Add ADR 0020 documenting explicit mode controls and build-line placeholder boundaries.
- Add typed local build-line draft state in `MapWorkspaceSurface` with ordered stop-id capture and draft metadata.
- Make build-line marker clicks append existing stop ids in click order while keeping inspect and place-stop interactions isolated by mode.
- Add minimal draft lifecycle actions (`Cancel draft`, `Complete line`) and gate completion with centralized `MINIMUM_STOPS_PER_LINE` (2).
- Persist completed build-line drafts only in local in-memory session line state.
- Add ADR 0021 documenting local build-line drafting and completion boundaries.
- Replace line-build magic values with canonical `lineBuilding` domain constants for minimum-stop completion and deterministic placeholder label prefix.
- Add minimal selected-line projection to the shell inspector, including id/label, stop count, and ordered stop-id summary.
- Keep the selected-line inspector strictly structural, without demand/economy/service fields.
- Add ADR 0022 documenting line-building constants centralization and minimal selected-line inspector boundaries.
- Slice 011: add first `build-line` mode with explicit ordered existing-stop drafting and completion flow.
- Slice 011: render minimal map lines for local structural feedback only, without routing or service simulation semantics.
- Slice 011: keep line draft and completed line state in-memory only (no persistence or backend sync).
- Slice 011a: load Inter at runtime via `@fontsource/inter` so shell typography no longer relies on fallback-only references.
- Slice 011a: establish Google Material Symbols Outlined as the canonical icon baseline via `@fontsource/material-symbols-outlined`.
- Slice 011a: add a typed minimal Material icon mapping/renderer and apply it to workspace mode buttons only.
- Add ADR 0024 documenting the font-loading and Material icon baseline correction scope and non-goals.
- Slice 011b: keep the map line overlay globally non-blocking while enabling stroke-only click targeting for completed line polylines.
- Slice 011b: keep draft line polylines non-interactive so only completed lines can capture click selection.
- Slice 011b: add a selected completed-line visual variant without changing inspect/placement map click-through behavior.
- Add ADR 0025 documenting the line-overlay pointer-event contract for completed-line selection.
- Slice 011c: enforce explicit mutual exclusivity between stop and completed-line selection in inspect interactions.
- Slice 011c: clear selected line on inspect stop selection and clear both selections on inspect empty-map click.
- Slice 011c: prevent build-line mode from selecting completed lines via overlay clicks and keep draft/completed selection states separate.
- Add ADR 0026 documenting stop/line mutual-exclusivity selection rules and mode-aware constraints.
- Replace additive right-panel inspector sections with an explicit selection-priority state machine (line first, then stop, else neutral empty state).
- Keep selected-line inspector output minimal and structural-only (`id/label`, stop count, ordered stop summary).
- Add ADR 0027 documenting the inspector selection-priority state machine and explicit non-goals.
