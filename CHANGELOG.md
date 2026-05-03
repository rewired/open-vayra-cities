# Changelog

All notable changes to this project will be documented in this file.

## [Unreleased]

### Added
- **Slice 178 — Focused Demand Gap Lifecycle Feedback**:
    - Added a pure `focusedDemandGapLifecycleProjection` to track whether a focused gap is still active in current ranking or has fallen out.
    - Updated `InspectorDemandTab` to render neutral lifecycle feedback when a focused gap is no longer currently ranked.
    - Wired lifecycle projection into the `NetworkPlanningProjections` bundle.
    - Added ADR 0179 documenting the projection-only lifecycle feedback design and non-authoritative resolution claims.
- **Slice 177 — Demand Gap Planning Entrypoint Context Banner**:
    - Added a transient, dismissible planning context banner in the UI shell after triggering a planning entrypoint from a demand gap.
    - Implemented shell-owned state and transient context model to provide guided workflow continuity.
    - Wired context clearing to manual dismissal, clearing demand gap focus, or returning to inspect mode.
    - Added ADR 0178 documenting non-authoritative transient UI context boundaries.
- **Slice 176 — Focused Demand Gap Planning Action Entrypoints**:
    - Added explicit map-focus and tool-mode action entrypoints within the Focused Demand Gap Planning Summary.
    - Preserved pure-projection boundaries by delegating mode transitions to the application shell.
    - Added ADR 0177 documenting non-authoritative planning action entrypoints.
- **Slice 174 — Focused Demand Gap Planning Summary Projection**:
    - Extracted legacy component-local planning guidance semantics into a pure projection module (`focusedDemandGapPlanningProjection.ts`).
    - Wired the new projection into the `NetworkPlanningProjections` bundle via `useNetworkPlanningProjections.ts`.
    - Updated `InspectorDemandTab.tsx` to consume the new projection, rendering deterministic actionable guidance, evidence facts, and an explicit "Clear focus" button.
    - Repaired type issues and established unit test coverage for deterministic guidance derivation.
    - Added ADR 0175 documenting the pure-projection planning guidance architecture.
- **Slice 168d — Shell Panel Spacing and Inspector Disclosure Polish**:
    - Removed vertical separator lines between `left-panel`, `workspace`, and `right-panel` for a more integrated look.
    - Normalized and reduced horizontal padding across shell panels to recover map space.
    - Aligned the top rhythm of the left rail, map workspace, and right inspector panel.
    - Implemented a global heading margin reset (`margin-top: 0`) to prevent unexpected vertical offsets.
    - Reduced visual noise in Inspector disclosures by removing redundant top dividers in expanded content.
    - Added ADR 0171 documenting layout and spacing refinements.
- **Slice 168b — Inspector Icon-Tab Information Architecture Repair**:
    - Refactored Inspector to use an icon-first tabbed navigation (`Overview`, `Lines`, `Demand`, `Service`).
    - Split overloaded `Network` tab into focused `Overview`, `Demand`, and `Service` perspectives.
    - Repaired contrast for `InspectorDisclosure` labels and `Demand Gaps` items for dark theme accessibility.
    - Added ADR 0169 to document the new information architecture.

### Slice 168: Inspector Information Architecture / Collapsible Projection Sections
- Introduced a collapsible information architecture for the Inspector panel to reduce visual density and vertical scroll pressure.
- Created the reusable `InspectorDisclosure` component using native `<details>` and `<summary>` elements with "whisper-weight" styling.
- Refactored the Network tab to move secondary capture, service, pressure, and gap details into collapsible sections while keeping primary KPIs visible.
- Refactored the Selected Line inspector to collapse route sequence and detailed demand contribution notes.
- Added ADR 0168 documenting information architecture decisions and always-visible KPI requirements.

### Slice 158b: Wire OSM Attractor Import Commands and Local Manifest Flow
- Added counted diagnostics for skipped unsupported geometries in `prepare-osm-attractors-source.mjs`.
- Extended test coverage in `prepare-osm-attractors-source.test.mjs` for package scripts, missing census CSV, and invalid GeoJSON.
- Updated documentation in `docs/data/osm-attractor-source-material.md` with explicit output paths.

### Slice 157b: Destatis Census Grid Column Autodetect and CRS Defaults

- Added `--source-preset` support for `destatis-zensus-2022-1km-population`.
- Implemented header and delimiter autodetection for Destatis Zensus 2022 CSV files.
- Applied strict precedence rules: CLI overrides > Preset defaults > Autodetect > Generic Fallbacks.
- Configured automatic EPSG:3035 to WGS84 coordinate conversion when Zensus presets apply.

### Slice 153: Repair Map Layer Registry and Visibility Contract
- Registered the `osm-stop-candidates` overlay in the map layer flyout.
- Set default visibility for OSM stop candidates to `true`.
- Implemented `applyMapLayerVisibility` helper mapping visibility state to MapLibre layers.
- Integrated visibility application into `useMapWorkspaceSourceSync` and `MapWorkspaceSurface`.

### Slice 151: Use Source-Material Manifests in Scenario Setup Demand Orchestration
- Routed scenario setup demand generation through the generic source-material manifest pipeline.
- Updated `setup-scenario.mjs` to invoke `build-scenario-demand.mjs` with `--manifest` for `hamburg-core-mvp`.
- Enforced clear, actionable failure if the required source-material manifest is missing.

### Slice 149: Align Source-Material Kind Contracts After Workplace Attractor Adapter
- Added `workplace-attractors` to the canonical `ScenarioSourceMaterialKind` union.
- Added `workplace-attractors` to `VALID_SOURCE_MATERIAL_KINDS`.
- Added parser test coverage for `workplace-attractors` kind, adapter, and options.
- Added parser test coverage validating the `hamburg-core-mvp.source-material.json` manifest file.

