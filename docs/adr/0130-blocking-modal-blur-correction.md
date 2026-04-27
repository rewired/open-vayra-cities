# ADR 0130: Blocking Modal Blur Correction

## Status

Accepted

## Context

Following the implementation of the blocking data-operation modal (ADR 0129), it was observed that the modal itself appeared blurred when active. This was due to the modal being rendered as a child of the `.app-shell` div, which receives a CSS `blur` filter when a data operation is in progress. CSS filters apply to the entire rendered subtree, including all child elements.

## Decision

We correct the modal's DOM placement to ensure it remains sharp and readable while the application background is blurred.

1.  **DOM Structure**: The `BlockingDataOperationModal` (and the `ToastHost`) are moved outside the `.app-shell` container. They are now rendered as siblings to the shell.
2.  **AppShell Component**: We introduced a focused `AppShell` layout component to explicitly manage this relationship. This component ensures that global overlays (modals, toasts) are always rendered outside the filtered shell subtree.
3.  **CSS Scoping**: Blur and grayscale filters are strictly applied to the `.app-shell--blocked` container only. Since the modal is no longer a child of this container, it is not affected by these filters.
4.  **Backdrop Blur**: The modal overlay may still use `backdrop-filter` to provide additional focus on the modal content, as `backdrop-filter` affects the background behind the overlay but not its children.

## Consequences

*   **Readability**: The blocking modal content (title, phase, progress) remains sharp and visually distinct from the blurred background.
*   **Testability**: The layout structure is now explicitly testable via the `AppShell` component.
*   **Consistency**: Other global overlays, like toasts, benefit from the same structural isolation.
*   **Regression Prevention**: A focused layout test ensures that future changes do not accidentally move these overlays back into the filtered subtree.
