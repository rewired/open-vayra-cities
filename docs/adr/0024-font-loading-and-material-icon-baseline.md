# ADR 0024: Font loading and Material icon baseline

## Status

Accepted

## Date

2026-04-22

## Scope

Correct the UI infrastructure baseline so Inter is actually loaded at runtime and Google Material icons become the canonical icon baseline for app-shell usage.

## Constraints

- Keep the change desktop-only and minimal.
- Do not introduce shell redesign, gameplay, simulation, routing, or persistence work.
- Avoid design-system expansion beyond the baseline correction.
- Keep icon usage typed and explicit where touched.

## Decision

- Load Inter through package-based runtime imports in the web entrypoint.
- Load Google Material Symbols Outlined through one package baseline in the same entrypoint.
- Introduce a small typed icon name surface and a minimal `MaterialIcon` renderer for touched shell controls.
- Update the existing workspace mode buttons to use the canonical Material icon baseline.

## Explicit non-goals

This slice does **not** introduce:

- typography token systems
- multi-library icon strategy
- global component-library redesign
- wider icon refactors beyond the touched shell controls
