import type { CSSProperties, ReactElement } from 'react';

import type { MaterialIconName } from './materialIcons';

/**
 * Defines the available Material Symbol font variants.
 */
export type MaterialIconVariant = 'outlined' | 'sharp';

/**
 * Defines override settings for Material Symbol variations.
 */
export interface MaterialIconSettings {
  readonly fill?: number;
  readonly weight?: number;
  readonly grade?: number;
  readonly opticalSize?: number;
}

/**
 * Renders one Google Material Symbols icon ligature with optional variant and style overrides.
 */
export interface MaterialIconProps {
  readonly name: MaterialIconName;
  /**
   * The font variant to use. Defaults to 'outlined'.
   */
  readonly variant?: MaterialIconVariant;
  /**
   * Optional font variation settings to override defaults.
   */
  readonly settings?: MaterialIconSettings;
  /**
   * Optional CSS class to apply to the icon container.
   */
  readonly className?: string;
}

/**
 * Provides the canonical Material icon renderer for the OpenVayra - Cities web shell.
 */
export function MaterialIcon({ 
  name, 
  variant = 'outlined', 
  settings,
  className: incomingClassName
}: MaterialIconProps): ReactElement {
  const baseClassName = variant === 'sharp' 
    ? 'material-symbols-sharp app-material-icon app-material-icon--sharp'
    : 'material-symbols-outlined app-material-icon';

  const fullClassName = incomingClassName 
    ? `${baseClassName} ${incomingClassName}` 
    : baseClassName;

  const style: CSSProperties = settings ? {
    fontVariationSettings: [
      settings.fill !== undefined ? `'FILL' ${settings.fill}` : null,
      settings.weight !== undefined ? `'wght' ${settings.weight}` : null,
      settings.grade !== undefined ? `'GRAD' ${settings.grade}` : null,
      settings.opticalSize !== undefined ? `'opsz' ${settings.opticalSize}` : null,
    ].filter(Boolean).join(', ')
  } : {};

  return (
    <span className={fullClassName} style={style} aria-hidden="true">
      {name}
    </span>
  );
}