### Slice 148: Generic Workplace Attractor GeoJSON Adapter
- Introduced a generic, scenario-agnostic GeoJSON workplace attractor source adapter (`workplace-attractor-geojson.mjs`).
- Implemented deterministic parsing for `Point`, `Polygon`, and `MultiPolygon` feature types, computing fallback bounding box centroids.
- Configured bidirectional destination time modifiers and bounded verification mappings.
- Added ADR 0150 documenting adapter scoping rules.

### Slice 147: Census Grid Adapter to Generator Integration
- Integrated the generic `census-grid` CSV source adapter into the scenario demand generator (`build-scenario-demand.mjs`).
- Converted normalized population datasets into residential demand nodes with standard time-band distributions.
- Enforced deterministic identifier alignment and multi-source collision verification criteria.
- Added ADR 0149 documenting manifest-to-adapter implementation scopes.

### Slice 146: Generic Census Grid Source Adapter Skeleton
- Introduced a generic population-grid CSV source-material adapter skeleton (`census-grid-csv.mjs`).
- Configured flexible column mappings allowing custom external formats without local hardcoding.
- Implemented data boundary validation enforcing valid bounding boxes and structural integrity.
- Added ADR 0148 documenting implementation scopes.


### Slice 145: Manifest-Driven Scenario Demand Generation
- Integrated the source-material manifest into the scenario demand generator skeleton (`build-scenario-demand.mjs`).
- Resolved enabled `manual-seed` source entries, enforcing scenario ID match verification and single enabled seed constraints.
- Enabled fail-fast evaluation rejecting pathless configurations and enabled unsupported source types.
- Added ADR 0147 documenting manifest-driven demand artifact lifecycle rules.

### Slice 144: Generic Scenario Source Material Manifest
- Introduced a generic, reusable scenario source-material manifest schema and parser.
- Defined canonical types for source entries (`manual-seed`, `census-grid`, `osm-extract`, etc.) mapping external datasets safely.
- Integrated manifest parsing into the scenario demand generator skeleton, supporting workspace-relative input pipelines.
- Added ADR 0146 documenting source configuration decoupling from simulation runtime state.

### Slice 143: Generic Scenario Demand Generator Skeleton
- Introduced a generic, reusable scenario demand artifact generator script (`build-scenario-demand.mjs`).
- Added curated seed format and initial Hamburg seed fixture (`hamburg-core-mvp.seed.json`).
- Integrated demand generation directly into scenario setup orchestration (`setup-scenario.mjs`).
- Added comprehensive validation test suites ensuring strong contract mapping.
- Configured ADR 0145 documenting baseline generator skeleton strategies.

### Slice 142: Scenario Demand Parser Type Hygiene Repair
- Replaced broad unchecked casts in scenario demand artifact parser with strict runtime control-flow type narrowing.
- Re-derived taxonomy domain string unions directly from constants tuples instead of duplicated definitions.
- Extended unit test suites ensuring invalid payloads (such as NaN weights, non-finite bounds, or structurally corrupted records) trigger appropriate parser rejections.
- Added ADR 0144 documenting type safety rules across integration boundaries.

### Slice 141: Scenario-Owned Demand Contracts
- Introduced canonical scenario-owned demand data contracts, defining target runtime truth shapes for demand sources, attractors, gateways, and time-band weights.
- Added strict validation parser accepting `unknown` at public boundaries to narrow constraints without type weakening.
- Configured scenario pointer architecture mapping asset definitions safely.
- Deployed comprehensive suite tracking schema rules.

### Slice 140: Legacy Demand Purge Before Scenario Demand Import
- Removed all legacy/demo demand domain files, types, constants, and JSON data.
- Neutralized demand state in `App.tsx` and removed demand props from shell components.
- Removed demand projections from `useNetworkPlanningProjections.ts`.
- Removed demand UI from `InspectorPanel.tsx`, `SelectedLineInspector.tsx`, and `DebugModal.tsx`.
- Purge demand map layers, sources, and visibility controls from `MapWorkspaceSurface.tsx`, `useMapWorkspaceSourceSync.ts`, and `mapWorkspaceSourceSync.ts`.
- Removed demand constants from `mapLayerUiConstants.ts` and `mapRenderConstants.ts`.
- Added ADR `0142-legacy-demo-demand-purge-before-scenario-import.md`.

### Slice 132: Demand Capture Preview Overlay
- Implemented `demandCapturePreviewProjection.ts` deriving deterministic demand node capture statuses against existing placed stops and the active selected stop.
- Configured spatial highlight ring overrides in `mapRenderConstants.ts` mapping catchment categories into direct style rules.
- Registered visual capture filters safely through `mapWorkspaceSourceSync.ts` and `useMapWorkspaceSourceSync.ts`.
- Enforced strong typing constraints across GeoJSON generators and diagnostic metrics tables.
- Extended vitest criteria catching coordinate mapping errors cleanly.

### Slice 131c: Final Demand Loader Type-Safety Repair
- Removed remaining avoidable type casts (`key as TimeBandId`, `{} as Record<TimeBandId, DemandWeight>`, and `weight as number`) from `loadScenarioDemandNodes.ts`.
- Replaced generic `any` fixture logic and broad `as Response` mocks in loader tests using strict data types and proper `Response` objects.
- Optimized `hamburg-core-mvp.demand.json` integration tests to safely evaluate payloads as strongly-typed models instead of implicit `any` patterns.

