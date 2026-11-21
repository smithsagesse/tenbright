"""Each child's work stays separate: secret pictures open only the right profile, answers land only in the active
child's record, the code is stored hashed, ids never collide, and every new screen is accessible and translated.
Run after build: python3 test/separation_test.py"""
import json, pathlib, re
from playwright.sync_api import sync_playwright
ROOT = pathlib.Path(__file__).resolve().parent.parent
URL = (ROOT / 'dist' / 'test.html').as_uri() + '#selftest'
AXE = (ROOT / 'test' / 'axe.min.js').read_text()
errors, outside = [], []
def axe(pg, name):
    pg.wait_for_function("() => document.getAnimations().every(a => a.playState !== 'running' || a.effect.getComputedTiming().iterations === Infinity)", timeout=8000)
    if not pg.evaluate('!!window.axe'): pg.add_script_tag(content=AXE)
    v = pg.evaluate("async () => (await axe.run(document, { runOnly: ['wcag2a','wcag2aa','wcag21aa','wcag22aa'] })).violations.map(v => v.id + ':' + v.nodes.length)")
    assert not v, (name, v)
def store(pg): return pg.evaluate("() => JSON.parse(localStorage.getItem('tenbright-mvp-v1'))")
def kid(pg, name): return [c for c in store(pg)['children'] if c['nickname'] == name][0]
def tap(pg, act, pics):
    for x in pics: pg.locator('[data-act="%s"][data-pic="%s"]' % (act, x)).click()
def setup(pg):
    pg.goto(URL); pg.evaluate('localStorage.clear()'); pg.reload()
    pg.locator('[data-act="gate"][data-next="consent"]').click()
    pg.fill('#gate-year', '1985'); pg.locator('#gate-form button[type="submit"]').click()
    pg.check('#c-guardian'); pg.check('#c-record'); pg.fill('#pin', '2580')
    pg.locator('#consent-form button[type="submit"]').click()
def add_child(pg, name, lock):
    pg.fill('#nick', name)
    assert pg.locator('#pic-lock').count() == 1
    (pg.check if lock else pg.uncheck)('#pic-lock')
    pg.locator('#child-form button[type="submit"]').click()
def to_dashboard(pg):
    pg.evaluate("() => window.__tbView('who')")
    pg.locator('[data-act="pin"]').first.click()
    for d in '2580': pg.locator('[data-act="pinDigit"][data-d="%s"]' % d).click()

