# ADR 0127: Osmium Tooling Container and Workflow

## Status

Accepted

## Context

CityOps needs to preprocess OpenStreetMap (OSM) data to generate stop candidates. This requires `osmium-tool`, a C++ based command-line utility. Installing `osmium-tool` natively on developer machines (especially on Windows) can be inconsistent or complex.

We already use Docker for OSRM routing, so a containerized approach for OSM preprocessing is a natural fit.

## Decision

We will use a dedicated Docker-based tooling container for OSM preprocessing tasks.

1. **Dedicated Image**: We will maintain a minimal `Dockerfile` based on `debian:bookworm-slim` that installs `osmium-tool`.
2. **Separation of Concerns**: The Osmium tooling image will remain separate from the OSRM routing image. OSRM is for routing; Osmium is for preprocessing/filtering.
3. **PowerShell Workflow**: We will provide PowerShell scripts (`setup-osmium-tooling.ps1`, `start-stop-candidate-generation.ps1`) to orchestrate the Docker commands and local Node.js normalization.
4. **Local Artifacts**: Generated candidates will be stored in `apps/web/public/generated/` and ignored by git to keep the repository lean and avoid licensing issues with large data extracts.
5. **Semantic Boundary**: The `normalize-stop-candidates.mjs` script remains the CityOps semantic boundary, converting raw Osmium output into the internal candidate schema.

## Consequences

- **Prerequisite**: Developers must have Docker installed to generate OSM stop candidates.
- **Portability**: The preprocessing workflow is consistent across different host operating systems.
- **No Runtime Dependency**: The web app remains independent of Docker and Osmium at runtime; it only consumes the generated GeoJSON artifacts.
- **Maintenance**: We need to maintain the Dockerfile and workflow scripts as dependencies change.
