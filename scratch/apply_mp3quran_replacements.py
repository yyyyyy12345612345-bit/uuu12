import json
import re
from pathlib import Path

BASE = Path(__file__).resolve().parent.parent
RECITERS_PATH = BASE / 'src' / 'data' / 'reciters.ts'
MAPPING_PATH = BASE / 'scratch' / 'mp3quran_invalid_current_replacements.json'

reciters_text = RECITERS_PATH.read_text(encoding='utf-8')
match = re.search(r'export const RECITERS: Reciter\[\] = (\[.*\]);', reciters_text, re.S)
if not match:
    raise RuntimeError('Could not parse src/data/reciters.ts')
reciters = json.loads(match.group(1))

mapping = json.loads(MAPPING_PATH.read_text(encoding='utf-8'))
new_values = {item['id']: f"{item['best_host']}/{item['best_folder']}" for item in mapping}

updated = 0
for rec in reciters:
    rec_id = rec['id']
    if rec_id in new_values:
        old_val = rec.get('mp3quranServer')
        new_val = new_values[rec_id]
        if old_val != new_val:
            rec['mp3quranServer'] = new_val
            updated += 1

new_array = json.dumps(reciters, ensure_ascii=False, indent=2)
new_content = reciters_text[:match.start(1)] + new_array + reciters_text[match.end(1):]
RECITERS_PATH.write_text(new_content, encoding='utf-8')
print(f'Updated {updated} reciters in {RECITERS_PATH}')
