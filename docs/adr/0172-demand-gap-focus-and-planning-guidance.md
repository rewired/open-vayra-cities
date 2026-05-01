# ADR 0172: Demand Gap Focus and Planning Guidance

## Context

With the introduction of the demand gap map overlay in Slice 170, players can visually identify areas of underserved demand. However, the connection between the spatial heatmap and the ranked list in the Demand inspector was purely informational. Players needed a way to bridge the gap between "seeing a problem" and "acting on it."

## Decision

We have implemented a "Demand Gap Focus" workflow that allows players to select a specific demand gap from the inspector to highlight it on the map and receive contextual planning guidance.

### 1. Transient UI State
The focused demand gap is managed as ephemeral UI state in the shell (`App.tsx`). This state is separate from the domain simulation state to maintain the "projection-only" architecture of the demand gap system.

- **`focusedDemandGapId`**: Stores the ID of the currently focused gap.
- **`onDemandGapFocus`**: Callback that updates the focused ID and triggers a map camera move to the gap's coordinates.

### 2. Map Visual Highlight
A dedicated, non-interactive circle layer (`MAP_LAYER_ID_DEMAND_GAP_OVERLAY_FOCUS`) is added to the map workspace. 

- **Styling**: It renders as a high-contrast white ring around the focused gap, increasing in size and visibility at higher zoom levels.
- **Layering**: It sits above the base demand gap points but below interactive layers like stops and line markers, ensuring it remains a clear visual indicator without interfering with gameplay actions.
- **Filtering**: The layer uses a GeoJSON property filter `['==', ['get', 'focused'], true]` to ensure only the active target is highlighted.

### 3. Actionable Planning Guidance
To assist players in resolving network gaps, we introduced concise, category-specific guidance text in the Demand inspector.

- **Uncaptured residential**: Encourages stop placement.
- **Captured but unserved**: Encourages connecting existing stops to destinations.
- **Unreachable workplace**: Encourages improving service reachability from residential areas.

The guidance is only visible when a gap is focused, reducing visual clutter in the default list view.

### 4. Selection Lifecycle
To ensure the focus highlight doesn't become a permanent "stain" on the map, the focus is automatically cleared when:
- The player selects a different entity (stop or line).
- The player selects another demand gap (updates the focus).
- (Optional) The player closes the Demand disclosure/tab.

## Consequences

- **Improved Playability**: Players can now quickly navigate to problem areas identified by the projection.
- **Educational Value**: The guidance text helps new players understand the relationship between stop placement, connectivity, and demand satisfaction.
- **Architectural Integrity**: The implementation remains strictly in the UI/Projection layer, requiring no changes to the core simulation or domain data models.
