"""Money and time (Tenbright 2.0, Phase 7, first strands): the Money Mission and Time Tower regions on the map, coin and
clock pictures whose descriptions never give the answer away, a practice session in each strand with a clue on a
known mistake, lessons that play through, coins only as math objects (no wallet or currency anywhere), light and dark
accessibility, Arabic layout. Run after build: python3 test/money_time_test.py"""
import pathlib, re
from playwright.sync_api import sync_playwright
ROOT = pathlib.Path(__file__).resolve().parent.parent
URL = (ROOT / 'dist' / 'test.html').as_uri() + '#selftest'
AXE = (ROOT / 'test' / 'axe.min.js').read_text()
errors, outside = [], []

def axe(pg, name):
    if not pg.evaluate('!!window.axe'): pg.add_script_tag(content=AXE)
    v = pg.evaluate("async () => (await axe.run(document, { runOnly: ['wcag2a','wcag2aa','wcag21aa','wcag22aa'] })).violations.map(v => v.id + ':' + v.nodes.length)")
    assert not v, (name, v)

def setup(pg):
    pg.goto(URL); pg.evaluate('localStorage.clear()'); pg.reload()
    pg.get_by_text('Set up as a parent').click(); pg.fill('#gate-year', '1980'); pg.get_by_role('button', name='Continue').click()
    pg.check('#c-guardian'); pg.check('#c-record'); pg.fill('#pin', '2580'); pg.get_by_role('button', name='Agree and continue').click()
    pg.fill('#nick', 'Ana'); pg.select_option('#sgrade', '3'); pg.uncheck('#pic-lock'); pg.get_by_role('button', name='Add child').click()
    pg.evaluate("""() => { const c = window.__tbChild(), E = window.TBEngine; c.placementDone = true; c.focus = 'all';
      ['C101', 'C104', 'PV07', 'AS05', 'AS10'].forEach((id) => { c.skills[id].status = 'mastered'; c.skills[id].learned = true; }); E.refreshUnlocks(c.skills); }""")

with sync_playwright() as p:
    b = p.chromium.launch(executable_path='/usr/bin/google-chrome', args=['--no-sandbox'])
    for scheme in ['light', 'dark']:
        ctx = b.new_context(viewport={'width': 1100, 'height': 900}, color_scheme=scheme, reduced_motion='reduce')
        pg = ctx.new_page()
        pg.on('pageerror', lambda e: errors.append(str(e)))
        pg.on('request', lambda r: outside.append(r.url) if r.url.startswith('http') else None)
        setup(pg)
        # 1. the two regions are on the map and open once their first skills' prerequisites are lit
        pg.evaluate("() => window.__tbView('map')")
        for name in ['Money Mission', 'Time Tower']:
            reg = pg.locator('button.region', has_text=name)
            assert reg.count() == 1 and reg.is_enabled(), name + ' should be open'
        axe(pg, 'map ' + scheme)
        # 2. the clock picture describes the hands, never the time
        for i in range(40):
            pg.evaluate("() => window.__tbShow('TM03', 0)")
            it = pg.evaluate("() => window.__tbSession().item")
            lab = pg.locator('svg.clock-svg').get_attribute('aria-label')
            assert lab.startswith('A clock.') and not re.search(r'\d+:\d\d', lab) and (':' not in it['answer'] or it['answer'] not in lab), lab
        axe(pg, 'clock ' + scheme)
        # 3. a coin practice question with a known mistake gets its clue
        while True:
            pg.evaluate("() => window.__tbShow('MY02', 0)")
            it = pg.evaluate("() => window.__tbSession().item")
            if it['format'] == 'number' and it['predicted'].get('MY1'): break
        for ch in it['predicted']['MY1']: pg.locator('.pad button[data-d="%s"]' % ch).click()
        pg.locator('.checkbtn').click()
        fb = pg.locator('.feedback').inner_text()
        assert 'Add the cents, not the coins.' in fb, fb
        assert pg.locator('.coins-row').get_attribute('aria-label').startswith('Coins:')
        axe(pg, 'coins ' + scheme)
        # 4. lessons play through for every new skill
        for sid in ['MY01', 'MY02', 'MY03', 'MY04', 'TM01', 'TM02', 'TM03', 'TM04']:
            n = pg.evaluate("(id) => window.__tbLesson(id)", sid)
            for f in range(n):
                pg.evaluate("(f) => window.__tbFrame(f)", f)
                t = pg.locator('main').inner_text()
                assert not re.search(r'undefined|NaN|\[object', t), (sid, f)
        # 5. coins are math objects only: no wallet, balance or currency anywhere a child goes
        for v in ['map', 'games', 'journal']:
            t = pg.evaluate("(v) => window.__tbView(v)", v).lower()
            assert not re.search(r'\bwallet\b|\bbalance\b|\bspend your\b|\bearn coins\b|\bshop for\b', t), v
        ctx.close()
    # 6. Arabic: the clock and coins read inside an RTL page
    ctx = b.new_context(viewport={'width': 1100, 'height': 900})
    pg = ctx.new_page(); pg.on('pageerror', lambda e: errors.append(str(e)))
    setup(pg); pg.evaluate("() => window.__tbSetLang('ar')")
    pg.evaluate("() => window.__tbShow('TM02', 0)")
    assert pg.evaluate('() => document.documentElement.dir') == 'rtl'
    assert 'What time' not in pg.locator('main').inner_text()
    axe(pg, 'clock in Arabic')
    ctx.close()
    b.close()
print('outside requests:', outside or 'none')
print('errors:', errors or 'none')
assert not errors and not outside
print('money and time: ok')
