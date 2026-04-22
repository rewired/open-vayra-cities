# ADR 0009: Introduce explicit workspace tool mode state for map click gating

## Status

Accepted

## Date

2026-04-22

## Context

The shell tools area previously rendered a static list and the map workspace click behavior was always active under one neutral interaction profile.

For upcoming stop placement workflows, we need an explicit typed mode switch at the shell level so map click semantics can be gated by the active tool, while staying within the desktop-only bus-first MVP.

## Decision

- Add a typed `WorkspaceToolMode` union in `App.tsx` with two modes:
  - `inspect`
  - `place-stop`
- Store active mode in local React state at the app shell level.
- Replace the static tools list with a minimal button control that toggles stop placement mode on/off.
- Pass `activeToolMode` into `MapWorkspaceSurface` as a typed prop.
- Gate map click handling by mode so click capture is only treated as placement-oriented when `place-stop` is active.

## Consequences

- Tool semantics become explicit and type-safe at the shell-to-workspace boundary.
- The change remains local and minimal, avoiding global store or feature scope expansion.
- Map runtime behavior is now ready for incremental stop-placement logic without coupling UI layout concerns into domain simulation logic.
