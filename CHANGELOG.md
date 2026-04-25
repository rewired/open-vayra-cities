# Changelog

All notable changes to this project will be documented in this file.

## 2026-04-25

- Slice 039: refactor selected-line inspector into a compact summary header with issue/readiness pills and action-first dialog entry points (`Edit frequency`, `Service plan`, `Departures`, `Projected vehicles`, `Route baseline`).
- Slice 039: move always-visible frequency editing and detailed service/departure/vehicle/route sections into dedicated selected-line dialog components while preserving existing projection wiring and callback contracts.
- Slice 039: show truthful unavailable states in dialog content when selected-line projections or route-baseline metrics are null/missing.
- Add ADR 0094 documenting compact selected-line inspector dialog workflow boundaries and explicit non-goals.

- Slice 038: replace inspector stacked composition with a tabbed UI-local state model (`Network`, `Lines`, `Debug`) and remove the `Active mode` line from inspector content.
- Slice 038: keep `Network` tab focused on concise network-level summary metrics only (stops, completed lines, projected vehicles, active service band, global state, and service status counts).
- Slice 038: add `Lines` tab list-first behavior (completed-line list by default, explicit Back action from selected-line detail) while reusing existing read-only projection wiring.
- Slice 038: move technical/dev-focused details (raw selected ids, session counts, configured/degraded counts, and schematic caveat text) into `Debug`.
- Add ADR 0093 documenting inspector tab-state boundaries, list-first line-detail behavior, and explicit non-goals.

## 2026-04-24

- Slice 028: document the product-style map-centric shell rationale as a layout/presentation-only consolidation (integrated top bar, real-tool left rail, contextual inspector, selected-line bottom tray, and dark basemap decisions).
- Slice 028 non-goals preserved: no simulation/routing/projection semantic changes, no fake KPIs or fabricated dashboard data, no out-of-scope feature surfacing, and no mobile/multimodal expansion.
- Add ADR 0092 documenting map-centric shell presentation boundaries and explicit non-goals.

- Slice 037: add a compact, read-only selected-line context tray near the map workspace bottom and render it only when a completed line is selected.
- Slice 037: show existing selected-line/session/projection values only (line id/label, stop count + compact stop sequence, segment count, total route time, active-band headway, next departure, projected vehicle count).
- Slice 037 non-goals preserved: no simulation/routing/projection behavior changes, no new interactive focusable controls, and no mobile/multimodal scope expansion.
- Add ADR 0091 documenting context-tray placement, projection-consumption boundaries, and explicit non-goals.

- Slice 036: switch `MAP_WORKSPACE_BOOTSTRAP_CONFIG.styleUrl` from CARTO Positron to CARTO Dark Matter GL (`https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json`) for a dark, MapLibre-compatible no-key startup basemap.
- Slice 036: preserve centralized bootstrap ownership of style URL and keep attribution behavior unchanged without introducing API-key/secret-dependent providers.
- Slice 036 non-goals preserved: no map interaction/lifecycle behavior changes and no style URL duplication outside bootstrap config.
- Add ADR 0090 documenting dark basemap bootstrap decision, no-key provider constraint, and explicit non-goals.

- Slice 035: replace the split app header + simulation controls stack with one integrated top bar containing CityOps brand, day/time + active time-band readout, play/pause/reset controls, discrete `1x`/`5x`/`10x`/`20x` speed buttons, and compact session load/export actions.
- Slice 035: update the desktop shell grid to a single `top-bar` structural row and remove separate `header`/`controls` layout rows.
- Slice 035 non-goals preserved: no simulation-clock semantic changes, no new speed ids, no session import/export contract changes, and no mobile or multimodal scope expansion.
- Add ADR 0089 documenting unified top-bar composition boundaries and explicit non-goals.

- Slice 027: apply a UI-only post-slice density/declutter pass that keeps planning summaries foregrounded while moving lower-priority diagnostics behind collapsed disclosure blocks in the inspector/map overlays.
- Slice 027 non-goals preserved: no simulation/routing/projection/loader/export semantics changes, no persistence/backends/scenario/replay/etc., and no mobile/multimodal expansion.
- Add ADR 0085 documenting dev UI density/disclosure rationale (including intentional non-use of browser zoom detection) and explicit non-goals.

