# ADR 0020: Use explicit workspace mode buttons and reserve build-line mode without placement overlap

## Status

Accepted

## Date

2026-04-22

## Context

The shell used a single toggle button to move between inspect and stop-placement modes.
That interaction made click intent ambiguous at a glance and did not scale cleanly to an additional line-building mode.

The MVP needs deterministic, low-friction mode switching where the active click behavior is obvious before interacting with the map.

## Decision

- Extend the workspace tool mode union with `build-line` as a first-class literal.
- Replace the single toggle with explicit mode buttons for `inspect`, `place-stop`, and `build-line`.
- Keep map click behavior mode-gated so stop placement runs only in `place-stop` mode.
- Keep a minimal line-build selection state at the shell boundary and pass it to map workspace + inspector.

## Explicit non-goals

This decision does **not** introduce:
- full line geometry construction workflows
- route editing UX
- schedule/timetable logic
- simulation/economy behavior changes
- persistence or backend state

## Consequences

- Click intent is explicit from the active mode button state.
- Entering `build-line` mode cannot accidentally trigger stop placement behavior.
- Shell, map workspace, and inspector now share a stable contract for future line-draft evolution.
