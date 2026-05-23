import concurrent.futures
import json
import re
import ssl
import sys
from pathlib import Path
from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8', errors='replace')
    sys.stderr.reconfigure(encoding='utf-8', errors='replace')

BASE = Path(__file__).resolve().parent.parent
RECITERS_PATH = BASE / 'src' / 'data' / 'reciters.ts'

text = RECITERS_PATH.read_text(encoding='utf-8')
m = re.search(r'export const RECITERS: Reciter\[\] = (\[.*\]);', text, re.S)
if not m:
    raise RuntimeError('Could not parse reciters.ts')
reciters = json.loads(m.group(1))

ssl._create_default_https_context = ssl._create_unverified_context

KNOWN_SERVER_PREFIXES = [f'server{i}' for i in range(1, 17)]

EVERYAYAH_HOSTS = [
    'https://everyayah.com',
    'https://www.everyayah.com',
]

MP3QURAN_HOSTS = ['mp3quran.net', 'www.mp3quran.net']

HEADERS = {
    'User-Agent': 'Mozilla/5.0',
    'Range': 'bytes=0-0'
}

TIMEOUT_SECONDS = 12
MAX_WORKERS = 20


def check_url(url):
    req = Request(url, method='HEAD', headers=HEADERS)
    try:
        with urlopen(req, timeout=TIMEOUT_SECONDS) as r:
            return r.status
    except HTTPError as e:
        if e.code in (405, 501, 400, 403):
            try:
                req_get = Request(url, method='GET', headers=HEADERS)
                with urlopen(req_get, timeout=TIMEOUT_SECONDS) as r2:
                    return r2.status
            except (HTTPError, URLError) as e2:
                return getattr(e2, 'code', f'URLERR({e2.reason})')
        return e.code
    except URLError as e:
        return f'URLERR({e.reason})'


def pad(n):
    return str(n).zfill(3)


def everyayah_url(folder, surah=1, ayah=1):
    slug = f'{pad(surah)}{pad(ayah)}'
    return f'https://everyayah.com/data/{folder}/{slug}.mp3'


def mp3quran_url(server, surah=1):
    return f'https://{server}/{pad(surah)}.mp3'


def is_success_status(status):
    return status in (200, 206)


def title_variant(value):
    words = re.split(r'[_\-]+', value)
    return '_'.join(word.capitalize() for word in words if word)


def normalize_name_variants(value):
    if not value:
        return []
    value = value.strip()
    variants = {value}
    variants.add(title_variant(value))
    variants.add(value.replace('_', '-'))
    variants.add(value.replace('-', '_'))
    variants.add(value.replace('_', ''))
    variants.add(value.replace('-', ''))
    variants.add(value.replace('_', ' ').replace('-', ' '))
    return [v for v in variants if v]


def everyayah_candidate_folders(reciter):
    candidates = []
    if reciter.get('everyAyahFolder'):
        candidates.append(reciter['everyAyahFolder'])

    for base in (reciter.get('folder'), reciter.get('id')):
        if not base:
            continue
        base = base.strip()
        if not base:
            continue
        if base not in candidates:
            candidates.append(base)
        title = title_variant(base)
        if title not in candidates:
            candidates.append(title)
        for suffix in ('_64kbps', '_128kbps', '_192kbps', '_40kbps'):
            for candidate in (base + suffix, title + suffix):
                if candidate not in candidates:
                    candidates.append(candidate)

    return candidates


def normalize_mp3quran_server(server):
    server_path = server.strip()
    if server_path.startswith('https://'):
        server_path = server_path[len('https://'):]
    elif server_path.startswith('http://'):
        server_path = server_path[len('http://'):]
    return server_path.rstrip('/')


def get_mp3quran_fallbacks(mp3quran_server):
    server_path = normalize_mp3quran_server(mp3quran_server)
    if '/' not in server_path:
        return []
    current_prefix, folder = server_path.split('/', 1)
    if current_prefix.endswith('.mp3quran.net'):
        current_prefix = current_prefix[:-len('.mp3quran.net')]
    return [
        (prefix, mp3quran_url(f'{prefix}.mp3quran.net/{folder}'))
        for prefix in KNOWN_SERVER_PREFIXES
        if prefix != current_prefix
    ]