- Slice 034: keep static network summary essentials (stops, completed lines, projected vehicles, active service band, and service-status counts) always visible in the inspector.
- Slice 034: move lower-priority static network diagnostic counts (degraded projected vehicles and configured service lines) into a collapsed `Debug details` subsection in the inspector summary.
- Slice 034: add compact summary/disclosure styling for the inspector summary block while preserving existing projection/service semantics.
- Add ADR 0088 documenting static network summary disclosure boundaries and explicit non-goals.

- Slice 033: keep selected-line identity, frequency editing, and compact readiness/service/departure/vehicle summaries always visible while adding an always-visible blockers/warnings summary line whenever issues exist.
- Slice 033: move heavy selected-line diagnostics behind disclosures (full readiness issue list, detailed service notes, upcoming departure lists, and projected vehicle departure-minute lists) while preserving existing projection wiring.
- Slice 033 non-goals preserved: no simulation/domain/projection behavior changes and no new transport-mode/mobile scope.
- Add ADR 0087 documenting selected-line inspector disclosure boundaries, critical blocker visibility, and explicit non-goals.

- Slice 032: refactor the left-panel workspace mode control to show a compact current-mode chip and icon-first mode buttons with explicit `aria-pressed` active state semantics.
- Slice 032: tighten `.tool-mode-control*` spacing/button density while preserving desktop keyboard focus visibility and accessible names via `aria-label`/`title`.
- Slice 032 non-goals preserved: no tool removals, no workspace mode behavior changes, and no simulation/domain scope expansion.
- Add ADR 0086 documenting tool-mode control compaction, icon-first accessibility semantics, and explicit non-goals.

- Slice 031: add a reusable native `<details>/<summary>` `DebugDisclosure` UI component for keyboard-accessible collapsed diagnostics sections.
- Slice 031: keep compact map workspace overlays visible by default while relocating map telemetry, interaction lifecycle text, feature-count diagnostics, and draft metadata into a collapsed debug disclosure block.
- Slice 031 non-goals preserved: no map interaction/sync/rendering/projection semantics changes and no simulation/domain behavior changes.
- Add ADR 0085 documenting map workspace debug disclosure presentation boundaries and explicit non-goals.

- Slice 026: add a top simulation control bar near the header with prominent day/time/active-band readout, a single play/pause toggle icon button, reset icon button, and discrete slider-like speed selection for canonical `1x`/`5x`/`10x`/`20x`.
- Slice 026: refactor session load/export actions into compact accessible icon buttons, convert static network summary and selected-line service/departure sections to compact tables, and move heavier debug diagnostics into collapsible details blocks.
- Slice 026 non-goals preserved: no simulation/routing/projection semantics changes, no loader/export contract changes, no persistence/savegame/scenario/fixture replay, no demand/economy/passenger/fleet/depot/layover logic, no backend, no multimodal expansion, and no mobile behavior.
- Add ADR 0084 documenting the Slice 026 dev UI declutter and control-bar reorganization rationale and explicit non-goals.

- Slice 025: refactor `App.tsx` by extracting shell session state/commands, simulation clock lifecycle control, projection aggregation, inspector rendering boundaries, and session load/export UI actions into focused modules while preserving behavior.
- Slice 025: keep planning session truth in-memory and shell-owned through hooks, keep inspector components presentational, and avoid test-suite reorganization beyond boundary fallout.
- Add ADR 0083 documenting the Slice 025 App shell boundary refactor rationale, extracted responsibilities, behavior-preserving intent, and explicit non-goals.

- Slice 024: refactor `MapWorkspaceSurface.tsx` boundaries by extracting street snap resolution, interaction bindings, lifecycle utilities, and map workspace UI feedback projection helpers into focused map-workspace modules while preserving behavior.
- Slice 024: keep React/session ownership in `MapWorkspaceSurface` with callback-driven helper contracts and no gameplay/UI semantics changes.
- Add ADR 0082 documenting the Slice 024 boundary-refactor rationale, extracted responsibilities, behavior-preserving intent, and explicit non-goals.

- Slice 023b: document builder-vs-source-vs-rendered diagnostics rationale, source `setData(...)` versus style-readiness lifecycle distinction, completed-line rendering hardening, and explicit custom-layer ordering helpers/coverage.
- Slice 023b: add focused deterministic tests for completed-line and vehicle GeoJSON builder counts/filtering, custom-layer order/id-list helpers, and fixture-backed Hamburg line behavior for completed lines and projected/degraded vs unavailable vehicle rendering.
- Add ADR 0081 documenting Slice 023b diagnostics boundaries, lifecycle separation, deterministic layer-order enforcement, and explicit non-goals.

