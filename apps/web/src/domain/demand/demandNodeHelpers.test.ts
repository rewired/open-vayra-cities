import { describe, expect, test } from 'vitest';

import { createDemandNodeId, createDemandWeight, createZeroDemandWeightByTimeBand, type DemandNode } from '../types/demandNode';
import type { TimeBandId } from '../types/timeBand';
import { summarizeDemandNodes, getActiveDemandNodes } from './demandNodeHelpers';

describe('demandNodeHelpers', () => {
  const mockNodes: readonly DemandNode[] = [
    {
      id: createDemandNodeId('res-1'),
      label: 'Residential Origin 1',
      position: { lng: 9.99, lat: 53.55 },
      role: 'origin',
      demandClass: 'residential',
      weightByTimeBand: {
        ...createZeroDemandWeightByTimeBand(),
        'morning-rush': createDemandWeight(10),
        'midday': createDemandWeight(5),
        'afternoon': createDemandWeight(0)
      }
    },
    {
      id: createDemandNodeId('res-2'),
      label: 'Residential Origin 2',
      position: { lng: 9.98, lat: 53.54 },
      role: 'origin',
      demandClass: 'residential',
      weightByTimeBand: {
        ...createZeroDemandWeightByTimeBand(),
        'morning-rush': createDemandWeight(15),
        'night': createDemandWeight(2)
      }
    },
    {
      id: createDemandNodeId('work-1'),
      label: 'Workplace Destination 1',
      position: { lng: 10.00, lat: 53.56 },
      role: 'destination',
      demandClass: 'workplace',
      weightByTimeBand: {
        ...createZeroDemandWeightByTimeBand(),
        'morning-rush': createDemandWeight(20),
        'afternoon': createDemandWeight(5),
        'night': createDemandWeight(0)
      }
    }
  ];

  describe('summarizeDemandNodes', () => {
    test('groups and counts nodes by role and class', () => {
      const summary = summarizeDemandNodes(mockNodes);
      
      expect(summary).toHaveLength(2);
      expect(summary).toEqual([
        { role: 'destination', demandClass: 'workplace', count: 1 },
        { role: 'origin', demandClass: 'residential', count: 2 }
      ]);
    });

    test('returns empty summary for empty input array', () => {
      const summary = summarizeDemandNodes([]);
      expect(summary).toEqual([]);
    });
  });

  describe('getActiveDemandNodes', () => {
    test('filters nodes with positive weights in the specified time band', () => {
      const morningNodes = getActiveDemandNodes(mockNodes, 'morning-rush');
      expect(morningNodes).toHaveLength(3); // All three have positive morning weight

      const middayNodes = getActiveDemandNodes(mockNodes, 'midday');
      expect(middayNodes).toHaveLength(1);
      expect(middayNodes[0]!.id).toBe('res-1');

      const nightNodes = getActiveDemandNodes(mockNodes, 'night');
      expect(nightNodes).toHaveLength(1);
      expect(nightNodes[0]!.id).toBe('res-2');
    });

    test('filters out nodes with zero weight in the specified time band', () => {
      const afternoonNodes = getActiveDemandNodes(mockNodes, 'afternoon');
      expect(afternoonNodes).toHaveLength(1); // Only work-1 has positive weight, res-1 is 0
      expect(afternoonNodes[0]!.id).toBe('work-1');
    });

    test('filters out nodes missing the time band configuration completely', () => {
      // 'evening-rush' is not present on any mock node, so it should be treated as undefined (0 weight implicitly)
      const eveningNodes = getActiveDemandNodes(mockNodes, 'evening-rush');
      expect(eveningNodes).toHaveLength(0);
    });
  });
});
