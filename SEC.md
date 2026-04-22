# SEC.md

## Purpose

This document defines practical security, safety, and operational integrity rules for the project.

The project is a desktop-only browser-based simulation game, but it still requires disciplined handling of dependencies, data ingestion, configuration, and deterministic simulation behavior.

---

## Security posture

This is not a high-trust enterprise backend system, but security and integrity still matter.

The project must avoid:

* careless dependency sprawl
* unsafe data ingestion assumptions
* unchecked user/import inputs
* hidden remote-service dependency for core gameplay
* secrets or credentials embedded in source control

---

## Input validation

All non-trivial external inputs must be validated before entering canonical domain state.

Examples:

* imported map-derived data
* routing adapter results
* saved game data
* scenario/configuration files
* user-authored line/network definitions crossing persistence boundaries

Validation should occur at boundary layers, not deep inside arbitrary feature code.

---

## Type safety as safety control

Strong type safety is part of the project’s safety posture.

Why:

* it reduces silent contract drift
* it reduces invalid state propagation
* it makes boundary assumptions explicit
* it reduces accidental misuse of exported surfaces

Do not bypass type checks as a convenience tactic.

---

## Centralized constants as integrity control

Scattered constants create inconsistent behavior and hidden failure modes.

Therefore:

* canonical thresholds and defaults must be centralized
* duplicated local values must be avoided
* domain constants must not be redefined in UI modules

This is not only a maintainability concern; it is also a correctness and integrity concern.

---

## Deterministic simulation preference

Simulation behavior should be deterministic for the same inputs wherever practical.

Preferred:

* explicit tick-based progression
* explicit time-band transitions
* explicit configuration inputs
* controlled randomness only when intentionally designed

Avoid hidden nondeterminism in core simulation rules.

---

## Dependency and service discipline

Core gameplay should not depend on uncontrolled third-party online services.

Allowed direction:

* optional tooling or preprocessing support
* replaceable routing/data adapters
* clearly bounded map/routing integration

Avoid making the core game loop unusable because an external hosted API is unavailable.

If external services are ever used in development or tooling, they must remain replaceable and non-authoritative for core project truth.

---

## Secret handling

Do not commit:

* API keys
* tokens
* private credentials
* environment secrets

If secrets ever become necessary, they must be loaded through proper environment handling and remain outside repository history.

---

## OSM and map data handling

Map and OSM-derived data must be handled with licensing and attribution awareness.

Do not assume that all imported geographic or map-derived data may be redistributed or transformed without obligations.

Any map-data-related implementation must preserve a path to proper attribution and compliant use.

---

## Save/import safety

If save files, scenarios, or imports are introduced:

* validate before use
* reject malformed or semantically invalid payloads
* avoid executing logic directly from unchecked imported structures
* convert external data into canonical domain types before simulation use

---

## UI safety and desktop-only posture

This project is desktop-only.

No security or architecture work should be distorted to support mobile-specific runtime behavior.

Touch/mobile support is not a requirement and must not create accidental complexity.

---

## DESIGN.md handling

`DESIGN.md` is externally provided by Voltagent.

Do not invent design-authority content in its absence.
Temporary UI work should remain functional and low-risk.

---

## Final rule

If a shortcut improves speed but weakens:

* input validation
* deterministic behavior
* dependency safety
* type safety
* canonical constant ownership

then the shortcut should be rejected unless explicitly approved.
