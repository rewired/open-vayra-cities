# Graph Report - .  (2026-05-05)

## Corpus Check
- Large corpus: 474 files · ~228,703 words. Semantic extraction will be expensive (many Claude tokens). Consider running on a subfolder, or use --no-semantic to run AST-only.

## Summary
- 1319 nodes · 2499 edges · 111 communities (102 shown, 9 thin omitted)
- Extraction: 88% EXTRACTED · 12% INFERRED · 0% AMBIGUOUS · INFERRED: 312 edges (avg confidence: 0.82)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- [[_COMMUNITY_Test Utilities and LineDemand Projections|Test Utilities and Line/Demand Projections]]
- [[_COMMUNITY_OSM Stop Candidate Processing|OSM Stop Candidate Processing]]
- [[_COMMUNITY_Workspace Configuration and Documentation|Workspace Configuration and Documentation]]
- [[_COMMUNITY_Focused Demand Gap Planning|Focused Demand Gap Planning]]
- [[_COMMUNITY_Early ADRs - Workspace and Stop Placement|Early ADRs - Workspace and Stop Placement]]
- [[_COMMUNITY_Test Framework Infrastructure|Test Framework Infrastructure]]
- [[_COMMUNITY_Stop Placement and Marker Interaction ADRs|Stop Placement and Marker Interaction ADRs]]
- [[_COMMUNITY_Demand Gap GeoJSON and Overlays|Demand Gap GeoJSON and Overlays]]
- [[_COMMUNITY_Routing Adapters and Line Completion|Routing Adapters and Line Completion]]
- [[_COMMUNITY_Line Overlay and Selection ADRs|Line Overlay and Selection ADRs]]
- [[_COMMUNITY_Scenario Demand Artifact Loading|Scenario Demand Artifact Loading]]
- [[_COMMUNITY_Line Route Segment Domain and Routing ADRs|Line Route Segment Domain and Routing ADRs]]
- [[_COMMUNITY_Dev UI and Debug Disclosure ADRs|Dev UI and Debug Disclosure ADRs]]
- [[_COMMUNITY_MapLibre Global Contract and Street Snap|MapLibre Global Contract and Street Snap]]
- [[_COMMUNITY_Demand Node Service Coverage|Demand Node Service Coverage]]
- [[_COMMUNITY_Simulation Clock|Simulation Clock]]
- [[_COMMUNITY_Network Planning Projections|Network Planning Projections]]
- [[_COMMUNITY_Demand and Line Service Projections|Demand and Line Service Projections]]
- [[_COMMUNITY_Script Test Framework|Script Test Framework]]
- [[_COMMUNITY_Selected Line Export Validation|Selected Line Export Validation]]
- [[_COMMUNITY_Test Group 20|Test Group 20]]
- [[_COMMUNITY_Community 21|Community 21]]
- [[_COMMUNITY_TypeScript Module 22|TypeScript Module 22]]
- [[_COMMUNITY_Community 23|Community 23]]
- [[_COMMUNITY_TypeScript Module 24|TypeScript Module 24]]
- [[_COMMUNITY_TypeScript Module 25|TypeScript Module 25]]
- [[_COMMUNITY_Community 26|Community 26]]
- [[_COMMUNITY_Test Group 27|Test Group 27]]
- [[_COMMUNITY_Test Group 28|Test Group 28]]
- [[_COMMUNITY_Community 29|Community 29]]
- [[_COMMUNITY_Test Group 30|Test Group 30]]
- [[_COMMUNITY_Community 31|Community 31]]
- [[_COMMUNITY_Community 32|Community 32]]
- [[_COMMUNITY_TypeScript Module 33|TypeScript Module 33]]
- [[_COMMUNITY_Test Group 34|Test Group 34]]
- [[_COMMUNITY_Community 35|Community 35]]
- [[_COMMUNITY_Community 36|Community 36]]
- [[_COMMUNITY_TypeScript Module 37|TypeScript Module 37]]
- [[_COMMUNITY_Community 39|Community 39]]
- [[_COMMUNITY_Test Group 40|Test Group 40]]
- [[_COMMUNITY_TypeScript Module 41|TypeScript Module 41]]
- [[_COMMUNITY_Community 42|Community 42]]
- [[_COMMUNITY_Community 43|Community 43]]
- [[_COMMUNITY_Community 44|Community 44]]
- [[_COMMUNITY_Test Group 45|Test Group 45]]
- [[_COMMUNITY_Community 46|Community 46]]
- [[_COMMUNITY_Community 47|Community 47]]
- [[_COMMUNITY_Community 48|Community 48]]
- [[_COMMUNITY_Test Group 49|Test Group 49]]
- [[_COMMUNITY_TypeScript Module 50|TypeScript Module 50]]
- [[_COMMUNITY_Community 51|Community 51]]
- [[_COMMUNITY_Architecture Decisions 52|Architecture Decisions 52]]
- [[_COMMUNITY_Community 53|Community 53]]
- [[_COMMUNITY_Community 54|Community 54]]
- [[_COMMUNITY_Community 58|Community 58]]
- [[_COMMUNITY_Community 60|Community 60]]
- [[_COMMUNITY_Architecture Decisions 67|Architecture Decisions 67]]
- [[_COMMUNITY_Community 108|Community 108]]
- [[_COMMUNITY_Architecture Decisions 109|Architecture Decisions 109]]
- [[_COMMUNITY_Community 110|Community 110]]

