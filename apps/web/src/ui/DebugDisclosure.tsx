import { type ReactElement, type ReactNode } from 'react';

interface DebugDisclosureProps {
  readonly summaryText?: string;
  readonly children: ReactNode;
  readonly className?: string;
}

/**
 * Renders a compact, keyboard-accessible native disclosure wrapper for optional debug diagnostics.
 */
export function DebugDisclosure({ summaryText = 'Debug details', children, className }: DebugDisclosureProps): ReactElement {
  const detailsClassName = className ? `debug-disclosure ${className}` : 'debug-disclosure';

  return (
    <details className={detailsClassName}>
      <summary>{summaryText}</summary>
      <div className="debug-disclosure__content">{children}</div>
    </details>
  );
}
