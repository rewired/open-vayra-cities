# ADR 0182: Demand Gap Overlay Visual Softening

## Status

Accepted

## Context

The demand gap overlay implemented in Slice 170 and refined in Slice 174 provided a functional visualization of scenario demand pressure. However, the initial visual presentation was high-intensity, appearing as bright, synthetic "blobs" that felt disconnected from the dark basemap. This high intensity could also be misinterpreted as active passenger flows or emergency alerts rather than aggregate planning pressure.

Slice 181 focuses on softening this presentation to make it read more naturally as planning context.

## Decision

We will tune the MapLibre paint constants and associated UI legend styles to achieve a more restrained, "planning-first" aesthetic.

### Heatmap Tuning
- Reduce `heatmap-opacity` from 0.85 to 0.6 to allow the basemap to show through more clearly.
- Reduce `heatmap-intensity` range (from 2-6 to 1.1-2.6) to soften the "stain" look.
- Subdue the `heatmap-color` ramp, using less saturated colors and lower alpha values (peak opacity 0.6).
- Adjust `heatmap-radius` (30-58) to manage cluster density.

### Gap Circle Tuning
- Subdue semantic colors for uncaptured (`#991b1b`), unserved (`#9a3412`), and unreachable (`#5b21b6`) gaps to use more grounded codes.
- Lower `circle-radius` to 4.
- Lower `circle-opacity` to 0.5 and `circle-stroke-opacity` to 0.55.
- Soften the `circle-stroke-color` from stark white to a semi-transparent white (rgba 0.5).

### Focus and Hint Layer Tuning
- Reduce `circle-stroke-opacity` of the focus ring to 0.65 to avoid it looking like an emergency marker.
- Reduce OD hint `line-width` (1.5) and `line-opacity` (0.5) to ensure they read as subordinate planning hints.

### Legend Alignment
- Update the `DemandMapLegend` swatch colors and opacities to remain truthful to the updated map rendering.

## Consequences

- The demand gap overlay remains functional and data-driven, preserving all semantic distinctions.
- The visual presentation is more integrated with the dark-matter basemap.
- Planning context is clearly distinguished from active network elements (stops, lines, vehicles) by being visually subordinate.
- No changes were made to demand generation, ranking, capture, or simulation logic.
