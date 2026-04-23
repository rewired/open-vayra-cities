# ADR 0033: Explicit user-triggered build-line completion only

## Status

Accepted

## Date

2026-04-23

## Scope

Document Slice 014a guardrails for build-line completion flow in `MapWorkspaceSurface`.

## Constraints

- Build-line completion must happen only from the explicit `Complete line` user action.
- Completion must be blocked when draft stop count is below `MINIMUM_STOPS_REQUIRED_TO_COMPLETE_LINE`.
- Draft and completed line state must stay separate (`draftLineState` vs `sessionLines`).
- Completion ordering must remain deterministic: append completed line, select completed line, reset draft.

## Decision

- Keep `handleDraftComplete` as the only line-completion path.
- Preserve the minimum-stop guard in `handleDraftComplete`.
- Preserve transition order by appending to `sessionLines` via `onSessionLinesChange`, then selecting the created line via `onSelectedLineIdChange`, and finally resetting draft state.
- Keep draft rendering sourced exclusively from `draftLineState` and completed rendering sourced from `sessionLines`.

## Explicit non-goals

Slice 014a does **not** introduce:

- automatic completion triggered by stop clicks or draft length side effects
- hidden conversion of draft lines into completed lines
- merged draft/completed state models
- simulation, routing, demand, economy, persistence, or backend changes

## Consequences

- Completion behavior remains player-controlled and predictable.
- Minimum-stop safety remains enforced at the completion boundary.
- Draft editing remains isolated from completed line session state.
