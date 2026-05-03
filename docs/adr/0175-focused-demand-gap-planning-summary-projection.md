# 175. Focused Demand Gap Planning Summary Projection

Date: 2026-05-03

## Status

Accepted

## Context

During gameplay planning in OpenVayra - Cities, players identify missing transit coverage or connectivity through the Demand tab's Gap analysis list. Previously, basic semantic guidance was derived directly within the `InspectorDemandTab` React component using a static `PLANNING_GUIDANCE` string mapping. This violated the strict architectural rule that UI components should only consume derived state, not invent or own domain semantics.

As we built out origin-destination (OD) candidate hints for focused gaps (Slice 173), the lack of clear, centralized planning guidance became a usability and architecture problem. Players needed a unified summary explaining *why* the gap exists, *what* the next logical planning action is, and *why* they are seeing specific OD hint lines on the map.

## Decision

We introduced a pure projection layer, `focusedDemandGapPlanningProjection.ts`, to derive a compact, player-facing planning summary.

1. **Projection Only**: This module takes the existing `DemandGapRankingProjection` and `DemandGapOdContextProjection` as inputs and derives an actionable summary (`title`, `primaryAction`, `supportingContext`, `caveat`, `evidence`).
2. **React Consumption**: `InspectorDemandTab` now simply consumes this new projection without any local knowledge of what `uncaptured-residential` or `captured-unreachable-workplace` functionally means.
3. **No Domain/Simulation Bleed**: This change does not alter map interactions, routing logic, demand generation, demand capture math, or passenger assignment simulation. It simply packages existing facts into a typed, concise format for the player.
4. **Deterministic Evidence**: The projection extracts deterministic evidence facts (active pressure, nearest stop, OD candidates count, etc.) to ground the guidance in simulation truth, making it clearer why a certain hint is provided.

## Consequences

* **Positive:** Strict separation between domain projection logic and React rendering logic is maintained.
* **Positive:** UI components remain pure and testable.
* **Positive:** The player gets clearer context about what actions are expected without the application implying full real-world passenger routing capabilities.
* **Neutral:** The network planning projection hook becomes slightly wider, acting as the ultimate aggregator for planning surfaces, which remains acceptable for an MVP architecture.
