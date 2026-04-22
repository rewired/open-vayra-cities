# PRODUCT_DEFINITION.md

## Purpose

This document defines the first playable product slice of the project in practical, implementation-facing terms.

It exists to prevent scope drift, vague feature inflation, and accidental conversion of the MVP into a full transport-planning platform.

This document is the product-level source of truth for the initial bus-first desktop MVP.

---

## Product statement

The project is a desktop-only, browser-based transit network simulation game in which the player designs and operates a custom public transport network inside a believable urban environment.

The first playable MVP focuses exclusively on bus network planning and operation.

The player creates stops, builds direction-aware lines by selecting stops in order, configures service frequency by time band, and evaluates the resulting network through financial performance and passenger satisfaction.

---

## Core player loop

The MVP must support the following loop:

1. inspect the city and demand patterns
2. place stops on streets
3. connect stops into bus lines
4. configure frequency by time band
5. run the simulation
6. observe demand capture, service quality, cost, revenue, and satisfaction
7. modify the network to improve results

If the MVP does not support this loop cleanly, it is not complete.

---

## Main player actions

The player must be able to:

* place bus stops on valid street-linked positions
* select stops in sequence to create a line
* create direction-aware service patterns
* create round lines
* assign a frequency value for each defined time band
* view line performance and network outcomes
* revise the network iteratively

---

## MVP scope

### Included in MVP

* desktop-only gameplay
* browser-based map interaction
* visually detailed city/map presentation
* bus-only transport gameplay
* stop placement on streets
* direction-aware lines
* round lines
* time-band-based frequency settings
* demand generated from residential origins and work destinations
* stop access using a simple radius rule
* realistic-enough stop-to-stop travel times based on believable street-linked routing
* visible buses on the map as service feedback
* economic evaluation
* passenger satisfaction evaluation
* pause and speed controls
* tick-based simulation

### Explicitly excluded from MVP

* tram gameplay
* subway gameplay
* S-Bahn gameplay
* ferry gameplay
* player-built rail infrastructure
* mobile support
* touch-first UX
* full pedestrian street-network access routing as a requirement
* detailed staff systems
* depot logistics
* detailed maintenance systems
* detailed depreciation systems
* microscopic traffic simulation
* deep city growth simulation
* real-world public transport timetable reconstruction
* multiplayer
* online service dependency for core gameplay

---

## MVP evaluation axes

The MVP must evaluate network quality through multiple dimensions.

### Primary axes

* financial performance
* passenger satisfaction

### Secondary axes

* demand served
* waiting time
* travel time quality
* overcrowding
* unserved demand
* service coverage

The game must not collapse into a single-metric optimizer.

---

## Demand model for MVP

### Required demand classes

The MVP requires only:

* residential origin demand
* workplace destination demand

### Future-ready but not active in MVP

The data model may prepare for later addition of:

* education
* leisure
* shopping
* health
* civic/service demand

These demand classes must not be required for MVP completeness.

### Important demand rule

Demand originates from demand nodes or clusters.

Stops do not generate demand.
Stops capture and serve demand.

This rule must remain stable across architecture and implementation.

---

## Spatial model for MVP

The map should appear detailed and grounded.

The simulation should remain manageable.

Therefore:

* the rendered map may be detailed
* simulation demand should use spatially anchored demand nodes or clusters
* stop access should begin with a radius rule
* future walking-network access may be planned for but is not required in MVP

---

## Service model for MVP

The first transport mode is bus only.

The system must support:

* ordered stop sequences
* line directionality
* round lines
* per-time-band frequency values

### Initial time bands

* morning rush
* late morning
* midday
* afternoon
* evening rush
* evening
* night

The initial MVP only requires one frequency value per time band.

Future extensions such as time-band-specific vehicle assignment may be prepared structurally, but must not expand MVP scope.

---

## Travel time realism requirement

Realistic stop-to-stop travel time is a core product requirement.

The MVP does not require full real-world traffic simulation.
However, it must not rely on naive straight-line timing as the main operational truth.

The service model must use believable street-linked segment travel times plus dwell effects.

If segment timing is not believable, the network game loop becomes unreliable.

---

## Vehicle presentation rule

Buses should be visible on the map for player feedback.

This is a presentation and game-feel requirement.
It does not require full vehicle micro-simulation to become the authoritative simulation truth.

Visible motion may be derived from aggregate or semi-aggregate service state.

---

## Platform rule

This project is desktop-only.

Mobile is explicitly out of scope.
No MVP decision should be distorted to accommodate small-screen or touch-first constraints.

---

## Language rule

All repository code and all repository documentation must be in English.

Chat discussion may be in German, but repository artifacts must remain English-only.

---

## Documentation rule

All exported public code surfaces must include concise inline documentation.

This is mandatory because the project is expected to interact with coding agents, and undocumented exports create drift, misuse, and duplication.

---

## Type safety rule

Strong type safety is part of the MVP foundation.

The project must not rely on loosely typed domain truth, duplicated ad-hoc unions, or scattered informal constants.

Important domain concepts must remain canonically typed.

---

## Central constants rule

Domain-relevant constants and defaults must be centrally owned.

They must not be duplicated across feature code, React components, or ad-hoc helpers.

This is a product stability rule as much as a technical one.

---

## No-abyss rules

The first phase of the project must not drift into any of the following:

* multimodal gameplay expansion
* rail construction systems
* highly detailed operations modeling
* premature backend/service complexity
* fake realism replacing simple playable truths
* map UI absorbing simulation logic
* uncontrolled economic detail growth
* mobile UI accommodation
* design-system invention in place of the external design source

---

## Completion test for the first MVP

The first MVP is complete when a player can:

* open the game on desktop
* inspect a city/map
* place bus stops on streets
* create one or more bus lines from ordered stop selection
* set time-band frequencies
* run the simulation with pause and speed controls
* observe travel performance, demand served, costs, revenue, and satisfaction
* identify network problems
* improve outcomes by changing the network

If these outcomes are not present, the MVP is not yet complete.
