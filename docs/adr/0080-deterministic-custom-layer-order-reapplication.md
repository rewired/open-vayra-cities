# ADR 0080: Deterministic custom-layer order reapplication through centralized source sync

## Status

Accepted (2026-04-24)

## Context

CityOps map workspace custom layers must stay in a stable stack order for correct visual hierarchy:

1. completed-line casing
2. completed lines
3. draft line
4. stop circles
5. stop labels
6. vehicle markers

The workspace already had ordering logic, but order enforcement was tied to source/layer ensure flow only.

When style readiness or layer availability changes caused data-only synchronization paths to run, custom layer order reapplication could be skipped until another ensure pass, risking transient or stale layer stacking.

## Decision

Introduce one dedicated deterministic map workspace layer-order helper that reapplies the canonical CityOps custom layer stack via typed `moveLayer(layerId, beforeId?)` calls.

Invoke this helper from the centralized source synchronization path so layer ordering is reapplied consistently on every sync pass, including data-only sync runs and style-ready recovery runs.

Also keep the local MapLibre type contract narrow for layer moves (`moveLayer(layerId: string, beforeId?: string): void`) and typed source lookups to avoid cast-based source mutation paths.

## Consequences

- custom layer stack order is reasserted consistently from one central sync path
- style/layer readiness transitions no longer depend on ensure-only ordering hooks
- MapLibre map typing remains strict and avoids broad casting in source synchronization
- behavior stays within bus-only map rendering scope with no simulation or modality expansion

## Explicit non-goals

- no changes to source ids, layer ids, or paint/layout semantics
- no changes to stop/line/vehicle feature schemas
- no changes to demand, economy, routing, or simulation logic
- no mobile or multimodal scope expansion