- Slice 030: add a dedicated deterministic map workspace custom-layer ordering helper that reapplies the canonical CityOps stack through typed `moveLayer(...)` calls.
- Slice 030: invoke custom-layer order reapplication from the centralized source synchronization path so ordering is restored consistently after style/layer readiness transitions.
- Slice 030: tighten local MapLibre typing with a narrow `moveLayer(layerId, beforeId?)` contract and generic typed GeoJSON source lookup to remove source-sync type casts.
- Add ADR 0080 documenting deterministic custom-layer ordering reapplication in centralized sync flow and typed `moveLayer` boundary.

- Slice 029b: replace split selected/non-selected completed-line foreground layers with one unfiltered completed-line foreground layer using data-driven `selected` paint expressions.
- Slice 029b: add a completed-line casing layer beneath the foreground layer for map-contrast readability while preserving completed-line selection emphasis.
- Slice 029b: preserve completed-line click selection semantics by binding interactions to the unified foreground layer and removing duplicate selected-layer handlers.
- Add ADR 0079 documenting unified completed-line foreground rendering and optional casing-layer rationale.

- Slice 029a: split map workspace synchronization into immediate source `setData(...)` updates when source handles already exist versus style-ready fallback creation when source/layer registration is still required.
- Slice 029a: limit `runWhenMapStyleReady(...)` usage in `MapWorkspaceSurface.tsx` to safe source/layer creation paths and avoid delaying reactive stop/line/vehicle data writes unnecessarily.
- Add ADR 0078 documenting source/layer ensure-versus-data-write lifecycle separation and explicit non-goals.

- Slice 029: add a shared `syncAllMapWorkspaceSources(...)` map workspace helper to ensure stop/completed-line/draft-line/vehicle sources and layers, synchronize source data, enforce deterministic custom layer order, and return source readback diagnostics.
- Slice 029: replace duplicated map source/layer orchestration across map load, style-ready stop/line/vehicle effects, and lifecycle update paths with the shared helper to keep behavior consistent.
- Add ADR 0077 documenting unified map source synchronization helper ownership, layer-order enforcement rationale, and explicit non-goals.

- Slice 023a: fix loaded-session MapLibre synchronization by ensuring stop, completed-line, draft-line, and vehicle sources/layers are synchronized during map load and style-ready updates.
- Slice 023a: remove load-handler stale-closure risk by reading current placed-stop, selection, draft, session-line, and vehicle-projection values from lifecycle-safe refs.
- Slice 023a: add compact HUD line GeoJSON diagnostic count (`Line features`) while preserving existing vehicle feature diagnostics.
- Slice 023a: add focused unit coverage for completed-line GeoJSON feature generation (segment-first geometry preference, selection flag semantics, stop-order fallback, and insufficient-geometry exclusion).
- Add ADR 0076 documenting loaded-session map source synchronization rationale, lifecycle-safe ref usage, diagnostics scope, and explicit non-goals.

- Slice 023 (selected-line loader): add a user-facing `Load line JSON` action that reads one browser-selected JSON file, safely parses it, validates it through the existing selected-line export validator, and reports compact parse/validation failures.
- Slice 023 (selected-line loader): add a pure validated selected-line export session conversion helper that maps payload stops/line into canonical in-memory session state while preserving ids, ordered stops, time-band frequencies, route segments, and stop labels.
- Slice 023 (selected-line loader): apply replacement-only load semantics (replace current in-memory stops/lines, select loaded line, clear selected stop, clear draft-line state) without route recomputation.
- Slice 023 (selected-line loader): add fixture-backed/unit coverage for deterministic conversion, validation boundary reuse, and all-null Hamburg fixture frequency preservation.
- Add ADR 0075 documenting validated selected-line export session loading boundaries, replacement semantics rationale, fixture location decision, and explicit non-goals.

- Slice 028: switch projected vehicle markers from symbol glyph contracts to canonical circle-based layer rendering while preserving existing vehicle source/layer ids.
- Slice 028: formalize degraded-vs-normal marker distinction through canonical circle styling semantics keyed by projected feature properties.
- Slice 028: expand vehicle GeoJSON builder test coverage to lock map-facing projected/degraded marker feature contracts.
- Slice 028: add HUD diagnostic counts for projected vs degraded projected vehicle totals.
- Add ADR 0074 documenting circle-layer semantics, map-native GeoJSON rendering boundary, and explicit non-goals.

