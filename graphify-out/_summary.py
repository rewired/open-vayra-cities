import json
from pathlib import Path

result = json.loads(Path('.graphify_detect.json').read_text())
files = result.get('files', {})
print(f"Corpus: {result['total_files']} files ~{result['total_words']:,} words")
for cat, flist in files.items():
    if flist:
        print(f"  {cat}: {len(flist)} files")
if result.get('skipped_sensitive'):
    print(f"  skipped_sensitive: {len(result['skipped_sensitive'])} files")
