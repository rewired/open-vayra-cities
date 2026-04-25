/** Canonical UI-local tab identifiers for inspector panel navigation. */
export const INSPECTOR_TAB_IDS = ['network', 'lines', 'debug'] as const;

/** Union of available UI-local inspector tab ids. */
export type InspectorTabId = (typeof INSPECTOR_TAB_IDS)[number];

/** Accessible labels keyed by tab id for inspector tab trigger rendering. */
export const INSPECTOR_TAB_LABELS: Readonly<Record<InspectorTabId, string>> = {
  network: 'Network',
  lines: 'Lines',
  debug: 'Debug'
};