- Slice 027: replace projected vehicle map marker rendering from symbol/text contracts to a circle-layer contract in `mapRenderConstants.ts` and `MapWorkspaceSurface.tsx`.
- Slice 027: remove vehicle text-field/glyph layout dependency and bind a canonical circle paint expression keyed by the `degraded` feature property.
- Slice 027: add higher-visibility vehicle marker radius plus contrasting near-white circle stroke for legibility over streets and stop markers.
- Add ADR 0073 documenting the vehicle circle-layer rendering contract and explicit non-goals.

- Slice 022V (vehicle projection): derive current-minute bus vehicle projections from theoretical departures plus stored route segments/timing, with map-native GeoJSON rendering output and projection-only status semantics.
- Slice 022V non-goals preserved: no demand/economy/passenger/fleet/depot/layover/dispatch/persistence/backend/import/savegame/scenario/replay/mobile/multimodal scope expansion.
- Add ADR 0072 documenting the post-departure-schedule derived vehicle projection rationale and visual-projection-only bus boundary.

- Slice 026: derive `currentSimulationMinuteOfDay` and active time band in `App.tsx`, then feed existing departure schedule projection plus completed lines/route segments into the vehicle projection module for one canonical current-minute projection pass.
- Slice 026: add compact network projected-vehicle totals (projected and degraded projected counts) to the existing inspector summary area.
- Slice 026: add a selected-line projected vehicles section showing count, active departure minutes, and degraded note when applicable using selected-line vehicle projection output.
- Slice 026 non-goals preserved: no demand/economy/passenger/fleet/depot/layover/capacity KPIs, no authoritative vehicle state owner, and no mobile-specific behavior.
- Add ADR 0071 documenting shell-level vehicle projection summary consumption and selected-line inspector boundaries.

- Slice 025: add canonical vehicle map rendering contracts (source/layer ids plus symbol paint/layout) in `mapRenderConstants.ts`.
- Slice 025: add typed `vehicleGeoJson` builder that maps derived line-vehicle projection output into marker features with projected-vehicle id, line id, projection status, and degraded flag properties.
- Slice 025: wire `App.tsx` to project network departure schedules and current-minute vehicle projections, then inject derived output into `MapWorkspaceSurface` for render-only map consumption.
- Slice 025: register/update vehicle source and layer via existing style-ready map lifecycle and render only active `projected`/`degraded-projected` entries (excluding `unavailable` markers).
- Add ADR 0070 documenting vehicle map render contract ownership and projection-to-map boundary constraints.

- Slice 024: add pure `routeGeometryInterpolation` domain helper to clamp segment progress ratios and project coordinates along ordered route geometry by walking leg distances (2-point and multi-point support).
- Slice 024: reuse route-geometry interpolation in line-vehicle projection so marker coordinates follow intermediate geometry points instead of endpoint-only interpolation.
- Slice 024: add focused unit coverage for ratio clamping, finite-ratio guarding, 2-point and multi-point interpolation, terminal clamping, and minimum-geometry validation.
- Add ADR 0069 documenting route-geometry interpolation helper boundaries and explicit non-goals.

- Slice 023: add canonical line-vehicle projection domain types (`LineVehicleProjectionId`, projection status union, per-vehicle contract, per-line result, and network summary) for current-minute marker projection boundaries.
- Slice 023: add pure `projectLineVehicleNetwork` projection module that consumes current minute, active time band, existing departure schedule output, and stored `line.routeSegments` to derive active in-flight departures and marker coordinates without route recomputation.
- Slice 023: map degraded departure/service conditions to `degraded-projected`, emit optional unavailable line notes without creating markers, and preserve immutable input contracts.
- Slice 023: add focused unit coverage for active-departure filtering, degraded status mapping, unavailable line-note behavior, and input immutability checks.
- Add ADR 0068 documenting current-minute line-vehicle projection boundaries and explicit non-goals.

- Slice 021: add pure current-time-band departure schedule projection helpers that reuse current service projection output to derive deterministic active-band departure rasters, previous/next departure values, minutes-until-next, and network summary totals.
- Slice 021: add compact selected-line inspector departure schedule rendering (status, headway, previous/next departure, minutes until next departure, active-band departure count, and capped upcoming departures list).
- Slice 021: add fixture-backed and unit test coverage for unavailable/available/degraded departure semantics, bounded active-band minute windows, and no route-segment recomputation during projection.
- Slice 021 non-goals preserved: no demand/economy/passenger/vehicle execution, no dispatch/fleet/depot/layover logic, no routing recalculation, and no import/persistence/backend/savegame/scenario/fixture replay/mobile scope expansion.
- Add ADR 0067 documenting deterministic active-time-band departure projection boundaries and explicit non-goals.

