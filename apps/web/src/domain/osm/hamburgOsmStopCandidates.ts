import { createOsmStopCandidateId } from '../types/osmStopCandidate';
import type { OsmStopCandidate } from '../types/osmStopCandidate';

/**
 * Deterministic MVP fixture of Hamburg OSM bus stop candidates.
 * This is external candidate data, not canonical CityOS stop truth.
 */
export const HAMBURG_OSM_STOP_CANDIDATES: readonly OsmStopCandidate[] = [
  {
    id: createOsmStopCandidateId('osm-node-1001'),
    position: { lng: 9.9930, lat: 53.5531 },
    label: 'Hauptbahnhof',
    kind: 'bus-stop',
    source: 'osm',
    osmElementType: 'node',
    osmElementId: 'node-1001'
  },
  {
    id: createOsmStopCandidateId('osm-node-1002'),
    position: { lng: 9.9895, lat: 53.5515 },
    label: 'Jungfernstieg',
    kind: 'bus-stop',
    source: 'osm',
    osmElementType: 'node',
    osmElementId: 'node-1002'
  },
  {
    id: createOsmStopCandidateId('osm-node-1003'),
    position: { lng: 9.9570, lat: 53.5470 },
    label: 'Reeperbahn',
    kind: 'bus-stop',
    source: 'osm',
    osmElementType: 'node',
    osmElementId: 'node-1003'
  },
  {
    id: createOsmStopCandidateId('osm-node-1004'),
    position: { lng: 9.9350, lat: 53.5500 },
    label: 'Altona',
    kind: 'bus-stop',
    source: 'osm',
    osmElementType: 'node',
    osmElementId: 'node-1004'
  },
  {
    id: createOsmStopCandidateId('osm-node-1005'),
    position: { lng: 10.0180, lat: 53.5870 },
    label: 'Barmbek',
    kind: 'bus-stop',
    source: 'osm',
    osmElementType: 'node',
    osmElementId: 'node-1005'
  },
  {
    id: createOsmStopCandidateId('osm-node-1006'),
    position: { lng: 10.0530, lat: 53.5680 },
    label: 'Wandsbek',
    kind: 'bus-stop',
    source: 'osm',
    osmElementType: 'node',
    osmElementId: 'node-1006'
  }
] as const;
