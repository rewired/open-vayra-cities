# ADR 0063: Slice 019 simulation clock and pause/speed controls baseline

## Status

Accepted (2026-04-24)

## Context

CityOps now has completed lines, canonical MVP time-band frequency configuration, route segments, selected-line export payload support, and line readiness diagnostics.

The project still intentionally does **not** execute demand, economy, passengers, vehicles, or service outcomes. However, later simulation slices require a deterministic shared notion of simulation time.

Without a canonical clock baseline, future simulation slices would risk:

- duplicated local time handling in UI components
- inconsistent time-band derivation behavior
- non-deterministic progression semantics tied to rendering concerns
- accidental scope expansion into service execution before temporal foundations are stable

## Decision

Introduce a minimal, deterministic, in-memory simulation clock baseline with shell-level controls.

### Included in this slice

1. A canonical simulation clock type/constant/helper layer outside React and map code.
2. Deterministic initial timestamp defaults (`day 1`, `06:00` baseline minute-of-day).
3. Running-state control (`paused` / `running`) with pause and resume commands.
4. Canonical speed set with stable IDs and multipliers (`1x`, `5x`, `10x`, `20x`).
5. Pure elapsed-time advancement with day wrapping (`0..1439` minute-of-day) and day-index increment.
6. Canonical full-day minute-range mapping to MVP time-band IDs.
7. Shell status-bar projection of day/time/band/running-state plus pause/resume/speed/reset controls.
8. Optional UI-only selected-line hint for current time-band frequency presence, without service execution behavior.

### Explicit architecture choices

- Clock transition rules are pure functions and not embedded in JSX.
- Timer lifecycle scheduling exists at shell level only and feeds elapsed milliseconds into pure transitions.
- Time-band derivation is canonical and shared, not UI-local literals.
- Clock state remains local client memory only.

## Rationale

### Why introduce the clock before demand/economy/vehicle simulation

A deterministic clock is prerequisite infrastructure for time-based simulation features. Adding it first reduces coupling and allows later slices to consume one stable time source.

### Why pause/speed controls are part of MVP foundation

Pause/speed controls are required player affordances for planning inspection and future simulation pacing. Defining these now avoids incompatible control semantics later.

### Why pure transition helpers outside React JSX

Pure helpers enforce deterministic behavior, improve testability, and preserve UI/domain boundaries.

### Why canonical time-band derivation

Line frequencies and readiness diagnostics already depend on canonical time-band IDs. Deriving active time band from one canonical mapping prevents drift between shell, readiness views, and future simulation modules.

### Why the clock does not execute service simulation yet

This slice is foundation-only. Executing service logic now would violate scoped progression and introduce premature coupling to demand/economy/passenger/vehicle systems.

### Why no fixture load/replay behavior is included

Existing fixtures remain validation/test artifacts. Loading or replaying fixture data is an explicit non-goal for this slice.

## Non-goals

- no demand simulation
- no economy simulation
- no passenger assignment
- no vehicle operation model
- no service execution
- no route recalculation
- no import behavior
- no persistence
- no backend
- no savegame loading
- no scenario loading
- no fixture replay loader
- no multimodal expansion
- no mobile behavior

## Consequences

### Positive

- Establishes deterministic, typed temporal foundations for subsequent simulation slices.
- Keeps time-band behavior centralized and testable.
- Preserves strict separation between UI scheduling and domain transition semantics.

### Trade-offs

- A new timer/update loop is introduced at shell level.
- Clock state exists without direct simulation outcomes until later slices consume it.

