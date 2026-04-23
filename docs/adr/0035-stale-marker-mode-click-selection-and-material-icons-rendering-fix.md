# ADR 0035: Stale marker mode click handling, completed-line clickability, and Material icon rendering fix

## Status

Accepted

## Date

2026-04-23

## Scope

Document Slice 014c corrections in `MapWorkspaceSurface` and shared shell styling.

## Constraints

- Keep stop-based ordered build-line drafting semantics unchanged.
- Preserve draft/completed line separation.
- Keep completed-line selection available only through completed line overlays.
- Keep Google Material as the single icon baseline.
- Do not introduce routing, simulation, demand, economy, persistence, backend, or mobile behavior.

## Decision

- Route stop-marker activation through a mode-aware interaction handler that reads current tool mode from refs at click time, preventing stale mode closures on markers created in earlier modes.
- Keep marker creation stable while making marker click behavior reflect current runtime state for both inspect and build-line interactions.
- Enable overlay hit testing so completed polylines are actually selectable through the intended SVG overlay click path.
- Add explicit Material Symbols font styling (`font-family` and baseline ligature/variation settings) to ensure ligature names render as icons rather than raw text.

## Explicit non-goals

Slice 014c does **not** introduce:

- any new line creation workflow
- map-click/freehand line creation
- routing/pathfinding logic
- simulation/demand/economy/frequency model redesign
- persistence or backend systems
- an alternate icon library

## Consequences

- Existing stop markers now honor the current tool mode without requiring marker recreation.
- Build-line append and inspect stop selection both remain functional on the same marker set.
- Completed line overlays are practically selectable.
- Material icon ligatures render consistently as intended icons.
