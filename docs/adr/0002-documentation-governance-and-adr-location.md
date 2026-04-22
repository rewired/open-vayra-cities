# ADR 0002: Centralize documentation governance and ADR location

## Status

Accepted

## Date

2026-04-22

## Context

The project requires predictable documentation placement and clear guidance for where long-lived architectural decisions are stored. Contributors also need an onboarding entry point that points to canonical scope and governance documents without turning the README into a full specification.

## Decision

- Keep `README.md` onboarding-focused with concise run instructions and links to canonical project documents.
- Store architecture decisions under `docs/adr/`.
- Reserve root-level markdown files for the approved canonical project-wide document set.
- Record meaningful project-facing documentation governance updates in `CHANGELOG.md`.

## Consequences

- New contributors can find run instructions and canonical docs quickly.
- Architecture decisions remain discoverable and centralized.
- Repository root stays clean and predictable.
- Governance updates become easier to audit through ADRs and changelog history.
