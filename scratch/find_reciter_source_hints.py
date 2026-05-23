import json
import re
import ssl
import urllib.error
import urllib.request
from difflib import SequenceMatcher
from pathlib import Path

ssl._create_default_https_context = ssl._create_unverified_context
BASE = Path(__file__).resolve().parent.parent
RECITERS_PATH = BASE / 'src' / 'data' / 'reciters.ts'
reciters_text = RECITERS_PATH.read_text(encoding='utf-8')
reciters = json.loads(re.search(r'export const RECITERS: Reciter\[\] = (\[.*\]);', reciters_text, re.S).group(1))

hosts = [f'server{i}.mp3quran.net' for i in range(1, 17)]
mp3dirs = {}
for host in hosts:
    try:
        html = urllib.request.urlopen(urllib.request.Request(f'https://{host}/', headers={'User-Agent': 'Mozilla/5.0'}), timeout=10).read().decode('utf-8', errors='ignore')
        dirs = [d.rstrip('/') for d in re.findall(r'href="([^"/]+/?)"', html) if d != '../' and not d.endswith('.php') and not d.endswith('.sh') and not d.endswith('.txt')]
        mp3dirs[host] = sorted(set(d for d in dirs if d and '/' not in d))
    except Exception as exc:
        print(f'{host} error: {exc}')

all_mp3_dirs = sorted({d for dirs in mp3dirs.values() for d in dirs})

every_dirs = []
try:
    html = urllib.request.urlopen(urllib.request.Request('https://everyayah.com/data/', headers={'User-Agent': 'Mozilla/5.0'}), timeout=10).read().decode('utf-8', errors='ignore')
    every_dirs = [m.group(1).strip('/') for m in re.finditer(r'href="(/data/[^"/]+/)"', html)]
    every_dirs = sorted(set(every_dirs))
except Exception as exc:
    print('everyayah error:', exc)

print('mp3 hosts', len(mp3dirs), 'unique mp3 dirs', len(all_mp3_dirs), 'everyayah dirs', len(every_dirs))


def normalize(value):
    if not value:
        return ''
    return ''.join(ch for ch in value.lower() if ch.isalnum())


def score(a, b):
    a_norm = normalize(a)
    b_norm = normalize(b)
    if not a_norm or not b_norm:
        return 0.0
    return SequenceMatcher(None, a_norm, b_norm).ratio()


def check_url(url):
    req = urllib.request.Request(url, method='HEAD', headers={'User-Agent': 'Mozilla/5.0', 'Range': 'bytes=0-0'})
    try:
        with urllib.request.urlopen(req, timeout=12) as r:
            return r.status
    except urllib.error.HTTPError as e:
        return e.code
    except Exception as exc:
        return type(exc).__name__


candidates = []
for rec in reciters:
    current_mp3 = rec.get('mp3quranServer')
    best_mp3 = []
    for d in all_mp3_dirs:
        best_score = max(score(rec.get('id', ''), d), score(rec.get('folder', ''), d), score(rec.get('name', ''), d))
        best_mp3.append((best_score, d))
    best_mp3 = sorted(best_mp3, key=lambda x: (-x[0], x[1]))[:10]
    best_every = []
    for d in every_dirs:
        best_score = max(score(rec.get('id', ''), d), score(rec.get('folder', ''), d), score(rec.get('name', ''), d))
        best_every.append((best_score, d))
    best_every = sorted(best_every, key=lambda x: (-x[0], x[1]))[:8]
    candidates.append({'id': rec['id'], 'name': rec['name'], 'current_mp3': current_mp3, 'best_mp3': best_mp3, 'best_every': best_every})

for rec in candidates:
    rec['mp3_results'] = []
    for score_val, folder in rec['best_mp3']:
        if score_val < 0.35:
            continue
        for host, dirs in mp3dirs.items():
            if folder not in dirs:
                continue
            url = f'https://{host}/{folder}/001.mp3'
            status = check_url(url)
            rec['mp3_results'].append({'folder': folder, 'host': host, 'score': score_val, 'status': status, 'url': url})
    rec['every_results'] = []
    for score_val, folder in rec['best_every']:
        if score_val < 0.35:
            continue
        url = f'https://everyayah.com/data/{folder}/001001.mp3'
        status = check_url(url)
        rec['every_results'].append({'folder': folder, 'score': score_val, 'status': status, 'url': url})

output = BASE / 'scratch' / 'reciter_source_hints.json'
output.write_text(json.dumps(candidates, ensure_ascii=False, indent=2), encoding='utf-8')
print('wrote', len(candidates), 'reciters to', output)
