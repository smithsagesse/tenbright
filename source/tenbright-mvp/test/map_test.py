"""The Tenbright Discovery Universe (owner, Nov 28, 2026): every place on the map is labelled with its name, subject, a
short description and a picture, sits in one of three categories (Mathematics, Financial Intelligence, Thinking and
Discovery), and opens a discovery card that lists what it really teaches (the engine's skills, the adventures or the
games, never invented topics) with one clear way in. Checked in light and dark, on a phone and a desktop, with axe.
Run after build: python3 test/map_test.py"""
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

def setup(pg, grade='3'):
    pg.goto(URL); pg.evaluate('localStorage.clear()'); pg.reload()
    pg.get_by_text('Set up as a parent').click(); pg.fill('#gate-year', '1980'); pg.get_by_role('button', name='Continue').click()
    pg.check('#c-guardian'); pg.check('#c-record'); pg.fill('#pin', '2580'); pg.get_by_role('button', name='Agree and continue').click()
    pg.fill('#nick', 'Ana'); pg.select_option('#sgrade', grade); pg.uncheck('#pic-lock'); pg.get_by_role('button', name='Add child').click()
    pg.evaluate("""() => { const c = window.__tbChild(), E = window.TBEngine; c.placementDone = true; c.focus = 'all';
      ['C101', 'C102', 'C103', 'C104', 'PV07', 'AS05', 'AS10', 'MY01', 'MY02', 'MS01', 'GE01', 'F301'].forEach((id) => { c.skills[id].status = 'mastered'; c.skills[id].learned = true; }); E.refreshUnlocks(c.skills); }""")
    pg.evaluate("() => window.__tbView('map')"); pg.wait_for_timeout(150)

