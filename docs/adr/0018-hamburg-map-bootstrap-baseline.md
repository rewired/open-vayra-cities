# ADR 0018: Set Hamburg-focused map bootstrap baseline for desktop stop placement

## Status

Accepted

## Date

2026-04-22

## Context

The workspace bootstrap still used a generic demo style and a world-scale viewport.
That made first-load gameplay context too abstract for the bus-first MVP and reduced immediate stop-placement readability.

For this slice we need to keep baseline map bootstrap values centralized while improving practical city-scale onboarding:
- choose a MapLibre-compatible style with clear street structure
- start directly in Hamburg for immediate gameplay context
- use city-level zoom bounds that fit desktop planning and stop placement
- avoid introducing any additional viewport/style constants in UI components

## Decision

- Keep map style and viewport defaults centralized in `apps/web/src/map-workspace/mapBootstrapConfig.ts`.
- Replace the demo style URL with CARTO Positron GL style (`https://basemaps.cartocdn.com/gl/positron-gl-style/style.json`) for street-legible city basemap rendering.
- Set startup center to Hamburg (`[9.993682, 53.551086]`).
- Set startup zoom and bounds to city-planning-friendly defaults (`zoom: 12`, `minZoom: 10`, `maxZoom: 18`).
- Update inline export documentation to describe Hamburg startup intent and practical stop-placement readability.

## Explicit non-goals

This decision does **not** add:
- new transport modes
- simulation logic changes
- map interaction behavior changes
- mobile viewport behavior

## Consequences

- The map opens in a gameplay-relevant Hamburg context with readable street structure.
- Baseline map values stay centralized and easier to evolve deliberately.
- `MapWorkspaceSurface` remains configuration-driven for style and viewport bootstrap inputs.
