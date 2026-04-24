# ADR 0085: Map workspace debug disclosure compaction

## Status

Accepted (2026-04-24)

## Context

`MapWorkspaceSurface` exposed a dense always-visible HUD string that mixed mode-critical status with lower-priority diagnostics. This reduced scanability for placement and build-line workflows in the compact desktop map view.

The existing map interaction, source synchronization, rendering, and projection behavior contracts are already established and should remain unchanged.

## Decision

1. Add one reusable presentational `DebugDisclosure` component that uses native `<details>/<summary>` semantics for keyboard-accessible disclosure behavior.
2. Keep compact, mode-critical map overlays visible by default.
   - Keep mode hint and concise placement/build feedback on always-visible overlays.
   - Keep draft completion controls in build-line mode visible.
3. Move lower-priority diagnostics into a collapsed debug section.
   - Include line/vehicle builder-source-rendered counts.
   - Include pointer and geographic telemetry.
   - Include interaction lifecycle/status text.
   - Include draft metadata and mode instruction copy used for diagnostics.
4. Add low-visual-weight styling for the debug disclosure so it remains available without dominating default map presentation.

## Consequences

- Default map overlay presentation is more compact and easier to scan.
- Existing diagnostics remain available with no computation-path removal.
- Keyboard and pointer users can expand/collapse diagnostics using native disclosure controls.

## Why this is presentation-only

This slice only relocates and restyles already computed values. It does not alter map behavior, interaction semantics, source synchronization semantics, render contracts, projection logic, or domain simulation behavior.

## Explicit non-goals (Slice 031)

- no map interaction changes
- no source synchronization changes
- no map rendering semantics changes
- no projection semantics changes
- no simulation/domain behavior changes
- no multimodal expansion
- no mobile behavior
