import json
import re
import ssl
from pathlib import Path
from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen

BASE = Path(__file__).resolve().parent.parent
RECITERS_PATH = BASE / 'src' / 'data' / 'reciters.ts'

text = RECITERS_PATH.read_text(encoding='utf-8')
m = re.search(r'export const RECITERS: Reciter\[] = (\[.*\]);', text, re.S)
if not m:
    raise RuntimeError('Could not parse reciters.ts')
reciters = json.loads(m.group(1))

ssl._create_default_https_context = ssl._create_unverified_context


def head_status(url):
    req = Request(url, method='HEAD', headers={'User-Agent': 'Mozilla/5.0'})
    try:
        with urlopen(req, timeout=20) as r:
            return r.status
    except HTTPError as e:
        return e.code
    except URLError as e:
        return f'URLERR({e.reason})'


results = []
for r in reciters:
    url = f'https://{r["mp3quranServer"]}/{str(1).zfill(3)}.mp3'
    status = head_status(url)
    results.append((r['id'], r['name'], r['mp3quranServer'], url, status))

working = [row for row in results if row[4] == 200]
failed = [row for row in results if row[4] != 200]

print('total', len(results), 'working', len(working), 'failed', len(failed))
print('\nWorking reciters:')
for row in working:
    print(row[0], row[1], row[2], row[4])

print('\nFailed reciters:')
for row in failed[:30]:
    print(row[0], row[1], row[2], row[4])

# Save to a small JSON report file for later review
import pathlib
report = BASE / 'scratch' / 'validate_reciters_audio_report.json'
report.write_text(json.dumps({'working': working, 'failed': failed}, ensure_ascii=False, indent=2), encoding='utf-8')
print('\nReport written to', report)
