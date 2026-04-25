# ADR 0095: Canonical time-band definitions and minute-of-day resolver

## Status

Accepted (2026-04-25)

## Context

Time-band ownership was split between independent id lists, display labels, and minute-range tables.
That created duplication risk and made midnight-crossing logic (`night`) depend on split ranges.
We also lacked a dedicated branded minute-of-day domain type for non-simulation modules.

## Decision

1. Add a canonical branded `MinuteOfDay` type and constructor in the time-band domain type module.
2. Define one canonical ordered `TIME_BAND_DEFINITIONS` list with `{ id, label, startMinuteOfDay, endMinuteOfDay }`.
3. Derive `MVP_TIME_BAND_IDS` and display labels from canonical definitions to avoid duplicated ownership.
4. Add pure time-band helpers for minute formatting, window formatting, and id resolution from minute-of-day.
5. Implement explicit midnight-wrapping logic where `startMinuteOfDay > endMinuteOfDay` means the band spans late-night plus post-midnight minutes.
6. Refactor simulation clock and departure projection consumers to rely on canonical definition/resolver behavior.

## Consequences

- Time-band ownership is centralized and easier to audit.
- Midnight behavior is explicit and consistent between simulation and projection layers.
- Domain modules can reuse one branded minute-of-day type outside simulation-only code.
- Existing consumers preserve bus-first MVP scope without introducing additional realism or transport modes.

## Explicit non-goals (this slice)

- no demand, economy, or passenger-behavior changes
- no route computation changes
- no UI layout/mobile behavior changes
- no persistence or backend changes