## God Nodes (most connected - your core abstractions)
1. `Vitest` - 86 edges
2. `createStopId()` - 41 edges
3. `createLineId()` - 39 edges
4. `createLineSegmentId()` - 28 edges
5. `createRouteTravelMinutes()` - 28 edges
6. `calculateGreatCircleDistanceMeters()` - 26 edges
7. `useNetworkPlanningProjections()` - 25 edges
8. `createNoServiceLineServiceByTimeBand()` - 25 edges
9. `AGENTS.md - Coding Agent Working Rules` - 24 edges
10. `createLineFrequencyMinutes()` - 23 edges

## Surprising Connections (you probably didn't know these)
- `ADR 0086: Tool mode control compaction and icon-first accessibility` --references--> `App.tsx shell component`  [EXTRACTED]
  docs/adr/0086-tool-mode-control-compaction-and-icon-first-accessibility.md → apps/web/src/App.tsx
- `ADR 0092: Product-style map-centric shell presentation boundaries` --references--> `Tool mode selector (inspect/place-stop/build-line)`  [EXTRACTED]
  docs/adr/0092-product-style-map-centric-shell-rationale.md → apps/web/src/App.tsx
- `ADR 0034: Stop marker interaction affordance` --references--> `MapWorkspaceSurface`  [EXTRACTED]
  docs/adr/0034-stop-marker-interaction-affordance-and-draft-membership-state.md → apps/web/src/map-workspace/MapWorkspaceSurface.tsx
- `ADR 0039: Stop-marker anchor/offset typing` --references--> `MapWorkspaceSurface`  [EXTRACTED]
  docs/adr/0039-stop-marker-anchor-offset-typing-and-visual-center-alignment.md → apps/web/src/map-workspace/MapWorkspaceSurface.tsx
- `ADR 0043: Feature-first map interaction` --references--> `MapWorkspaceSurface`  [EXTRACTED]
  docs/adr/0043-feature-first-map-interaction-entry-and-inspect-empty-click-clearing.md → apps/web/src/map-workspace/MapWorkspaceSurface.tsx

