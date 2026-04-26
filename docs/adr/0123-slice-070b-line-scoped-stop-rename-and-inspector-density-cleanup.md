# ADR 0123: Slice 070b Line-Scoped Stop Rename and Inspector Density Cleanup

- Status: Accepted
- Date: 2026-04-26

## Context

Slice 070 introduced inline rename in inspector inventory rows for stops and lines.

Follow-up scope for Slice 070b is to keep stop rename line-scoped, make selection affordances clearer in dense lists, and reduce inspector visual density without changing domain behavior.

## Decision

For Slice 070b:

- keep stop rename entrypoints scoped to line-context workflows,
- keep compact badge-first controls as the primary selection/focus affordance in dense inspector rows,
- remove redundant inline controls and keep labels readability-first,
- keep all existing session/domain command routes unchanged.

## Non-goals

Slice 070b explicitly does **not** introduce:

- stop or line deletion behavior,
- topology or service-pattern editing changes,
- routing adapter or simulation behavior changes.

## Consequences

- Rename workflows are clearer because stop rename remains tied to line context rather than global inventory mass editing.
- Selection intent remains explicit in compact inspector layouts.
- Inspector density is reduced while preserving existing behavior boundaries and type-safe command paths.
