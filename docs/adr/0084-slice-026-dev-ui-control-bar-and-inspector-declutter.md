# ADR 0084: Slice 026 dev UI control bar and inspector declutter

## Status

Accepted (2026-04-24)

## Context

After the projection and vehicle slices, the desktop shell exposed useful planning and diagnostics data but presented too much information as dense paragraph text. Clock controls were low in the layout, service/departure summaries were hard to scan quickly, and lower-priority debug details competed with primary planning information.

The existing behavior for clock, readiness/service/departure/vehicle projections, selected-line load/export, map rendering, and projected markers was already established and should remain unchanged.

## Decision

1. Move simulation controls into a top-level desktop control bar near the application header.
   - Keep current day, `HH:MM`, and active time-band label always visible.
   - Keep clock controls easy to locate and use.
2. Replace separate pause/resume buttons with one icon toggle button.
   - Preserve the canonical running-state model (`running` vs `paused`) where paused is not a speed.
3. Keep reset as a dedicated icon button.
4. Represent canonical speed selection as one discrete slider-like control mapped only to `1x`, `5x`, `10x`, and `20x`.
   - Reuse canonical speed definitions and avoid arbitrary speed values.
5. Render session selected-line load/export as compact icon actions with accessible labels and titles.
   - Preserve existing load replacement and export behavior semantics.
6. Convert static network summary rendering to compact table presentation.
   - Use existing structural/service/projection counts only.
7. Remove the always-visible full MVP time-band list text from the main inspector UI.
   - Keep active time-band visibility in the top control bar and selected-line summary sections.
8. Reorganize selected-line inspector hierarchy for scanability.
   - Frequency editing, service readiness summary, current service plan summary, departure schedule summary, projected vehicles summary, and route baseline summary use compact stat/table layouts.
9. Move heavy debug/diagnostic detail blocks into native disclosure sections (`<details>/<summary>`), while keeping compact blocker/error summaries visible outside collapsed content.

## Consequences

- The desktop planning workflow is easier to scan without changing domain behavior.
- Clock/service controls become more prominent and compact.
- Session import/export remains accessible but less visually noisy.
- Service/departure/projection summaries remain visible with clearer information hierarchy.
- Debug information is still available but no longer dominates the default inspector layout.

## Why this is UI organization only

This slice changes component organization and presentation hierarchy. It does not alter simulation clock semantics, routing semantics, projection semantics, validation rules, selected-line loader/export contracts, map synchronization behavior, or vehicle marker semantics.

## Explicit non-goals (Slice 026)

- no simulation changes
- no routing changes
- no projection semantics changes
- no loader/export semantics changes
- no persistence
- no savegame loading
- no scenario loading
- no fixture replay
- no demand/economy/passenger/vehicle/fleet/depot/layover behavior
- no backend
- no multimodal expansion
- no mobile behavior
