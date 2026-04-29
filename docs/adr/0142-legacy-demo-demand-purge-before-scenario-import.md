# ADR 0142: Legacy Demo Demand Purge Before Scenario Import

## Status

Accepted

## Date

2026-04-29

## Context

The project is moving to a posture where external datasets (e.g., Zensus, OSM) serve as scenario source material, generating scenario-owned runtime truth. The legacy/demo demand implementations, placeholders, and related UI fixtures were becoming technical debt and risked confusing the upcoming scenario import pipeline.

## Decision

- Completely remove all legacy demand domain files, types, constants, and projections.
- Remove all demand-related UI sections from the Inspector Panel, Selected Line Inspector, and Debug Modal.
- Purge demand map layers, sources, and visibility controls from the Map Workspace.
- Maintain strict neutral posture (honest empty states) without fake placeholders until the new scenario demand pipeline is established.

## Consequences

- A clean, unburdened foundation for the upcoming HVV census/OSM scenario demand import slice.
- Stronger focus on centralized scenario runtime artifacts.
- Temporary removal of demand visualization features from the UI.
