import json
from pathlib import Path

uncached = Path('.graphify_uncached.txt').read_text().strip().split('\n')
detect = json.loads(Path('.graphify_detect.json').read_text())

# Only non-code files need semantic extraction
code_files = set(detect.get('files', {}).get('code', []))
non_code = [f for f in uncached if f not in code_files and f]

# Write chunk files
chunk_size = 25
chunks = [non_code[i:i+chunk_size] for i in range(0, len(non_code), chunk_size)]
for i, chunk in enumerate(chunks):
    Path(f'.graphify_chunk_list_{i+1}.txt').write_text('\n'.join(chunk))
    
print(f'{len(non_code)} non-code files to extract -> {len(chunks)} chunks')
