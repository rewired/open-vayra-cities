# ADR 0124: Slice 070c Inspector Flattening and Route Sequence Interaction Fix

- Status: Accepted
- Date: 2026-04-26

## Context

Slice 070b introduced line-scoped stop rename. Follow-up scope for Slice 070c is to flatten the selected-line inspector visual hierarchy, fix route-sequence interaction callbacks, and improve layout density.

## Decision

### Layout Flattening

- Remove nested `inspector-card` wrappers from selected-line sections.
- Use lightweight section containers (e.g., `.selected-line-inspector__summary`, `.selected-line-inspector__demand`, `.selected-line-inspector__actions`, `.selected-line-inspector__route-sequence`).
- Replace metadata grid with compact chip-based display.
- Keep dark visual language but reduce borders, backgrounds, padding, and repeated radius treatment.

### Route Sequence Badge Fix

- Render stop order badges as `1`, `2`, `3` instead of `[1]`, `[2]`, `[3]`.
- Accessible labels still say full phrases like "Stop 1: Hamburg HBF".

### Route Sequence Stop Focus Behavior

- Add `onLineSequenceStopFocus` callback for line-context stop focus (does not clear selected line).
- Global Network tab stop selection clears line context; line route-sequence stop click does not.
- Map focuses/zooms to clicked stop in both cases.

### Route Sequence Horizontal Space

- Use `idleDisplayMode="edit-only"` for inline rename fields in route-sequence rows.
- Add CSS override `.selected-line-inspector__route-item .inline-rename-field { min-width: 0; max-width: none; }`.
- Stop label gets flexible width, edit icon aligns right, long labels ellipsize.

### Route Sequence Internal Scroll

- Add `max-height: clamp(180px, 34vh, 320px)` and `overflow-y: auto` to route sequence list.
- Section header stays visible above scrollable list.
- Do not force page scroll for long route sequences.

### Action Buttons

- Replace wide text action buttons with compact icon-led buttons.
- Use Material icons: `pace` (frequency), `route` (service plan), `schedule` (departures), `directions_bus` (projected vehicles).
- Keep accessible labels/titles on each icon button.

## Non-Goals

Slice 070c explicitly does **not** introduce:

- stop or line deletion behavior,
- stop removal from route,
- route topology editing or route geometry changes,
- demand/economy/simulation changes,
- export/import or persistence format changes,
- mobile-specific layout behavior.

## Consequences

- Selected-line inspector is visually flattened and dense.
- Route-sequence interaction stays in line context.
- Map focuses correctly without inspector context switch.
- Improved horizontal space usage in route sequence rows.
- Long routes scroll internally without page scroll.