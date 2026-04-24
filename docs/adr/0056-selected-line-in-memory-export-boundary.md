# ADR 0056: Selected-line in-memory export boundary and shell-owned stop truth

## Status

Accepted

## Date

2026-04-24

## Context

The selected-line export feature is intended as a lightweight, bus-first MVP debugging and fixture-generation action.

Without explicit boundaries, export behavior could drift into broader session snapshots, persistence assumptions, or route recomputation that exceeds current MVP scope.

The shell already owns canonical session stop truth in `App.tsx`, while completed lines store canonical route segments as session truth.

## Decision

- Scope export to one in-memory completed line: the currently selected line only.
- Build the payload boundary from:
  - the selected completed line
  - only stops referenced by that line's ordered stop ids
- Do not include unrelated session lines or unrelated placed stops in export payloads.
- Serialize route segments exactly as stored canonical line truth (`line.routeSegments`) without recomputation, rerouting, or normalization during export.
- Preserve shell-owned stop truth in `App.tsx` as the source used to resolve referenced stop blocks for export.
- Keep schema versioning explicit and stable (schema id + payload kind discriminator) so exported JSON fixtures remain deterministic and robust against accidental contract drift.

## Consequences

- Export output remains tightly aligned with the current selected planning artifact, which matches bus-first MVP scope and avoids accidental full-session snapshot semantics.
- Route segment data in exported JSON remains faithful to stored session truth, improving reproducibility for tests and fixtures.
- Stop ownership in the shell preserves one canonical stop source for map rendering, inspector summaries, and export assembly.
- Explicit schema/version markers make fixture updates intentional and reviewable when export contracts change.

## Non-goals

- No persistence or save/load system.
- No import workflow.
- No backend/API synchronization.
- No simulation, demand, economy, or traffic-model expansion.
- No multimodal scope expansion beyond the bus-first MVP.