- Slice 022: extend line service network projection summary with `totalCompletedLineCount` while preserving `totalLineCount` as a backward-compatible alias.
- Slice 022: add a compact active-service subsection under static network summary in `App.tsx` showing active time band and configured/degraded/not-configured/blocked completed-line counts.
- Slice 022 non-goals preserved: no simulation execution changes, no demand/economy/passenger KPIs, and no broad inspector layout redesign.
- Add ADR 0066 documenting active-service network summary projection consumption in the shell inspector.

- Slice 021: add a compact line-selected service inspector projection helper (`projectLineSelectedServiceInspector`) that derives active-band label, service status label, headway/departure labels, route-time/segment totals, blocker/warning counts, and a bounded note list from canonical line service projection output.
- Slice 021: refactor `App.tsx` line-selected inspector and status-bar selected-line frequency hint to consume domain projection output instead of ad-hoc active-band frequency semantics in React.
- Slice 021 non-goals preserved: no demand/economy/vehicle/satisfaction KPI additions.
- Add ADR 0065 documenting compact line-selected service inspector projection ownership and UI consumption boundary.

- Slice 020: add a new line-service plan projection module and canonical projection types for active-band service status, per-line output, optional notes, and network-level summaries.
- Slice 020: add a compact inspector service section that consumes projection output (active-band status/headway/departures plus structural service totals) instead of ad-hoc component-local derivation.
- Slice 020: add line-level and network-level projection unit tests covering blocked/not-configured/configured/degraded status behavior.
- Slice 020 non-goals preserved: no demand/economy/passenger/vehicle/service execution/rerouting/import/persistence/backend/savegame/scenario/fixture replay/multimodal/mobile scope expansion.
- Add ADR 0064 documenting projection timing (after clock/readiness), readiness reuse, fallback-only `degraded` handling, and planning-only departures/hour semantics.

- Slice 019: add a pure simulation clock baseline (deterministic day/minute timestamp, running-state transitions, canonical speed controls, reset support, and elapsed-time advancement helpers) outside React and map rendering modules.
- Slice 019: add canonical clock constants and full-day minute-range-to-time-band mapping for deterministic active MVP time-band derivation.
- Slice 019: add shell status-bar clock projection and controls for pause/resume/speed/reset, plus current day/time/time-band/running-state display.
- Slice 019: add unit tests for deterministic clock initialization, pause/run behavior, speed semantics, day-wrap progression, reset, time-band coverage, formatting, and invalid-speed fallback.
- Slice 019 non-goals preserved: no demand/economy/passenger/vehicle/service execution, no route recalculation, no fixture replay/import/persistence/backend scope expansion.
- Add ADR 0063 documenting the simulation clock baseline decision, architecture boundaries, and explicit non-goals.

- Slice 018c: introduce pure line-readiness diagnostics at the domain boundary to keep readiness evaluation deterministic and UI-agnostic.
- Slice 018c: add typed readiness issue code/severity constants plus a typed status projection contract for selected-line readiness output.
- Slice 018c: add a selected-line inspector readiness section that projects readiness status, issue summaries, and compact diagnostic details.
- Slice 018c: add fixture-backed readiness test coverage for deterministic ready/blocked/partial classification and issue projection behavior.
- Slice 018c non-goals preserved: no simulation, economy, demand, import, or persistence scope expansion.

- Slice 018b: project selected-line readiness in `App.tsx` via the pure domain `evaluateLineServiceReadiness(selectedLine, placedStops)` evaluator instead of component-local readiness semantics.
- Slice 018b: add a compact line-selected readiness inspector section covering status, configured/missing time-band counts, route-segment count, blocker/warning counts, and a short issue list with code tags.
- Slice 018b non-goals: no simulation/demand/economy/revenue/satisfaction/vehicle KPIs added to inspector output.
- Add ADR 0061 documenting selected-line readiness projection boundaries and evaluator ownership in the domain layer.

