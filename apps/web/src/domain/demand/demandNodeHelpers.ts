import type { TimeBandId } from '../types/timeBand';
import type { DemandNode, DemandNodeRole, DemandClass } from '../types/demandNode';

/**
 * Summarizes the total count of a specific demand node role and class.
 */
export interface DemandNodeSummary {
  readonly role: DemandNodeRole;
  readonly demandClass: DemandClass;
  readonly count: number;
}

/**
 * Counts and groups demand nodes by their role and classification.
 * Returns a stable array of deterministic summary counts for projection layers.
 */
export const summarizeDemandNodes = (nodes: readonly DemandNode[]): readonly DemandNodeSummary[] => {
  const counts = new Map<string, number>();

  for (const node of nodes) {
    const key = `${node.role}-${node.demandClass}`;
    counts.set(key, (counts.get(key) || 0) + 1);
  }

  // To ensure deterministic order, we sort by key
  const sortedEntries = Array.from(counts.entries()).sort((a, b) => a[0].localeCompare(b[0]));

  return sortedEntries.map(([key, count]) => {
    const [role, demandClass] = key.split('-') as [DemandNodeRole, DemandClass];
    return { role, demandClass, count };
  });
};

/**
 * Filters demand nodes down to those that have a strictly positive demand weight
 * configured for the specified canonical time band.
 */
export const getActiveDemandNodes = (
  nodes: readonly DemandNode[],
  timeBandId: TimeBandId
): readonly DemandNode[] => {
  return nodes.filter(node => {
    const weight = node.weightByTimeBand[timeBandId];
    return weight !== undefined && weight > 0;
  });
};
