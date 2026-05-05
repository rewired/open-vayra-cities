import json
from pathlib import Path

# Read analysis
analysis = json.loads(Path('.graphify_analysis.json').read_text())
communities = analysis['communities']
extract = json.loads(Path('.graphify_extract.json').read_text())
node_map = {n['id']: n['label'] for n in extract['nodes']}

# Build labels based on community content
labels = {}

# Top communities with clear themes
label_hints = {
    0: "Test Utilities and Line/Demand Projections",
    1: "OSM Stop Candidate Processing",
    2: "Workspace Configuration and Documentation",
    3: "Focused Demand Gap Planning",
    4: "Early ADRs - Workspace and Stop Placement",
    5: "Test Framework Infrastructure",
    6: "Stop Placement and Marker Interaction ADRs",
    7: "Demand Gap GeoJSON and Overlays",
    8: "Routing Adapters and Line Completion",
    9: "Line Overlay and Selection ADRs",
    10: "Scenario Demand Artifact Loading",
    11: "Line Route Segment Domain and Routing ADRs",
    12: "Dev UI and Debug Disclosure ADRs",
    13: "MapLibre Global Contract and Street Snap",
    14: "Demand Node Service Coverage",
    15: "Simulation Clock",
    16: "Network Planning Projections",
    17: "Demand and Line Service Projections",
    18: "Script Test Framework",
    19: "Selected Line Export Validation",
}

for cid, nodes in communities.items():
    cid_int = int(cid)
    if cid_int in label_hints:
        labels[cid_int] = label_hints[cid_int]
    else:
        # Auto-label based on first few node labels
        sample = [node_map.get(n, n)[:40] for n in nodes[:3]]
        # Try to infer a short label
        if any('test' in s.lower() for s in sample):
            labels[cid_int] = f"Test Group {cid_int}"
        elif any('adr' in s.lower() for s in sample):
            labels[cid_int] = f"Architecture Decisions {cid_int}"
        elif any('.ts' in s.lower() for s in sample):
            labels[cid_int] = f"TypeScript Module {cid_int}"
        else:
            labels[cid_int] = f"Community {cid_int}"

# Write labels
Path('.graphify_labels.json').write_text(json.dumps({str(k): v for k, v in labels.items()}))
print(f'Generated {len(labels)} community labels')
