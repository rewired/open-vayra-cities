import { type ReactElement, type ReactNode } from 'react';

interface InspectorDisclosureProps {
  /** Text to show in the disclosure summary. */
  readonly summaryText: string;
  /** Optional preview or badge content to show in the summary row. */
  readonly summaryBadge?: ReactNode;
  /** The content to show when the disclosure is expanded. */
  readonly children: ReactNode;
  /** Optional CSS class for the wrapper. */
  readonly className?: string;
  /** Whether the disclosure is open by default. */
  readonly defaultOpen?: boolean;
}

/**
 * Renders a compact, keyboard-accessible native disclosure for secondary inspector details.
 * Aligns with the "whisper-weight" design system with ultra-thin borders and restrained spacing.
 */
export function InspectorDisclosure({
  summaryText,
  summaryBadge,
  children,
  className,
  defaultOpen = false
}: InspectorDisclosureProps): ReactElement {
  const detailsClassName = className ? `inspector-disclosure ${className}` : 'inspector-disclosure';

  return (
    <details className={detailsClassName} open={defaultOpen}>
      <summary className="inspector-disclosure__summary">
        <span className="inspector-disclosure__summary-text">{summaryText}</span>
        {summaryBadge && <span className="inspector-disclosure__summary-badge">{summaryBadge}</span>}
      </summary>
      <div className="inspector-disclosure__content">{children}</div>
    </details>
  );
}
