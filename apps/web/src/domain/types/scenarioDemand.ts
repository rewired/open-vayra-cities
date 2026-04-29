import type { TimeBandId } from './timeBand';
import type {
  ScenarioDemandNodeRole,
  ScenarioDemandNodeClass,
  ScenarioDemandAttractorCategory,
  ScenarioDemandScale,
  ScenarioDemandGatewayKind,
  ScenarioDemandSourceKind
} from '../constants/scenarioDemand';

/**
 * Role of a demand node in the simulation.
 */
export type { ScenarioDemandNodeRole };

/**
 * Classification of a demand node.
 * Future-ready classes are clearly marked with '_future'.
 */
export type { ScenarioDemandNodeClass };

/**
 * Geographic position for demand entities in WGS84 coordinates.
 */
export interface ScenarioDemandPosition {
  readonly lng: number;
  readonly lat: number;
}

/**
 * Represents a scenario-owned demand source/sink node.
 */
export interface ScenarioDemandNode {
  /** Unique stable identifier. */
  readonly id: string;
  /** Geographic location. */
  readonly position: ScenarioDemandPosition;
  /** Functional role. */
  readonly role: ScenarioDemandNodeRole;
  /** Target demographic classification. */
  readonly class: ScenarioDemandNodeClass;
  /** Base scalar weight. */
  readonly baseWeight: number;
  /** Weight distributions across canonical time bands. */
  readonly timeBandWeights: Readonly<Record<TimeBandId, number>>;
  /** Optional non-authoritative provenance metadata. */
  readonly sourceTrace?: Record<string, unknown>;
}

/**
 * Category of an attractor.
 */
export type { ScenarioDemandAttractorCategory };

/**
 * Scale of an attractor or gateway.
 */
export type { ScenarioDemandScale };

/**
 * Represents a scenario-owned attractor (non-gateway target pull location).
 */
export interface ScenarioDemandAttractor {
  /** Unique stable identifier. */
  readonly id: string;
  /** Geographic location. */
  readonly position: ScenarioDemandPosition;
  /** Functional category. */
  readonly category: ScenarioDemandAttractorCategory;
  /** Catchment hierarchy tier. */
  readonly scale: ScenarioDemandScale;
  /** Baseline generation weight. */
  readonly sourceWeight: number;
  /** Baseline attraction weight. */
  readonly sinkWeight: number;
  /** Optional explicit directional time band adjustments. */
  readonly timeBandWeights?: Readonly<Record<TimeBandId, number>>;
  /** Optional non-authoritative provenance metadata. */
  readonly sourceTrace?: Record<string, unknown>;
}

/**
 * Kind of a gateway.
 */
export type { ScenarioDemandGatewayKind };

/**
 * Represents a scenario-owned gateway (bidirectional external/internal exchange point).
 */
export interface ScenarioDemandGateway {
  /** Unique stable identifier. */
  readonly id: string;
  /** Geographic location. */
  readonly position: ScenarioDemandPosition;
  /** Operational mode taxonomy. */
  readonly kind: ScenarioDemandGatewayKind;
  /** Catchment hierarchy tier. */
  readonly scale: ScenarioDemandScale;
  /** Outbound exchange weight. */
  readonly sourceWeight: number;
  /** Inbound exchange weight. */
  readonly sinkWeight: number;
  /** Internal transfer coefficient. */
  readonly transferWeight: number;
  /** Temporal capacity variations. */
  readonly timeBandWeights: Readonly<Record<TimeBandId, number>>;
  /** Optional non-authoritative provenance metadata. */
  readonly sourceTrace?: Record<string, unknown>;
}

/**
 * Kind of source data.
 */
export type { ScenarioDemandSourceKind };

/**
 * Metadata entry for a single source dataset.
 */
export interface ScenarioDemandSourceEntry {
  /** Source material category. */
  readonly sourceKind: ScenarioDemandSourceKind;
  /** Dataset label. */
  readonly label: string;
  /** Optional release date string. */
  readonly sourceDate?: string;
  /** Optional reference year. */
  readonly datasetYear?: number;
  /** Optional licensing reference. */
  readonly licenseHint?: string;
  /** Optional required attribution line. */
  readonly attributionHint?: string;
}

/**
 * Metadata describing the provenance of the demand artifact.
 */
export interface ScenarioDemandSourceMetadata {
  /** Contributing input sources. */
  readonly generatedFrom: readonly ScenarioDemandSourceEntry[];
  /** Generating processor name. */
  readonly generatorName: string;
  /** Generating processor semantic version. */
  readonly generatorVersion: string;
  /** Operator notes. */
  readonly notes?: string;
}

/**
 * Top-level canonical scenario-owned demand artifact.
 */
export interface ScenarioDemandArtifact {
  /** Payload schema validation version. */
  readonly schemaVersion: number;
  /** Scenario primary key mapping. */
  readonly scenarioId: string;
  /** Compilation UTC timestamp. */
  readonly generatedAt: string;
  /** Origin tracking structures. */
  readonly sourceMetadata: ScenarioDemandSourceMetadata;
  /** Source/sink distributions. */
  readonly nodes: readonly ScenarioDemandNode[];
  /** Spatial attractors. */
  readonly attractors: readonly ScenarioDemandAttractor[];
  /** Boundary interfaces. */
  readonly gateways: readonly ScenarioDemandGateway[];
}
