# TDD.md

## Purpose

This document defines the technical implementation rules for the project.

The project targets a desktop-only browser-based game using TypeScript and a React/Vite frontend, with strong emphasis on type safety, centralized constants, clear package boundaries, and realistic-enough street-based stop-to-stop travel times.

---

## Technical baseline

Primary technical direction:

* TypeScript
* pnpm workspace
* React
* Vite

Desktop browser is the primary runtime target.

Mobile support is explicitly out of scope.

---

## TypeScript strictness

Strict typing is mandatory.

Required compiler posture:

* `strict: true`
* `noUncheckedIndexedAccess: true`
* `exactOptionalPropertyTypes: true`

Additional strictness settings should remain enabled unless there is a strong, documented reason otherwise.

### Forbidden shortcuts

* no `any` as a convenience escape hatch
* no `as any`
* no unchecked broad casts to silence type errors
* no weakening public types just to satisfy implementation shortcuts

### Public contract discipline

All public module surfaces must expose intentionally designed types.

Important areas:

* IDs
* commands
* simulation inputs
* simulation outputs
* routing results
* UI projection models
* economy result structures

---

## Language rule

All code and repository documentation must be written in English.

This includes:

* identifiers
* comments
* docstrings
* Markdown docs
* exported symbol documentation

Do not mix repository language.

---

## Export documentation rule

Every exported symbol must have concise inline documentation.

This includes:

* types
* interfaces
* enums or literal groups
* functions
* factories
* classes
* exported constants or constant groups

Documentation should state:

* what it represents or does
* key input assumptions
* important output meaning
* constraints or invariants where relevant

Public exports without documentation are not acceptable.

---

## Centralized constants rule

Constants must be centralized and reusable.

### Required separation

* domain constants
* simulation defaults
* routing defaults
* UI-only constants

### Forbidden

* magic numbers in feature code
* duplicate thresholds across packages
* hidden defaults in React components
* redefinition of canonical values near use-sites

If a value is domain-relevant or simulation-relevant, it must have a canonical home outside the UI layer.

---

## Package boundary guidance

The technical structure should encourage separation of concerns.

Recommended high-level split:

* application shell / UI
* domain
* simulation core
* routing support/adapters

The exact file/folder cut may be finalized later, but the boundary intent must already be preserved.

### Boundary rules

* UI must not own simulation logic
* routing logic must not live inside React components
* domain types must not be recreated separately in multiple layers
* simulation core should be framework-independent
* map rendering concerns should not leak into domain truth

---

## React/Vite guidance

### React

Use React for:

* UI composition
* editing workflows
* panel state
* map tool state
* projections and interaction handling

Do not use React components as containers for canonical simulation rules.

### Vite

Use Vite as the frontend toolchain baseline.

Keep build setup simple and close to defaults unless there is a clear need to extend it.

---

## Desktop-only implementation rule

This project is desktop-only.

Therefore:

* mouse/keyboard interaction may be assumed
* dense information layouts are acceptable
* no requirement exists for touch-first interaction
* no mobile-responsive behavior is required as a primary concern

Avoid introducing mobile-driven complexity.

---

## Routing and travel time rule

Realistic stop-to-stop travel times are a core technical requirement.

For MVP, the system should support:

* stop placement on valid street-related positions
* routed or otherwise street-believable paths between consecutive stops
* segment distance calculation
* segment travel time calculation
* separate dwell-time handling

Do not use naive straight-line travel time as the main operational truth.

The routing layer must remain separable from UI and simulation logic.

---

## Simulation implementation rule

The MVP simulation should remain aggregate-first.

Preferred MVP posture:

* tick-based time progression
* time-band-aware service configuration
* demand-node-driven trip generation
* aggregate or semi-aggregate passenger/service evaluation
* derived visual vehicle motion

Avoid introducing:

* full microscopic traffic simulation
* full vehicle duty scheduling
* detailed depot operations
* unnecessary real-time physics

---

## Testability rule

Implementation should favor deterministic, testable behavior.

Prefer:

* pure functions for calculations
* isolated simulation state transitions
* explicit input/output contracts
* stable constants and config sources

Avoid:

* hidden mutable module state
* simulation rules embedded in UI callbacks
* opaque coupled side effects

---

## Dependency discipline

Keep dependencies lean and justified.

Do not add large framework or service dependencies without explicit need.

Especially avoid:

* premature backend complexity
* unnecessary remote service coupling
* adding transit/planning frameworks that distort the MVP architecture

Reference systems may inspire the design, but should not be imported blindly.

---

## DESIGN.md handling

`DESIGN.md` is externally provided by Voltagent.

Until it exists:

* use functional UI assumptions only
* avoid inventing a durable visual design system
* do not let temporary styling decisions reshape technical architecture
