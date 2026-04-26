# ADR 0122: Network Inventory Summary-First and Compact Stop Selection

- Status: Accepted
- Date: 2026-04-26

## Context

The Network tab inventory rendered a full global stop list with inline rename controls for each stop.

That made stop rename appear as a primary global workflow even though line-context rename entrypoints already exist in:

- the Lines tab list,
- the selected-line header and route sequence context.

The Network tab should stay summary-oriented and avoid large, always-on stop rename surfaces.

## Decision

Restructure `NetworkInventory` to:

- keep network-level stop information summary-first,
- remove inline stop rename controls from the global inventory,
- provide only a compact stop selection list (debug/selection aid) limited to a small subset,
- keep line list content and row-level line rename available.

No new domain/session commands are introduced. Existing stop rename callbacks remain available in line-context flows outside the network inventory.

## Consequences

- Network tab remains focused on high-level network understanding rather than mass stop editing.
- Large global stop inventory rendering is reduced.
- Stop selection remains possible from the Network tab without promoting rename as the primary action.
- Line-focused rename entrypoints remain intact where line context exists.
