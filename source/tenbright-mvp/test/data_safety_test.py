"""Data safety (release audit, Nov 26, 2026): unreadable saved data is kept aside and never overwritten; a second open
tab stops saving once another tab saves (or erases everything) and offers a reload; a failed save is shown to the
grown-ups; the page has its own doctype and phone viewport (no quirks mode, no 980 px layout on phones).
Run after build: python3 test/data_safety_test.py"""
import pathlib, json
from playwright.sync_api import sync_playwright
ROOT = pathlib.Path(__file__).resolve().parent.parent
URL = (ROOT / 'dist' / 'test.html').as_uri() + '#selftest'
REL = (ROOT / 'dist' / 'index.html').as_uri()
KEY = 'tenbright-mvp-v1'
errors = []

def setup(pg):
    pg.goto(URL); pg.evaluate('localStorage.clear()'); pg.reload()
    pg.get_by_text('Set up as a parent').click(); pg.fill('#gate-year', '1980'); pg.get_by_role('button', name='Continue').click()
    pg.check('#c-guardian'); pg.check('#c-record'); pg.fill('#pin', '2580'); pg.get_by_role('button', name='Agree and continue').click()
    pg.fill('#nick', 'Ana'); pg.select_option('#sgrade', '2'); pg.uncheck('#pic-lock'); pg.get_by_role('button', name='Add child').click()

with sync_playwright() as p:
    b = p.chromium.launch(executable_path='/usr/bin/google-chrome', args=['--no-sandbox'])
    # 1. unreadable data is kept aside, the app starts fresh and tells the grown-ups
    ctx = b.new_context(); pg = ctx.new_page(); pg.on('pageerror', lambda e: errors.append(str(e)))
    pg.goto(URL); pg.evaluate(f"localStorage.setItem('{KEY}', '{{\"children\": [broken')"); pg.reload()
    kept = pg.evaluate(f"() => Object.keys(localStorage).filter((k) => k.startsWith('{KEY}-unreadable-')).map((k) => localStorage.getItem(k))")
    assert kept == ['{"children": [broken'], kept
    assert 'Set up as a parent' in pg.locator('main').inner_text()
    pg.get_by_text('Set up as a parent').click(); pg.fill('#gate-year', '1980'); pg.get_by_role('button', name='Continue').click()
    pg.check('#c-guardian'); pg.check('#c-record'); pg.fill('#pin', '2580'); pg.get_by_role('button', name='Agree and continue').click()
    pg.fill('#nick', 'Ana'); pg.uncheck('#pic-lock'); pg.get_by_role('button', name='Add child').click()
    pg.evaluate("() => window.__tbView('dashboard')")
    assert 'saved data could not be read' in pg.locator('main').inner_text().lower()
    assert pg.evaluate(f"() => localStorage.getItem(Object.keys(localStorage).find((k) => k.startsWith('{KEY}-unreadable-')))") == '{"children": [broken'
    # a record with the wrong shape is treated the same way (no crash)
    pg.evaluate(f"localStorage.clear(); localStorage.setItem('{KEY}', JSON.stringify({{children: [{{nickname: 'x'}}]}}))"); pg.reload()
    assert 'Set up as a parent' in pg.locator('main').inner_text()
    ctx.close()
    # 2. two tabs: the second stops saving once the first saves, and offers a reload with the newest progress
    ctx = b.new_context(); a = ctx.new_page(); a.on('pageerror', lambda e: errors.append(str(e)))
    setup(a)
    c = ctx.new_page(); c.on('pageerror', lambda e: errors.append(str(e))); c.goto(URL)
    assert "Who's playing" in c.locator('main').inner_text() or 'Ana' in c.locator('main').inner_text()
    a.evaluate("() => { const ch = window.__tbChild(); ch.nickname = 'Ana2'; }"); a.evaluate("() => window.__tbView('dashboard')")
    a.locator('[data-act="go"][data-to="who"]').click()  # any action that saves
    a.evaluate(f"() => {{ const S = JSON.parse(localStorage.getItem('{KEY}')); S.children[0].nickname = 'Newest'; localStorage.setItem('{KEY}', JSON.stringify(S)); }}")
    c.wait_for_timeout(300)
    # the storage event reaches the other page only for changes made elsewhere: write from page a, check page c
    a.evaluate(f"() => localStorage.setItem('{KEY}', localStorage.getItem('{KEY}').replace('Newest', 'Newest'))")
    a.evaluate(f"() => {{ const S = JSON.parse(localStorage.getItem('{KEY}')); S.children[0].nickname = 'Newer'; localStorage.setItem('{KEY}', JSON.stringify(S)); }}")
    c.wait_for_function("() => document.body.innerText.includes('open in another window')", timeout=5000)
    c.evaluate("() => { try { window.__tbChild().nickname = 'Stale'; } catch (e) {} }")
    c.evaluate("() => window.__tbView('map')")
    assert 'open in another window' in c.locator('main').inner_text(), 'the stale tab keeps its warning'
    assert json.loads(a.evaluate(f"() => localStorage.getItem('{KEY}')"))['children'][0]['nickname'] == 'Newer', 'the stale tab did not overwrite newer progress'
    c.get_by_role('button', name='Reload').click(); c.wait_for_load_state()
    assert 'open in another window' not in c.locator('body').inner_text()
    # erasing everything in one tab also stops the other tab from writing the child back
    d = ctx.new_page(); d.goto(URL)
    a.evaluate('localStorage.clear()')
    d.wait_for_function("() => document.body.innerText.includes('open in another window')", timeout=5000)
    d.evaluate("() => window.__tbView('map')")
    assert a.evaluate(f"() => localStorage.getItem('{KEY}')") is None, 'erased data stays erased'
    ctx.close()
    # 3. a failed save is shown on the grown-ups page
    ctx = b.new_context(); pg = ctx.new_page(); pg.on('pageerror', lambda e: errors.append(str(e)))
    setup(pg)
    pg.evaluate("() => { Storage.prototype._set = Storage.prototype.setItem; Storage.prototype.setItem = function () { throw new DOMException('full', 'QuotaExceededError'); }; }")
    pg.evaluate("() => window.__tbView('dashboard')"); pg.locator('#adv-on').click()
    pg.evaluate("() => window.__tbView('dashboard')")
    assert 'progress is not being saved' in pg.locator('main').inner_text().lower()
    pg.evaluate("() => { Storage.prototype.setItem = Storage.prototype._set; }")
    pg.locator('#adv-on').click(); pg.evaluate("() => window.__tbView('dashboard')")
    assert 'progress is not being saved' not in pg.locator('main').inner_text().lower(), 'the warning clears once saving works again'
    ctx.close()
    # 4. the release page stands on its own: standards mode and a phone-width layout on phones and tablets
    for dev in ['iPhone SE', 'iPhone 13', 'Pixel 7', 'iPad Mini']:
        ctx = b.new_context(**p.devices[dev]); pg = ctx.new_page(); pg.on('pageerror', lambda e: errors.append(str(e)))
        pg.goto(REL)
        r = pg.evaluate("() => ({ mode: document.compatMode, w: innerWidth, sw: screen.width, doc: document.documentElement.scrollWidth, lang: document.documentElement.lang })")
        assert r['mode'] == 'CSS1Compat' and r['w'] == r['sw'] and r['doc'] <= r['w'] + 1 and r['lang'] == 'en', (dev, r)
        ctx.close()
    b.close()
print('errors:', errors or 'none')
assert not errors
print('data safety: ok')
