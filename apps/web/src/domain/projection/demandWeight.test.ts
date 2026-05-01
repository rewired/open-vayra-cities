import { describe, it, expect } from 'vitest';
import { calculateActiveDemandWeight, calculateActiveAttractorSinkWeight, calculateActiveGatewayTransferWeight } from './demandWeight';
import type { ScenarioDemandNode, ScenarioDemandAttractor, ScenarioDemandGateway } from '../types/scenarioDemand';

describe('demandWeight helpers', () => {
  const mockNode: ScenarioDemandNode = {
    id: 'n1',
    position: { lng: 0, lat: 0 },
    role: 'origin',
    class: 'residential',
    baseWeight: 100,
    timeBandWeights: {
      'morning-rush': 1.5,
      'midday': 0.5,
      'night': 0
    } as any
  };

  const mockAttractor: ScenarioDemandAttractor = {
    id: 'a1',
    position: { lng: 0, lat: 0 },
    category: 'workplace',
    scale: 'local',
    sourceWeight: 0,
    sinkWeight: 200,
    timeBandWeights: {
      'morning-rush': 1.2
    } as any
  };

  const mockGateway: ScenarioDemandGateway = {
    id: 'g1',
    position: { lng: 0, lat: 0 },
    kind: 'rail-station',
    scale: 'major',
    sourceWeight: 10,
    sinkWeight: 10,
    transferWeight: 300,
    timeBandWeights: {
      'morning-rush': 2.0,
      'midday': 1.0
    } as any
  };

  describe('calculateActiveDemandWeight', () => {
    it('multiplies base weight by time band weight', () => {
      expect(calculateActiveDemandWeight(mockNode, 'morning-rush' as any)).toBe(150);
      expect(calculateActiveDemandWeight(mockNode, 'midday' as any)).toBe(50);
    });

    it('returns 0 for zero time band weight', () => {
      expect(calculateActiveDemandWeight(mockNode, 'night' as any)).toBe(0);
    });

    it('returns 0 for missing time band weight', () => {
      expect(calculateActiveDemandWeight(mockNode, 'afternoon' as any)).toBe(0);
    });
  });

  describe('calculateActiveAttractorSinkWeight', () => {
    it('multiplies sink weight by time band weight', () => {
      expect(calculateActiveAttractorSinkWeight(mockAttractor, 'morning-rush' as any)).toBe(240);
    });

    it('falls back to 1.0 multiplier if timeBandWeights is missing or band is missing', () => {
      const attractorNoWeights: ScenarioDemandAttractor = { ...mockAttractor, timeBandWeights: undefined };
      expect(calculateActiveAttractorSinkWeight(attractorNoWeights, 'morning-rush' as any)).toBe(200);
      expect(calculateActiveAttractorSinkWeight(mockAttractor, 'midday' as any)).toBe(200);
    });
  });

  describe('calculateActiveGatewayTransferWeight', () => {
    it('multiplies transfer weight by time band weight', () => {
      expect(calculateActiveGatewayTransferWeight(mockGateway, 'morning-rush' as any)).toBe(600);
      expect(calculateActiveGatewayTransferWeight(mockGateway, 'midday' as any)).toBe(300);
    });

    it('returns 0 for missing time band weight', () => {
      expect(calculateActiveGatewayTransferWeight(mockGateway, 'night' as any)).toBe(0);
    });
  });
});
