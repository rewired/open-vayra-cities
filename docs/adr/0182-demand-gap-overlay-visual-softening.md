# ADR 0182: Demand Gap Overlay Visual Softening

## Status

Accepted

## Context

The demand gap overlay implemented in Slice 170 and refined in Slice 174 provided a functional visualization of scenario demand pressure. However, the initial visual presentation was high-intensity, appearing as bright, synthetic "blobs" that felt disconnected from the dark basemap. This high intensity could also be misinterpreted as active passenger flows or emergency alerts rather than aggregate planning pressure.

Slice 181 focuses on softening this presentation to make it read more naturally as planning context.

## Decision

We will tune the MapLibre paint constants and associated UI legend styles to achieve a more restrained, "planning-first" aesthetic.

### Heatmap Tuning
- Reduce `heatmap-opacity` from 0.85 to 0.7 to allow the basemap to show through more clearly.
- Reduce `heatmap-intensity` range (from 2-6 to 1-4) to soften the "stain" look.
- Subdue the `heatmap-color` ramp, using less saturated colors and darker peak values.
- Increase `heatmap-radius` at low zooms to avoid overly sharp clusters.

### Gap Circle Tuning
- Subdue semantic colors for uncaptured (red), unserved (orange), and unreachable (purple) gaps to use less bright, more grounded hex codes.
- Lower `circle-opacity` and `circle-stroke-opacity` to 0.6.
- Soften the `circle-stroke-color` from stark white to a semi-transparent white (rgba 0.5).

### Focus and Hint Layer Tuning
- Reduce `circle-stroke-opacity` of the focus ring to 0.7 to avoid it looking like an emergency marker.
- Reduce OD hint `line-width` (1.5) and `line-opacity` (0.5) to ensure they read as subordinate planning hints.

### Legend Alignment
- Update the `DemandMapLegend` swatch colors and opacities to remain truthful to the updated map rendering.

## Consequences

- The demand gap overlay remains functional and data-driven, preserving all semantic distinctions.
- The visual presentation is more integrated with the dark-matter basemap.
- Planning context is clearly distinguished from active network elements (stops, lines, vehicles) by being visually subordinate.
- No changes were made to demand generation, ranking, capture, or simulation logic.
