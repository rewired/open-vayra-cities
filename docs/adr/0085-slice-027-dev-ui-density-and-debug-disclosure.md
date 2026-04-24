# ADR 0085: Slice 027 dev UI density and debug disclosure

## Status

Accepted (2026-04-24)

## Context

After recent bus-only MVP planning slices, the desktop shell and map/inspector surfaces carried useful diagnostics but too much always-visible text density. High-signal planning information competed with lower-priority troubleshooting detail, reducing scan speed during line planning and frequency tuning.

The goal of this slice is a post-slice declutter pass that reorganizes existing UI information without changing domain or simulation truth.

## Decision

1. Run a post-slice declutter density pass focused on information hierarchy, not behavior.
   - Keep always-visible content centered on planning-critical summaries.
   - Move verbose diagnostics into optional disclosure regions.
2. Intentionally avoid browser zoom detection.
   - Browser zoom reporting is inconsistent across environments and can create brittle, device-specific behavior.
   - The UI should remain legible through deterministic compact layout rules rather than runtime zoom heuristics.
3. Hide diagnostics behind disclosure instead of removing diagnostics.
   - Diagnostics remain essential for debugging map/render/inspector issues during development.
   - Disclosure preserves access while reducing default cognitive load.
4. Keep map overlay diagnostics minimized by default.
   - Map overlays must prioritize actionable placement/build-line signals.
   - Secondary telemetry and counters should be available on demand, not dominant in baseline view.
5. Prioritize planning summaries in the inspector.
   - Inspector default sections should emphasize planning outcomes (service/frequency/readiness/projection summaries) before deep technical diagnostics.
   - Detailed internals remain available in collapsed sections for investigation.

## Consequences

- The desktop UI is easier to scan during routine planning workflows.
- Developers retain full diagnostic access without permanent visual noise.
- Behavior remains presentation-only, preserving existing simulation and projection contracts.

## Explicit non-goals (Slice 027)

- no simulation/routing/projection/loader/export semantics changes
- no persistence/backends/scenario/replay/etc.
- no mobile/multimodal expansion
