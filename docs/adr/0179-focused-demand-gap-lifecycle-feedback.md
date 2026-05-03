# ADR 0179: Focused Demand Gap Lifecycle Feedback

## Status

Accepted

## Context

In OpenVayra - Cities, players can focus on specific demand gaps to receive planning guidance. When a player takes action (e.g., placing a stop or modifying a line), the underlying demand gap data may change. A gap might fall out of the top-ranked list, move to a different category, or become irrelevant in the current time band.

Without explicit feedback, the Demand inspector can feel ambiguous if a focused gap disappears. The player might wonder if it was "resolved" or if the UI is just failing to show it.

## Decision

We will implement a pure **Focused Demand Gap Lifecycle Projection** to track the status of a focused gap relative to the current ranking output.

1.  **Projection-Only**: Lifecycle status is derived purely from `focusedDemandGapId` and the output of `DemandGapRankingProjection`. It does not recompute demand math or own authoritative simulation truth.
2.  **Status Categories**:
    *   `unfocused`: No gap is currently focused.
    *   `active`: The focused gap is still present in the current top-ranked buckets.
    *   `not-currently-ranked`: The focused gap ID is set but is no longer present in any current ranking bucket.
3.  **Non-Authoritative Resolution Claims**: The UI will NOT claim a gap is "resolved" with certainty. Instead, it will state that the gap "no longer appears in current gaps" and provide possible reasons (resolved, below threshold, or time-band dependent).
4.  **UI Integration**: The `InspectorDemandTab` will consume this projection to render a neutral, informative notice when a focused gap falls out of ranking, preserving the "Clear focus" path for the player.

## Consequences

*   **Improved Clarity**: Players receive immediate feedback on whether their actions affected the focused gap's ranking.
*   **Robustness**: The UI handles data changes gracefully without leaving the player in an ambiguous state.
*   **Separation of Concerns**: React components remain focused on rendering while lifecycle semantics are centralized in a testable pure projection.
*   **No Resolution Authority**: By avoiding "Resolved" labels, we remain honest about the heuristic nature of demand gap ranking (which is capped and filtered).
