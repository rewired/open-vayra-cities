import { createDemandNodeId, createDemandWeight, type DemandNode } from '../types/demandNode';
import { MVP_TIME_BAND_IDS } from '../constants/timeBands';
import type { TimeBandId } from '../types/timeBand';

/**
 * Creates a baseline demand weight record for all MVP time bands with a single default weight.
 */
const createUniformWeights = (weight: number): Record<TimeBandId, ReturnType<typeof createDemandWeight>> => {
  const weights = {} as Record<TimeBandId, ReturnType<typeof createDemandWeight>>;
  for (const id of MVP_TIME_BAND_IDS) {
    weights[id] = createDemandWeight(weight);
  }
  return weights;
};

/**
 * Creates a residential demand weight record that is high in the morning and evening rushes, but low at night.
 */
const createResidentialWeights = (peak: number, offPeak: number): Record<TimeBandId, ReturnType<typeof createDemandWeight>> => {
  const weights = {} as Record<TimeBandId, ReturnType<typeof createDemandWeight>>;
  weights['morning-rush'] = createDemandWeight(peak);
  weights['late-morning'] = createDemandWeight(offPeak);
  weights['midday'] = createDemandWeight(offPeak);
  weights['afternoon'] = createDemandWeight(offPeak);
  weights['evening-rush'] = createDemandWeight(peak);
  weights['evening'] = createDemandWeight(Math.floor(offPeak / 2));
  weights['night'] = createDemandWeight(1);
  return weights;
};

/**
 * Creates a workplace demand weight record that is very high in the morning rush (inbound destination strength) 
 * and moderately high in the evening rush.
 */
const createWorkplaceWeights = (peak: number, offPeak: number): Record<TimeBandId, ReturnType<typeof createDemandWeight>> => {
  const weights = {} as Record<TimeBandId, ReturnType<typeof createDemandWeight>>;
  weights['morning-rush'] = createDemandWeight(peak);
  weights['late-morning'] = createDemandWeight(offPeak);
  weights['midday'] = createDemandWeight(offPeak);
  weights['afternoon'] = createDemandWeight(offPeak);
  weights['evening-rush'] = createDemandWeight(Math.floor(peak * 0.8));
  weights['evening'] = createDemandWeight(Math.floor(offPeak / 2));
  weights['night'] = createDemandWeight(1);
  return weights;
};

/**
 * Canonical, deterministic in-memory MVP demand scenario for the Hamburg area.
 * Contains hand-authored residential origin and workplace destination nodes.
 * This scenario provides a consistent spatial demand baseline for testing the MVP planning loop.
 */