- Slice 018a: add canonical line-service readiness diagnostic constants (`LINE_SERVICE_READINESS_ISSUE_CODES`, `LINE_SERVICE_READINESS_ISSUE_SEVERITIES`) under `apps/web/src/domain/constants/lineServiceReadiness.ts`.
- Slice 018a: move readiness domain contracts to `apps/web/src/domain/types/lineServiceReadiness.ts` and derive issue-code/severity unions from canonical constants.
- Slice 018a: refactor readiness evaluator/tests to consume canonical readiness constants, removing ad-hoc diagnostic string literals from readiness paths.
- Add ADR 0060 documenting readiness diagnostic code/severity constant ownership and readiness-only scope.

- Slice 018: add a pure domain line-service readiness evaluator (`evaluateLineServiceReadiness`) for one completed in-memory line against placed stops and canonical time bands.
- Slice 018: export strongly typed readiness contracts (status union, issue severity/code/shape, and summary/result structures with counts and flags).
- Slice 018: enforce structural checks for line identity/label, stop-chain coherence, placed-stop references, route-segment existence/count/adjacency/line-id coherence, timing usability, and route-status validity.
- Slice 018: enforce service-configuration checks for canonical time-band presence, frequency validity (unset or positive finite), at-least-one configured band, complete-band coverage, and fallback-only routing detection.
- Slice 018: add unit tests covering ready, blocked, and partially-ready classification outcomes.
- Add ADR 0059 documenting line-service readiness evaluator boundaries and non-goals.

- Slice 017: add a pure selected-line export fixture validator for committed fixture verification workflows.
- Slice 017: add typed validation results with machine-readable issue codes for deterministic failure classification.
- Slice 017: add validation tests against the committed Hamburg fixture plus required negative validation cases.
- Slice 017 non-goals: no import flow, no persistence changes, and no simulation-scope expansion.
- Slice 017: reference ADR 0057 for validator boundaries, invariants, and constant ownership context.

- Slice 016j: add a pure selected-line export payload validator (`validateSelectedLineExportPayload`) that accepts unknown input and returns a discriminated typed success/failure result with multi-issue collection.
- Slice 016j: enforce schema/kind/timestamp/source checks plus line/stop/route-segment/metadata coherence rules, including canonical time-band and route-status validation.
- Slice 016j: centralize geometry-endpoint and travel-time validation tolerances in canonical domain constants for export parsing boundaries.
- Add ADR 0057 documenting selected-line export payload validation boundaries and tolerance constant ownership.

- Slice 016: add a selected-line JSON export action that emits one typed export payload for the currently selected completed in-memory line.
- Slice 016: keep stop session truth shell-owned in `App.tsx` so export assembly and map/inspector projections resolve from one canonical stop list.
- Slice 016: enforce export payload boundaries to only include the selected line plus stops referenced by that line, excluding unrelated session entities.
- Slice 016 non-goals: no persistence, no import flow, no backend/API integration, and no simulation model changes.
- Add ADR 0056 documenting selected-line in-memory export scope, route-segment serialization truth contract, shell-owned stop truth rationale, and schema/versioning fixture-stability intent.

- Slice 015i: add canonical selected-line export payload types in `apps/web/src/domain/types/selectedLineExport.ts`, including schema-version and kind discriminators plus typed root/line/segment/stop/metadata blocks.
- Slice 015i: keep exported route-segment fields directly aligned to `LineRouteSegment` field truth (id, line/from/to stop ids, ordered geometry, distance, in-motion/dwell/total minutes, and status) without recomputation semantics.
- Add ADR 0055 documenting selected-line export schema typing boundaries and non-goals.

- Slice 015h: lift canonical placed-stop session ownership to `App.tsx` as `readonly Stop[]` and derive inspector/network stop counts from that single source of truth.
- Slice 015h: update `MapWorkspaceSurface` to consume injected `placedStops` plus immutable stop-appender callback, removing local stop ownership and count-export callback flow.
- Slice 015h: reuse injected canonical stops for stop/line GeoJSON source synchronization and fallback line-segment generation during draft completion.
- Add ADR 0054 documenting canonical shell-owned stop state and map-surface stop sync boundary.

- Slice 015g: formalize the routing-support boundary for completed lines so canonical `routeSegments` are introduced now for deterministic map projection and structural inspector baselines, without claiming full routing simulation completeness.
- Slice 015g: keep fallback routing explicitly deterministic and limited (ordered adjacent stop-pair resolution with deterministic ids/order), and clarify that fallback geometry/time outputs are continuity baselines rather than final service truth.
- Slice 015g: keep completed-line rendering segment-first by preferring persisted route-segment geometry for GeoJSON assembly, with stop-order fallback only when routed coordinates are unavailable.
- Slice 015g: document explicit non-goals (no full graph routing, traffic, demand/economy/vehicle simulation, persistence, backend/remote routing, or multimodal expansion).
- Add ADR 0053 documenting routing-support boundary timing, fallback resolver intent/limits, segment-first rendering semantics, and non-goals.

