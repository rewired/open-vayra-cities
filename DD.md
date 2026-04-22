# DD.md

## Purpose

This document defines the domain and architecture boundaries for the project.

The goal is to preserve a clean separation between city/map representation, demand generation, transit network logic, simulation behavior, routing support, economy, and UI projection.

---

## Architectural style

The system should be organized around a strongly typed core domain with explicit boundaries.

Preferred structure:

* canonical domain definitions
* simulation core using domain truth
* routing/map adapters using domain truth
* UI consuming projections and issuing commands

The UI must not become the source of simulation or domain semantics.

---

## Core bounded areas

### 1. World / Map

Represents the playable urban environment.

Responsibilities:

* map bounds
* street geometry references
* water/barrier references
* valid stop placement anchors
* optional rendering-oriented map metadata

Non-responsibilities:

* passenger demand truth
* service planning truth
* economy logic

### 2. Demand

Represents where trips originate and where they are attracted.

Responsibilities:

* demand node identity and position
* demand class
* origin/destination role
* time-band demand weights
* satisfaction-relevant trip context

Non-responsibilities:

* stop placement
* line routing
* UI-only heatmap styling

Important rule:
Demand arises from demand nodes, not from stops.

### 3. Transit Network

Represents player-created service structure.

Responsibilities:

* stops
* stop ordering
* line identity
* direction-aware line definitions
* round-line support
* time-band frequency settings
* route segment references between consecutive stops

Non-responsibilities:

* low-level street routing algorithm internals
* passenger demand generation
* map rendering concerns

### 4. Routing Support

Represents the pathing support required to connect network elements realistically.

Responsibilities:

* snapping stops to valid street anchors
* resolving routed street paths between stops
* returning route geometry, distance, and time-oriented segment data

Non-responsibilities:

* game economy
* passenger satisfaction rules
* UI editing state

Routing support is an adapter/service boundary, not the owner of transit network truth.

### 5. Simulation

Represents game-state evolution over time.

Responsibilities:

* tick advancement
* current time-band resolution
* demand realization
* service availability evaluation
* passenger assignment logic
* service quality scoring
* vehicle visualization state derivation
* KPI generation

Non-responsibilities:

* React component state
* map camera state
* visual widget formatting

### 6. Economy

Represents financial consequences of network operation.

Responsibilities:

* acquisition cost interpretation
* fixed service cost interpretation
* variable operating cost interpretation
* fare revenue accumulation
* score inputs for economic evaluation

Non-responsibilities:

* stop placement validity
* route path computation
* display formatting

### 7. UI / Projection

Represents the playable interface layer.

Responsibilities:

* map interactions
* line-building workflow
* stop placement interactions
* time controls
* display of KPIs, overlays, and selection state
* user-facing projections of simulation state

Non-responsibilities:

* canonical simulation truth
* hidden domain defaults
* routing calculation ownership

---

## Domain truth rules

### Canonical types

Core domain concepts must be centrally typed.

Examples include:

* IDs
* time bands
* transport modes
* line direction
* stop roles
* demand classes
* economy metric names
* simulation statuses

Do not recreate these concepts as ad-hoc local unions in feature code.

### Canonical constants

Core domain constants must be centrally owned.

Examples include:

* time-band identifiers
* radius defaults
* economy defaults
* simulation thresholds
* route quality thresholds
* satisfaction weighting defaults

Do not redefine these values locally in UI or feature modules.

---

## Travel time truth

Stop-to-stop travel time is part of service truth.

For MVP:

* travel time must derive from routed street paths or equivalent believable street-based segment modeling
* direct straight-line travel time must not be the primary service truth
* dwell time must be modeled separately from in-motion travel time

Travel time realism is important, but full traffic micro-simulation is not required in MVP.

---

## Visual buses vs simulation truth

Visible buses on the map are allowed and encouraged for player feedback.

However:

* visual vehicles do not automatically define the authoritative simulation model
* the MVP may derive visible vehicle positions from aggregate service state
* do not force full vehicle-ops truth into the simulation solely because vehicles are displayed

This distinction must remain explicit.

---

## Directionality and line semantics

The transit network domain must support:

* ordered stop sequences
* direction-aware services
* round lines
* time-band-specific frequency configuration

Do not collapse direction-aware service into undirected graph abstractions at the domain level.

---

## MVP transport mode rule

The first playable slice is bus-only.

Future transport modes may be planned for structurally, but must not distort the MVP domain into premature multimodal complexity.

Do not introduce active tram/subway/S-Bahn/ferry semantics unless explicitly requested.

---

## Desktop-only rule

The domain and architecture should assume desktop play.

Do not add mobile-oriented compromises to:

* interaction models
* viewport assumptions
* information density
* UI behavior

---

## Export documentation rule

Every exported public surface must include concise inline documentation.

This is a domain/architecture requirement because undocumented exports lead to misuse, duplication, and drift.

---

## DESIGN.md rule

`DESIGN.md` is externally owned by Voltagent.

This document must not invent or override design-system truth. Domain and architecture rules must remain independent of missing visual design details.