### Slice 131b: Demand Loader Hardening and Documentation Compliance
- Hardened the scenario-bound demand loading path by eliminating unsafe type casts in `loadScenarioDemandNodes.ts`.
- Introduced local type guards (`isRecord`, `isDemandNodeRole`, `isDemandClass`) to narrow unknown input safely.
- Refactored `demandCatchment.ts` to iterate over canonical time bands instead of unchecked keys.
- Deleted legacy hardcoded demand models (`mvpDemandScenario.ts` and its test).
- Added parser-oriented validation tests and Hamburg JSON fixture verification in `loadScenarioDemandNodes.test.ts`.
- Added ADR 0140 to record the scenario-bound demand overlay implementation.

### Slice 131: Scenario Demand Overlay Skeleton
- Added demand visibility toggle state in `App.tsx` connected to map workspace capabilities.
- Implemented dynamic client-side loader fetching scenario-bound demand nodes.
- Created GeoJSON mapping layer for spatial nodes and integrated access-radius scoring.
- Added basic demand visualization.

### Slice 103b: Fix Blocking Modal Blur Scope
- Refactored the application layout to separate the blurred app shell from global overlays (modals and toasts).
- Introduced `AppShell.tsx` layout component to manage structural isolation of filtered subtrees.
- Moved `BlockingDataOperationModal` and `ToastHost` outside the `.app-shell` container in `App.tsx`.
- Ensured the blocking modal remains sharp and readable while the application background is dimmed and blurred.
- Added `AppShell.test.tsx` for structural DOM verification and regression prevention.
- Added ADR 0130 documenting the corrective layout decision.

### Slice 103: Blocking Data Operation Modal
- Implemented a reusable `BlockingDataOperationModal` for app-runtime data operations (e.g., loading and consolidating OSM stop candidates).
- Added shell-level `.app-shell--blocked` state in `App.tsx` and `App.css` to dim and blur the background while blocking interactions.
- Integrated phase-based progress reporting into the initial OSM candidate loading flow in `MapWorkspaceSurface.tsx`.
- Added unit tests for the modal component and verified progress clamping and rendering behavior.
- Added ADR 0129 documenting the boundary and rationale for blocking app-runtime modals.

- Flattened the Lines tab and selected-line detail layout, removing nested `inspector-card` wrappers from selected-line sections.
- Replaced the metadata grid with compact chip-based metadata display.
- Fixed route-sequence stop badge text from `[1]` to `1`, and similar for all badges.
- Added a line-context stop focus callback (`onLineSequenceStopFocus`) so clicking a route-sequence stop badge focuses the map without leaving selected-line inspector context.
- Route sequence now uses `idleDisplayMode="edit-only"` for inline rename fields, with CSS override to remove default min-width.
- Added internal scroll area to route sequence with `max-height: clamp(180px, 34vh, 320px)`.
- Converted action buttons to compact icon-led buttons using Material icons (`pace`, `route`, `schedule`, `directions_bus`).
- Added `schedule` Material icon to approved icon set.
- Created ADR 0124 to document flatten scope, route sequence interactions, and non-goals.
- Non-goals: no delete/stop removal/route topology editing, no routing/simulation/persistence changes.

### Slice 074: Network Inventory Summary-First Stop UX
- Refactored the Network tab inventory to be summary-first for stops, replacing full global stop rows with compact stop summary KPIs.
- Removed inline stop rename controls from the Network inventory so stop rename is no longer presented as a primary global workflow.
- Added a compact stop selection/debug list limited to a small subset, including hidden-count feedback for large stop sets.
- Preserved line-related inventory rows and inline line rename controls to align rename entrypoints with line context.
- Added ADR 0122 to document scope, decision boundaries, and non-goals for summary-first network inventory behavior.

### Slice 073: Lines-Tab List Row Selection and Inline Rename Refactor
- Refactored completed-line rows in the Lines tab list mode to use a compact line-id badge button as the primary select/focus affordance.
- Moved line label text to a non-primary, readability-focused span so label copy is no longer the primary click target.
- Added per-row inline line rename controls in list mode via `InlineRenameField`, wired to existing `onLineRename` callback flow.
- Added an `InlineRenameField` idle display mode variant (`edit-only`) to support compact row layouts without duplicating visible label text.
- Preserved rename acceptance behavior and existing line-label normalization path in session commands (`normalizeAcceptedLineLabel`) by reusing existing callbacks and not introducing new rename command routes.

### Slice 072: Selected-Line Route Sequence Stop Lookup and Inline Rename Flow
- Added a selected-line route-sequence list that renders every stop in canonical route order from `selectedLine.stopIds`.
- Built a stop lookup map keyed by stop id from `placedStops` to resolve labels safely per sequence row.
- Added a compact clickable order badge (`[n]`) per row as the select/focus affordance while keeping stop label text as non-primary-click content.
- Added inline stop rename affordances in the selected-line sequence using the existing `InlineRenameField`.
- Threaded existing inspector callbacks so selected-line row actions use existing `onStopSelectionChange` and `onStopRename` paths without introducing new command routes.
- Added safe fallback labels for missing stop ids (`Unknown stop (<id>)`) so rendering continues even when line references stale stop ids.

### Slice 071: Selected-Line Inspector Compact Header Summary
- Replaced the selected-line top inspector table/KPI layout with a compact summary header that combines line badge, readable label, and inline line rename entrypoint.
- Removed ordered-stop chip preview, `+N more`, and expandable stop-sequence disclosure from the selected-line top card.
- Consolidated topology, service pattern, stop count, segment count, runtime, readiness, warning count, and blocker count into compact metadata rows sourced from existing inspector projections and panel state.
- Removed the separate selected-line readiness card and kept the issue summary inline in the compact header.
- Added ADR 0120 to document compact-header scope and non-goals.

