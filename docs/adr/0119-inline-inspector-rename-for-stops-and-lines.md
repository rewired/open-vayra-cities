# ADR 0119: Inline Inspector Rename for Stops and Lines

- Status: Accepted
- Date: 2026-04-26

## Context

Slice 070 requires compact rename support for player-authored stop and line labels without adding delete or structural editing behavior.

The existing inspector inventory already lists both stops and lines and owns selection affordances, making it the lowest-duplication location for a shared rename interaction.

## Decision

Implement inline rename controls in the inspector network inventory for both stops and lines.

Behavior rules:

- Explicit edit affordance enters edit mode.
- Enter and checkmark accept.
- Escape and cancel icon cancel.
- Blur does not auto-commit.
- Accepted input is trimmed and rejected when empty.
- Canceled or invalid edits preserve the previous persisted label.

Route/line labels additionally apply accept-time symbol normalization in this order:

1. `<->` to `↔`
2. `<>` to `↔`
3. `->` to `→`
4. `>` to `→`

Normalization is scoped only to accepted line renames and is not applied while typing.

## Consequences

- Rename state remains local UI editing state and does not become domain truth until explicit accept.
- Selection and map-focus flows stay unchanged because row selection actions are preserved.
- No delete behavior, route topology edits, persistence format changes, or simulation/routing changes are introduced.
