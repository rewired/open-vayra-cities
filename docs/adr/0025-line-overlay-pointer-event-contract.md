# ADR 0025: Line overlay pointer-event contract for completed-line selection

## Status

Accepted

## Date

2026-04-22

## Scope

Refine map line-overlay hit behavior so completed line polylines are selectable by click while normal MapLibre map interactions continue to work for non-line areas.

## Constraints

- Keep the change desktop-only and scoped to the existing bus-first MVP line-building slice.
- Keep the SVG line overlay non-blocking by default so map click-through remains intact.
- Do not make draft line polylines interactive in this slice.
- Do not introduce routing, simulation, persistence, or additional transport modes.

## Decision

- Keep `svg.map-workspace__line-overlay` with `pointer-events: none` as the default interaction baseline.
- Enable pointer events only for completed polylines with `pointer-events: stroke` so only stroke hits are clickable.
- Add a selected completed-line class variant that remains stroke-interactive and visually distinct.
- Keep draft polylines explicitly non-interactive.

## Explicit non-goals

This slice does **not** introduce:

- area-based hit targets for lines
- draft-line selection interaction
- global map interaction rewrites
- gameplay/economy/service behavior changes