- Slice 015f: add a lightweight Vitest test runner baseline for `apps/web` with `test` and `test:watch` scripts.
- Slice 015f: add root-level `test:web` and `test` scripts to aggregate web package unit-test execution through existing pnpm workspace tooling.
- Slice 015f: add focused unit coverage for fallback line-routing helper behavior (segment cardinality/order, deterministic ids, aggregate distance/time compatibility, fallback status preservation, and explicit insufficient-stop failure contract).
- Add ADR 0052 documenting unit-test runner adoption and fallback-routing test boundaries.

- Slice 015e: add a compact line-selected inspector `Route baseline` block with aggregate route-segment metrics (segment count, total distance, in-motion minutes, dwell minutes, and total line minutes).
- Slice 015e: add per-segment structural/debug rows (from/to stop ids, distance/travel values, and explicit route-status labels including `Fallback routed`).
- Slice 015e: show explicit fallback-routing disclaimer text when any segment status is `fallback-routed`, avoiding accuracy claims.
- Add ADR 0051 documenting structural-only route baseline inspector boundaries and explicit non-goals against demand/economy/vehicle KPIs.

- Slice 015d: update completed-line GeoJSON assembly to prefer persisted `routeSegments` geometry over stop-order fallback when routed segment coordinates are available.
- Slice 015d: flatten completed-line segment geometries in segment order and de-duplicate shared adjacent boundary coordinates to avoid duplicate vertices.
- Slice 015d: preserve completed-line feature properties (`lineId`, `selected`) to keep existing feature-first map selection behavior unchanged.
- Add ADR 0050 documenting route-segment-first completed-line geometry projection and explicit draft-preview non-goal.

- Slice 015c: add pure fallback line-routing helper (`buildFallbackLineRouteSegments`) that validates ordered stop sequences, builds deterministic per-pair route segments, supports explicit closure semantics, computes fallback geometry/distance/travel times, and marks segments as `fallback-routed`.
- Slice 015c: update map workspace line completion to populate completed lines with fallback-derived `routeSegments` while preserving existing draft preview behavior.
- Add ADR 0049 documenting fallback route-segment generation boundaries and explicit non-goals.

- Slice 015b: add canonical routing baseline constants in `apps/web/src/domain/constants/routing.ts` for fallback bus speed, default dwell minutes, and minimum in-motion travel minutes.
- Slice 015b: add route travel-timing helpers in `apps/web/src/domain/types/lineRoute.ts` that consume canonical routing constants instead of local numeric defaults.
- Add ADR 0048 documenting canonical routing baseline constant ownership and helper import boundaries.

- Slice 015a: add canonical line-route domain primitives (`LineSegmentId`, `RouteGeometryCoordinate`, branded route distance/travel time, and explicit `RouteStatus` with `fallback-routed`) in `apps/web/src/domain/types/lineRoute.ts`.
- Slice 015a: extend canonical `Line` with readonly typed `routeSegments` using `LineRouteSegment[]`, and initialize new lines with an empty route-segment list in map workspace line completion flow.
- Add ADR 0047 documenting the canonical line-route segment type surface and line-level route-segment ownership boundary.

## 2026-04-23

- Slice 014n: keep street-snap fallback strictly secondary by returning direct-hit candidates immediately when available.
- Slice 014n: add stricter fallback acceptance gating (tighter fallback tolerance, minimum feature-match quality, and ambiguity rejection for near-equal fallback candidates).
- Slice 014n: centralize fallback acceptance thresholds in map workspace placement constants to avoid component-local literals.
- Add ADR 0046 documenting strict-secondary fallback gating and ambiguity rejection boundaries.

- Slice 014m: extend street snap candidate ranking with deterministic metadata precedence (direct-hit provenance, then feature/layer match strength, then pixel distance).
- Slice 014m: centralize snap candidate ordering in one compare helper and reuse it across line-segment, direct-hit, fallback, and final candidate resolution paths for consistent selection behavior.
- Add ADR 0045 documenting deterministic street snap ranking and shared compare semantics.

