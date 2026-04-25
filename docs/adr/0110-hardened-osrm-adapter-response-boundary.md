# ADR 0110: Hardened OSRM Adapter Response Boundary

## Status
Accepted

## Context
External routing responses (from a local OSRM instance) are untyped JSON payloads. To ensure domain integrity and prevent runtime errors caused by malformed or unexpected responses, we need a strict validation boundary at the adapter level. The previous implementation relied on partial validation and unchecked TypeScript casts (e.g., `as RouteGeometry`).

## Decision
We will harden the `OsrmAdapter` to strictly validate all incoming data from the OSRM service before it is permitted to enter the domain.

- **Deep Validation**: Every field required by the `ResolvedRouteSegment` contract (distance, duration, geometry) must be checked for existence and type.
- **Coordinate Integrity**: GeoJSON coordinates must be deeply validated to ensure they are finite numeric `[longitude, latitude]` pairs.
- **No Unchecked Casts**: We will remove all `as any` and `as RouteGeometry` casts, instead reconstructing a typed object from validated primitives.
- **Testability via Injection**: The adapter will accept an optional `fetch` implementation. This allows unit tests to mock network responses deterministically without requiring a running Docker container or OSRM service.
- **Centralized Constants**: All OSRM-specific configuration (base URL, profile, overview mode) will be centralized in the domain constants to prevent magic strings and duplication.

## Consequences
- **Improved Stability**: The system will fail gracefully with a typed `RoutingFailure` instead of throwing or passing invalid data downstream if OSRM returns unexpected results.
- **Faster Test Cycles**: Unit tests for routing logic no longer depend on external services or Docker, enabling standard CI/CD workflows.
- **Strict Boundary**: The adapter acts as a true corruption layer, ensuring the rest of the application can trust the routing data it receives.
