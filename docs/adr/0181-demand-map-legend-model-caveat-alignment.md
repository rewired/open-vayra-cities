# ADR 0181: Demand Map Legend Model-Caveat Alignment

## Status

Accepted

## Context

The map demand overlays (heatmap and OD hints) in OpenVayra - Cities provide critical spatial guidance. However, their visual presentation can be misinterpreted as precise, real-world observed demand or exact passenger flows. 

After Slice 180, we aligned the Inspector UI with the truth that demand is generated scenario demand. The map legend must now reflect this same truth to avoid visual misinformation and manage player expectations regarding simulation fidelity.

## Decision

We will align the map legend and overlay copy with the generated scenario-demand reality.

1.  **Refactor Legend**: The `DemandGapLegend` is refactored into a `DemandMapLegend` that handles both demand gaps and OD context hints.
2.  **Explicit Caveat**: The legend will include a mandatory, compact caveat: `Generated scenario demand. Planning context only.`
3.  **Bottom Placement**: The legend is positioned at the bottom-left of the map to separate interpretation from the map layer flyout controls (top-right).
4.  **Non-Claim Wording**: All player-facing copy in the legend and map layer flyout will avoid precision claims such as "actual demand", "real flow", or "true OD". Instead, it will use terms like "Demand gap pressure" and "Straight planning hints".
5.  **Context-Aware Rendering**: The legend will dynamically show sections based on which demand layers are currently visible (`demand-gap-overlay` or `demand-gap-od-context`).
6.  **Visual Integrity**: OD hints will be explicitly labeled as "Straight planning hints" to reinforce that they are not routed geometries or playable bus lines.

## Consequences

*   **Honest Visualization**: Players receive clear guidance that the overlays are heuristic planning aids derived from the demand model, not high-fidelity traffic simulations.
*   **Reduced Scope Drift**: By explicitly framing OD hints as "straight planning hints", we reinforce the non-routed nature of the current MVP data, preventing accidental pressure to implement complex passenger routing at this stage.
*   **UI Consistency**: The map legend now matches the tone and disclosures of the Inspector Demand tab.
