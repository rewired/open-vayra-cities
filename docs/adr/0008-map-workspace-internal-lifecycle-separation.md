# ADR 0008: Separate map workspace runtime internals into lightweight local helpers

## Status

Accepted

## Date

2026-04-22

## Context

`MapWorkspaceSurface` grew to include map creation, neutral interaction subscriptions, and resize wiring inside one `useEffect` block. The behavior remained correct, but internal concerns were less explicit than needed for maintenance.

The current MVP still requires a lightweight structure:

- no domain/game semantics in the map workspace runtime wiring
- no global store introduction
- no heavy architectural extraction

## Decision

- Keep map instance creation responsibilities in a dedicated local helper (`createMapWorkspaceInstance`).
- Move neutral interaction listener registration and cleanup into `setupNeutralMapInteractions`.
- Keep helper contracts strongly typed with explicit input/output shapes:
  - map instance contract (`MapLibreMap`)
  - interaction state setter contract
  - explicit disposable return objects
- Keep resize wiring isolated in a focused local helper (`setupMapResizeBinding`) near the same workspace module.

## Consequences

- Internal responsibilities are easier to follow while preserving the same behavior and scope.
- The refactor remains local to `map-workspace`, avoiding architectural sprawl.
- Type safety remains explicit at helper boundaries for interaction and lifecycle cleanup flows.
