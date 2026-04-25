# ADR 0114: Explicit Line Topology and Service Pattern Semantics

## Context

Bus lines in the CityOps MVP were previously assumed to be simple linear paths with one-way service. To support more diverse transit networks, players need to be able to define closed loop lines and bidirectional service.

## Decision

We will add explicit topology and service pattern fields to the `Line` domain model.

*   **LineTopology**: `'linear' | 'loop'`
    *   `linear`: The line has a distinct start and end stop.
    *   `loop`: The line connects the last stop back to the first stop, forming a closed circuit.
*   **LineServicePattern**: `'one-way' | 'bidirectional'`
    *   `one-way`: Vehicles traverse the route segments only in the forward direction.
    *   `bidirectional`: Vehicles traverse the route segments in both forward and independently-routed reverse directions.

### Routing Semantics

*   **Loop Closure**: For `loop` topology, an additional route segment is computed from the final stop in the sequence back to the first stop.
*   **Independent Reverse Routing**: For `bidirectional` service, reverse route segments are computed by calling the routing adapter with the reversed stop sequence. This ensures that one-way street constraints and turn restrictions are respected, as the reverse path may differ from the forward geometry.

### UX Flow

Players are presented with a "Complete Line" dialog when finishing a draft line. This dialog allows them to choose the topology and service pattern before the line is committed to the session.

## Rationale

*   **Explicit Truth**: Storing topology and service pattern explicitly in the domain model avoids brittle inferences based on stop repetition.
*   **Realistic Constraints**: Independent reverse routing is necessary for bus simulations in urban environments where one-way streets are common.
*   **Forward Compatibility**: This structure provides the foundation for future features like multi-pattern lines or different transport modes.

## Consequences

*   **Positive**: Players can now build loops and "back-and-forth" bus lines.
*   **Positive**: Routing remains truthful to real-world street constraints.
*   **Neutral**: The `Line` model and export schema version have been updated (`v3`).
*   **Negative**: Slight increase in routing complexity and potential for asynchronous failures in both directions.
