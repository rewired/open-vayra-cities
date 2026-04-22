# Changelog

All notable changes to this project will be documented in this file.

## 2026-04-22

- Bootstrap pnpm workspace configuration and strict TypeScript base settings.
- Add `apps/web` React + TypeScript + Vite baseline with structural source boundaries.
- Add initial repository structural directories for docs and data partitions.
- Add onboarding-focused `README.md` that points contributors to canonical root docs and ADR location.
- Add ADR 0002 documenting documentation governance and `docs/adr/` as the ADR location.
- Add the initial desktop shell UI with header, left tools panel, workspace, right inspector panel, and bottom status bar placeholders.
- Add ADR 0003 documenting the initial desktop shell layout decision and scope boundaries.
- Prepare a dedicated map workspace surface scaffold with explicit empty-state and structural overlay regions, without map logic or dependencies.
- Add ADR 0004 documenting the map workspace surface scaffold decision and constraints.
- Integrate a real MapLibre-powered workspace baseline in the central shell area with lifecycle-safe React map setup/cleanup and neutral map-ready overlay status.
- Add ADR 0005 documenting the initial MapLibre workspace baseline decision and runtime-source constraints.
- Add local typed pointer interaction state and MapLibre move/click handler plumbing in the map workspace with cleanup-safe unsubscribe behavior and neutral developer-facing overlay text.
- Add ADR 0006 documenting neutral map workspace interaction plumbing and its non-goal constraints.
- Add explicit map workspace resize handling with `ResizeObserver`-first wiring, window resize fallback, and cleanup-safe registration lifecycle.
- Extend the typed MapLibre global surface with `resize(): void` to keep map runtime contracts explicit.
- Add ADR 0007 documenting explicit map workspace resize handling decisions and constraints.
- Refactor map workspace internals into lightweight local helpers that separate map instance lifecycle setup, neutral interaction subscriptions, and resize bindings with explicit typed contracts.
- Add ADR 0008 documenting map workspace internal lifecycle separation and lightweight boundary constraints.
- Add typed workspace tool mode state (`inspect` / `place-stop`) in the shell and replace the static tool list with a minimal stop-placement toggle control.
- Pass active workspace tool mode into the map workspace and gate click capture behavior by mode to support explicit placement-intent interactions.
- Add ADR 0009 documenting workspace tool mode gating at the shell-to-map boundary and associated scope constraints.