## Hyperedges (group relationships)
- **Map Workspace Lifecycle Components** — concept_map_workspace_surface, concept_pointer_interaction_plumbing, concept_resize_handling, concept_map_lifecycle_separation [EXTRACTED 0.95]
- **Domain Architecture Bounded Contexts** — concept_bounded_context_world_map, concept_bounded_context_demand, concept_bounded_context_transit_network, concept_bounded_context_routing_support, concept_bounded_context_simulation, concept_bounded_context_economy, concept_bounded_context_ui_projection [EXTRACTED 1.00]
- **Canonical Project Document Source-of-Truth Order** — doc_product_definition_md, doc_foundation_md, doc_vision_scope_md, doc_dd_md, doc_tdd_md, doc_sec_md, doc_design_md [EXTRACTED 1.00]
- **Stop Placement Slice 008 Components** — adr0009_workspace_tool_mode_gating, adr0010_place_stop_click_validation_split, adr0011_local_stop_state_and_marker_rendering, adr0012_maplibre_feature_query_contract, adr0013_stop_placement_slice_008_boundaries, slice_008_stop_placement [EXTRACTED 1.00]
- **Stop Selection to Inspector Projection Flow** — adr0014_stop_only_local_selection_state, adr0015_stop_selection_projection_to_shell_inspector, adr0016_stop_selection_transition_rules, concept_selection_projection, state_selected_stop_id [EXTRACTED 1.00]
- **Build-Line Drafting and Completion Flow** — adr0020_explicit_workspace_modes_build_line, adr0021_build_line_local_draft_session_commit, adr0023_first_ordered_stop_line_building, adr0033_explicit_user_triggered_build_line_completion, concept_build_line_drafting, concept_explicit_line_completion [EXTRACTED 1.00]
- **Line Frequency Configuration Flow** — adr0028_canonical_time_band_domain_module, adr0029_completed_line_frequency_configuration, adr0030_line_selected_frequency_editing_session_lift, adr0031_slice_013_frequency_boundaries, concept_line_frequency_configuration, concept_time_band_domain, slice_013_frequency_config [EXTRACTED 1.00]
- **Inspector Selection State Machine** — adr0026_mutual_exclusivity_stop_line_selection, adr0027_inspector_selection_priority_state_machine, concept_mutual_exclusivity_selection, concept_inspector_priority_state_machine, component_inspector_panel [EXTRACTED 1.00]
- **Hamburg Map Bootstrap Baseline** — adr0018_hamburg_map_bootstrap, adr0019_hamburg_street_legible_baseline, concept_hamburg_map_bootstrap, module_map_bootstrap_config [EXTRACTED 1.00]
- **Workspace Mode Separation** — adr0009_workspace_tool_mode_gating, adr0020_explicit_workspace_modes_build_line, adr0023_first_ordered_stop_line_building, concept_mode_separation, type_workspace_tool_mode_union [EXTRACTED 1.00]
- **Static Network KPIs Slice 014** — adr0032_slice_014_static_network_kpis, slice_014_static_kpis, concept_static_network_kpis, component_inspector_panel [EXTRACTED 1.00]
- **Stop marker interaction evolution chain** — adr0034_stop_marker_interaction, adr0035_stale_marker_mode, adr0039_stop_marker_anchor [INFERRED 0.85]
- **Material Symbols rendering contract chain** — adr0035_stale_marker_mode, adr0036_material_symbols_ligature, concept_material_symbols_font, concept_material_icon_component [EXTRACTED 1.00]
- **Street snap placement refinement chain** — adr0037_street_stop_placement, adr0045_deterministic_snap_ranking, adr0046_strict_fallback_gating, concept_street_snap_eligibility, concept_deterministic_snap_ranking, concept_strict_fallback_gating [EXTRACTED 1.00]
- **Map overlay projection refresh evolution** — adr0038_map_overlay_refresh, adr0040_render_lifecycle, concept_projection_refresh_raf, concept_render_lifecycle_binding [EXTRACTED 1.00]
- **Migration to map-native GeoJSON rendering** — adr0041_stop_geojson_rendering, adr0042_line_geojson_rendering, adr0043_feature_first_interaction, concept_stop_geojson_pipeline, concept_line_geojson_pipeline, concept_feature_first_interaction [EXTRACTED 1.00]
- **Route segment domain and fallback routing chain** — adr0047_route_segment_types, adr0048_routing_constants, adr0049_fallback_route_generation, adr0050_route_segment_geojson, adr0053_routing_boundary, concept_line_route_segment_types, concept_routing_constants_module, concept_fallback_routing_helper, concept_route_segment_geojson_assembly [EXTRACTED 1.00]
- **Route inspector and test infrastructure** — adr0051_route_debug_inspector, adr0052_fallback_routing_tests, concept_route_baseline_inspector, concept_vitest_runner [INFERRED 0.85]
- **Shell-owned canonical state migration** — adr0054_shell_stop_state, concept_shell_owned_stop_state, concept_stop_append_callback [EXTRACTED 1.00]
- **Selected-line export schema, validation, and fixture pipeline** — adr0055_export_schema_typing, adr0056_in_memory_export, adr0057_export_validation, adr0058_export_fixture_validation, concept_export_schema_types, concept_export_payload_validator, concept_in_memory_export_scope, concept_fixture_storage_path [EXTRACTED 1.00]
- **MapWorkspaceSurface cross-cutting concerns** — adr0034_stop_marker_interaction, adr0035_stale_marker_mode, adr0037_street_stop_placement, adr0038_map_overlay_refresh, adr0041_stop_geojson_rendering, adr0042_line_geojson_rendering, adr0043_feature_first_interaction, adr0044_map_style_readiness, adr0049_fallback_route_generation, adr0054_shell_stop_state, concept_map_workspace_surface [EXTRACTED 1.00]
- **Style-readiness guard for source/layer synchronization** — adr0044_map_style_readiness, concept_style_readiness_guard, concept_is_style_loaded, concept_stop_geojson_pipeline, concept_line_geojson_pipeline [INFERRED 0.85]
- **Readiness Evaluation Pipeline** — 0059_line_service_readiness_evaluator_boundary, 0060_diagnostic_code_constant_ownership, 0061_readiness_inspector_projection, 0062_readiness_diagnostics [EXTRACTED 1.00]
- **Simulation Clock Foundation** — 0063_simulation_clock_baseline, 0063_pure_clock_transitions, 0063_canonical_speeds, 0063_time_band_derivation [EXTRACTED 1.00]
- **Service Plan Projection Chain** — 0064_service_plan_projection, 0065_inspector_projection_consumption, 0066_network_summary_projection, 0067_departure_schedule [EXTRACTED 1.00]
- **Vehicle Projection Pipeline** — 0068_vehicle_projection_boundary, 0069_geometry_interpolation, 0070_vehicle_render_contracts, 0071_shell_vehicle_summary, 0072_derived_vehicle_projection [EXTRACTED 1.00]
- **Vehicle Rendering Contracts** — 0073_circle_layer_contract, 0074_vehicle_geojson_boundary, 0070_geojson_builder [EXTRACTED 1.00]
- **Session Loader and Map Sync Lifecycle** — 0075_session_loader, 0076_source_sync_fix, 0077_unified_source_sync [EXTRACTED 1.00]
- **Map Style Readiness and Data Sync** — 0078_style_readiness_split, 0079_completed_line_foreground_layer, 0080_layer_order_reapplication, 0081_diagnostics_hardening [EXTRACTED 1.00]
- **Module Boundary Refactors (Surface and Shell)** — 0082_surface_refactor, 0083_shell_refactor [EXTRACTED 1.00]
- **Map-centric shell design pattern** — concept_top-bar, concept_inspector, concept_selected-line-context-tray, concept_tool-mode-selector, concept_carto-dark-matter, concept_map-workspace-surface [EXTRACTED 1.00]
- **Service plan editor workflow** — concept_frequency-editor, concept_service-plan-kinds, concept_time-band-definitions, concept_session-state, concept_selected-line-projections [INFERRED 0.85]
- **Debug diagnostics pipeline** — concept_map-workspace-surface, concept_diagnostics-snapshot, concept_debug-modal, concept_app-tsx [EXTRACTED 1.00]
- **Time-band domain module** — concept_time-band-definitions, concept_minute-of-day, concept_time-band-ids, concept_simulation-controls [EXTRACTED 1.00]
- **Inspector tab organization** — concept_inspector, concept_static-network-summary, concept_selected-line-projections, concept_frequency-editor [EXTRACTED 1.00]
- **Map-native GeoJSON rendering pipeline** — 0041_stop_geojson_source_layer, 0042_map_native_line_geojson_rendering, mapRenderConstants_ts, stopGeoJson_ts, lineGeoJson_ts, MapWorkspaceSurface [INFERRED 0.95]
- **Routing domain foundation** — 0047_canonical_line_route_segment_domain_types, 0048_canonical_routing_baseline_constants, 0049_fallback_line_route_segment_generation, lineRoute_ts, routing_constants_ts, fallbackLineRouting_ts, LineRouteSegment, buildFallbackLineRouteSegments [INFERRED 0.95]
- **Selected-line export system** — 0055_selected_line_export_schema_typing, 0056_selected_line_in_memory_export_boundary, selectedLineExport_ts, LineRouteSegment, sessionLines, placedStops [INFERRED 0.95]
- **Shell-owned state ownership** — 0030_line_selected_frequency_editing, 0054_canonical_shell_owned_stop_session_state, App_tsx, sessionLines, placedStops, MapWorkspaceSurface [INFERRED 0.95]
- **Demand Gap Overlay Slice 170-174** — 0170c_demand_gap_overlay_tuning, 0172_demand_gap_focus, 0173_demand_gap_od_context, 0174_demand_gap_od_hints [EXTRACTED 1.00]
- **Demand Gap Planning Workflow Slice 175-179** — 0175_focused_planning_summary, 0176_od_candidate_readability, 0177_planning_action_entrypoints, 0178_planning_context_banner, 0179_lifecycle_feedback [EXTRACTED 1.00]
- **Demand Model Transparency Slice 180-182** — 0180_scenario_demand_provenance, 0181_demand_map_legend_caveat, 0182_visual_softening [EXTRACTED 1.00]
- **Demand Node Inspection Slice 183-186** — 0183_demand_node_focus, 0184_context_candidate_locality, 0185_service_coverage_projection, 0186_service_coverage_map [EXTRACTED 1.00]
- **OSM Data Pipeline** — census_grid_source_material, osm_attractor_source_material, local_osm_stop_candidates, local_osrm_routing [INFERRED 0.85]

