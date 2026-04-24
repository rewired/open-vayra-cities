# ADR 0091: Add compact selected-line context tray near map workspace bottom

## Status

Accepted (2026-04-24)

## Context

The selected-line details currently live in the right inspector panel, which can force repeated eye travel away from the map while line planning and simulation-time checks happen in the map workspace.
We need a compact, read-only context surface near the map bottom that keeps map dominance while exposing a minimal set of already-existing selected-line/session/projection fields.

## Decision

1. Add a small presentational `SelectedLineContextTray` component under `apps/web/src/map-workspace` and keep it stateless.
2. Render the tray from `App.tsx` near the map workspace bottom only when a completed line is selected from session state.
3. Limit displayed fields to existing values already available from selected line + selected-line projections:
   - line id/label
   - stop count with compact stop-sequence representation
   - segment count
   - total route time
   - active time-band headway
   - next departure
   - projected vehicle count
4. Keep the tray non-interactive (no focus trap risk) and visually compact so the map remains the dominant surface.

## Consequences

- Line context remains visible near the map without opening new interactive controls.
- No simulation/domain logic moves into UI; the tray consumes existing selected-line/session/projection outputs.
- Keyboard safety is preserved by using read-only markup and no trapped focusable elements.

## Explicit non-goals

- no new simulation, routing, departure, or vehicle projection behavior
- no new editable controls inside the tray
- no mobile layout introduction
- no multimodal transport scope expansion
