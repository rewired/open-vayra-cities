import json, re
from pathlib import Path

content = Path(r'C:\Users\rewir\.local\share\opencode\tool-output\tool_df654bf1e0037nAWxk5c7iS6K1').read_text()
# Extract JSON - find first { and last }
start = content.find('{')
end = content.rfind('}') + 1
if start >= 0 and end > start:
    json_str = content[start:end]
    data = json.loads(json_str)
    Path('graphify-out/.graphify_chunk_02.json').write_text(json.dumps(data, indent=2))
    print(f'Written chunk 02: {len(data["nodes"])} nodes, {len(data["edges"])} edges')
else:
    print('No JSON found')
