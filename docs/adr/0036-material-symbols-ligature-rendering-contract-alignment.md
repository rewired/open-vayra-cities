# ADR 0036: Material Symbols ligature rendering contract alignment

## Status

Accepted

## Date

2026-04-23

## Scope

Document Slice 014d styling-level alignment for Material Symbols ligature rendering in the web shell.

## Constraints

- Keep `@fontsource/material-symbols-outlined` as the only icon baseline.
- Preserve the existing typed icon surface (`MaterialIconName`) and ligature-based `MaterialIcon` rendering.
- Do not introduce alternate icon libraries, icon fallback systems, or design-system replacements.
- Preserve current accessibility behavior for decorative tool-button icons.

## Decision

- Keep `font-family: 'Material Symbols Outlined'` on `.app-material-icon`.
- Align `.app-material-icon` with expected ligature class rendering properties by explicitly setting:
  - `display: inline-block`
  - `font-style: normal`
  - `font-weight: normal`
  - `line-height: 1`
  - `letter-spacing: normal`
  - `text-transform: none`
  - `white-space: nowrap`
  - `direction: ltr`
  - `-webkit-font-feature-settings: 'liga'`
  - `-webkit-font-smoothing: antialiased`
- Retain existing `aria-hidden="true"` behavior in `MaterialIcon` because icons are currently decorative alongside visible button labels; therefore no `aria-label` is added in this slice.

## Explicit non-goals

Slice 014d does **not** introduce:

- any new icon package or fallback icon renderer
- typed icon-name contract changes
- component-level accessibility contract rewrites
- changes to line building, routing, simulation, demand, economy, persistence, backend, or mobile behavior

## Consequences

- Material Symbols ligatures are rendered with a browser-compatible style contract matching expected icon-font behavior.
- The icon baseline remains singular and predictable.
- Accessibility semantics remain unchanged for current decorative icon usage.