### Slice 070b: Line-Scoped Stop Rename and Inspector Density Cleanup
- Shifted stop rename to line-scoped contexts, keeping rename entrypoints tied to selected-line and line-list workflows instead of global stop inventory usage.
- Standardized badge-first selection affordances so compact id badges remain the primary select/focus target in dense inspector lists.
- Reduced inspector row density by removing redundant inline controls and preserving readability-first label presentation.
- Explicit non-goals: no stop or line deletion behavior, no topology/service-pattern editing changes, and no routing or simulation behavior changes.

### Slice 070: Inline Rename for Stops and Routes
- Added compact inline rename controls to inspector network inventory rows for both stops and completed lines, including explicit edit/check/cancel icon affordances.
- Added keyboard editing controls for rename interactions: `Enter` accepts and `Escape` cancels, with no blur auto-commit behavior.
- Enforced local rename validation to trim accepted input and reject empty post-trim names while preserving existing names on cancel/invalid input.
- Added line-only accepted-name normalization (`<->`, `<>` to `↔`; `->`, `>` to `→`) in required order, applied only on accept.
- Added ADR 0119 to document rename interaction boundaries and scoped normalization behavior.

### Slice 068b: Network Save Envelope Repair and Test Alignment
- Hardened `validateSelectedLineExportPayload` to strictly require the `OpenVayra - Cities.network-save` envelope at the root, rejecting raw v4 or v3 payloads with specific error messages.
- Cleaned up `selectedLineExportValidation.ts` by removing unused `validateSegments` and obsolete v3-only validation codes.
- Updated `hamburg-line-1.v4.json` fixture to be a valid enveloped file and created `hamburg-line-1.v4.raw-legacy.json` for rejection testing.
- Aligned `selectedLineExport.test.ts`, `selectedLineExportValidation.test.ts`, and `selectedLineExportSessionLoader.test.ts` with the strict envelope requirement and verified all tests pass.
- Ensured type safety across the save boundary by centralizing envelope and payload types in `networkSave.ts` and `selectedLineExport.ts`.

### Slice 068: Network Save Envelope and Legacy Import Cleanup
- Introduced the `NetworkSaveEnvelope` canonical wrapper for all network-level exports, including schema metadata (`schema`, `schemaVersion`, `timestamp`, `sourceMetadata`).
- Formalized the transition to slim network saves where route geometry is omitted and reconstructed on import; removed all legacy `v3` import support and reconstruction logic.
- Hardened `validateSelectedLineExportPayload` to support both raw `v4` and enveloped payloads while explicitly rejecting legacy `v3` files with a specific error code.
- Updated `useNetworkSessionState` to provide specific user feedback ("This OpenVayra - Cities save format is no longer supported.") when legacy `v3` files are rejected.
- Simplified `convertSelectedLineExportPayloadToSession` to always produce empty route segments, enforcing a single truthful path for geometry reconstruction.
- Cleaned up all legacy `v3` fixtures and updated 5+ test suites (`selectedLineExportValidation`, `selectedLineExportSessionLoader`, `lineDepartureScheduleProjection`, `lineServiceReadiness`, `lineGeoJson`, `vehicleGeoJson`) to use the `v4` baseline.
- verified that modern `v4` exports are correctly wrapped and remain importable.

### Slice 066c: Final Demand Projection Type Hygiene and Shared Semantics Repair
- Extracted `projectLineBandDemandNodeCoverage` into a shared domain helper, ensuring that network-level and selected-line demand projections use the exact same structural connectivity logic.
- Removed all remaining `as any` and broad unchecked casts from `servedDemandProjection.ts` and `demandCatchmentProjection.ts`.
- Refactored `projectNetworkDemand` to use the shared line-level helper, eliminating semantic drift between network-wide and line-specific demand results.
- Hardened `DemandNodeId` and `DemandWeight` type safety by removing redundant casts and ensuring branded identifiers are preserved through aggregation and map lookups.
- Cleaned up `as any` shortcuts in `lineDepartureTimetableProjection.test.ts` by using properly typed `LineServiceBandPlan` objects.
- Tightened `validateSelectedLineExportPayload` return logic by replacing broad root-level casts with explicit typed reconstruction of versioned export payloads.
- Verified that all unit tests and strict TypeScript typechecks pass without shortcuts.


### Slice 066b: Green-State Repair for Demand Projection and Type Safety
- Fixed network-wide demand projection to deduplicate residential origin nodes across multiple stops or lines, ensuring each node is counted only once in served-demand aggregates.
- Implemented direction-aware connectivity for linear one-way lines (origin must precede destination), bidirectional lines (any pair reachable), and loop lines (any pair reachable).
- Hardened `projectLineBandDemand` signature to accept line topology, service pattern, and explicit node maps, removing hidden global state assumptions.
- Restored "Green State" by resolving 50+ TypeScript compiler errors related to strict null-checks, union-type narrowing, and missing imports.
- Removed all `as any` and `{} as any` shortcuts from demand-related code and tests, replacing them with canonical creators and strong typing.
- Updated `LineServiceProjectionSummary` to include Slice-066 mandatory counters: `availableLineCount` (configured/degraded) and `unavailableLineCount` (blocked).
- Hardened `deriveSimulationWeekdayId` with a safe fallback to prevent `noUncheckedIndexedAccess` failures.
- Removed committed `typecheck_output.txt` artifact and updated `.gitignore` to prevent re-committing diagnostic output files.

### Slice 066: Demand Capture and Served Demand UI Projection
- Implemented network-wide demand capture projection for residential origins and workplace destinations using a centralized 400m catchment radius.
- Added a first truthful "Served now" projection that calculates residential demand structurally connected to workplaces by active bus lines in the current time band.
- Enforced directional connectivity rules: a residential node is served only if the capturing stop appears before a workplace-capturing stop in the line's sequence (respecting topology and bidirectional service).
- Updated the Network inspector with a "Demand capture" section showing homes/jobs coverage and actively served demand.
- Refined the Selected Line inspector to show line-specific structural coverage, active served demand, and actionable warnings for missing service or demand.
- Added `demandCatchmentProjection.ts` and associated unit tests for deterministic network-wide demand aggregates.
- Integrated demand projections into the main `useNetworkPlanningProjections` hook.

