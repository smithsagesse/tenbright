"""Strategy library (Tenbright 2.0, Phase 6): the parents' searchable library with the 14 parts of every strategy, the
trial methods hidden from children until a parent turns them on, a trial lesson with its picture and a 4-question
independent test recorded on the device and shown to the parent. Light and dark accessibility.
Run after build: python3 test/strategies_test.py"""
import pathlib
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
    pg.fill('#nick', 'Ana'); pg.select_option('#sgrade', '4'); pg.uncheck('#pic-lock'); pg.get_by_role('button', name='Add child').click()
    pg.evaluate("() => { const c = window.__tbChild(); c.placementDone = true; ['C104', 'F406', 'PV03'].forEach((id) => { c.skills[id].status = 'mastered'; c.skills[id].learned = true; }); }")

with sync_playwright() as p:
    b = p.chromium.launch(executable_path='/usr/bin/google-chrome', args=['--no-sandbox'])
    for scheme in ['light', 'dark']:
        ctx = b.new_context(viewport={'width': 1100, 'height': 900}, color_scheme=scheme, reduced_motion='reduce')
        pg = ctx.new_page()
        pg.on('pageerror', lambda e: errors.append(str(e)))
        pg.on('request', lambda r: outside.append(r.url) if r.url.startswith('http') else None)
        setup(pg)
        # 1. the library, from the grown-ups page
        pg.evaluate("() => window.__tbView('dashboard')")
        pg.get_by_role('button', name='Open the strategy library').click()
        assert pg.locator('h1', has_text='Strategy library').count() == 1
        n = pg.locator('details.lib-entry').count()
        assert n == pg.evaluate('() => window.TBStrategies.LIST.length') and n >= 20, n
        assert pg.locator('.lib-tag.trial').count() == 4, 'four trial methods are marked'
        # every entry has the 14 parts (plus origin and research)
        pg.locator('details.lib-entry').first.locator('summary').click()
        dts = pg.locator('details.lib-entry').first.locator('dt').all_inner_texts()
        for part in ['Mathematical idea', 'Skills', 'Ready when', 'How Pip explains it', 'Picture', 'Worked examples', 'Step by step', 'Why it works', 'When to use it', 'When not to use it', 'Common mistakes', 'Practice questions', 'Independent mastery test', 'Where it comes from', 'What the research says']:
            assert part in dts, part
        axe(pg, 'library ' + scheme)
        # search keeps the text box and filters the list
        pg.locator('#strat-q').fill('vedic')
        assert pg.evaluate("() => document.activeElement && document.activeElement.id") == 'strat-q', 'search box keeps focus'
        names = pg.locator('details.lib-entry summary').all_inner_texts()
        assert len(names) >= 3 and any('Numbers near 100' in x for x in names), names
        pg.locator('details.lib-entry', has_text='Numbers near 100').locator('summary').click()
        entry = pg.locator('details.lib-entry', has_text='Numbers near 100').inner_text()
        assert 'not found in the ancient Vedas' in entry and 'No rigorous study' in entry, 'honest origin and evidence notes'
        pg.locator('#strat-q').fill('zzzz')
        assert 'No strategy matches that search.' in pg.locator('#lib-list').inner_text()
        # 2. trial methods are off by default: no button for the child
        pg.evaluate("() => window.__tbView('map')")
        assert pg.locator('[data-to="trials"]').count() == 0, 'trials must be off by default'
        # 3. a parent turns them on
        pg.evaluate("() => window.__tbView('dashboard')")
        pg.check('#trial-on')
        assert pg.evaluate('() => JSON.parse(localStorage.getItem("tenbright-mvp-v1")).settings.trials') is True
        pg.evaluate("() => window.__tbView('map')")
        pg.locator('[data-act="go"][data-to="trials"]').click()
        txt = pg.locator('main').inner_text()
        for name in ['Number bonds picture', 'Mental abacus', 'Numbers near 100 (Nikhilam)', 'Vertically and crosswise']: assert name in txt, name
        axe(pg, 'extra ways ' + scheme)
        # 4. a trial lesson with its picture, then 4 questions on the child's own
        pg.locator('[data-act="trialLesson"][data-id="number-bonds"]').click()
        assert pg.locator('.bond-svg').count() == 1 and "Pip's steps" in pg.locator('main').inner_text()
        axe(pg, 'number bond lesson ' + scheme)
        pg.locator('[data-act="trialTest"]').click()
        for i in range(4):
            ans = pg.evaluate('() => { const s = window.__tbSession(); return s.rounds[s.i].answer; }')
            v = ans if i else str(int(ans) + 1)
            for ch in v: pg.locator('[data-act="gdigit"][data-d="%s"]' % ch).click()
            pg.locator('[data-act="gameCheck"]').click()
            if i == 0:
                assert 'Try again' in pg.locator('.feedback').inner_text()
                pg.evaluate("() => { window.__tbSession().entry = ''; }")
                for ch in ans: pg.locator('[data-act="gdigit"][data-d="%s"]' % ch).click()
                pg.locator('[data-act="gameCheck"]').click()
            pg.locator('[data-act="gameNext"]').click()
        assert 'You got 3 of 4 on the first try.' in pg.locator('main').inner_text()
        tr = pg.evaluate("() => window.__tbChild().trials['number-bonds']")
        assert tr and tr[-1]['right'] == 3 and tr[-1]['n'] == 4, tr
        # the mental abacus lesson shows the beads
        pg.evaluate("() => window.__tbView('trials')")
        pg.locator('[data-act="trialLesson"][data-id="mental-abacus"]').click()
        assert pg.locator('.soroban').count() >= 1, 'abacus picture'
        # 5. the parent sees what was tried
        pg.evaluate("() => window.__tbView('dashboard')")
        main = pg.locator('main').inner_text()
        assert 'Extra ways tried, latest result:' in main and 'Number bonds picture: 3 of 4 on the first try' in main, main[:400]
        ctx.close()
    b.close()
print('outside requests:', outside or 'none')
print('errors:', errors or 'none')
assert not errors and not outside
print('strategy library: ok')
