# VISION_SCOPE.md

## Project vision

This project is a desktop-only, browser-based transit network simulation game focused on designing and operating a player-created urban public transport network on top of a realistic city/map foundation.

The player does not reproduce an existing real-world transit network. Instead, the player creates their own network within a believable urban environment, starting with a bus-first MVP.

The core experience is not vehicle micro-management. The core experience is planning stops and lines, shaping service quality across the day, and balancing economic viability with passenger satisfaction.

---

## Core player fantasy

The player should feel like they are building a useful, efficient, and financially viable public transport network in a believable metropolitan space.

The player should make meaningful trade-offs between:

* coverage
* travel quality
* frequency
* cost
* network simplicity
* passenger satisfaction

---

## MVP vision

The first MVP is a bus-only playable slice.

The MVP must allow the player to:

* place bus stops on streets
* create ordered, direction-aware bus lines by selecting stops
* allow round lines
* configure service frequency by time band
* observe demand capture, service quality, cost, revenue, and satisfaction
* iterate on the network

The MVP must feel like a real game loop, not a static planning mockup.

---

## What the MVP is

The MVP is:

* desktop-only
* browser-based
* map-centric
* bus-only
* tick-based with pause and speed controls
* visually detailed at map level
* simulation-driven at demand/network level
* economically meaningful
* passenger-focused

---

## What the MVP is not

The MVP is not:

* a full multimodal transit simulator
* a rail construction game
* a micro-scale bus operations simulator
* a real-world timetable reconstruction tool
* a mobile-first product
* a city-builder in full scope
* a transport engineering suite

---

## Primary success criteria

The MVP is successful if it produces a playable loop where the player can:

* build a bus network
* understand why it performs well or poorly
* improve outcomes through planning changes
* balance economics and rider experience
* see believable consequences from service decisions

---

## Evaluation axes

The MVP should evaluate network performance through a combination of:

* financial performance
* passenger satisfaction
* demand served
* waiting time
* travel quality
* overcrowding
* unserved demand

No single metric should completely dominate the game.

---

## Demand scope for MVP

Demand in the MVP is generated primarily from:

* residential origins
* workplace destinations

The architecture must allow future extension for:

* education
* leisure
* shopping
* health
* civic/service destinations

These future demand classes are not required in MVP behavior.

---

## Spatial scope for MVP

The city should be visually detailed.

However, simulation truth should remain manageable:

* demand should originate from spatially anchored demand nodes or clusters
* stops should serve demand
* stops should not generate demand themselves

This separation is intentional and must be preserved.

---

## Service design scope for MVP

The player configures service through time-band-based frequency planning.

Initial time bands:

* morning rush
* late morning
* midday
* afternoon
* evening rush
* evening
* night

The MVP only requires one frequency value per time band.

Future extensions such as time-band-specific vehicle assignment or service windows may be prepared for, but must not be required for MVP delivery.

---

## Travel time realism

Realistic stop-to-stop travel times are a core requirement.

This does not require full real-world traffic simulation in MVP.
It does require that line segments follow believable street-based paths and produce plausible travel times.

The MVP must not use naive straight-line travel time as the main service truth.

---

## Platform scope

This project is desktop-only.

Mobile is explicitly out of scope.

No product, UI, or architecture decisions should be distorted to accommodate touch-first or small-screen use.

---

## No-abyss list

The following are explicitly forbidden in the initial project phase unless separately approved:

* adding tram, subway, S-Bahn, ferry, or player-built rail gameplay
* adding mobile support
* adding micro traffic simulation
* adding full depot logistics
* adding staff scheduling systems
* adding deep maintenance/depreciation systems
* adding full pedestrian street-network access routing as a requirement for MVP
* adding city growth simulation as core MVP behavior
* adding multiplayer or online service architecture
* turning the project into a real-world transit reconstruction tool

---

## Design ownership

Visual design authority does not originate in this file.

`DESIGN.md` is externally provided by Voltagent. Until that document exists, implementation should rely on functional UI assumptions only.

---

## Language rule

All repository code and documentation must remain in English.

Chat discussion may happen in German, but repository artifacts must not mix languages.