### Slice 065b: Selected-Line Export v4 Type Hygiene and Test Cleanup
- Refactored `SelectedLineExportPayload` into a discriminated union of `SelectedLineExportPayloadV3` (legacy with geometry) and `SelectedLineExportPayloadV4` (slim without geometry), ensuring strict type safety for version-specific fields.
- Updated `buildSelectedLineExportPayload` to return a strongly typed `SelectedLineExportPayloadV4` and omit cached route geometry at the type level.
- Hardened `buildSelectedLineExportPayload` default `sourceMetadata` to include `{ source: 'OpenVayra - Cities-web' }`, ensuring new exports are valid by default.
- Improved `validateSelectedLineExportPayload` return type by replacing the broad `as unknown as SelectedLineExportPayload` cast with narrowed, runtime-guarded version-specific casts.
- Removed all `as any` usage from `selectedLineExport.test.ts` and added JSON-level assertions to verify that `v4` exports are strictly geometry-free in their serialized form.
- Fixed version-specific geometry access in `selectedLineExportSessionLoader.ts`, `lineDepartureScheduleProjection.test.ts`, and `lineServiceReadiness.test.ts` using type narrowing.
- Resolved a minor TypeScript `undefined` warning in `simulationClock.ts` weekday derivation to ensure a clean `typecheck` baseline.

### Slice 065: Slim Selected-Line Export and Re-route on Import
- Implemented slim selected-line export/import format (`v4`) that stores only the line definition (topology, stops, service plan) and omits routed geometry coordinates.
- Added `OpenVayra - Cities-selected-line-export-v4` schema version and ensured backward compatibility with `v3` (geometry-cached) payloads.
- Automated geometry reconstruction on import via the routing layer, ensuring fresh geometry consistent with the current routing environment.
- Updated the import workflow to distinguish between rebuilt v4 geometry and loaded v3 geometry in toast notifications, including feedback on whether street routing or fallback routing was used.
- Added `hamburg-line-1.v4.json` fixture for slim-export testing and verification.
- Updated all export/import unit and round-trip tests to reflect the new geometry-free v4 save-game truth.

### Slice 064e: Modal Close Icons, Stable Clock Display, Weekday Label, and Timetable Numeric Typography
- Replaced all "Close" text buttons in modals with a Material `close` icon button for a cleaner, consistent UI.
- Updated the simulation clock readout to show `Day X, Weekday` above `HH:MM`, with internal centering and fixed-width layout to prevent top-bar "wobble".
- Implemented deterministic weekday derivation (Day 1 → Mon, Day 8 → Mon, etc.) with shared domain constants and tested logic.
- Integrated Google Font `Datatype` for technical numeric displays, specifically applying it to the simulation clock and the departures timetable minutes.
- Enforced simulation start at Monday 06:00 (Day 1) via initial clock constants.

### Slice 064d: Toast Feedback and Layout Safety Repair
- Implemented a reusable Toast feedback system with four variants (success, error, warning, info).
- Replaced raw layout-breaking import feedback text with contained toast notifications.
- Added `ToastProvider`, `ToastHost`, and `Toast` components with Material icon support.
- Documented global UI layout text-safety rule in `AGENTS.md` to prevent uncontrolled text from breaking app chrome.
- Aligned toast visual style with `DESIGN.md` using semantic colors and whisper-weight borders.


### Added
- **Slice 064c**: Realtime Speed, 0.1×, Pace Icon, and Header Layout Repair.
- Add distinct `realtime` speed option (1:1 simulated-to-real second) using the Material Symbols `pace` icon.
- Add `0.1×` simulation speed option.
- Ensure all simulation speed labels use the multiplication sign `×` (e.g., `1×`, `0.5×`, `0.1×`).
- Harden top header layout in `App.css` to remain stable with the expanded speed controls, using `min-width: 0` and reduced gaps for desktop density.
- Update simulation clock tests to cover `0.1x` and `realtime` distinctness and accuracy.
- **Slice 063c**: Final hygiene repair before vehicle projection work.
- Fix `generateLineLabel` to return `null` when required endpoint stop labels are missing, empty, or whitespace-only, preventing user-facing labels such as `undefined → Some Stop`. New line completion continues to fall back to the deterministic `Line <ordinal>` placeholder when `generateLineLabel` returns `null`.
- Remove `as any` from all export/import validation tests directly touched by Slice 063/063b: `selectedLineExportValidation.test.ts` and `selectedLineExportSessionLoader.test.ts` now use a typed `MutableJsonObject` helper, `structuredClone`-based fixture clones, and `unknown`-parsed candidates guarded by explicit `isRecord`-equivalent checks.
- Remove committed compiler/debug output artifacts `apps/web/tsc_output.txt` and `apps/web/tsc_output_ascii.txt`.
- Update `.gitignore` with `apps/*/tsc_output*.txt`, `**/tsc_output*.txt`, and `**/test_output*.txt` patterns to prevent recurrence of committed compiler or test output artifacts.

