# AGENTS.md

## Purpose

This document defines mandatory working rules for coding agents contributing to this project.

CityOps is a desktop-only, browser-based transit network simulation game focused on a bus-first MVP. The goal is to preserve a sharply scoped, implementation-friendly foundation and prevent scope drift, accidental architecture sprawl, and weakly typed shortcuts.

---

## Source of truth order

When working on this project, use the following source-of-truth order:

1. `PRODUCT_DEFINITION.md`
2. `FOUNDATION.md`
3. `VISION_SCOPE.md`
4. `DD.md`
5. `TDD.md`
6. `SEC.md`
7. `DESIGN.md` (externally owned; only as provided)
8. Current repository code

If code and docs disagree, do not silently choose one. Surface the conflict explicitly.

---

## Repository documentation placement

Documentation placement must remain predictable and centralized.

### Root-level documents

The repository root may contain only the following project-wide documentation files:

* `README.md`
* `CHANGELOG.md`
* `AGENTS.md`
* `FOUNDATION.md`
* `PRODUCT_DEFINITION.md`
* `VISION_SCOPE.md`
* `DD.md`
* `TDD.md`
* `SEC.md`
* `DESIGN.md`

Do not add additional ad-hoc Markdown files to the repository root unless explicitly approved.

### `/docs` directory

All other documentation must live under `/docs`.

Examples include:

* implementation notes
* architecture deep-dives
* feature-specific specifications
* ADRs
* data/import notes
* simulation notes
* workflow notes
* temporary analysis documents that are intentionally retained

### Documentation placement rules

* Do not scatter Markdown files across random package or app directories unless there is a strong local reason.
* Prefer `/docs` for all non-root documentation.
* If a document is project-wide and canonical, place it in the root only if it clearly belongs to the short approved root list.
* If a document is exploratory, supporting, historical, or feature-specific, place it in `/docs`.

### README rule

`README.md` should remain concise and onboarding-oriented.

It should explain:

* what CityOps is
* how to run it
* where canonical documentation lives
* where to find design authority once available

Do not turn `README.md` into a dumping ground for every design, domain, or implementation detail.

### CHANGELOG rule

`CHANGELOG.md` should remain root-level and reserved for meaningful project-facing change history.

Do not misuse it for scratch notes, planning fragments, or implementation diaries.

---

## Mandatory working mode

### Plan first, then implement

For any non-trivial change:

1. inspect the current repository state
2. identify the exact scope being changed
3. state the intended patch boundaries
4. only then implement

Do not jump directly into patch generation for medium or large changes.

### No silent scope expansion

Do not add adjacent features just because they seem useful.

Examples of forbidden silent expansion:

* adding tram, subway, S-Bahn, ferry, or rail construction to a bus-only MVP task
* adding micro-simulation when the task only requires aggregate simulation
* adding mobile support
* adding backend/server complexity without explicit need
* adding persistence, saves, accounts, cloud sync, or multiplayer unless explicitly requested

### No inferred realism escalation

Do not replace simplified MVP rules with more “realistic” ones unless explicitly requested.

Examples:

* do not replace radius-based access with street-network walking automatically
* do not replace aggregated service logic with full vehicle duty scheduling
* do not replace simplified economy with detailed depreciation, staffing, and maintenance models unless asked

---

## Language rules

* All source code must be written in English.
* All project documentation must be written in English.
* Do not introduce German identifiers, comments, types, docstrings, or Markdown content into the repository.
* Chat discussion may be in German, but repository artifacts must remain English-only.

---

## Type safety rules

Strong type safety is mandatory.

### Required

* Preserve strict TypeScript usage.
* Prefer explicit types over inferred ad-hoc object shapes at public boundaries.
* Use canonical domain types for domain concepts.
* Use narrow unions, branded IDs, or other strong typing patterns where helpful for domain safety.

### Forbidden

* no silent `any`
* no broad `unknown` casts to bypass type safety
* no `as any`
* no type weakening to “get it to compile”
* no duplicated informal string unions across files
* no plain string/number truth for important domain concepts when canonical types exist

### Public boundary discipline

Public module boundaries must expose clear, intentionally typed contracts.

Important examples:

* IDs
* time bands
* transport modes
* line direction
* demand classes
* simulation statuses
* economy metrics
* UI projection inputs

---

## Constant and configuration rules

Constants must be centralized.

### Required

* Reuse canonical constants/config values when they already exist.
* Add new constants only in canonical constant/config modules.
* Keep domain constants separate from UI constants.
* Keep simulation defaults separate from display-only values.

### Forbidden

