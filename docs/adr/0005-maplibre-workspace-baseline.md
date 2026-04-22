# ADR 0005: Integrate MapLibre as the initial workspace rendering baseline

## Status

Accepted

## Date

2026-04-22

## Context

The map workspace scaffold currently reserves structure for future map integration but still renders a non-functional placeholder. CityOps needs a real interactive map runtime inside the existing desktop shell so future map-centric slices can build on a concrete baseline without introducing gameplay semantics.

## Decision

- Replace the placeholder surface behavior in `apps/web/src/map-workspace/MapWorkspaceSurface.tsx` with a real MapLibre map instance lifecycle.
- Keep map initialization narrowly scoped to the map workspace component using a React effect with explicit cleanup via `map.remove()`.
- Introduce `apps/web/src/map-workspace/mapBootstrapConfig.ts` to centralize baseline map settings (style URL, center, zoom bounds).
- Load MapLibre runtime and CSS from the MapLibre CDN in `apps/web/index.html` because registry access in this environment blocked package installation.
- Keep map overlays neutral and non-gameplay (single map-ready status label only).

## Consequences

- The shell now hosts a real interactive map surface in the central workspace region.
- Map lifecycle management stays localized and ready for incremental map interaction layers later.
- No stop placement, line building, routing, demand, simulation, persistence, or backend logic is introduced.
- The style/runtime source remains explicitly replaceable in a future infrastructure slice.
