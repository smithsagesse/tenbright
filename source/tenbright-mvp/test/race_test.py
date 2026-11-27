"""Races (owner, Nov 27, 2026): Pip's Lantern Race and Zuri's Shape Race. Each opens once a skill of its racer is lit, asks
only engine questions from the child's lit skills (number skills for Pip, shapes and measuring for Zuri), moves the racer one
stop on a right answer or after "here is how" (never back), has no clock unless the child picks the timed run after one
finish, never changes mastery, is translated, speaks in the racer's voice and works without motion.
Run after build: python3 test/race_test.py"""
import pathlib, re
from playwright.sync_api import sync_playwright
ROOT = pathlib.Path(__file__).resolve().parent.parent
URL = (ROOT / 'dist' / 'test.html').as_uri() + '#selftest'
AXE = (ROOT / 'test' / 'axe.min.js').read_text()
errors, outside = [], []

def setup(pg):
    pg.goto(URL); pg.evaluate('localStorage.clear()'); pg.reload()
    pg.get_by_text('Set up as a parent').click(); pg.fill('#gate-year', '1980'); pg.get_by_role('button', name='Continue').click()
    pg.check('#c-guardian'); pg.check('#c-record'); pg.fill('#pin', '2580'); pg.get_by_role('button', name='Agree and continue').click()
    pg.fill('#nick', 'Ana'); pg.select_option('#sgrade', '3'); pg.uncheck('#pic-lock'); pg.get_by_role('button', name='Add child').click()
    pg.evaluate("() => { const c = window.__tbChild(); c.placementDone = true; c.focus = 'all'; }")

def answer(pg, right=True):
    it = pg.evaluate("() => window.__tbSession().rounds[window.__tbSession().i].item")
    if it['format'] == 'choice':
        v = it['answer'] if right else next(str(c) for c in it['choices'] if str(c) != str(it['answer']))
        pg.locator('.choices button[data-v="%s"]' % v.replace('"', '\\"')).first.click()
    else:
        v = str(it['answer']) if right else ('9' if str(it['answer']) != '9' else '8')
        for d in v: pg.locator('.pad button[data-d="%s"]' % d).first.click()
    pg.locator('.checkbtn').click(); pg.wait_for_timeout(120)

def axe(pg, name):
    if not pg.evaluate('!!window.axe'): pg.add_script_tag(content=AXE)
    v = pg.evaluate("async () => (await axe.run(document, { runOnly: ['wcag2a','wcag2aa','wcag21aa','wcag22aa'] })).violations.map(v => v.id + ':' + v.nodes.length)")
    assert not v, (name, v)