* no scattered magic numbers
* no duplicated thresholds across packages
* no hidden domain defaults inside React components
* no local redefinition of canonical simulation values

If a constant appears to belong to the domain or simulation core, it must not live in the UI layer.

---

## Export documentation rules

All exports must have clean inline documentation.

This applies to:

* exported functions
* exported classes
* exported types
* exported interfaces
* exported constants or constant groups
* exported factories
* exported public module surfaces

Documentation must describe, concisely:

* purpose
* input expectations
* output meaning
* important invariants or constraints

Do not leave public exports undocumented.
Do not write bloated essay-comments either.

---

## Architecture discipline

### Preserve layer boundaries

Do not mix:

* UI rendering and simulation logic
* routing logic and React component logic
* domain truth and display-only projections
* map interaction glue and economy simulation
* design assumptions and domain behavior

### Preferred direction

* domain definitions stay canonical
* simulation logic depends on domain truth
* routing adapters depend on domain truth
* UI consumes projections and commands
* UI must not become the source of domain rules

### Forbidden shortcuts

* no simulation logic embedded in React components
* no route computation embedded in view code
* no UI-only constants redefining domain semantics
* no design-driven domain changes without explicit approval

### UI Layout safety

* Debug/status/diagnostic/transient feedback must be rendered only through contained UI surfaces.
* Acceptable surfaces: toast, modal/dialog, inspector/debug panel, or a bounded inline component that wraps safely.
* Raw long text must not be inserted directly into app chrome/header/layout containers.
* If uncertain, use a small modal or toast rather than letting text escape into layout.

---

## CSS organization rules

Agents must adhere to the CSS architecture when modifying styles.

### Required

* Keep `apps/web/src/App.css` as the ordered import entrypoint unless explicitly instructed otherwise.
* Put new feature styles in focused files under `apps/web/src/styles/`.
* Preserve cascade order when moving CSS.
* Use shared custom properties from the base stylesheet for repeated foundational values.

### Forbidden

* Avoid adding unrelated selectors to existing large CSS files.
* Do not rename selectors or alter visual values during source-organization slices.
* Do not introduce CSS Modules, preprocessors, styling libraries, or theme systems without explicit approval.
* Do not add mobile/touch-first CSS behavior because CityOps is desktop-only.

---

## MVP scope guardrails

Current MVP focus:

* desktop-only
* browser-based
* bus-only playable slice
* line planning via stop selection
* direction-aware lines
* round lines allowed
* time-band-based frequency settings
* realistic-enough stop-to-stop travel times
* demand from residential origins and work destinations
* economic performance plus passenger satisfaction as primary evaluation axes

Out of scope unless explicitly requested:

* mobile
* tram/subway/S-Bahn/ferry gameplay
* player-built rail in MVP
* detailed staff systems
* depot logistics
* full maintenance model
* micro traffic simulation
* fully realistic pedestrian routing
* deep city growth simulation
* multiplayer
* full real-world transit data reconstruction

---

## DESIGN.md handling

`DESIGN.md` is externally owned by Voltagent.

Coding agents must not:

* invent its content
* replace it with self-authored design systems
* infer visual truth that claims to come from it when it is not yet provided

Until the external design document exists, use only minimal functional UI assumptions needed for implementation.

---

## Acceptance criteria discipline

Every meaningful implementation task must define explicit acceptance criteria.

Acceptance criteria should cover:

* behavior
* boundaries
* type-safety expectations
* non-goals where relevant

If acceptance criteria are missing, do not silently broaden the task.

---

## No-drift checks

Before completing a task, verify:

1. scope stayed within the requested slice
2. no new transport modes were introduced unintentionally
3. no mobile behavior or layout support was added
4. type safety was preserved
5. constants were not duplicated locally
6. exported surfaces were documented
7. UI did not absorb simulation/domain logic
8. simplified MVP truths were not silently replaced with heavier realism
9. documentation placement stayed compliant with this file
10. CSS changes preserved the feature-file structure and did not recreate stylesheet sprawl

If any of the above changed, surface it explicitly.

---

## Change sizing guidance

Prefer small, coherent, testable slices.

Good slices:

* define time-band domain types and constants
* add stop placement rules on streets
* add line creation through ordered stop selection
* compute stop-to-stop segment travel times from routed street paths
* add demand-node to stop radius coverage
* add passenger satisfaction scoring based on travel quality

Bad slices:

* “implement the whole transit simulation”
* “add all future transport modes”
* “make it realistic”
* “build the entire UI and engine in one patch”

---

## Final rule

When in doubt, choose:

* smaller scope
* stronger types
* clearer boundaries
* centralized constants
* simpler MVP truth
* explicit documentation
