"""Parent dashboard v2 (Tenbright 2.0, Phase 8): 8-week trends (minutes, answers on their own, lanterns lit) from what is
already on the device, the last 2 weeks against the 2 before, what the child is working on with why it matters, what it
builds on and what it opens next, the empty state for a new child, light and dark accessibility, Arabic.
Run after build: python3 test/dashboard2_test.py"""
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
    pg.fill('#nick', 'Ana'); pg.select_option('#sgrade', '2'); pg.uncheck('#pic-lock'); pg.get_by_role('button', name='Add child').click()

# answers placed in known weeks: 3 and 4 weeks ago 10 answers, 4 on their own; the last 2 weeks 10 answers, 8 on their own
HISTORY = """() => { const c = window.__tbChild(), E = window.TBEngine, D = E.DAY, t = Date.now();
  c.placementDone = true;
  const add = (id, daysAgo, hint) => c.skills[id].attempts.push({ correct: true, format: 'number', hint, mis: null, at: t - daysAgo * D, kind: 'plain' });
  for (let i = 0; i < 10; i++) add('C101', 17 + (i % 10), i < 4 ? 0 : 3);
  for (let i = 0; i < 10; i++) add('AS01', 1 + (i % 12), i < 8 ? 1 : 2);
  c.sessions.push({ start: t - 20 * D, end: t - 20 * D + 12 * 60000, mode: 'practice', items: 10 }, { start: t - 3 * D, end: t - 3 * D + 15 * 60000, mode: 'practice', items: 10 });
  c.skills.C101.status = 'mastered'; c.skills.C101.masteredAt = t - 18 * D;
  ['C101'].forEach(() => E.refreshUnlocks(c.skills));
  c.skills.AS01.status = 'learning'; }"""

with sync_playwright() as p:
    b = p.chromium.launch(executable_path='/usr/bin/google-chrome', args=['--no-sandbox'])
    for scheme in ['light', 'dark']:
        ctx = b.new_context(viewport={'width': 1100, 'height': 900}, color_scheme=scheme, reduced_motion='reduce')
        pg = ctx.new_page()
        pg.on('pageerror', lambda e: errors.append(str(e)))
        pg.on('request', lambda r: outside.append(r.url) if r.url.startswith('http') else None)
        setup(pg)
        # 1. a new child: the trends card explains when it fills in
        pg.evaluate("() => window.__tbView('dashboard')")
        assert 'Trends show here after a few practice sessions.' in pg.locator('main').inner_text()
        # 2. with history: three charts of 8 weeks each
        pg.evaluate(HISTORY)
        pg.evaluate("() => window.__tbView('dashboard')")
        card = pg.locator('section.card', has_text='Over the last 8 weeks')
        assert card.count() == 1
        assert card.locator('.trend').count() == 3 and card.locator('ol.trend-bars').count() == 3
        for i in range(3): assert card.locator('ol.trend-bars').nth(i).locator('li').count() == 8
        txt = card.inner_text()
        assert 'On their own: 80% of answers in the last 2 weeks, 40% in the 2 weeks before.' in txt, txt
        mins = card.locator('ol.trend-bars').nth(0).locator('.trend-v').all_inner_texts()
        assert sum(int(x) for x in mins if x.isdigit()) == 27, mins
        lit = card.locator('ol.trend-bars').nth(2).locator('.trend-v').all_inner_texts()
        assert lit[-1] == '1' and lit[0] == '0', lit
        own = card.locator('ol.trend-bars').nth(1).locator('.trend-v').all_inner_texts()
        assert '–' in own, 'weeks with no answers show a dash'
        # 3. what the child is working on, and why
        why = pg.locator('section.card', has_text='is working on, and why')
        assert why.count() == 1
        wt = why.inner_text()
        assert 'Add and subtract within 20' in wt and 'Adding and subtracting come up in almost every later topic' in wt, wt
        assert 'Opens next:' in wt, wt
        assert not re.search(r'undefined|NaN|\[object', pg.locator('main').inner_text())
        axe(pg, 'dashboard v2 ' + scheme)
        ctx.close()
    # 4. phone width: the charts fit without sideways scrolling
    ctx = b.new_context(viewport={'width': 360, 'height': 780})
    pg = ctx.new_page(); pg.on('pageerror', lambda e: errors.append(str(e)))
    setup(pg); pg.evaluate(HISTORY); pg.evaluate("() => window.__tbView('dashboard')")
    assert pg.evaluate('() => document.documentElement.scrollWidth <= window.innerWidth + 1'), 'no sideways scroll on a phone'
    # 5. Arabic: the new cards are translated and accessible
    pg.evaluate("() => window.__tbSetLang('ar')"); pg.evaluate("() => window.__tbView('dashboard')")
    main = pg.locator('main').inner_text()
    for en in ['Over the last 8 weeks', 'Minutes of practice', 'On their own', 'Builds on', 'Opens next', 'is working on']:
        assert en not in main, en
    axe(pg, 'dashboard v2 in Arabic')
    ctx.close()
    b.close()
print('outside requests:', outside or 'none')
print('errors:', errors or 'none')
assert not errors and not outside
print('parent dashboard v2: ok')
