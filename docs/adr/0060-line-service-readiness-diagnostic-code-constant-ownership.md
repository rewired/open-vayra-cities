# ADR 0060: Line service readiness diagnostic code/severity constant ownership

## Status

Accepted

## Date

2026-04-24

## Context

The line service readiness evaluator currently emits machine-readable issue codes and severities that downstream consumers (tests and future UI diagnostics) must treat as stable contracts.

Keeping these literals embedded in evaluator/test files encourages ad-hoc string usage and weakens contract consistency.

## Decision

- Add a dedicated canonical readiness-constant module at `apps/web/src/domain/constants/lineServiceReadiness.ts`.
- Export readiness-only diagnostic constants:
  - `LINE_SERVICE_READINESS_ISSUE_CODES`
  - `LINE_SERVICE_READINESS_ISSUE_SEVERITIES`
- Move readiness contract types to `apps/web/src/domain/types/lineServiceReadiness.ts` and derive issue-code/severity union types from the canonical constants.
- Update `evaluateLineServiceReadiness` and readiness unit tests to reference canonical readiness constants instead of ad-hoc string literals.
- Keep this constant surface scoped to readiness diagnostics only (no selected-line JSON export validation codes).

## Consequences

- Readiness diagnostics now expose one stable, machine-readable code/severity contract that UI and tests can safely consume.
- Readiness evaluator and tests become less brittle because literal drift is reduced.
- Export-validation diagnostics remain isolated in their own domain module and are not coupled to readiness constants.

## Non-goals

- no changes to selected-line export payload validation issue codes
- no UI rendering or inspector behavior changes
- no simulation/economy logic changes
- no multimodal or mobile scope expansion
