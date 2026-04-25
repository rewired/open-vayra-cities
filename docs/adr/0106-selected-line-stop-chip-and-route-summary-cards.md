# ADR 0106: Use stop chips with expandable sequence and truthful route-summary cards in selected-line inspector

## Status

Accepted

## Context

The selected-line inspector compact header rendered ordered stops as a long inline arrow-delimited text worm, which became hard to scan for longer lines. The same header also used a combined `Segments / route time` row that compressed key route facts into one table cell.

We need a more readable compact presentation while keeping the inspector truthful and preserving existing action/readiness workflow.

## Decision

Update selected-line compact header presentation to:

- replace the ordered-stop text worm with compact stop chips;
- render only a bounded chip preview by default;
- provide an expandable disclosure to reveal the full ordered stop sequence when the line has more stops than the preview cap.

Replace the combined `Segments / route time` row with three compact stat cards:

- `Stops` from selected-line stop ids;
- `Segments` from route-baseline aggregate metrics;
- `Runtime` from route-baseline aggregate metrics.

If route-baseline metrics are unavailable, keep explicit `Unavailable` values instead of derived/fabricated substitutes.

Keep issue/readiness pills near the top and retain required action entrypoints (`Edit frequency`, `Service plan`, `Departures`, `Projected vehicles`) without introducing any non-truthful KPI metrics.

## Consequences

- Selected-line stop ordering becomes easier to scan in compact form while still allowing full-sequence inspection on demand.
- Route summary values become clearer and more scannable through dedicated truthful stat cards.
- Selected-line inspector remains presentation-only with no simulation, routing, or projection semantic changes.