## Communities (111 total, 9 thin omitted)

### Community 0 - "Test Utilities and Line/Demand Projections"
Cohesion: 0.05
Nodes (67): convertLineServiceByTimeBand(), convertSelectedLineExportPayloadToSession(), generateLineLabel(), generateUniqueLineLabel(), normaliseLabel(), normalizeAcceptedLineLabel(), buildCollection(), buildLine() (+59 more)

### Community 1 - "OSM Stop Candidate Processing"
Cohesion: 0.05
Nodes (48): decodeDemandGapIdFromFeatureProperties(), decodeDemandNodeIdFromFeature(), decodeDemandNodeIdFromFeatureProperties(), buildDemandNodeHoverFilter(), buildOsmStopCandidateHoverFilter(), createMapEntityHoverAffordanceController(), decodeMapEntityHoverTargetFromFeatureProperties(), hasNonEmptyString() (+40 more)

### Community 2 - "Workspace Configuration and Documentation"
Cohesion: 0.05
Nodes (80): BBBike Download Helper HTML (hvv-mvp), BBBike Download Helper HTML (OSM path), pnpm-workspace.yaml - Workspace Configuration, Architecture Decision Records, Agent Skills System, Blocking Data Operation Modal, Bounded Context: Demand, Bounded Context: Economy (+72 more)

### Community 3 - "Focused Demand Gap Planning"
Cohesion: 0.05
Nodes (31): resolveFocusedDemandGapPlanningContext(), applyFocusedDemandGapPlanningEntrypoint(), resolveFocusedDemandGapPlanningEntrypointToolMode(), isLikelyJsonFile(), parseSelectedLineExportFile(), parseSelectedLineExportJsonText(), createStopFromOsmCandidateGroup(), evaluateOsmStopCandidateAdoptionEligibility() (+23 more)