with sync_playwright() as p:
    b = p.chromium.launch(executable_path='/usr/bin/google-chrome', args=['--no-sandbox'])
    for scheme, vp in [('light', {'width': 390, 'height': 844}), ('dark', {'width': 1280, 'height': 900})]:
        ctx = b.new_context(viewport=vp, color_scheme=scheme, reduced_motion='reduce')
        pg = ctx.new_page()
        pg.on('pageerror', lambda e: errors.append(str(e)))
        pg.on('request', lambda r: outside.append(r.url) if r.url.startswith('http') else None)
        setup(pg)
        regions = pg.evaluate("() => [...new Set(window.TBEngine.SKILL_ORDER.map((id) => window.TBEngine.SKILLS[id].region))]")
        # 1. the universe: a title, three categories and nothing the app does not teach
        txt = pg.locator('main').inner_text()
        assert 'Tenbright Discovery Universe' in txt
        assert [h.inner_text() for h in pg.locator('.dest-cat > h2').all()] == ['Mathematics', 'Financial Intelligence', 'Thinking and Discovery']
        for word in ['Percent', 'Bond', 'Banking', 'Science', 'Technology', 'Stock market']:
            assert word not in txt, word + ' is not taught yet'
        # 2. every region has a labelled tile with a subject, a description and a picture; plus adventures, games and the warm-up
        ids = pg.evaluate("() => [...document.querySelectorAll('[data-act=dest]')].map((b) => b.dataset.id)")
        assert set(regions) <= set(ids) and {'adventures', 'games', 'line'} <= set(ids), ids
        assert pg.locator('.region').count() == len(regions)
        for i in ids:
            t = pg.locator('[data-act="dest"][data-id="%s"]' % i)
            assert t.locator('h3').inner_text().strip() and t.locator('.dest-subject').inner_text().strip() and t.locator('.dest-desc').inner_text().strip(), i
            assert t.locator('.dest-art svg, .dest-art img').count() >= 1, i + ' has no picture'
            bb = t.bounding_box(); assert bb['height'] >= 88 and bb['width'] >= 88, (i, bb)
        assert pg.locator('[data-id="shapes"] .dest-guide img').count() == 1 and pg.locator('[data-id="workshop"] .dest-guide img').count() == 1, 'Zuri guides her two places'
        # no sideways scrolling on a phone
        assert pg.evaluate("() => document.documentElement.scrollWidth <= innerWidth + 1")
        axe(pg, 'map ' + scheme)
        # 3. each region's card lists exactly its skills (in the chosen grade), with one way in when it is open
        for r in regions:
            pg.locator('[data-act="dest"][data-id="%s"]' % r).click(); pg.wait_for_timeout(60)
            card = pg.locator('.dest-card')
            assert card.get_attribute('role') == 'dialog' and card.get_attribute('aria-modal') == 'true'
            want = pg.evaluate("(r) => window.TBEngine.SKILL_ORDER.filter((id) => window.TBEngine.SKILLS[id].region === r).map((id) => window.TBEngine.SKILLS[id].name)", r)
            got = [li.locator('.dt-name').inner_text() for li in card.locator('.dest-topics li').all()]
            assert got == want, (r, got, want)
            assert card.locator('.dest-real').inner_text().startswith('In real life:') and card.locator('h3').inner_text() == 'What you will learn'
            open_ = pg.evaluate("(r) => { const c = window.__tbChild(), E = window.TBEngine; return E.SKILL_ORDER.some((id) => E.SKILLS[id].region === r && c.skills[id].status !== 'locked'); }", r)
            assert card.locator('[data-act="region"]').count() == (1 if open_ else 0), r
            if r == 'river': axe(pg, 'card ' + scheme)
            # the page behind is inert while the card is open; Escape closes and returns to the tile
            assert pg.evaluate("() => document.querySelector('.map-body').inert === true")
            pg.keyboard.press('Escape'); pg.wait_for_timeout(40)
            assert pg.locator('.dest-card').count() == 0 and pg.evaluate("(r) => document.activeElement.dataset.id === r", r), r
        # 4. the way in starts that place: a region starts a lesson or practice there; the others open their screens
        pg.locator('[data-act="dest"][data-id="river"]').click(); pg.locator('.dest-card [data-act="region"]').click(); pg.wait_for_timeout(120)
        assert pg.evaluate("() => window.TBEngine.SKILLS[window.__tbSession().skill].region") == 'river'
        for d, check in [('games', "() => document.querySelector('h1').innerText === 'Math games'"), ('adventures', "() => document.querySelector('h1').innerText.includes('Money adventures')"), ('line', "() => window.__tbSession().mode === 'line'")]:
            pg.evaluate("() => window.__tbView('map')")
            pg.locator('[data-act="dest"][data-id="%s"]' % d).click()
            pg.locator('.dest-card .dest-go').click(); pg.wait_for_timeout(120)
            assert pg.evaluate(check), d + ' did not open'
        # 5. adventures: grouped by what they teach; investing stories only after a grown-up turns them on
        pg.evaluate("() => window.__tbView('map')")
        pg.locator('[data-act="dest"][data-id="adventures"]').click()
        heads = [h.inner_text() for h in pg.locator('.dest-card h4').all()]
        assert heads == ['Saving and budgeting', 'Spending wisely', 'Running a business'], heads
        assert 'a grown-up can turn these on' in pg.locator('.dest-card').inner_text()
        names = pg.evaluate("() => Object.values(window.TBEngine.ADVENTURES).filter((a) => !a.investing).map((a) => a.name).sort()")
        got = sorted(li.locator('.dt-name').inner_text() for li in pg.locator('.dest-card .dest-topics li').all())
        assert got == names, (got, names)
        pg.keyboard.press('Escape')
        # 6. games: the card lists the real games
        pg.locator('[data-act="dest"][data-id="games"]').click()
        got = [li.locator('.dt-name').inner_text() for li in pg.locator('.dest-card .dest-topics li').all()]
        assert got == pg.evaluate("() => Object.values(window.TBEngine.GAMES).map((g) => g.name)"), got
        pg.keyboard.press('Escape')
        # 7. a grade chip narrows each card to that grade's skills
        pg.locator('.gchip[data-g="2"]').click()
        pg.locator('[data-act="dest"][data-id="workshop"]').click()
        got = [li.locator('.dt-name').inner_text() for li in pg.locator('.dest-card .dest-topics li').all()]
        assert got == ['Measure with a ruler', 'Compare lengths'], got
        pg.keyboard.press('Escape')
        # 8. reduced motion: the card does not slide
        pg.locator('[data-act="dest"][data-id="clock"]').click()
        assert pg.evaluate("() => getComputedStyle(document.querySelector('.dest-card')).animationName") == 'none'
        ctx.close()
    b.close()
assert not errors, errors
assert not outside, outside
print('Map checks passed')
