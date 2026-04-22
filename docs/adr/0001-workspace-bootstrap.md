# ADR 0001: Establish monorepo workspace and web baseline

## Status

Accepted

## Date

2026-04-22

## Context

CityOps needs a strict TypeScript workspace baseline and a minimal desktop web app scaffold that preserves architecture boundaries without introducing gameplay logic.

## Decision

- Use a pnpm workspace rooted at the repository with `apps/*` package inclusion.
- Define strict shared TypeScript defaults in `tsconfig.base.json`.
- Create `apps/web` as a React + TypeScript + Vite baseline app.
- Pre-create source boundary directories under `apps/web/src` for app, domain, simulation, routing, map, features, UI constants, and shared library utilities.

## Consequences

- Workspace-level scripts can delegate to the web app package directly.
- Type strictness is enforced consistently from the start.
- Directory boundaries are explicit before domain implementation begins.
- No simulation, routing, persistence, or backend logic is introduced by this decision.
