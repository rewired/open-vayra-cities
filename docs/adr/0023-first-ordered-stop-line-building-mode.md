# ADR 0023: First ordered stop-based line-building mode

## Status

Accepted

## Date

2026-04-22

## Scope

Define the first playable `build-line` workflow slice for drafting a line by selecting **existing stops** in explicit click order and completing that draft into a local session line.

## Constraints

- Keep implementation desktop-only and browser-local, consistent with MVP boundaries.
- Restrict draft inputs to existing stops only; no new stop creation inside `build-line` mode.
- Preserve explicit mode separation (`inspect` / `place-stop` / `build-line`) so each mode owns a narrow interaction contract.
- Keep line rendering minimal and structural (sufficient to confirm draft/complete outcomes), without expanding into richer service visualization.
- Keep state in memory for the active session only.

## Decision

- Introduce a first ordered stop-based drafting flow in `build-line` mode.
- Append clicked existing stop ids to a draft in deterministic order.
- Allow draft completion only when minimum ordered-stop requirements are met.
- Store completed lines in local in-memory state and expose minimal structural inspection data.

## Explicit non-goals

This slice does **not** introduce:

- stop-to-stop routing/path computation
- simulation behavior or service operations
- economy, fares, or financial modeling
- persistence (local storage, backend sync, save/load)

## Mode-separation rationale

- `inspect` remains selection/inspection only.
- `place-stop` remains stop creation only.
- `build-line` remains ordered existing-stop drafting/completion only.

Keeping these boundaries explicit prevents accidental coupling between editing flows and avoids scope drift into routing, simulation, or economy concerns.
