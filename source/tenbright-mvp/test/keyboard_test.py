"""Keyboard only (release audit, Nov 26, 2026): a grown-up sets up and a child practises with Tab, Space, Enter and digit
keys alone, on the release page; every focused control shows a visible focus ring.
Run after build: python3 test/keyboard_test.py"""
import pathlib
from playwright.sync_api import sync_playwright
ROOT = pathlib.Path(__file__).resolve().parent.parent
URL = (ROOT / 'dist' / 'index.html').as_uri()
errors, noring = [], []

def tab_to(pg, match, limit=60, back=False):
    for _ in range(limit):
        pg.keyboard.press('Shift+Tab' if back else 'Tab')
        info = pg.evaluate("""() => { const el = document.activeElement; if (!el || el === document.body) return null;
          const cs = getComputedStyle(el), ring = (cs.outlineStyle !== 'none' && parseFloat(cs.outlineWidth) > 0) || (cs.boxShadow && cs.boxShadow !== 'none');
          return { t: (el.getAttribute('aria-label') || el.innerText || el.value || el.id || el.tagName).trim().slice(0, 50), id: el.id, ring }; }""")
        if not info: continue
        if not info['ring']: noring.append(info['t'])
        if match(info): return info
    raise AssertionError('could not reach by keyboard: ' + str(match))

with sync_playwright() as p:
    b = p.chromium.launch(executable_path='/usr/bin/google-chrome', args=['--no-sandbox'])
    ctx = b.new_context(viewport={'width': 1100, 'height': 900}, reduced_motion='reduce'); pg = ctx.new_page()
    pg.on('pageerror', lambda e: errors.append(str(e)))
    pg.goto(URL); pg.evaluate('localStorage.clear()'); pg.reload()
    tab_to(pg, lambda i: 'Set up as a parent' in i['t']); pg.keyboard.press('Enter')
    pg.keyboard.type('1980'); pg.keyboard.press('Enter')
    tab_to(pg, lambda i: i['id'] == 'c-guardian'); pg.keyboard.press('Space')
    tab_to(pg, lambda i: i['id'] == 'c-record'); pg.keyboard.press('Space')
    tab_to(pg, lambda i: i['id'] == 'pin'); pg.keyboard.type('2580')
    tab_to(pg, lambda i: 'Agree and continue' in i['t']); pg.keyboard.press('Enter')
    tab_to(pg, lambda i: i['id'] == 'nick'); pg.keyboard.type('Kai')
    tab_to(pg, lambda i: i['id'] == 'pic-lock')
    if pg.evaluate("() => document.activeElement.checked"): pg.keyboard.press('Space')
    tab_to(pg, lambda i: i['t'] == 'Add child'); pg.keyboard.press('Enter')
    assert 'Kai' in pg.locator('main').inner_text(), pg.locator('main').inner_text()[:200]
    # the child: choose the profile, then go on until a question with a number pad appears
    tab_to(pg, lambda i: 'Kai' in i['t']); pg.keyboard.press('Enter')
    for _ in range(12):
        if pg.locator('.pad').count() or pg.locator('.choices').count(): break
        pg.wait_for_timeout(150)
        info = tab_to(pg, lambda i: True)
        btn = pg.evaluate("() => { const el = document.activeElement; return el && el.tagName === 'BUTTON' ? el.innerText : '' }")
        if any(w in btn for w in ['Start', "Let's", 'Next', 'Begin', 'Play', 'Go', 'Keep going']): pg.keyboard.press('Enter')
    assert pg.locator('.pad').count() or pg.locator('.choices').count(), pg.locator('main').inner_text()[:300]
    if pg.locator('.pad').count():
        pg.keyboard.type('7')
        print('typed entry:', pg.locator('.entry').first.inner_text())
        tab_to(pg, lambda i: i['t'] == 'Check'); pg.keyboard.press('Enter')
    else:
        tab_to(pg, lambda i: True); pg.keyboard.press('Enter'); pg.keyboard.press('Enter')
    pg.wait_for_timeout(300)
    txt = pg.locator('main').inner_text()
    assert pg.locator('.feedback').count() or 'Next' in txt or 'Keep going' in txt or 'clue' in txt.lower(), txt[:400]
    ctx.close(); b.close()
print('controls without a visible focus ring:', sorted(set(noring)) or 'none')
print('errors:', errors or 'none')
assert not errors and not noring
print('keyboard only: ok')
