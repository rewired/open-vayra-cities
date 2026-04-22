# ADR 0019: Adopt Hamburg-centered, street-legible map baseline as the playable bootstrap reference

## Status

Accepted

## Date

2026-04-22

## Context

The previous bootstrap used a generic demo-oriented map baseline that was not sufficient for traceable, gameplay-relevant validation.
In practice, that baseline had two issues for the bus-first MVP:
- it did not reliably open in a concrete, city-scale planning context suitable for immediate stop placement
- it made street structure legibility too weak for quick visual confirmation of street-constrained placement behavior

The MVP needs a reproducible baseline that is concrete enough for demos and political/stakeholder walkthroughs, while still staying inside the existing stop-placement slice boundaries.

## Decision

- Use a Hamburg-centered startup viewport as the default bootstrap context.
- Use a street-legible MapLibre-compatible basemap as the default bootstrap style.
- Treat this as a baseline correction only; keep existing street-based stop-placement constraints intact.
- Keep style/viewport defaults centralized in the existing map bootstrap configuration surface.

## Explicit non-goals

This decision does **not** expand scope into:
- line planning or line editing features
- routing or pathfinding features
- simulation behavior changes
- economy system changes
- persistence, saves, or backend state
- mobile behavior or responsive/mobile layouts

## Consequences

- Demo and stakeholder validation starts from a concrete Hamburg context instead of a generic world/demo baseline.
- Street network readability is improved at startup for stop-placement traceability.
- The change remains documentation and baseline-focused, without introducing adjacent gameplay/system expansion.
