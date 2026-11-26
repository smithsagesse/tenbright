"""Measurement and geometry (Tenbright 2.0, Phase 7, second slice): the Measuring Workshop and Shape Garden regions,
ruler, rectangle, shape, angle and grid pictures with descriptions, a clue on a known mistake, lessons that play through,
light and dark accessibility, Arabic layout. Run after build: python3 test/measure_shape_test.py"""
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
        for name in ['Measuring Workshop', 'Shape Garden']:
            reg = pg.locator('button.region', has_text=name)
            assert reg.count() == 1 and reg.is_enabled(), name + ' should be open'
        axe(pg, 'map ' + scheme)
        # 2. every picture renders with a description; the grid description never gives the star's place
        for sid, sel in [('MS01', 'svg.mpic'), ('MS02', 'svg.mpic'), ('MS03', 'svg.mpic'), ('MS04', 'svg.mpic'), ('GE02', 'svg.mpic'), ('GE03', 'svg.mpic')]:
            for i in range(12):
                pg.evaluate("(s) => window.__tbShow(s, 0)", sid)
                it = pg.evaluate("() => window.__tbSession().item")
                if it['model']['type'] == 'paper': continue
                lab = pg.locator(sel).first.get_attribute('aria-label')
                assert lab and 'undefined' not in lab and 'NaN' not in lab, (sid, lab)
                if sid == 'GE03': assert '%d across and %d up' % (it['model']['x'], it['model']['y']) not in lab and 'star is' not in lab, lab
            axe(pg, sid + ' ' + scheme)
        while True:
            pg.evaluate("() => window.__tbShow('GE01', 0)")
            it = pg.evaluate("() => window.__tbSession().item")
            if it['format'] == 'choice': break
        assert pg.locator('svg.mpic polygon').count() == 1
        axe(pg, 'GE01 ' + scheme)
        # 3. a ruler question with a known mistake gets its clue
        while True:
            pg.evaluate("() => window.__tbShow('MS01', 0)")
            it = pg.evaluate("() => window.__tbSession().item")
            if it['format'] == 'number' and it['predicted'].get('MM1'): break
        for ch in it['predicted']['MM1']: pg.locator('.pad button[data-d="%s"]' % ch).click()
        pg.locator('.checkbtn').click()
        fb = pg.locator('.feedback').inner_text()
        assert 'Count the units from the start to the end.' in fb, fb
        # 4. lessons play through for every new skill
        for sid in ['MS01', 'MS02', 'MS03', 'MS04', 'GE01', 'GE02', 'GE03']:
            n = pg.evaluate("(id) => window.__tbLesson(id)", sid)
            for f in range(n):
                pg.evaluate("(f) => window.__tbFrame(f)", f)
                t = pg.locator('main').inner_text()
                assert not re.search(r'undefined|NaN|\[object', t), (sid, f)
        ctx.close()
    # 5. Arabic: rectangles and angles read inside an RTL page
    ctx = b.new_context(viewport={'width': 1100, 'height': 900})
    pg = ctx.new_page(); pg.on('pageerror', lambda e: errors.append(str(e)))
    setup(pg); pg.evaluate("() => window.__tbSetLang('ar')")
    for sid in ['MS03', 'GE02']:
        pg.evaluate("(s) => window.__tbShow(s, 0)", sid)
        assert pg.evaluate('() => document.documentElement.dir') == 'rtl'
        assert 'rectangle' not in pg.locator('main').inner_text() and 'angle' not in pg.locator('main').inner_text()
        axe(pg, sid + ' in Arabic')
    ctx.close()
    b.close()
print('outside requests:', outside or 'none')
print('errors:', errors or 'none')
assert not errors and not outside
print('measurement and geometry: ok')
