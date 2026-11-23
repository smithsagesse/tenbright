"""Build Tenbright and run every test suite. Exits non-zero if anything fails.

Usage (from source/tenbright-mvp):  python3 test/run_all.py
Set QUICK=1 to run only the build and the math engine checks (no browser needed).
A suite fails if it exits non-zero, or if it reports page errors or any outside network request.
"""
import os, re, subprocess, sys, pathlib, time

ROOT = pathlib.Path(__file__).resolve().parent.parent
SUITES = [
    ['node', 'build.js'],
    ['node', 'test/engine.test.js'],
]
if not os.environ.get('QUICK'):
    SUITES += [[sys.executable, 'test/' + t] for t in ('e2e.py', 'features_test.py', 'audio_test.py', 'living_test.py', 'separation_test.py', 'i18n_test.py')]

LINE = re.compile(r'^\s*((?:page\s+)?errors?\b|outside\b[^:\n]*\brequests?\b)[^:\n]*:\s*(.*)$', re.I)
OK = ('none', '0', '[]', '{}')

def problem(out):
    """The first reported page error or outside request, or a Python traceback."""
    for line in out.splitlines():
        if line.startswith('Traceback '): return 'Python error'
        m = LINE.match(line)
        if m and m.group(2).strip().split(' ')[0].lower() not in OK: return line.strip()[:200]
    return None

failed = []
for cmd in SUITES:
    name = ' '.join(cmd[1:] if cmd[0] == sys.executable else cmd)
    t0 = time.time()
    print(f'\n=== {name}', flush=True)
    p = subprocess.run(cmd, cwd=ROOT, capture_output=True, text=True)
    out = p.stdout + p.stderr
    print(out[-4000:], flush=True)
    why = 'exit code %d' % p.returncode if p.returncode else problem(out)
    print(f'--- {name}: {"FAILED (" + why + ")" if why else "passed"} in {time.time() - t0:.0f}s', flush=True)
    if why:
        failed.append(name)
        if name == 'build.js':
            break

print('\nRESULT:', 'all passed' if not failed else 'failed: ' + ', '.join(failed))
sys.exit(1 if failed else 0)
