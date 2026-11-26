"""Money & Wealth Adventures, step 1: the adventure runner. The map button appears only when an adventure's math is lit;
a story of linked steps with a running "story so far"; money-idea clues on known mistakes; "here is how" after two
misses; an idea check with two choices; the end screen names the math; first answers count as story evidence for
their skills; nothing about spending is kept and no money carries over; light and dark accessibility, Arabic, phone
width. Run after build: python3 test/adventure_test.py"""
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

def setup(pg, lit=True):
    pg.goto(URL); pg.evaluate('localStorage.clear()'); pg.reload()
    pg.get_by_text('Set up as a parent').click(); pg.fill('#gate-year', '1980'); pg.get_by_role('button', name='Continue').click()
    pg.check('#c-guardian'); pg.check('#c-record'); pg.fill('#pin', '2580'); pg.get_by_role('button', name='Agree and continue').click()
    pg.fill('#nick', 'Ana'); pg.select_option('#sgrade', '3'); pg.uncheck('#pic-lock'); pg.get_by_role('button', name='Add child').click()
    pg.evaluate("(lit) => { const c = window.__tbChild(); c.placementDone = true; if (lit) c.skills.FN02.status = 'mastered'; window.__tbView('map'); }", lit)

def step(pg):
    return pg.evaluate("() => { const s = window.__tbSession(); return s.rounds[s.i]; }")

def answer(pg, rd, v):
    if rd.get('choices'): pg.locator('[data-act="achoose"][data-v="%s"]' % v).click()
    else:
        pg.evaluate("() => { window.__tbSession().entry = ''; }")
        for ch in v: pg.locator('[data-act="gdigit"][data-d="%s"]' % ch).click()
    pg.locator('[data-act="gameCheck"]').click()

with sync_playwright() as p:
    b = p.chromium.launch(executable_path='/usr/bin/google-chrome', args=['--no-sandbox'])
    for scheme in ['light', 'dark']:
        ctx = b.new_context(viewport={'width': 1100, 'height': 900}, color_scheme=scheme, reduced_motion='reduce')
        pg = ctx.new_page()
        pg.on('pageerror', lambda e: errors.append(str(e)))
        pg.on('request', lambda r: outside.append(r.url) if r.url.startswith('http') else None)
        # 1. no button until the math is lit
        setup(pg, lit=False)
        assert pg.locator('[data-to="adventures"]').count() == 0, 'adventures must wait for their math'
        pg.evaluate("() => { window.__tbChild().skills.FN02.status = 'mastered'; window.__tbView('map'); }")
        pg.locator('[data-act="go"][data-to="adventures"]').click()
        assert 'Money adventures' in pg.locator('h1').inner_text() and 'The money is pretend.' in pg.locator('main').inner_text()
        axe(pg, 'adventures list ' + scheme)
        # 2. play: a story of linked steps with a running total
        pg.locator('[data-act="advStart"][data-id="lemonade"]').click()
        assert pg.locator('.story-strip').count() == 1 and 'pretend money' in pg.locator('main').inner_text()
        axe(pg, 'adventure step ' + scheme)
        rd = step(pg); answer(pg, rd, rd['answer'])
        assert 'Right' in pg.locator('.feedback').inner_text(); pg.locator('[data-act="gameNext"]').click()
        # step 2: two misses bring "here is how"
        rd = step(pg); answer(pg, rd, '999'); answer(pg, rd, '998')
        assert 'Here is how.' in pg.locator('.feedback').inner_text() and rd['how'].split('=')[-1].strip() in pg.locator('.feedback').inner_text()
        pg.locator('[data-act="gameNext"]').click()
        # step 3: revenue given as profit gets the money-idea clue
        rd = step(pg)
        assert 'Sales' in pg.locator('.story-strip').inner_text() and 'Costs' in pg.locator('.story-strip').inner_text()
        answer(pg, rd, rd['predicted']['MF1'])
        assert 'That is all the money in. What is left after costs?' in pg.locator('.feedback').inner_text()
        axe(pg, 'money clue ' + scheme)
        answer(pg, rd, rd['answer']); pg.locator('[data-act="gameNext"]').click()
        # step 4: forgetting the sign is "forgot a cost"
        rd = step(pg); answer(pg, rd, rd['predicted']['MF2'])
        assert 'Is there another cost?' in pg.locator('.feedback').inner_text()
        answer(pg, rd, rd['answer']); pg.locator('[data-act="gameNext"]').click()
        # step 5: the idea check
        rd = step(pg); assert rd.get('choices') == ['Revenue', 'Profit']
        answer(pg, rd, 'Revenue'); pg.locator('[data-act="gameNext"]').click()
        # 3. the end screen names the math and the money idea
        end = pg.locator('main').inner_text()
        for t in ['Adventure complete!', 'You got 1 of 4 calculations right on the first try.', 'What math did you use?', 'Price times quantity', 'Revenue, cost and profit', 'The money in this story is pretend.']:
            assert t in end, (t, end[:300])
        axe(pg, 'adventure end ' + scheme)
        # 4. what is kept: first answers as story evidence, and the result like a game; nothing about spending
        rec = pg.evaluate("() => { const c = window.__tbChild(); return { a: c.adventures.lemonade, f1: c.skills.FN01.attempts.map((x) => [x.correct, x.kind]), f2: c.skills.FN02.attempts.map((x) => [x.correct, x.kind, x.mis]) }; }")
        assert rec['f1'] == [[True, 'transfer'], [False, 'transfer']], rec['f1']
        assert rec['f2'] == [[False, 'transfer', 'MF1'], [False, 'transfer', 'MF2']], rec['f2']
        assert len(rec['a']) == 1 and sorted(rec['a'][0].keys()) == ['at', 'first', 'idea', 'steps'] and rec['a'][0]['first'] == 1 and rec['a'][0]['idea'] is True, rec['a']
        # 5. no money carries over: a new run starts fresh, and nothing in the app is a wallet or balance
        pg.locator('[data-act="advStart"]').click()
        assert pg.evaluate("() => { const s = window.__tbSession(); return s.i === 0 && s.first === 0 && s.ideaRight === null; }")
        for v in ['map', 'adventures', 'journal', 'games']:
            t = pg.evaluate("(v) => window.__tbView(v)", v).lower()
            assert not re.search(r'\bwallet\b|\bbalance\b|\bearn coins\b|\byour money\b|\bshop for\b', t), v
        ctx.close()
    # 6. Arabic and a phone
    # reduced motion, like the other contexts: axe must measure the settled screen, not a fade-in
    ctx = b.new_context(viewport={'width': 360, 'height': 780}, reduced_motion='reduce')
    pg = ctx.new_page(); pg.on('pageerror', lambda e: errors.append(str(e)))
    setup(pg); pg.evaluate("() => window.__tbSetLang('ar')")
    pg.evaluate("() => window.__tbAdventure('lemonade')")
    assert pg.evaluate('() => document.documentElement.dir') == 'rtl'
    main = pg.locator('main').inner_text()
    for en in ['Story so far', 'Cups', 'Price', 'lemonade', 'How many dollars']:
        assert en not in main, en
    assert pg.evaluate('() => document.documentElement.scrollWidth <= window.innerWidth + 1'), 'no sideways scroll on a phone'
    pg.wait_for_function('() => document.getAnimations().every((a) => a.animationName !== "viewIn" || a.playState === "finished")')
    axe(pg, 'adventure in Arabic')
    ctx.close()
    b.close()
print('outside requests:', outside or 'none')
print('errors:', errors or 'none')
assert not errors and not outside
print('money adventures: ok')