### Community 4 - "Early ADRs - Workspace and Stop Placement"
Cohesion: 0.05
Nodes (61): ADR 0009: Explicit Workspace Tool Mode State for Map Click Gating, ADR 0010: Split Neutral Click Telemetry from Stop-Placement Click Validation, ADR 0011: Keep Placed Stops in Local Map State with Canonical Minimal Stop Type, ADR 0012: Keep Stop-Placement Feature Queries on Narrow Typed MapLibre Contract, ADR 0013: Consolidate Stop-Placement Slice 008 Boundaries and Non-Goals, ADR 0014: Keep Map Workspace Selection Local and Stop-Only (Superseded), ADR 0015: Project Selected Stop Details from Map Workspace to Shell Inspector, ADR 0016: Define Explicit Stop Selection Transitions with Minimal Inspector Contract (+53 more)

### Community 5 - "Test Framework Infrastructure"
Cohesion: 0.08
Nodes (46): fail(), main(), validateTimeBandWeights(), fail(), main(), parseCensusGridCsv(), splitCsvLine(), cleanup() (+38 more)

### Community 6 - "Stop Placement and Marker Interaction ADRs"
Cohesion: 0.06
Nodes (53): ADR 0034: Stop marker interaction affordance and draft-membership state, ADR 0035: Stale marker mode click handling and Material icons rendering fix, ADR 0036: Material Symbols ligature rendering contract alignment, ADR 0037: Street stop placement eligibility and snap resolution split, ADR 0038: Map overlay refresh lifecycle and schematic copy clarification, ADR 0039: Stop-marker anchor/offset typing and visual-center alignment, ADR 0040: Render-lifecycle projection refresh binding for line overlay, ADR 0041: Stop rendering via GeoJSON source/layers and feature click interactions (+45 more)

### Community 7 - "Demand Gap GeoJSON and Overlays"
Cohesion: 0.06
Nodes (27): buildDemandGapOdContextFeatureCollection(), buildDemandGapOverlayFeatureCollection(), buildDemandNodeContextHintFeatureCollection(), buildCompletedLineFeatureCollection(), buildDraftLineFeatureCollection(), buildLineCoordinatesFromRouteSegments(), buildLineCoordinatesFromStops(), countSourceFeatures() (+19 more)

### Community 8 - "Routing Adapters and Line Completion"
Cohesion: 0.06
Nodes (22): LineCompletionDialog(), applyBasemapSemanticReadabilityOverrides(), applyPaintOverride(), applyMapLayerVisibility(), buildMapWorkspaceDebugSnapshot(), applyMapMaxBounds(), applyMapWorkspaceFocusIntent(), resolveLineFocusBounds() (+14 more)

### Community 9 - "Line Overlay and Selection ADRs"
Cohesion: 0.08
Nodes (36): ADR 0025: Line overlay pointer-event contract, ADR 0027: Inspector selection-priority state machine, ADR 0030: Line-selected frequency editing, ADR 0033: Explicit user-triggered build-line completion, ADR 0034: Stop marker interaction affordance, ADR 0038: Map overlay refresh lifecycle, ADR 0039: Stop-marker anchor/offset typing, ADR 0040: Render-lifecycle projection refresh (+28 more)

### Community 10 - "Scenario Demand Artifact Loading"
Cohesion: 0.11
Nodes (37): cleanup(), runAll(), runGenerator(), setup(), testCreateOutputDir(), testDuplicateIds(), testHamburgManifest(), testInvalidSeedShape() (+29 more)

### Community 11 - "Line Route Segment Domain and Routing ADRs"
Cohesion: 0.1
Nodes (39): ADR 0047: Canonical line-route segment domain types, ADR 0048: Canonical routing baseline constants, ADR 0049: Fallback line route segment generation on line completion, ADR 0050: Route-segment-first completed-line GeoJSON assembly, ADR 0051: Line-selected route baseline structural debug inspector, ADR 0052: Fallback routing unit test runner baseline, ADR 0053: Routing-support boundary and fallback truth contract, ADR 0054: Canonical shell-owned stop session state for map workspace sync (+31 more)

### Community 12 - "Dev UI and Debug Disclosure ADRs"
Cohesion: 0.1
Nodes (36): ADR 0084: Slice 026 dev UI control bar and inspector declutter, ADR 0085: Map workspace debug disclosure compaction, ADR 0085: Slice 027 dev UI density and debug disclosure, ADR 0086: Tool mode control compaction and icon-first accessibility, ADR 0087: Selected-line inspector disclosure compaction, ADR 0088: Static network summary debug disclosure compaction, ADR 0089: Unified top-bar simulation and session actions, ADR 0090: Switch map bootstrap style to CARTO Dark Matter GL (+28 more)

### Community 13 - "MapLibre Global Contract and Street Snap"
Cohesion: 0.16
Nodes (22): getSourceRefsForLayerIds(), compareSnapCandidates(), hasStreetLineGeometryInSourceFallback(), includesHint(), isLineGeometry(), isLineStringCoordinates(), isMultiLineStringCoordinates(), resolveBestSnapCandidateFromFeatures() (+14 more)

