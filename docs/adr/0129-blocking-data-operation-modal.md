# ADR 0129: Blocking App-Runtime Data Operation Modal

## Status

Accepted

## Context

CityOps increasingly processes larger local data artifacts during the application runtime, specifically OpenStreetMap (OSM) stop candidates. These operations—loading, validating, and consolidating raw data—can take noticeable time.

Without visual feedback, the player may perceive the app as frozen. Furthermore, allowing interaction with the map or panels during these phases could lead to race conditions, accidental edits, or inconsistent UI states before the data is fully ready.

## Decision

We implement a reusable, shell-level blocking modal for app-runtime data operations.

1.  **Scope**: The modal is reserved for browser-app runtime work (e.g., fetching JSON, CPU-heavy consolidation, map source synchronization). It is NOT used for external background processes (PowerShell, Docker, Osmium) which are outside the app's direct control.
2.  **Visual Feedback**: While an operation is active, the app shell is dimmed and lightly blurred using CSS filters. Pointer and keyboard interactions are blocked to ensure data integrity during processing.
3.  **State Management**: The data-operation state is treated as UI/runtime state, managed at the shell level (`App.tsx`), and decoupled from the domain model.
4.  **UX**: The modal supports both indeterminate progress (for unknown durations) and determinate progress (for chunked or counted operations). It displays a title and the current specific phase of the operation.
5.  **Robustness**: The modal must clear on both success and failure to prevent the UI from remaining permanently blocked. Missing data artifacts are handled gracefully by clearing the modal and returning to an interactive state with empty data.

## Consequences

*   **Improved Clarity**: Players receive immediate feedback when the app is performing heavy data work.
*   **State Safety**: Blocking interactions prevents user actions that might conflict with data currently being processed.
*   **Aesthetics**: The dim/blur effect provides a premium, focused feel for data-heavy transitions.
*   **Complexity**: Developers must ensure that all async paths correctly clear the operation state, especially in error handlers.