def get_mp3quran_variants(reciter):
    variants = []
    server_path = normalize_mp3quran_server(reciter['mp3quranServer'])
    if not server_path:
        return variants

    server_prefix = server_path.split('/')[0]
    path_suffix = server_path[len(server_prefix) + 1:] if '/' in server_path else None

    # Primary server path
    variants.append(('mp3quran', server_path, f'https://{server_path}/{pad(1)}.mp3'))

    # Try folder/id variants on the current and common mp3quran hosts
    candidate_folders = set()
    for value in (reciter.get('folder'), reciter.get('id')):
        if not value:
            continue
        value = value.strip()
        if not value:
            continue
        candidate_folders.add(value)
        candidate_folders.add(title_variant(value))
        candidate_folders.add(value.replace('_', '-'))
        candidate_folders.add(value.replace('-', '_'))
    candidate_folders = [v for v in candidate_folders if v]

    for folder in candidate_folders:
        variants.append(('mp3quran', server_prefix, f'https://{server_prefix}/{folder}/{pad(1)}.mp3'))
        for host in MP3QURAN_HOSTS:
            variants.append(('mp3quran-alt', host, f'https://{host}/{folder}/{pad(1)}.mp3'))

    if path_suffix:
        variants.append(('mp3quran', server_prefix, f'https://{server_prefix}/{path_suffix}/{pad(1)}.mp3'))

    # Try fallback server prefixes with the same folder paths
    for prefix in KNOWN_SERVER_PREFIXES:
        if prefix == server_prefix:
            continue
        fallback_host = f'{prefix}.mp3quran.net'
        if path_suffix:
            variants.append(('mp3quran-fallback', prefix, f'https://{fallback_host}/{path_suffix}/{pad(1)}.mp3'))
        for folder in candidate_folders:
            variants.append(('mp3quran-fallback', prefix, f'https://{fallback_host}/{folder}/{pad(1)}.mp3'))

    # Deduplicate while preserving order
    seen = set()
    deduped = []
    for typ, server, url in variants:
        if url in seen:
            continue
        seen.add(url)
        deduped.append((typ, server, url))
    return deduped


def get_reciter_candidates(reciter):
    candidates = []
    if reciter.get('everyAyahFolder') or reciter.get('folder') or reciter.get('id'):
        for folder in everyayah_candidate_folders(reciter):
            candidates.append({'type': 'everyayah', 'url': everyayah_url(folder), 'folder': folder})

    if reciter.get('mp3quranServer'):
        for typ, server, url in get_mp3quran_variants(reciter):
            candidates.append({'type': typ, 'server': server, 'url': url})

    return candidates


def check_candidate(candidate):
    url = candidate['url']
    return {**candidate, 'status': check_url(url)}


def main():
    with concurrent.futures.ThreadPoolExecutor(max_workers=MAX_WORKERS) as executor:
        future_to_reciter = {}
        for reciter in reciters:
            candidates = get_reciter_candidates(reciter)
            futures = [executor.submit(check_candidate, c) for c in candidates]
            future_to_reciter.update({f: (reciter, c) for f, c in zip(futures, candidates)})

        results = []
        for fut in concurrent.futures.as_completed(future_to_reciter):
            reciter, candidate = future_to_reciter[fut]
            status = fut.result()
            reciter.setdefault('__sources', []).append(status)

    for reciter in reciters:
        sources = reciter.pop('__sources', [])
        preferred = 'none'
        if any(s['type'] == 'everyayah' and is_success_status(s['status']) for s in sources):
            preferred = 'everyayah'
        elif any(s['type'] == 'mp3quran' and is_success_status(s['status']) for s in sources):
            preferred = 'mp3quran'
        elif any(s['type'] == 'mp3quran-alt' and is_success_status(s['status']) for s in sources):
            preferred = 'mp3quran-alt'
        else:
            fallback_ok = next((s for s in sources if s['type'] == 'mp3quran-fallback' and is_success_status(s['status'])), None)
            if fallback_ok:
                preferred = f"mp3quran:{fallback_ok['server']}"

        results.append({
            'id': reciter['id'],
            'name': reciter['name'],
            'everyAyahFolder': reciter.get('everyAyahFolder'),
            'mp3quranServer': reciter.get('mp3quranServer'),
            'preferredSource': preferred,
            'sources': sources,
        })

    working = [r for r in results if r['preferredSource'] != 'none']
    failed = [r for r in results if r['preferredSource'] == 'none']

    print('total', len(results), 'working', len(working), 'failed', len(failed))
    print('\nfirst 30 working reciters:')
    for row in working[:30]:
        print(row['id'], row['name'], row['preferredSource'])

    print('\nfirst 30 failed reciters:')
    for row in failed[:30]:
        print(row['id'], row['name'], 'everyAyah=', bool(row['everyAyahFolder']), 'mp3quran=', row['mp3quranServer'])

    report = BASE / 'scratch' / 'validate_reciters_sources_report.json'
    report.write_text(json.dumps(results, ensure_ascii=False, indent=2), encoding='utf-8')
    print('\nReport written to', report)


if __name__ == '__main__':
    main()
