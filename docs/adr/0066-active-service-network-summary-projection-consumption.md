# ADR 0066: Active-service network summary projection consumption

## Status

Accepted (2026-04-24)

## Context

The shell inspector already shows a static network summary and selected-line details, while the domain projection layer already computes network-wide active-time-band service status counts.

The next slice requires exposing a compact active-service network summary (completed line count, active time-band id, and configured/degraded/not-configured/blocked counts) without broad inspector layout changes or component-local status recomputation.

## Decision

Consume network-level service summary values from `projectLineServicePlan` in `App.tsx` and render them as a compact subsection under the existing static network summary.

### Included

1. Extend `LineServiceProjectionSummary` with `totalCompletedLineCount` and keep `totalLineCount` as a backward-compatible alias.
2. Keep active-time-band and status-count ownership in `projectLineServicePlan`.
3. Add compact active-service inspector lines in `App.tsx` for:
   - active time-band label
   - total completed line count
   - configured line count
   - degraded line count
   - not-configured line count
   - blocked line count
4. Add/adjust unit coverage for the new summary field.

### Explicit non-goals

- no simulation clock behavior changes
- no demand/economy/vehicle/passenger KPI additions
- no broad panel/layout redesign
- no persistence/import/backend scope expansion

## Rationale

Reusing domain projection output preserves layer boundaries: React renders deterministic projection values while domain helpers own status semantics and counting rules.

Adding a small subsection in the existing summary minimizes UI churn and keeps scope aligned with the MVP inspector baseline.

## Consequences

- The inspector now surfaces active-service network status at a glance.
- Network-level status counting remains centralized in projection helpers rather than spread across UI code.
- Existing consumers of `totalLineCount` remain stable while new code can use `totalCompletedLineCount` explicitly.