### Community 14 - "Demand Node Service Coverage"
Cohesion: 0.19
Nodes (17): createCandidateMatches(), createDiagnostics(), createEmptyProjection(), createProjection(), findCoveringStops(), findStructuralLineMatches(), formatDistanceLabel(), hasActiveLineService() (+9 more)

### Community 15 - "Simulation Clock"
Cohesion: 0.25
Nodes (16): advanceSimulationClock(), applySimulationClockCommand(), createInitialSimulationClockState(), createSimulationDayIndex(), createSimulationMinuteOfDay(), createSimulationSecondOfDay(), deriveSimulationSecondOfDay(), deriveTimeBandIdFromMinuteOfDay() (+8 more)

### Community 16 - "Network Planning Projections"
Cohesion: 0.19
Nodes (13): projectFocusedDemandGapLifecycle(), projectLineDepartureScheduleNetwork(), projectLinePlanningVehicles(), projectNetworkPlanningVehicles(), projectLineSelectedServiceInspector(), projectLineServicePlan(), projectLineVehicleNetwork(), projectScenarioDemandCapture() (+5 more)

### Community 17 - "Demand and Line Service Projections"
Cohesion: 0.2
Nodes (12): calculateGreatCircleDistanceMeters(), toRadians(), createEmptyProjection(), projectDemandGapRanking(), isPositiveFiniteNumber(), projectLineServicePlanForLine(), resolveProjectionStatus(), toProjectionNotes() (+4 more)

### Community 18 - "Script Test Framework"
Cohesion: 0.29
Nodes (17): cleanup(), runAll(), runScript(), setup(), testActionableErrors(), testDestatisAutodetect(), testDestatisPreset(), testDuplicateIds() (+9 more)

### Community 19 - "Selected Line Export Validation"
Cohesion: 0.22
Nodes (13): getFixturePath(), getValidatedFixturePayload(), readFixtureCandidate(), isFiniteNumber(), isRecord(), isStopCoordinateInRange(), parseIsoTimestamp(), cloneFixturePayload() (+5 more)

### Community 20 - "Test Group 20"
Cohesion: 0.2
Nodes (6): createUnavailableProjection(), projectDemandNodeInspection(), calculateActiveAttractorSinkWeight(), calculateActiveDemandWeight(), calculateActiveGatewayTransferWeight(), createEmptyCapturedEntitySummary()

### Community 21 - "Community 21"
Cohesion: 0.33
Nodes (14): cleanup(), runAll(), runScript(), setup(), testDuplicateIds(), testInvalidGeoJsonFailure(), testManifestReferences(), testMissingCensusCsvFailure() (+6 more)

### Community 23 - "Community 23"
Cohesion: 0.15
Nodes (14): Replacement Semantics Instead of Merge for Session Load, Validated Selected-Line Export Session Loader, Current-Value Refs for Load-Time Synchronization, Loaded-Session Map Source Synchronization Fix, Single syncAllMapWorkspaceSources Helper, Map Workspace Unified Source Synchronization Helper, Creation Path vs Data-Write Path Split, Style-Readiness Limited to Source/Layer Creation Not setData (+6 more)

### Community 24 - "TypeScript Module 24"
Cohesion: 0.28
Nodes (12): resolveTimeBandIdForMinuteOfDay(), createDepartureMinutes(), deriveDepartureProjectionStatus(), deriveUnavailableReason(), isServiceProjectionDepartureReady(), projectLineDepartureScheduleForLine(), projectLineDepartureScheduleForServiceProjection(), projectLineSelectedDepartureInspector() (+4 more)

### Community 25 - "TypeScript Module 25"
Cohesion: 0.26
Nodes (9): addFrequencyBandDepartures(), normalizeMinute(), projectLineDepartureTimetable(), projectOriginDepartures(), projectRouteBaselineSummary(), resolveActiveBandSummary(), resolveBandMinutes(), resolveStopLabels() (+1 more)

### Community 26 - "Community 26"
Cohesion: 0.21
Nodes (13): Canonical Speed Set (1x/5x/10x/20x), Pure Clock Transition Functions Outside React, Slice 019 Simulation Clock and Pause/Speed Controls Baseline, Canonical Time-Band Derivation from Minute-of-Day, Current Time-Band Departure Schedule Projection, Deterministic Headway Raster for Departure Minutes, Current-Minute Line Vehicle Projection Boundary, Vehicle Projection Status (projected/degraded-projected/unavailable) (+5 more)

### Community 27 - "Test Group 27"
Cohesion: 0.2
Nodes (4): formatMinuteOfDayToClock(), formatTimeBandWindow(), formatSimulationMinuteOfDay(), createMinuteOfDay()

### Community 28 - "Test Group 28"
Cohesion: 0.42
Nodes (11): runAll(), runWrapper(), testCustomImageDryRun(), testDryRunDefaults(), testFailureMissingArea(), testFailureMissingScenario(), testImageEnsureDryRun(), testNoCityopsName() (+3 more)