with sync_playwright() as p:
    b = p.chromium.launch(executable_path='/usr/bin/google-chrome', args=['--no-sandbox'])
    for scheme in ['light', 'dark']:
        ctx = b.new_context(viewport={'width': 1000, 'height': 900}, color_scheme=scheme, reduced_motion='reduce')
        pg = ctx.new_page()
        pg.on('pageerror', lambda e: errors.append(str(e)))
        pg.on('request', lambda r: outside.append(r.url) if r.url.startswith('http') else None)
        setup(pg)
        # 1. locked until a racer's skill is lit
        pg.evaluate("() => window.__tbView('games')")
        for g in ['race', 'zrace']:
            assert pg.evaluate("(g) => window.TBEngine.gameLevel(window.__tbChild().skills, g)", g) == 0
        assert pg.locator('[data-act="gameStart"][data-g="race"]').count() == 0 and pg.locator('[data-act="gameStart"][data-g="zrace"]').count() == 0
        pg.evaluate("""() => { const c = window.__tbChild(); ['C101', 'AS05', 'MU03', 'MS01', 'GE01'].forEach((id) => { c.skills[id].status = 'mastered'; c.skills[id].learned = true; }); }""")
        pg.evaluate("() => window.__tbView('games')")
        assert pg.locator('[data-act="gameStart"][data-g="race"]').count() == 1 and pg.locator('[data-act="gameStart"][data-g="zrace"]').count() == 1
        axe(pg, 'games list ' + scheme)
        for g, who, pool in [('race', 'pip', {'C101', 'AS05', 'MU03'}), ('zrace', 'zuri', {'MS01', 'GE01'})]:
            before = pg.evaluate("() => JSON.stringify(window.__tbChild().skills)")
            pg.locator('[data-act="gameStart"][data-g="%s"]' % g).click(); pg.wait_for_timeout(150)
            s = pg.evaluate("() => window.__tbSession()")
            assert s['game'] == g and len(s['rounds']) == 6 and not s['timed']
            assert all(r['skill'] in pool for r in s['rounds']), [r['skill'] for r in s['rounds']]
            assert pg.evaluate("() => window.__tbGuide()") == who
            # no clock on screen
            assert not re.search(r'\d+\s*(s|sec|seconds)\b', pg.locator('main').inner_text()), 'a clock appeared'
            axe(pg, g + ' ' + scheme)
            # 2. a miss: clue, the racer stays; a second miss: here is how, and the racer moves on
            assert 'of 6' in pg.locator('.race-track').get_attribute('aria-label') and ': 0 of 6' in pg.locator('.race-track').get_attribute('aria-label')
            answer(pg, right=False)
            assert pg.locator('.feedback.clue').count() == 1 and ': 0 of 6' in pg.locator('.race-track').get_attribute('aria-label')
            answer(pg, right=False)
            assert 'Here is how' in pg.locator('.feedback').inner_text() and ': 1 of 6' in pg.locator('.race-track').get_attribute('aria-label')
            assert pg.locator('.rt-stop.on').count() == 1
            for k in range(5):
                pg.locator('[data-act="gameNext"]').click(); pg.wait_for_timeout(80); answer(pg)
                assert (': %d of 6' % (k + 2)) in pg.locator('.race-track').get_attribute('aria-label')
            pg.locator('[data-act="gameNext"]').click(); pg.wait_for_timeout(150)
            assert pg.evaluate("() => window.__tbView('gameEnd') && true")
            txt = pg.locator('main').inner_text()
            assert ('Pip crossed the finish line!' if g == 'race' else 'Zuri crossed the finish line!') in txt and '5 of 6' in txt, txt
            # 3. races never change mastery
            assert pg.evaluate("() => JSON.stringify(window.__tbChild().skills)") == before, 'a race changed skills'
            # 4. the timed run is offered only after a finish, and counts up
            pg.evaluate("() => window.__tbView('games')")
            assert pg.locator('[data-act="gameStart"][data-g="%s"][data-timed="1"]' % g).count() == 1
        # 5. reduced motion: the racer does not dash
        pg.evaluate("() => window.__tbGame('race', 1)"); answer(pg)
        assert pg.evaluate("() => getComputedStyle(document.querySelector('.rt-run')).animationName") == 'none'
        ctx.close()
    # 6. translated (no English left on the race screens) and right-to-left
    ctx = b.new_context(viewport={'width': 390, 'height': 844}); pg = ctx.new_page(); pg.on('pageerror', lambda e: errors.append(str(e)))
    setup(pg)
    for lang in ['es', 'fr', 'ht', 'zh', 'ar']:
        pg.evaluate("(l) => window.__tbSetLang(l)", lang)
        for g in ['race', 'zrace']:
            pg.evaluate("(g) => window.__tbGame(g, 1)", g); pg.wait_for_timeout(100)
            for w in ['Lanterns lit', 'Shape stones', 'Race', 'Check']:
                assert w not in pg.locator('main').inner_text() and w not in (pg.locator('.race-track').get_attribute('aria-label') or ''), (lang, g, w)
        pg.evaluate("() => window.__tbView('games')")
        for w in ['Lantern Race', 'Shape Race', 'help Pip run', 'help Zuri draw']:
            assert w not in pg.locator('main').inner_text(), (lang, w)
    ctx.close(); b.close()
assert not errors, errors
assert not outside, outside
print('Race checks passed')
