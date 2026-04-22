import type { ReactElement } from 'react';

import type { MaterialIconName } from './materialIcons';

/**
 * Renders one Google Material Symbols Outlined icon ligature.
 */
export interface MaterialIconProps {
  readonly name: MaterialIconName;
}

/**
 * Provides the canonical Material icon renderer for the CityOps web shell.
 */
export function MaterialIcon({ name }: MaterialIconProps): ReactElement {
  return (
    <span className="material-symbols-outlined app-material-icon" aria-hidden="true">
      {name}
    </span>
  );
}
