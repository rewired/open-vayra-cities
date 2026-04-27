/**
 * Progress of a data operation.
 */
export type DataOperationProgress =
  | { readonly kind: 'indeterminate' }
  | { readonly kind: 'determinate'; readonly completed: number; readonly total: number };

/**
 * State of an active data operation that blocks the UI.
 */
export interface ActiveDataOperation {
  readonly title: string;
  readonly phase: string;
  readonly progress: DataOperationProgress;
}
