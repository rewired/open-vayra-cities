# ADR 0168: Inspector Information Architecture

## Status

Proposed

## Context

The right-side Inspector has become increasingly dense as more projections (demand capture, served demand, service pressure, demand gaps, demand contribution) have been added.
Long lists, such as the demand gap ranking and the route sequence of a selected line, were causing excessive vertical scroll pressure and competing for the player's attention with primary network KPIs.

## Decision

We will introduce a collapsible information architecture for the Inspector using a new `InspectorDisclosure` component.

### Essential Information (Always Visible)

The following information must remain visible without expanding any disclosure:
- **Network Tab**: 
    - Primary KPIs (Stop count, Line count, Active service band, Global state).
    - Demand Capture (Residential nodes and Workplace destinations captured/total).
    - Served Demand (Residential served and Workplace reachable summary).
    - Service Pressure (Status and Departures/hour).
- **Selected Line Tab**:
    - Line Badge and Label.
    - Issue Summary.
    - Metadata Chips (Topology, Service, Stops, Runtime, Status).
    - Line Demand Contribution Summary (Served/Captured).

### Secondary Information (Collapsible)

The following details are moved into `InspectorDisclosure` sections:
- **Network Tab**:
    - "Capture details": Access radius and Gateway counts.
    - "Service details": Active band (duplicate but contextual), Unserved demand counts, Active service line count.
    - "Pressure details": Average headway, Demand per departure.
    - "Identify gaps": The full list of demand gaps, summarized by a badge showing the total count.
    - "Network inventory": The lists of stops and lines at the bottom of the network tab.
- **Selected Line Tab**:
    - "Contribution details": Departures/hour, Line pressure, and detailed notes.
    - "Route sequence": The full list of stops in the line's route.

### UI Implementation

- The `InspectorDisclosure` component uses native `<details>` and `<summary>` elements for accessibility and simplicity.
- Styling follows the "whisper-weight" design rule (`1px solid rgba(0,0,0,0.1)`).
- A rotation animation is used for the disclosure arrow to provide visual feedback.

## Consequences

- **Pros**: 
    - Reduced visual clutter and scroll pressure.
    - Essential KPIs are visible at a glance.
    - Information is organized into logical, progressive disclosure layers.
- **Cons**: 
    - Secondary details require an extra click to view.
    - The overall inspector height may vary significantly when multiple sections are expanded.

## Non-Goals

- No changes to projection semantics.
- No new metrics or simulation logic.
- No map overlays or heatmaps in this slice.