export const MVP_DEMAND_SCENARIO: readonly DemandNode[] = [
  // --- RESIDENTIAL ORIGINS (8-12 nodes) ---
  {
    id: createDemandNodeId('demand-res-altona-1'),
    label: 'Altona North Residential',
    position: { lng: 9.935, lat: 53.560 },
    role: 'origin',
    demandClass: 'residential',
    weightByTimeBand: createResidentialWeights(100, 30)
  },
  {
    id: createDemandNodeId('demand-res-altona-2'),
    label: 'Altona South Residential',
    position: { lng: 9.938, lat: 53.547 },
    role: 'origin',
    demandClass: 'residential',
    weightByTimeBand: createResidentialWeights(120, 40)
  },
  {
    id: createDemandNodeId('demand-res-eimsbuttel-1'),
    label: 'Eimsbüttel Central Residential',
    position: { lng: 9.954, lat: 53.576 },
    role: 'origin',
    demandClass: 'residential',
    weightByTimeBand: createResidentialWeights(150, 50)
  },
  {
    id: createDemandNodeId('demand-res-eimsbuttel-2'),
    label: 'Eimsbüttel East Residential',
    position: { lng: 9.970, lat: 53.570 },
    role: 'origin',
    demandClass: 'residential',
    weightByTimeBand: createResidentialWeights(110, 35)
  },
  {
    id: createDemandNodeId('demand-res-winterhude-1'),
    label: 'Winterhude West Residential',
    position: { lng: 9.995, lat: 53.590 },
    role: 'origin',
    demandClass: 'residential',
    weightByTimeBand: createResidentialWeights(140, 45)
  },
  {
    id: createDemandNodeId('demand-res-winterhude-2'),
    label: 'Winterhude East Residential',
    position: { lng: 10.015, lat: 53.595 },
    role: 'origin',
    demandClass: 'residential',
    weightByTimeBand: createResidentialWeights(130, 40)
  },
  {
    id: createDemandNodeId('demand-res-harburg-1'),
    label: 'Harburg Central Residential',
    position: { lng: 9.980, lat: 53.461 },
    role: 'origin',
    demandClass: 'residential',
    weightByTimeBand: createResidentialWeights(90, 25)
  },
  {
    id: createDemandNodeId('demand-res-st-georg-1'),
    label: 'St. Georg Residential',
    position: { lng: 10.010, lat: 53.555 },
    role: 'origin',
    demandClass: 'residential',
    weightByTimeBand: createResidentialWeights(80, 20)
  },
  {
    id: createDemandNodeId('demand-res-wilhelmsburg-1'),
    label: 'Wilhelmsburg North Residential',
    position: { lng: 10.000, lat: 53.500 },
    role: 'origin',
    demandClass: 'residential',
    weightByTimeBand: createResidentialWeights(70, 20)
  },
  {
    id: createDemandNodeId('demand-res-eppendorf-1'),
    label: 'Eppendorf Residential',
    position: { lng: 9.985, lat: 53.585 },
    role: 'origin',
    demandClass: 'residential',
    weightByTimeBand: createResidentialWeights(120, 35)
  },

  // --- WORKPLACE DESTINATIONS (6-10 nodes) ---
  {
    id: createDemandNodeId('demand-work-city-1'),
    label: 'City Center Workplaces',
    position: { lng: 9.993, lat: 53.551 },
    role: 'destination',
    demandClass: 'workplace',
    weightByTimeBand: createWorkplaceWeights(200, 80)
  },
  {
    id: createDemandNodeId('demand-work-city-2'),
    label: 'Jungfernstieg Business District',
    position: { lng: 9.990, lat: 53.554 },
    role: 'destination',
    demandClass: 'workplace',
    weightByTimeBand: createWorkplaceWeights(180, 70)
  },
  {
    id: createDemandNodeId('demand-work-hammerbrook-1'),
    label: 'Hammerbrook Office Hub',
    position: { lng: 10.021, lat: 53.546 },
    role: 'destination',
    demandClass: 'workplace',
    weightByTimeBand: createWorkplaceWeights(250, 100)
  },
  {
    id: createDemandNodeId('demand-work-hafencity-1'),
    label: 'HafenCity West Workplaces',
    position: { lng: 9.994, lat: 53.542 },
    role: 'destination',
    demandClass: 'workplace',
    weightByTimeBand: createWorkplaceWeights(150, 60)
  },
  {
    id: createDemandNodeId('demand-work-hafencity-2'),
    label: 'HafenCity East Development',
    position: { lng: 10.008, lat: 53.540 },
    role: 'destination',
    demandClass: 'workplace',
    weightByTimeBand: createWorkplaceWeights(120, 50)
  },
  {
    id: createDemandNodeId('demand-work-altona-1'),
    label: 'Altona Business Park',
    position: { lng: 9.925, lat: 53.555 },
    role: 'destination',
    demandClass: 'workplace',
    weightByTimeBand: createWorkplaceWeights(130, 55)
  },
  {
    id: createDemandNodeId('demand-work-harburg-1'),
    label: 'Harburg Port Industry',
    position: { lng: 9.975, lat: 53.475 },
    role: 'destination',
    demandClass: 'workplace',
    weightByTimeBand: createWorkplaceWeights(110, 40)
  },
  {
    id: createDemandNodeId('demand-work-uk-eppendorf-1'),
    label: 'UKE Medical Center',
    position: { lng: 9.975, lat: 53.590 },
    role: 'destination',
    demandClass: 'workplace',
    weightByTimeBand: createWorkplaceWeights(300, 150) // Constant high demand for hospitals
  }
];