- Slice 014l: add a map style-readiness guard for reactive stop/line source-layer sync so source and layer registration only runs after MapLibre style load completion.
- Slice 014l: extend local MapLibre typing with `isStyleLoaded()` and `'styledata'` lifecycle event support for strict typed readiness gating.
- Add ADR 0044 documenting style-readiness gating for map source/layer synchronization and crash prevention boundaries.

- Slice 014k: move inspect selection entry to MapLibre feature-first interactions so stop/line layer clicks own selection transitions, while empty-map inspect clicks clear both selections.
- Slice 014k: add narrow typed feature-property decoders for `stopId` and `lineId` in `MapWorkspaceSurface` to keep stop/line click payload parsing explicit and local.
- Slice 014k: gate inspect-mode map click clearing behind a rendered-feature check for interactive stop/line layers to preserve current feature-priority semantics.
- Add ADR 0043 documenting feature-first interaction entry and inspect empty-map clear boundaries.

- Slice 014j: remove SVG polyline overlay projection (`toProjectedLineSegments`, `projectionRefreshTick`, and render-lifecycle projection refresh binding) as active line rendering in `MapWorkspaceSurface`.
- Slice 014j: add typed GeoJSON LineString builders for completed session lines and active draft preview under `apps/web/src/map-workspace/lineGeoJson.ts`.
- Slice 014j: centralize completed/draft line source and layer identifiers plus paint/filter style constants in `mapRenderConstants.ts`, including selected-line filter split.
- Slice 014j: register MapLibre completed/draft line sources and line layers, refresh source data reactively from `sessionLines`, `selectedLineId`, `draftLineState.stopIds`, and placed stop coordinates.
- Slice 014j: wire completed-line selection through layer-constrained feature click handlers (`map.on('click', completed-line-layer-id, ...)`) while preserving inspect/build-line stop interaction semantics.
- Add ADR 0042 documenting map-native line rendering and line-feature interaction ownership.

- Slice 014i: remove DOM stop-marker rendering (`createStopMarker`/`syncStopMarkers`) as active map truth and migrate stop rendering to one map-native GeoJSON source with circle/symbol layers.
- Slice 014i: add a typed stop GeoJSON builder with explicit stop feature properties (`stopId`, `selected`, `draftMember`, `buildLineInteractive`) and refresh source data from reactive stop/tool state.
- Slice 014i: replace marker-element click handling with layer-constrained feature clicks (`map.on('click', stop-layer-id, ...)`) for inspect/build-line stop interaction flow.
- Add ADR 0041 documenting map-native stop source/layer rendering and feature interaction boundaries.

- Slice 014h: switch map overlay projection refresh binding from interaction-only (`move`/`zoom`/`rotate`) triggers to render-lifecycle (`render` + `idle`) subscriptions so projection recomputation tracks active map animation frames.
- Slice 014h: preserve lightweight single-`requestAnimationFrame` refresh coalescing while keeping stop-order schematic polyline projection semantics unchanged.
- Add ADR 0040 documenting render-lifecycle-driven projection refresh boundaries and explicit non-goals.

- Slice 014g: extend the local MapLibre marker constructor typing with explicit stop-marker `anchor` and `offset` options to preserve strict typed API usage.
- Slice 014g: centralize stop-marker visual anchor/offset constants in the map-workspace constants layer and consume them in marker creation.
- Slice 014g: align stop-marker CSS box/affordance transform centering with explicit centered-anchor semantics for trustworthy stop-position perception.
- Add ADR 0039 documenting stop-marker anchor/offset typing and visual-center alignment boundaries.

- Slice 014f: replace key-based SVG remount refresh with explicit projection refresh triggers across pan/zoom/rotate lifecycle events (`start`/active/`end`) and coalesced refresh ticks.
- Slice 014f: keep the existing SVG overlay architecture while recomputing projected polyline points from current map transform without forcing full overlay remount.
- Slice 014f: clarify completed/draft line overlay semantics and styling as schematic stop-order connections (not street-routed yet), while preserving ordered stop selection plus explicit line completion behavior.
- Add ADR 0038 documenting map overlay refresh lifecycle wiring and schematic line copy boundaries.

- Slice 014e: split stop-placement target handling into explicit street eligibility and snap-resolution phases.
- Slice 014e: add nearest-point snapping from click position to rendered street line (`LineString`/`MultiLineString`) geometry and place stops at snapped lng/lat.
- Slice 014e: centralize map-workspace street snap query/tolerance pixels in a dedicated map-workspace constants module.
- Add ADR 0037 documenting street-placement snap resolution boundaries and non-goals.

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
