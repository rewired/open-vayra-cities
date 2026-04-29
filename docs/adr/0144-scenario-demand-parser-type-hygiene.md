# ADR 0144: Scenario Demand Parser Type Hygiene Repair

## Status

Accepted

## Context

Slice 141 established scenario-bound demand data configurations. However, its parser implemented unchecked object casts bypassing safety checks. Before adding city-scale imports, the boundary requires strict hardening.

## Decision

1. **Zero-Cast Data Evaluation**: Utilize strict explicit guards instead of broad type assertions.
2. **Literal Assembly**: Map temporal scales directly via static declarations ensuring absolute type conformance.
3. **Scope Guarding**: Ensure that downstream components remain decoupled from generation complexities.

## Consequences

Validation rules successfully block malformed inputs early in the processing pipeline.