- Increase `SELECTED_LINE_EXPORT_ROUTE_CACHE_ENDPOINT_TOLERANCE_DEGREES` from `1e-5` to `5e-4` to accept realistic OSRM street-snap endpoint offsets (~17m observed in Hamburg v3 fixture); rename constant to clarify it is a route-cache compatibility tolerance, not a stop-position precision guarantee.
- Add `'invalid-route-segment-stop-reference'` to `SelectedLineExportValidationIssueCode` union to fix TypeScript compile errors.
- Fix `lineGeoJson.ts`: add missing `LineRouteSegment` import; replace `any[]` with a properly typed feature array; remove the fallback that synthesized reverse geometry from reversed stop order when `reverseRouteSegments` is absent — the rendering layer must not invent reverse route geometry.
- Update `lineGeoJson.test.ts`: replace the reversed-stop-order-fallback expectation with an assertion that bidirectional lines without `reverseRouteSegments` emit only the forward feature.
- Remove all `as any` and `{} as any` shortcuts from new Slice-063 tests in `selectedLineExportRoundTrip.test.ts` and `lineLabeling.test.ts`, replacing them with canonical creators (`createLineSegmentId`, `createRouteDistanceMeters`, `createRouteTravelMinutes`, `createNoServiceLineServiceByTimeBand`).
- Update ADR 0116 to accurately describe the staged/ranked nearby label lookup introduced in Slice 063, replacing the outdated 16px fixed-radius description.
- Remove `test_output.txt` debug artifact from repository root.

### Fixed
- Hamburg v3 fixture (`hamburg-line-1.v3.json`) now validates successfully through `validateSelectedLineExportPayload`.
- Session loader tests no longer fail on fixture validation.
- Round-trip test (`selectedLineExportRoundTrip.test.ts`) is type-safe with no `as any` usage.

- **Slice 063**: Session round-trip repair, deterministic line labeling, bidirectional rendering, and ranked stop-label lookup.
- Repair selected-line JSON round-trip import to preserve cached route segments and stop labels without mandatory re-routing on load.
- Implement deterministic line labeling (e.g., "Stop A → Stop B" or "Stop A ↔ Stop B") derived from stop sequence and service pattern, including unique numeric suffixing for duplicates.
- Render bidirectional reverse route geometry with a visual direction-aware line offset for distinguishable overlapping paths.
- Replace fixed 16px stop-label lookup with a staged (12/24/40px) and ranked (road/street hints first) lookup for more robust stop naming.
- Add ADR 0117 documenting bidirectional rendering offsets and deterministic labeling logic.
- Add focused unit tests for line labeling, GeoJSON bidirectional features, and staged label lookup.
- **Slice 061**: Street-derived stop labels from snapped map features with deterministic duplicate suffixing.
- Derive newly placed stop labels from the street feature used for stop snapping instead of generic "Stop N" labels.
- Implement deterministic suffixing (e.g., "Street A", "Street A 1") when multiple stops are placed on the same named street.
- Add pure `extractStreetLabelCandidate` and `createUniqueStopLabel` helpers with focused unit tests.
- [ADR 0116](docs/adr/0116-street-derived-stop-labels-as-placement-display-hints.md): Street-Derived Stop Labels as Placement Display Hints.

- **Slice 062**: Repair and make visible street-derived stop labels with nearby rendered-label fallback.
- Expand street label extraction to support additional common property keys (`name_de`, `name_en`, `ref` fallback, etc.).
- Add a secondary nearby-label lookup that queries rendered symbol/text layers if the snapped street line lacks a name.
- Update the selected-stop inspector to show actual stop label, ID, and position by resolving canonical `Stop` data from session state.
- Add last-placed label feedback to the map debug snapshot for easier verification during placement.

- **Slice 060**: Post-completion frequency flow automation and stop marker visual polish for improved readability and workflow.
- Introduce a one-shot "dialog open intent" mechanism to automatically open the frequency editor after successful line creation.
- Enhance stop marker visibility on the dark basemap: increased circle radii (8/11px) and larger sequence labels (11px).
- Improve label contrast and readability with state-aware colors (dark text on orange, light text on dark) and a subtle contrast halo.
- Update `InspectorPanel` and `SelectedLineInspector` to handle and consume UI interaction intents targeting specific lines.

- **Slice 059**: Repair service-readiness validation after loop/bidirectional route support and selected-line import/export changes.
- Update `evaluateLineServiceReadiness` to be topology-aware, correctly validating $N$ segments for $N$ stops in loop lines.
- Introduce `lineTopologySegments` domain helper for centralized topology-aware segment count and stop-pair expectations.
- Update readiness issue messages to avoid hardcoding linear-only logic for loop lines.
- Align readiness tests with `hamburg-line-1.v3.json` fixture and add dedicated loop-readiness coverage.

- **Slice 056**: Explicit line topology (linear/loop) and service pattern (one-way/bidirectional) semantics.
- Line completion decision flow with settings for topology and direction.
- Loop closure routing for circular lines.
- Independent reverse routing for bidirectional lines to respect one-way street constraints.
- [ADR 0114](docs/adr/0114-explicit-line-topology-and-service-pattern-semantics.md): Explicit Line Topology and Service Pattern Semantics.
- **Slice 058**: Repair and clarify selected-line JSON import/export contract for intent-first loading with derived route cache.
- Decouple canonical line intent from derived route geometry in export schema.
- Implement async re-routing on import, ensuring fresh geometry and metrics consistent with the current routing environment.
- Increase coordinate endpoint tolerance to `1e-5` degrees to handle common routing-engine (OSRM) rounding.
- Update Hamburg fixture to v3 and handle filename/schemaVersion alignment.
- [ADR 0115](docs/adr/0115-selected-line-export-intent-cache-contract.md): Selected-Line Exports Preserve Line Intent with Derived Route Cache.

- **Slice 057**: Repair topology-aware projections and strict TypeScript verification issues.
- Update `lineDepartureTimetableProjection` to be topology-aware, correctly handling $N$ segments for $N$ stops in loop lines while displaying $N-1$ downstream offsets.
- Harden `selectedLineExportValidation` to support and validate `reverseRouteSegments` using directional adjacency rules.
- Resolve strict TypeScript issues in demand domain by introducing `createZeroDemandWeightByTimeBand` factory and enforcing complete `Record<TimeBandId, T>` map initialization.
- Align test suites with canonical MVP time bands and hardened type safety requirements.

