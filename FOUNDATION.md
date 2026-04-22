# FOUNDATION.md

## Purpose

This document provides the compact, project-level foundation for the initial phase of the project.

It complements the more specialized governance documents by summarizing the essential truth of the product, architecture posture, delivery philosophy, and implementation boundaries.

This document is intended to help humans and coding agents align quickly before making changes.

---

## Project identity

This project is a desktop-only, browser-based transit network simulation game.

The first playable scope is a bus-first MVP in which the player builds a custom network inside a believable urban environment and improves it through iterative planning.

The project is not a full real-world transit reconstruction tool and not a full multimodal transport engineering suite.

---

## Foundational product truth

The first playable experience is centered on:

* stop placement on streets
* line creation through ordered stop selection
* direction-aware service
* round-line support
* time-band-based frequency planning
* realistic-enough stop-to-stop travel times
* demand capture from residential and workplace patterns
* evaluation through economics and passenger satisfaction

The game must produce a real planning-improvement loop, not merely a static map editor or planning mockup.

---

## Delivery philosophy

The project must be developed as a sharply scoped, playable game slice.

The initial phase must favor:

* playable truth over exhaustive realism
* strong boundaries over convenience shortcuts
* explicit documentation over implied semantics
* centralized constants over local duplication
* strict type safety over weakly typed speed hacks
* aggregate-first simulation over premature micro-simulation

The project should remain compatible with disciplined coding-agent-assisted implementation.

---

## Anti-sprawl principle

This project can become a scope trap if allowed to drift.

To avoid that, the first phase must not silently expand into:

* multimodal transport simulation
* rail construction gameplay
* detailed depot operations
* staffing systems
* maintenance/depreciation depth
* micro traffic simulation
* mobile UX support
* full city-growth simulation
* heavy backend/service architecture without clear need

The first phase is intentionally smaller than the long-term vision.

---

## Architecture posture

The project should be organized around a strongly typed core with clear separation between:

* world/map representation
* demand model
* player-created transit network
* routing support
* simulation logic
* economy logic
* UI projections and interactions

The UI is not allowed to become the owner of simulation truth.
The routing layer is not allowed to become the owner of network truth.
The map layer is not allowed to become the owner of demand truth.

---

## Simulation posture

The MVP should remain aggregate-first.

This means:

* tick-based progression
* time-band-aware service behavior
* demand-node-driven trip generation
* believable routed segment travel times
* visible buses as player feedback
* no requirement for full vehicle micro-ops truth

The project should only increase realism where it materially improves the planning game loop.

---

## Travel time principle

Realistic stop-to-stop travel time is a core requirement.

This must be grounded in believable street-linked routing or equivalent street-based path truth.

The project must not use straight-line timing as the main operational truth.

However, the MVP does not require full traffic micro-simulation, signal simulation, or minute-perfect operations modeling.

---

## Demand principle

Demand comes from spatial demand sources, not from stops.

For MVP, the active demand model is limited to:

* residential origins
* workplace destinations

The system may be prepared for additional demand classes later, but those future extensions must not distort MVP delivery.

---

## Platform principle

This project is desktop-only.

This is not a mobile project.
No architecture, interaction, or UI decision should be degraded to accommodate phone-sized screens or touch-first constraints.

Dense interfaces, map editing precision, and desktop interaction assumptions are acceptable by design.

---

## Language principle

All source code and all project documentation must be written in English.

German is acceptable in chat discussion, but never as repository truth.

This rule applies to:

* identifiers
* comments
* docstrings
* Markdown docs
* exported symbol documentation

---

## Export documentation principle

All exported public code surfaces must include concise inline documentation.

This is mandatory, not optional.

Undocumented exports create ambiguity, invite duplication, and degrade coding-agent reliability.

Every exported public surface should make its purpose and constraints obvious enough to be used correctly without guesswork.

---

## Type safety principle

Strong type safety is a foundational project rule.

The project must avoid:

* informal string truth for important domain concepts
* weakly typed public contracts
* `any`-based shortcuts
* duplicated ad-hoc type definitions across layers

Important concepts such as IDs, time bands, directions, demand classes, and simulation statuses should be canonically typed.

---

## Constants principle

Domain and simulation constants must be centralized.

The project must avoid:

* scattered magic numbers
* duplicated thresholds
* local redefinition of domain defaults
* UI-local copies of simulation values

If a value matters to domain meaning or simulation behavior, it must have a canonical home.

---

## External design ownership

`DESIGN.md` is externally owned and provided by Voltagent.

The repository must not invent, replace, or speculate design authority in its absence.

Until the external design source exists, implementation may use only minimal functional UI assumptions required for desktop gameplay and delivery progress.

---

## Coding-agent operating principle

Coding agents must work with explicit scope discipline.

Preferred behavior:

* plan first
* implement small coherent slices
* preserve boundaries
* keep exports documented
* preserve type safety
* reuse canonical constants
* avoid silent realism escalation
* avoid silent scope expansion

The project should remain easy to reason about for both humans and coding agents.

---

## Practical definition of success for phase one

Phase one is successful if the project reaches a clearly playable desktop bus-network MVP with:

* a detailed map view
* stop placement on streets
* line creation from ordered stops
* time-band frequency control
* believable segment travel times
* demand capture from homes to work
* visible service feedback
* financial and passenger-facing performance metrics
* an iterative improvement loop that is understandable and satisfying

If the project instead becomes a broad technical framework without a playable loop, phase one has failed.