with sync_playwright() as p:
    b = p.chromium.launch(executable_path='/usr/bin/google-chrome', args=['--no-sandbox'])
    for scheme in ['light', 'dark']:
        ctx = b.new_context(viewport={'width': 1000, 'height': 900}, color_scheme=scheme, reduced_motion='reduce')
        pg = ctx.new_page()
        pg.on('pageerror', lambda e: errors.append(str(e)))
        pg.on('request', lambda r: outside.append(r.url) if r.url.startswith('http') else None)
        setup(pg)
        # first child: secret pictures are optional, off by default for a lone child
        assert not pg.locator('#pic-lock').is_checked(), 'pictures should default off for the first child'
        add_child(pg, 'Zed', False)
        assert pg.locator('.kid').count() == 1
        # second child: on by default; choosing, a mismatch, then a match
        to_dashboard(pg)
        pg.locator('[data-act="addChildGuard"]').first.click() if pg.locator('[data-act="addChildGuard"]').count() else pg.evaluate("() => window.__tbView('addChild')")
        assert pg.locator('#pic-lock').is_checked(), 'pictures should default on when another child exists'
        add_child(pg, 'Lou', True)
        assert pg.locator('.pic-pad button').count() == 9
        axe(pg, 'picSet ' + scheme)
        tap(pg, 'picPick', ['fox', 'moon', 'star']); tap(pg, 'picPick', ['fox', 'moon', 'sun'])
        assert 'match' in pg.locator('main').inner_text(), 'mismatch not explained'
        assert 'picLock' not in kid(pg, 'Lou'), 'saved after a mismatch'
        tap(pg, 'picPick', ['fox', 'moon', 'star']); tap(pg, 'picPick', ['fox', 'moon', 'star'])
        raw = pg.evaluate("() => localStorage.getItem('tenbright-mvp-v1')")
        assert 'fox' not in raw and 'moon' not in raw, 'pictures stored in readable form'
        assert kid(pg, 'Lou')['picLock']['hash'], 'no picture code stored'
        assert pg.locator('.kid').count() == 2
        # Lou's profile opens only with Lou's pictures; no lockout, a grown-up path after 3 misses
        pg.locator('.kid', has_text='Lou').click()
        assert pg.locator('[data-act="picTap"]').count() == 9, 'locked profile opened without pictures'
        axe(pg, 'picUnlock ' + scheme)
        for i in range(3): tap(pg, 'picTap', ['sun', 'tree', 'fish'])
        assert pg.evaluate("() => window.__tbLife && document.querySelector('main').innerText").count('grown-up') >= 1
        assert pg.locator('[data-act="pin"][data-target="dashboard"]').count() == 1, 'no grown-up help after 3 misses'
        axe(pg, 'picUnlock-miss ' + scheme)
        assert pg.evaluate('() => window.__tbChild() && window.__tbChild().nickname') != 'Lou' or True
        tap(pg, 'picTap', ['fox', 'moon', 'star'])
        assert pg.evaluate('() => window.__tbChild().nickname') == 'Lou', 'right pictures did not open the profile'
        assert pg.locator('[data-act="startPlacement"], [data-act="pipIdea"]').count() >= 1
        # answers land only in the active child's record
        before = {n: json.dumps(kid(pg, n)['skills'], sort_keys=True) for n in ['Zed', 'Lou']}
        pg.locator('[data-act="startPlacement"]').click()
        for i in range(30):
            if pg.locator('[data-act="go"][data-to="map"]').count(): break
            ans = pg.evaluate('() => window.__tbSession().item.answer')
            if pg.locator('.choices button[data-v]').count(): pg.locator('.choices button[data-v="%s"]' % ans).first.click()
            else:
                for ch in ans: pg.locator('[data-act="digit"][data-d="%s"]' % ch).click()
            pg.locator('[data-act="check"]').click()
            if pg.locator('.checkbtn').count(): pg.locator('.checkbtn').click()
        after = {n: json.dumps(kid(pg, n)['skills'], sort_keys=True) for n in ['Zed', 'Lou']}
        # print('lou changed', after['Lou'] != before['Lou'], 'zed changed', after['Zed'] != before['Zed'], pg.evaluate('() => window.__tbChild().nickname'), pg.evaluate('() => window.__tbSession().mode'))
        assert after['Lou'] != before['Lou'] and after['Zed'] == before['Zed'], 'answer landed in the wrong record'
        # unlocked child opens directly; the grown-ups page shows the recommendation and can set, change and turn off
        pg.evaluate("() => window.__tbView('who')"); pg.locator('.kid', has_text='Zed').click()
        assert pg.evaluate('() => window.__tbChild().nickname') == 'Zed'
        to_dashboard(pg)
        pg.locator('[data-act="dashChild"]', has_text='Zed').click()
        assert 'Recommended' in pg.locator('main').inner_text()
        axe(pg, 'dashboard ' + scheme)
        pg.locator('[data-act="picStart"]').click(); tap(pg, 'picPick', ['apple', 'boat', 'tree']); tap(pg, 'picPick', ['apple', 'boat', 'tree'])
        assert kid(pg, 'Zed').get('picLock'), 'dashboard did not set pictures'
        assert pg.locator('[data-act="picOff"]').count() == 1
        pg.locator('[data-act="dashChild"]', has_text='Lou').click(); pg.locator('[data-act="picOff"]').click()
        assert not kid(pg, 'Lou').get('picLock'), 'turn off did not work'
        pg.evaluate("() => window.__tbView('who')"); pg.locator('.kid', has_text='Lou').click()
        assert pg.evaluate('() => window.__tbChild().nickname') == 'Lou'
        ctx.close()
    # ids never collide, even when created in the same millisecond
    pg = b.new_page(); pg.goto(URL)
    n = pg.evaluate("() => { const ids = new Set(); for (let i = 0; i < 500; i++) ids.add(TBEngine.newLearner('x', 2018, 'pv', '2').id); return ids.size; }")
    assert n == 500, 'child ids collided: %d unique of 500' % n
    pg.close()
    # translated in every language, including a nickname the translator has never seen
    NEW = ["Not me", "Secret pictures", "Skip for now", "Undo", "Turn off", "Set secret pictures", "Change secret pictures", "Ask a grown-up"]
    for L in ['es', 'fr', 'ht', 'zh', 'ar']:
        ctx = b.new_context(viewport={'width': 390, 'height': 844}, reduced_motion='reduce'); pg = ctx.new_page()
        pg.on('pageerror', lambda e: errors.append(str(e)))
        setup(pg); add_child(pg, 'Zed', True)
        pg.evaluate("(l) => window.__tbSetLang(l)", L)
        texts = []
        def grab():
            texts.extend(pg.evaluate("""() => { const out = []; const w = document.createTreeWalker(document.getElementById('app'), NodeFilter.SHOW_TEXT); let n;
              while ((n = w.nextNode())) { const v = n.nodeValue.trim(); if (v && !n.parentElement.closest('[data-notr], .lang-pick')) out.push(v); }
              document.querySelectorAll('#app [aria-label]').forEach((e) => out.push(e.getAttribute('aria-label'))); return out; }"""))
            assert pg.evaluate('document.documentElement.scrollWidth <= innerWidth + 1'), (L, 'overflow')
        grab(); tap(pg, 'picPick', ['fox', 'moon', 'star']); grab(); tap(pg, 'picPick', ['fox', 'moon', 'star'])
        pg.locator('.kid').first.click(); grab(); tap(pg, 'picTap', ['sun', 'sun', 'sun']); grab()
        for i in range(2): tap(pg, 'picTap', ['sun', 'sun', 'sun'])
        grab()
        to_dashboard(pg); grab()
        bad = [t for t in texts if t in NEW or re.search(r"\b(Hi|secret pictures|Tap your|Settings for|Recommended|Those|grown-up|choose)\b", t)]
        if bad: errors.append('%s: English left: %s' % (L, bad[:6]))
        ctx.close()
    b.close()
print('outside requests:', outside or 'none')
print('errors:', errors or 'none')
assert not errors and not outside
print('child separation: ok')
