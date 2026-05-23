import json
import sys
from collections import Counter
from pathlib import Path

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8', errors='replace')
    sys.stderr.reconfigure(encoding='utf-8', errors='replace')

report = Path(__file__).resolve().parent / 'validate_reciters_sources_report.json'
if not report.exists():
    raise FileNotFoundError(report)
results = json.loads(report.read_text(encoding='utf-8'))
working = [r for r in results if r['preferredSource'] != 'none']
failed = [r for r in results if r['preferredSource'] == 'none']

print('total', len(results), 'working', len(working), 'failed', len(failed))
print('source distribution:')
for source, count in sorted(Counter(r['preferredSource'] for r in working).items()):
    print(' ', source, count)

fallback_success = [r for r in results if any(s['type'] == 'mp3quran-fallback' and s['status'] in (200, 206) for s in r['sources'])]
print('fallback-available reciters:', len(fallback_success))

print('\nworking IDs:')
for r in working:
    print(' ', r['id'], r['preferredSource'])

print('\nfailed reciters:')
for r in failed:
    print(' ', r['id'], 'everyAyah=', bool(r.get('everyAyahFolder')), 'mp3quran=', r.get('mp3quranServer'))
