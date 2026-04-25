import { describe, it, expect } from 'vitest';
import { MVP_DEMAND_SCENARIO } from './mvpDemandScenario';
import { MVP_TIME_BAND_IDS } from '../constants/timeBands';

describe('MVP_DEMAND_SCENARIO', () => {
  it('contains at least one residential origin node', () => {
    const residentialOrigins = MVP_DEMAND_SCENARIO.filter(
      (node) => node.role === 'origin' && node.demandClass === 'residential'
    );
    expect(residentialOrigins.length).toBeGreaterThanOrEqual(1);
    expect(residentialOrigins.length).toBeGreaterThanOrEqual(8); // Recommended size
  });

  it('contains at least one workplace destination node', () => {
    const workplaceDestinations = MVP_DEMAND_SCENARIO.filter(
      (node) => node.role === 'destination' && node.demandClass === 'workplace'
    );
    expect(workplaceDestinations.length).toBeGreaterThanOrEqual(1);
    expect(workplaceDestinations.length).toBeGreaterThanOrEqual(6); // Recommended size
  });

  it('ensures all scenario node IDs are unique', () => {
    const ids = MVP_DEMAND_SCENARIO.map((node) => node.id);
    const uniqueIds = new Set(ids);
    expect(uniqueIds.size).toBe(ids.length);
  });

  it('ensures all scenario coordinates are finite', () => {
    for (const node of MVP_DEMAND_SCENARIO) {
      expect(Number.isFinite(node.position.lng)).toBe(true);
      expect(Number.isFinite(node.position.lat)).toBe(true);
    }
  });

  it('ensures all scenario demand weights are positive and use canonical time-band IDs', () => {
    for (const node of MVP_DEMAND_SCENARIO) {
      const timeBandIdsInNode = Object.keys(node.weightByTimeBand);
      
      // Check if all canonical time bands are present
      expect(timeBandIdsInNode.length).toBe(MVP_TIME_BAND_IDS.length);
      
      for (const timeBandId of MVP_TIME_BAND_IDS) {
        const weight = node.weightByTimeBand[timeBandId];
        expect(weight).toBeDefined();
        expect(weight).toBeGreaterThanOrEqual(0);
      }
    }
  });

  it('verifies spatial patterns: at least one origin/destination pair is not trivially close', () => {
    // 0.01 degrees is roughly 1km at this latitude
    const LARGE_DISTANCE_THRESHOLD = 0.05; // ~5km
    
    let foundFarPair = false;
    const origins = MVP_DEMAND_SCENARIO.filter(n => n.role === 'origin');
    const destinations = MVP_DEMAND_SCENARIO.filter(n => n.role === 'destination');

    for (const origin of origins) {
      for (const dest of destinations) {
        const dLng = Math.abs(origin.position.lng - dest.position.lng);
        const dLat = Math.abs(origin.position.lat - dest.position.lat);
        if (dLng > LARGE_DISTANCE_THRESHOLD || dLat > LARGE_DISTANCE_THRESHOLD) {
          foundFarPair = true;
          break;
        }
      }
      if (foundFarPair) break;
    }

    expect(foundFarPair).toBe(true);
  });
});
