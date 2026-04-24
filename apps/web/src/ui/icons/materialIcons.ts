/**
 * Enumerates the currently approved Google Material icon ligature names
 * used by the desktop shell baseline.
 */
export type MaterialIconName =
  | 'search'
  | 'add_location_alt'
  | 'route'
  | 'play_arrow'
  | 'pause'
  | 'restart_alt'
  | 'upload_file'
  | 'download';

/**
 * Canonical Material icon name mapping for workspace mode controls.
 */
export const WORKSPACE_MODE_ICONS = {
  inspect: 'search',
  'place-stop': 'add_location_alt',
  'build-line': 'route'
} as const satisfies Record<'inspect' | 'place-stop' | 'build-line', MaterialIconName>;
