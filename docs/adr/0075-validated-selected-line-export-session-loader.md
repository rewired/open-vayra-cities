# ADR 0075: Validated selected-line export session loader (replacement-only)

## Status

Accepted (2026-04-24)

## Context

CityOps now has a selected-line export schema (`cityops-selected-line-export-v2`) and a committed fixture at `data/fixtures/selected-line-exports/hamburg-line-1.v2.json`, plus a typed payload validator.

Before this slice, repeating line route/testing workflows required rebuilding stops and one completed line manually inside each browser session.

This created friction for deterministic route-baseline, readiness, service-plan, departure, and derived-vehicle projection verification while persistence/savegame work is still intentionally out of scope.

## Decision

Add a user-triggered `Load line JSON` action that reads one selected-line export JSON file from disk, validates it through the existing selected-line export validator, converts the validated payload into canonical in-memory stop/line session state, and replaces current in-memory network truth with the loaded single line.

### Included

- browser file-picker entry point (`.json`/`application/json` friendly guard)
- safe JSON parsing with compact parse failure feedback
- validator reuse (`validateSelectedLineExportPayload`) as the schema boundary
- pure validated-payload conversion helper for session state mapping
- replacement semantics for current in-memory network truth (no merge)
- post-load selection/reset behavior:
  - loaded line becomes selected
  - selected stop is cleared
  - active build-line draft selection is cleared
- route segments are loaded exactly as exported (no recomputation)

## Rationale

### Why introduce this before persistence/savegame work

A validated single-line loader enables repeatable route/testing workflows immediately, without introducing storage architecture, savegame schema evolution, migration rules, or backend coupling.

### Why validated UI-created JSON is useful for repeatable testing

Selected-line exports provide deterministic, typed, portable artifacts that can be loaded back into the in-memory session for repeat checks of readiness and projection behavior.

### Why replacement instead of merge

Replacement avoids id-collision policy complexity, silent deduplication/renaming risk, and accidental mixed-truth sessions. For the single-line import scope, replacement is simpler and safer.

### Why validation is reused rather than duplicated

Reusing the established validator keeps one canonical schema/coherence boundary and prevents drift between import and fixture-validation rules.

### Why route segments are preserved as-is

The selected-line export already carries stored route segments. Preserving them prevents hidden route recalculation side effects and keeps import deterministic.

### Why this is not savegame/persistence/scenario/replay

The loader imports one selected-line export payload into current volatile session memory only. It does not claim generalized game-state restore, scenario orchestration, or automation.

## Fixture location decision

The committed Hamburg payload remains under `data/fixtures/selected-line-exports/` because it is a test/validation fixture for selected-line export/import behavior.

It is not moved to `data/seeds/` because this slice does not add startup seeding, scenario initialization, or automatic fixture replay.

## Consequences

- repeatable single-line session restoration is available without backend or persistence scope expansion
- invalid JSON and invalid schema payloads are rejected before mutating session truth
- map and inspector projections continue consuming canonical in-memory stops/lines after load
- the Hamburg fixture remains a stable fixture artifact and is not treated as runtime seed data

## Explicit non-goals

- no persistence
- no localStorage/session restore
- no savegame loading
- no scenario loading
- no fixture replay automation
- no backend
- no route recalculation
- no demand simulation
- no economy simulation
- no passenger assignment
- no vehicle operation model
- no fleet management
- no depot logic
- no layover logic
- no multimodal expansion
- no mobile behavior
