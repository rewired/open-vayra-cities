# ADR 0138: README Scenario Workflow and Hamburg Cleanup

## Status

Proposed

## Context

Previous setup steps relied on hardcoded workflows targeting specific regions like `hamburg-latest` and direct script invocation (`download-hamburg-osm.ps1`). With the introduction of scenario presets and local area registries, onboarding procedures required alignment to prevent developer friction and ensure reproducible environment definitions.

## Decision

We replace the legacy manual onboarding documentation with the orchestrated scenario workflow.

Key changes:
- **Obsolete Cleanup**: Removed `scripts/routing/download-hamburg-osm.ps1`.
- **Standardize Setup**: The `pnpm scenario:setup:hamburg` execution path becomes the primary onboarding vector.
- **Gitignore Hardening**: Consolidated conflicting asset rules recursively covering `.pbf`, `.osrm`, and browser outputs.

## Consequences

- Simplifies initial workspace verification.
- Prevents accidental commits of bulky local geometries.

## Non-Goals

- No runtime behavior changes or state mutations.
- Scenario mapping defaults are not altered.