- **Slice 064b**: Projection Second Guardrails & Speed Polish (Repair).
- Enforced `0 <= seconds < 86400` range validation for `SimulationSecondOfDay`.
- Updated stale "current-minute" documentation in vehicle projection types to reflect continuous time.
- Added `Realtime` (1:1 simulated-to-real second) and `0.5×` simulation speed options.
- Updated all simulation speed labels to use the multiplication sign `×`.

- **Slice 064**: Vehicle Projection Continuity + Smooth Movement.
- Continuous simulation-second projection input for smooth vehicle movement using `SimulationSecondOfDay` branded type.
- `deriveSimulationSecondOfDay` helper for animation-frame cadence clock reads.
- Refactored simulation clock controller to use `requestAnimationFrame` for smoother progression.
- Stabilized projected vehicle IDs to `<lineId>:vehicle-<index>`, removing time-band dependency to prevent marker churn.
- Updated vehicle projection logic to use continuous seconds for geometry interpolation.
- Improved marker identity stability across time-band transitions for overlapping vehicle slot indexes.
- Removed legacy `as any` shortcuts in vehicle projection unit tests.
- Add ADR 0118 documenting the vehicle projection continuity and smooth movement decisions.

## [0.63.3] - 2026-04-26

- Slice 055: implement a deterministic, in-memory MVP demand scenario for the Hamburg area with residential origin and workplace destination nodes.
- Slice 055: wire the scenario demand nodes into the application/session projection flow, replacing empty demand arrays in network planning projections and debug diagnostics.
- Add ADR 0113 documenting the deterministic MVP demand scenario baseline decision, spatial demand node boundaries, and explicit non-goals.
- Slice 032: redesign selected-line `Departures` into a player-facing stop-by-hour timetable matrix (`Stop` + `00..23`) with per-cell minute departures, quiet no-service dashes, and clear unavailable downstream timing states when segment-level offsets are missing.
- Slice 032: add pure deterministic `lineDepartureTimetableProjection` helper to project full-day departures from canonical service-band plans (`frequency` only), including midnight-wrapping night service handling.
- Slice 032: remove the separate player-facing `Route baseline` action/modal and integrate compact route runtime/segment/status support details directly into `Departures`, with fallback-routing warning text when relevant.
- Add ADR 0108 documenting departures timetable matrix boundaries and route-baseline integration decisions.

- Slice 031b: remove canonical `unset` line service state so every MVP time band is explicitly `frequency` or `no-service`, and initialize newly completed lines with all-band `no-service` defaults.
- Slice 031b: refactor `Edit service plan` into a compact desktop editor with `WINDOW / TIME BAND / SERVICE` columns and per-row `Interval` + text-input + `No service` controls only.
- Slice 031b: enforce controlled interval input validation (`1..999`, digits-only, max three characters) with helper-owned parsing/activation behavior and no implicit no-service conversion from empty input.
- Add ADR 0107 documenting no-unset service-state semantics and compact service-plan editor boundaries.

- Slice 050: replace selected-line ordered-stop text worm with compact stop chips plus an expandable full stop-sequence disclosure for long lines.
- Slice 050: replace the selected-line `Segments / route time` row with three truthful route-summary stat cards (`Stops`, `Segments`, `Runtime`) using existing selected-line and route-baseline projection values only.
- Slice 050: keep readiness/issue pills near the top of selected-line inspector content and retain required action entrypoints (`Edit frequency`, `Service plan`, `Departures`, `Projected vehicles`) while preserving the existing `Route baseline` action.
- Add ADR 0106 documenting selected-line stop-sequence chip presentation and truthful route-summary stat-card boundaries.

- Slice 049: restructure selected-line `Service plan` dialog around player-facing primary service status content (status pill, active band label/window, active service state, optional departures/hour, and optional runtime).
- Slice 049: replace deep issue list disclosures in the service-plan dialog with compact actionable issue pills and a debug-modal redirect note for technical diagnostics.
- Slice 049: keep service-plan dialog on the shared medium surface variant while removing player-facing raw issue-code exposure from this modal.
- Add ADR 0105 documenting player-facing service-plan dialog prioritization and debug-modal diagnostics ownership boundaries.

- Slice 048: refactor `Edit service plan` into a three-column table-like editor (`Time band`, `Window`, `Service`) with one top-level minutes/unset/positive-only guidance sentence.
- Slice 048: show canonical time-band labels/windows from shared domain constants and expose explicit per-row `Frequency`/`No service`/`Unset` state controls.
- Slice 048: clear minute input whenever `No service` or `Unset` is selected, while preserving positive-only input validation via existing `lineFrequencyEditorState` action logic.
- Add ADR 0104 documenting three-column service-plan editor structure and explicit state-control behavior boundaries.

- Slice 047: update shared inspector compact-table alignment so row headers stay left-aligned and value cells default to right alignment.
- Slice 047: add explicit `inspector-compact-table__value--left` opt-out usage for textual/status cells in Network, Selected line, Service plan, Departures, and Projected vehicles summaries.
- Slice 047: preserve numeric/value-first right alignment across compact inspector/dialog tables while keeping only readability exceptions left-aligned.
- Add ADR 0103 documenting compact inspector value-cell right-alignment defaults and targeted left-alignment opt-out boundaries.

