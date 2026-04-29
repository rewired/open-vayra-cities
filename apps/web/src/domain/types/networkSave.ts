/**
 * Canonical schema identifier for CityOps network save files.
 */
export const NETWORK_SAVE_SCHEMA = 'openvayra-cities.network-save' as const;

/**
 * Current supported schema version for the network save envelope.
 */
export const NETWORK_SAVE_SCHEMA_VERSION = 1 as const;

/**
 * Canonical application metadata for the export envelope.
 */
export interface NetworkSaveAppMetadata {
  readonly name: 'CityOps';
  /** Optional build identifier or version string. */
  readonly build?: string;
}

/**
 * Generic envelope for CityOps network saves, carrying schema metadata and a typed payload.
 */
export interface NetworkSaveEnvelope<TPayload = unknown> {
  /** Explicit schema identity. */
  readonly schema: typeof NETWORK_SAVE_SCHEMA;
  /** Explicit schema version. */
  readonly schemaVersion: typeof NETWORK_SAVE_SCHEMA_VERSION;
  /** ISO UTC timestamp of when the file was exported. */
  readonly exportedAt: string;
  /** Application metadata for traceability. */
  readonly app: NetworkSaveAppMetadata;
  /** The actual domain payload (e.g. selected line data). */
  readonly payload: TPayload;
}