### Community 29 - "Community 29"
Cohesion: 0.2
Nodes (12): Issue Severity and Issue Code Types, Line Service Readiness Evaluator Boundary, evaluateLineServiceReadiness Pure Domain Evaluator, Readiness Status Union (ready/partially-ready/blocked), Line Service Readiness Diagnostic Code/Severity Constant Ownership, Canonical Readiness Constants Module, Inspector as Read-Only Projection Surface, Selected-Line Readiness Inspector Projection Boundary (+4 more)

### Community 30 - "Test Group 30"
Cohesion: 0.35
Nodes (6): createVehicleNetworkProjection(), findSegmentProgress(), projectVehiclesForLine(), clampRouteSegmentProgressRatio(), projectCoordinateAlongRouteGeometry(), createLineVehicleProjectionId()

### Community 31 - "Community 31"
Cohesion: 0.18
Nodes (11): OD Context Candidate Cap, Demand Gap OD Context Projection, OD Context Deterministic Ranking, Focused Demand Gap Planning Summary Projection, Planning Summary Evidence, focusedDemandGapPlanningProjection, Connectivity Gap Build Line Entrypoint, Focused Demand Gap Planning Action Entrypoints (+3 more)

### Community 32 - "Community 32"
Cohesion: 0.2
Nodes (11): Demand Node Focus and Time-Band Inspection, demandNodeInspectionProjection, inspectDemandTimeBandSelection State, selectedDemandNodeId State, Demand Node Context Candidate Locality, DEMAND_NODE_CONTEXT_DISTANCE_DECAY_METERS, Hyperbolic Distance Decay Scoring, Service Coverage Logic (+3 more)

### Community 33 - "TypeScript Module 33"
Cohesion: 0.4
Nodes (8): getExpectedForwardRouteSegmentCount(), getExpectedForwardRouteSegmentStopPair(), countConfiguredTimeBands(), evaluateLineServiceReadiness(), isKnownRouteStatus(), isNonEmptyString(), isNonNegativeFiniteNumber(), isPositiveFiniteNumber()

### Community 35 - "Community 35"
Cohesion: 0.42
Nodes (7): extractOsmNodeId(), normalizeStopCandidateFeatures(), parseOsmiumIntermediateText(), runTests(), testExtractOsmNodeId(), testNormalizeStopCandidateFeatures(), testParseOsmiumIntermediateText()

### Community 36 - "Community 36"
Cohesion: 0.22
Nodes (10): OSM Candidate Adoption Readiness, OSM Stop Candidate Inspection and Adoption Readiness, OSM Stop Candidate Inspection Projection, Local OSM Stop Candidate Generation, Local OSRM Routing Baseline, OSM Stop Adoption Workflow, OSM Stop Candidate Consolidation, OSM Stop Street Anchor Resolution (+2 more)

### Community 39 - "Community 39"
Cohesion: 0.22
Nodes (9): DemandGapOdContextProjection, demandGapOdContextGeoJson Builder, demand-gap-od-context Layer, Demand Gap OD Desire Hint Map Context, OD Desire Hints, Candidate Map-Focus Action, DemandGapOdCandidateListProjection, Demand Gap OD Candidate Focus and Readability (+1 more)

### Community 40 - "Test Group 40"
Cohesion: 0.36
Nodes (4): createEmptyProjection(), findFocusedGapItem(), projectDemandGapOdContext(), resolveProblemSideAndGuidance()

### Community 41 - "TypeScript Module 41"
Cohesion: 0.25
Nodes (3): InspectorLinesTab(), InspectorScrollArea(), InspectorTabBar()

### Community 42 - "Community 42"
Cohesion: 0.25
Nodes (8): Departures Per Hour as Theoretical Planning Metric, Projection Separate from Execution Simulation, Line Service Plan Projection Status and Summary Boundary, Service Status Union (blocked/not-configured/degraded/configured), Compact Line-Selected Inspector Projection Helper, Line-Selected Service Inspector Projection Consumption, Total Completed Line Count Field, Active-Service Network Summary Projection Consumption

### Community 43 - "Community 43"
Cohesion: 0.29
Nodes (8): DemandGapLegend Component, Demand Gap Overlay Tuning, Heatmap Tuning, Visual Weight Property, DemandMapLegend Component, Gap Circle Visual Softening, Heatmap Visual Softening, Demand Gap Overlay Visual Softening

### Community 44 - "Community 44"
Cohesion: 0.29
Nodes (8): Scenario Demand Provenance Projection, Census Grid Pipeline, Census Grid Source-Material Preparation, Census Data Sources, OSM Attractor Tag Categories, OSM Attractor Licensing, OSM Attractor Pipeline, OSM Attractor Source-Material Preparation

### Community 45 - "Test Group 45"
Cohesion: 0.38
Nodes (3): createEmptyProjection(), findFocusedGapItem(), projectFocusedDemandGapPlanningSummary()