- Slice 046: add reusable selected-line inspector dialog size modifiers (`small`, `medium`, `large`) on `inspector-dialog__surface` in shared app styles.
- Slice 046: apply dialog size variants by intent (`Edit service plan` small, `Service plan` medium, `Departures` large) and remove legacy ad-hoc service-plan width class usage.
- Slice 046: keep large departures dialog constrained and scrollable with a dedicated large-surface modifier instead of per-component width handling.
- Add ADR 0102 documenting reusable dialog size modifier ownership and selected-line dialog mapping.

- Slice 045: add a new UI-only `DebugModal` component with tabbed diagnostics (`Overview`, `Routing`, `Service`, `Raw state`) and preserve shell-owned modal state in `App.tsx`.
- Slice 045: route existing map snapshot diagnostics and inspector-adjacent debug details (tool mode, selected ids, counts, route fallback notes, readiness details, ordered stop ids, and line ids) into the modal tabs using existing projection/session truth only.
- Slice 045: keep simulation/domain/backend/persistence behavior unchanged and presentation-only by wiring modal props from existing `App.tsx` state/projection values.
- Add ADR 0101 documenting tabbed debug modal composition and diagnostics routing boundaries.

- Slice 044: move debug access to one global top-bar `Debug` button wired directly to shell-owned modal open/close state in `App.tsx`.
- Slice 044: remove inspector `Debug` tab ids/labels and delete the inspector debug rendering section so inspector navigation now includes only `Network` and `Lines`.
- Slice 044: remove left-rail debug affordance so the top-bar control is the only debug entry point.
- Add ADR 0100 documenting the single global debug entrypoint and inspector debug-tab removal boundaries.

- Slice 043: remove map-surface HUD/debug overlays (`map-workspace__overlay--hud`, `map-workspace__overlay--debug`) so map diagnostics no longer render directly on top of gameplay.
- Slice 043: preserve existing map diagnostics derivations (interaction status, pointer/geographic summaries, feature diagnostics, and draft metadata) and route them through a shell-owned debug snapshot contract.
- Slice 043: add an app-shell controlled debug modal and left-rail debug entrypoint to surface map diagnostics centrally outside the map overlays.
- Add ADR 0099 documenting centralized shell-owned map debug modal state and non-goals.

- Slice 030a: replace the selected-line `Edit frequency` dialog with a compact `Edit service plan` editor showing canonical time-band label/window rows and player-facing `Interval`/`No service` actions only.
- Slice 030a: keep `unset` as internal not-configured state (no direct selection control), show neutral row styling for unset bands, and display an en dash (`–`) minute placeholder for explicit no-service bands.
- Slice 030a: move interval entry to controlled text-input validation (`1..999`, whole minutes, max three digits, no spinner semantics) and keep explicit `{ kind: "no-service" }` domain state.
- Slice 030a: add focused tests for compact service-plan dialog rendering and frequency-editor action semantics/validation boundaries.
- Add ADR 0098 documenting compact service-plan editor interaction and non-goals.

- Slice 042: add explicit selected-line frequency editor control state (`unset` / `frequency` / `no-service`) so UI intent is not inferred from empty input text.
- Slice 042: update selected-line frequency update actions to include explicit `set-no-service` and `set-unset` paths while preserving empty-input-to-`unset` and positive-numeric-to-`frequency` semantics.
- Slice 042: update frequency dialog per-band controls with explicit service-mode selection and keep validation messaging aligned with the new semantics.
- Add ADR 0097 documenting explicit frequency editor mode controls and selected-line synchronization rules.

- Slice 041: update line-service readiness semantics so canonical bands configured as `frequency` or `no-service` count as configured service-plan bands, while only `unset` bands are treated as missing.
- Slice 041: preserve stable readiness issue codes while updating readiness messages to avoid treating explicit `no-service` plans as "missing frequency" configuration.
- Slice 041: extend service-plan projection contracts with explicit active-band state (`unset`/`no-service`/`frequency`) and keep status derivation truthful for each state.
- Slice 041: update departure schedule projection semantics to generate departures only for active-band `frequency`, and expose explicit unavailable reasons including active-band `no-service`.
- Slice 041: ensure vehicle projection treats active-band `no-service` as zero-vehicle/zero-departure output without missing-configuration messaging.
- Add ADR 0096 documenting active-band service-plan semantics for explicit `no-service` versus `unset` behavior.

- Slice 040: add canonical branded `MinuteOfDay` and `TimeBandDefinition` domain contracts with validated `0..1439` constructor semantics.
- Slice 040: replace split time-band id/label/range ownership with one canonical ordered `TIME_BAND_DEFINITIONS` source and derived `MVP_TIME_BAND_IDS`/display labels.
- Slice 040: add pure time-band helpers for `HH:MM` formatting, formatted window labels, and canonical minute-to-band resolution with explicit midnight-wrap handling.
- Slice 040: refactor simulation clock and departure schedule projection to consume canonical resolver logic, including wrapped night-window active segment resolution.
- Add ADR 0095 documenting canonical time-band definition ownership and midnight resolver boundaries.

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

- Slice 035: replace the split app header + simulation controls stack with one integrated top bar containing OpenVayra - Cities brand, day/time + active time-band readout, play/pause/reset controls, discrete `1x`/`5x`/`10x`/`20x` speed buttons, and compact session load/export actions.
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

- Slice 030: add a dedicated deterministic map workspace custom-layer ordering helper that reapplies the canonical OpenVayra - Cities stack through typed `moveLayer(...)` calls.
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

- Slice 152: add a scenario-demand runtime artifact loader that fetches `ScenarioDefinition.demandAssets.scenarioDemand`, validates with the canonical parser, and returns explicit loaded/failed result unions.
- Slice 152: wire shell-owned demand artifact initialization into scenario selection, including actionable missing-artifact failures and debug modal demand status/count diagnostics.
- Slice 152: keep runtime demand scope to artifact loading only (no demand capture, heatmaps, served-demand, economy, or satisfaction behavior).
