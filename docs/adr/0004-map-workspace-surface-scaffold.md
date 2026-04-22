# ADR 0004: Prepare a dedicated map workspace surface scaffold

## Status

Accepted

## Date

2026-04-22

## Context

The initial shell established a central workspace placeholder, but the map-facing area still reads as generic content. CityOps needs a clearer workspace structure that reserves extension points for future map integration without introducing any real map technology, gameplay semantics, routing, or simulation behavior.

## Decision

- Add a dedicated `MapWorkspaceSurface` component in `apps/web/src/map-workspace/MapWorkspaceSurface.tsx`.
- Replace the generic central workspace placeholder in `apps/web/src/App.tsx` with the new component.
- Keep the surface intentionally structural with:
  - a non-functional background layer representing the future interaction surface
  - non-functional HUD and overlay region markers
  - an empty-state message that explicitly states map integration is not connected in this slice
- Limit styling changes to `apps/web/src/App.css` to support desktop-first shell composition and visual clarity of the new workspace structure.

## Consequences

- The center of the shell now reads as an intentional map workspace instead of generic placeholder content.
- Future slices have explicit extension points for map, HUD, and overlay behavior while preserving layer boundaries.
- No map dependency, geographic rendering stack, fake transport gameplay state, or simulation logic is introduced.
