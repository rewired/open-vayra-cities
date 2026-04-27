import type { ReactNode, ReactElement } from 'react';

interface AppShellProps {
  /** The main application content (top bar, sidebar, workspace, inspector). */
  children: ReactNode;
  /** Whether the application is currently blocked by a data operation. */
  isBlocked: boolean;
  /** The blocking modal to render when an operation is active. */
  blockingModal: ReactNode;
  /** The toast host for global notifications. */
  toastHost: ReactNode;
}

/**
 * Renders the application shell layout.
 * 
 * This component ensures that blocking modals and toasts are rendered as siblings
 * to the blurred app shell, preventing CSS filters (like blur) from being inherited
 * by the modal content.
 */
export function AppShell({ 
  children, 
  isBlocked, 
  blockingModal, 
  toastHost 
}: AppShellProps): ReactElement {
  return (
    <>
      <div
        className={`app-shell${isBlocked ? ' app-shell--blocked' : ''}`}
        data-app-surface="desktop-shell"
      >
        {children}
      </div>
      {toastHost}
      {blockingModal}
    </>
  );
}
