# ADR 0105: Prioritize player-facing service-plan summary and move deep diagnostics to Debug modal

## Status

Accepted

## Context

The selected-line `Service plan` dialog previously mixed high-priority gameplay information with deep readiness diagnostics (including expandable issue lists and raw issue codes). This made the player-facing modal noisy and exposed technical/debug detail in a surface intended for quick service planning checks.

We need the modal to emphasize actionable service state at a glance while preserving full diagnostics somewhere else.

## Decision

Refactor the selected-line `Service plan` dialog so its primary content is:

- service status pill;
- active time-band label;
- active time-band window;
- active service state (`Every N min`, `No service`, or `Unset`);
- departures/hour only when available;
- runtime only when available;
- compact warning/blocker/message pills for actionable issues.

At the same time:

- remove/demote deep issue lists from this player-facing modal;
- stop surfacing raw issue codes in this modal;
- direct technical issue detail review to the global Debug modal service diagnostics.

The dialog remains on the shared medium-size inspector dialog variant.

## Consequences

- Players see the most relevant service status fields first, with less cognitive load.
- Technical readiness details continue to exist in the Debug modal without duplicating heavy diagnostics across surfaces.
- UI scope remains presentation-only; no readiness, projection, or simulation/domain semantics change.
