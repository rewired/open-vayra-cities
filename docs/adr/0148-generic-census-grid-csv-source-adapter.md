# ADR 0148: Generic Census Grid CSV Source Adapter

## Status
Proposed

## Context
OpenVayra - Cities requires demand patterns generated from external population grid models. To avoid direct ingestion coupling at runtime, source files serve only as generation inputs.

## Decision
Introduce a local CSV adapter dedicated entirely to standardizing population metrics across various formats:

- **Generic approach**: Instead of creating custom logic for Zensus 2022 or Eurostat GEOSTAT files, the adapter processes data based on user-supplied column header configurations.
- **Runtime Isolation**: External formats are not read directly by the simulation engine or UI dashboards. Demand scenarios are pre-compiled beforehand into the engine's uniform JSON schema formats.
- **Scope constraints**: Focuses entirely on data integrity and verification (range parsing, coordinate constraints).
