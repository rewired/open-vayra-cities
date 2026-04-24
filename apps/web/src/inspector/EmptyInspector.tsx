import type { ReactElement } from 'react';

/** Renders the neutral inspector content when no line or stop is selected. */
export function EmptyInspector(): ReactElement {
  return <p>No stop or line selected.</p>;
}
