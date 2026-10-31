"""Check the explicitly curated public showcase files before publishing changes."""
import hashlib
import ipaddress
from pathlib import Path
import re
import subprocess
import sys
ROOT = Path(__file__).resolve().parents[1]
ALLOWED = set((ROOT / 'public-files.txt').read_text(encoding='utf-8').splitlines())
TOKENS = re.compile(rb'(?:github_pat_[A-Za-z0-9_]{20,}|gh[pousr]_[A-Za-z0-9_]{20,}|sk-[A-Za-z0-9_-]{16,}|AKIA[0-9A-Z]{16}|-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----)')
IPS = re.compile(rb'(?<![\d.])(?:\d{1,3}\.){3}\d{1,3}(?![\d.])')
PERSONAL = re.compile(rb'(?:[A-Za-z]:[\\/](?:Users|Documents|01 documents)[\\/][^\s"<>]+|/' + rb'Users/[^/\s]+|/' + rb'home/(?!runner\b|gradle\b)[^/\s]+)')
WRAPPER_HASH = '497c8c2a7e5031f6aa847f88104aa80a93532ec32ee17bdb8d1d2f67a194a9c7'
def check():
    tracked = set(x.decode('utf-8') for x in subprocess.check_output(['git', '-C', str(ROOT), 'ls-files', '-z']).split(b'\0') if x)
    errors = [f'Unreviewed public file: {x}' for x in sorted(tracked - ALLOWED)]
    errors += [f'Missing curated file: {x}' for x in sorted(ALLOWED - tracked)]
    for name in sorted(tracked):
        file = ROOT / name
        if file.is_symlink():
            errors.append(f'Symlink not allowed: {name}')
            continue
        data = file.read_bytes()
        if name.endswith('.jar'):
            if name != 'gradle/wrapper/gradle-wrapper.jar' or hashlib.sha256(data).hexdigest() != WRAPPER_HASH:
                errors.append(f'Unreviewed binary: {name}')
            continue
        if TOKENS.search(data): errors.append(f'Credential marker in {name}')
        if PERSONAL.search(data): errors.append(f'Personal path in {name}')
        for match in IPS.finditer(data):
            try: address = ipaddress.ip_address(match.group().decode())
            except ValueError: continue
            if not address.is_loopback and not address.is_unspecified:
                errors.append(f'External/deployment IP in {name}')
    if errors:
        print('\n'.join(errors), file=sys.stderr)
        return 1
    print(f'Public boundary OK: {len(tracked)} curated files; no credential markers or deployment paths')
    return 0
if __name__ == '__main__':
    raise SystemExit(check())
