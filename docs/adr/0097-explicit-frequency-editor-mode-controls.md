# ADR 0097: Explicit frequency editor mode controls for `unset`, `frequency`, and `no-service`

## Status

Accepted (2026-04-25)

## Context

The selected-line frequency editor previously used only raw text input state per time band.
This caused two UX/state problems:

1. Explicit `no-service` could not be selected directly in the editor.
2. Selected-line synchronization collapsed `no-service` and `unset` into the same empty input representation.

The domain already models distinct service-plan kinds (`unset`, `frequency`, `no-service`), so the editor state must preserve that distinction.

## Decision

1. Add explicit per-band control-mode state in session for selected-line frequency editing: `unset | frequency | no-service`.
2. Keep existing raw-input semantics stable:
   - empty text input maps to `{ kind: 'unset' }`
   - positive finite numeric input maps to `{ kind: 'frequency', headwayMinutes }`
3. Add explicit update actions for mode changes, including a dedicated `set-no-service` path that does not depend on empty input inference.
4. Update selected-line synchronization (`useEffect`) to map canonical line service plans into both:
   - input text state, and
   - explicit control-mode state,
   so `no-service` remains visible as `no-service` instead of being collapsed into empty/unset.
5. Update the frequency dialog to expose explicit per-band mode controls (unset/no-service/frequency) and keep validation text aligned with these semantics.

## Consequences

- User intent is explicit for service-band mode selection.
- UI preserves canonical service-plan semantics from selected-line state.
- Empty input remains a valid shorthand for returning a frequency band to `unset`.

## Explicit non-goals (this slice)

- no changes to readiness/projection semantics introduced in ADR 0096
- no route computation changes
- no simulation clock changes
- no demand/economy/passenger model changes
- no mobile or multimodal scope expansion