### Community 46 - "Community 46"
Cohesion: 0.4
Nodes (6): Vehicle GeoJSON Feature Builder, Map Vehicle Render Contracts from Derived Projections, Vehicle Circle-Layer Rendering Contract, Circle Layer Instead of Symbol Layer for Vehicle Markers, Degraded vs Normal Marker Styling Semantics, Vehicle Circle Layer Semantics and Map-Native GeoJSON Boundary

### Community 47 - "Community 47"
Cohesion: 0.33
Nodes (6): Demand Gap Focus Workflow, focusedDemandGapId State, Demand Gap Overlay Focus Layer, Demand Gap Planning Guidance, Focused Demand Gap Lifecycle Feedback, Focused Demand Gap Lifecycle Projection

### Community 48 - "Community 48"
Cohesion: 0.7
Nodes (4): main(), printDiagnostics(), validateAreaConfig(), waitPort()

### Community 50 - "TypeScript Module 50"
Cohesion: 0.67
Nodes (3): deriveSimulationWeekdayId(), formatSimulationWeekdayShort(), SimulationControlBar()

### Community 51 - "Community 51"
Cohesion: 0.83
Nodes (3): fail(), main(), splitCsvLine()

### Community 52 - "Architecture Decisions 52"
Cohesion: 0.83
Nodes (4): ADR 0018: Set Hamburg-Focused Map Bootstrap Baseline for Desktop Stop Placement, ADR 0019: Adopt Hamburg-Centered Street-Legible Map Baseline as Playable Bootstrap Reference, Hamburg Map Bootstrap Baseline, Map Bootstrap Config (mapBootstrapConfig.ts)

### Community 53 - "Community 53"
Cohesion: 0.5
Nodes (4): Extracted Map Workspace Modules (Street Snap/Interactions/Lifecycle/UI Feedback), Slice 024 Map Workspace Surface Boundary Refactor, Extracted Shell Boundaries (Session State/Clock Controller/Projections/Inspector), Slice 025 App Shell Session and Projection Boundary Refactor

### Community 54 - "Community 54"
Cohesion: 0.5
Nodes (4): Demand Model Caveat, Scenario Demand Provenance and Model Caveat, Demand Map Legend Model-Caveat Alignment, Non-Claim Wording Policy

### Community 60 - "Community 60"
Cohesion: 0.67
Nodes (3): Inspector Disclosure Polish, Shell CSS Tokens, Shell Panel Spacing and Inspector Disclosure Polish

## Knowledge Gaps
- **88 isolated node(s):** `DESIGN.md - Design System (Externally Owned)`, `pnpm-workspace.yaml - Workspace Configuration`, `Web App Entry Point HTML`, `BBBike Download Helper HTML (OSM path)`, `ADR 0003 - Initial Desktop Shell Layout` (+83 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **9 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `Vitest` connect `Test Utilities and Line/Demand Projections` to `OSM Stop Candidate Processing`, `Focused Demand Gap Planning`, `Demand Gap GeoJSON and Overlays`, `Routing Adapters and Line Completion`, `Line Overlay and Selection ADRs`, `Scenario Demand Artifact Loading`, `Simulation Clock`, `Demand and Line Service Projections`, `Selected Line Export Validation`, `Test Group 20`, `TypeScript Module 22`, `Test Group 27`, `Test Group 30`, `Test Group 34`, `Test Group 38`, `Test Group 40`, `Test Group 45`, `Test Group 49`, `Test Group 55`, `Test Group 56`?**
  _High betweenness centrality (0.215) - this node is a cross-community bridge._
- **Why does `ADR 0052: Fallback routing unit test runner` connect `Line Overlay and Selection ADRs` to `Test Utilities and Line/Demand Projections`?**
  _High betweenness centrality (0.041) - this node is a cross-community bridge._
- **Are the 10 inferred relationships involving `createStopId()` (e.g. with `convertSelectedLineExportPayloadToSession()` and `createStopFromOsmCandidateGroup()`) actually correct?**
  _`createStopId()` has 10 INFERRED edges - model-reasoned connections that need verification._
- **Are the 11 inferred relationships involving `createLineId()` (e.g. with `convertSelectedLineExportPayloadToSession()` and `createSegment()`) actually correct?**
  _`createLineId()` has 11 INFERRED edges - model-reasoned connections that need verification._
- **Are the 11 inferred relationships involving `createLineSegmentId()` (e.g. with `createSegment()` and `createSegment()`) actually correct?**
  _`createLineSegmentId()` has 11 INFERRED edges - model-reasoned connections that need verification._
- **Are the 10 inferred relationships involving `createRouteTravelMinutes()` (e.g. with `createSegment()` and `createSegment()`) actually correct?**
  _`createRouteTravelMinutes()` has 10 INFERRED edges - model-reasoned connections that need verification._
- **What connects `DESIGN.md - Design System (Externally Owned)`, `pnpm-workspace.yaml - Workspace Configuration`, `Web App Entry Point HTML` to the rest of the system?**
  _88 weakly-connected nodes found - possible documentation gaps or missing edges._