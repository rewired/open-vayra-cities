# ADR 0003: Introduce the initial desktop app shell layout

## Status

Accepted

## Date

2026-04-22

## Context

CityOps needs a first usable UI composition that establishes where planning workflows will live, while keeping the implementation intentionally lightweight and free of map, routing, simulation, and persistence behavior.

## Decision

- Implement a desktop-only shell in `apps/web/src/App.tsx` with five explicit regions:
  - top header
  - left tool/navigation panel
  - central workspace
  - right inspector panel
  - bottom status bar
- Use minimal CSS grid styling in `apps/web/src/App.css` to make these regions visually clear.
- Keep all region content as placeholders so future slices can add behavior incrementally without architectural drift.

## Consequences

- The web app now communicates intended gameplay workflow zones without introducing domain or simulation logic.
- The shell remains desktop-first by using a wide-layout minimum width and no mobile fallback behavior.
- Future slices can populate existing regions with typed UI and domain projections while preserving boundary discipline.
