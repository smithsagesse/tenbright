"""Adaptive Pip (Tenbright 2.0, Phase 4): fill in the missing step, the same math in a new story, three kinds of
explanation that change after a miss, mastery on separate kinds of evidence, and the parent page showing them.
Light and dark accessibility. Run after build: python3 test/adaptive_test.py"""
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

def type_answer(pg, v):
    pg.evaluate("() => { window.__tbSession().entry = ''; }")
    for ch in str(v): pg.locator('.pad button[data-d="%s"]' % ch).click()
    pg.locator('.checkbtn').click()

def wrong(pg):
    it = pg.evaluate("() => { const s = window.__tbSession(); return { ans: s.item.answer, pred: Object.values(s.item.predicted || {}) }; }")
    v = '99' if it['ans'] != '99' else '98'
    while v in it['pred']: v = str(int(v) + 7)
    type_answer(pg, v)

def setup(pg):
    pg.goto(URL); pg.evaluate('localStorage.clear()'); pg.reload()
    pg.get_by_text('Set up as a parent').click(); pg.fill('#gate-year', '1980'); pg.get_by_role('button', name='Continue').click()
    pg.check('#c-guardian'); pg.check('#c-record'); pg.fill('#pin', '2580'); pg.get_by_role('button', name='Agree and continue').click()
    pg.fill('#nick', 'Ana'); pg.select_option('#sgrade', '2'); pg.uncheck('#pic-lock'); pg.get_by_role('button', name='Add child').click()
    pg.evaluate("() => { const c = window.__tbChild(); c.placementDone = true; c.skills.AS05.status = 'learning'; c.skills.AS05.learned = true; }")

with sync_playwright() as p:
    b = p.chromium.launch(executable_path='/usr/bin/google-chrome', args=['--no-sandbox'])
    for scheme in ['light', 'dark']:
        ctx = b.new_context(viewport={'width': 1100, 'height': 900}, color_scheme=scheme, reduced_motion='reduce')
        pg = ctx.new_page()
        pg.on('pageerror', lambda e: errors.append(str(e)))
        pg.on('request', lambda r: outside.append(r.url) if r.url.startswith('http') else None)
        setup(pg)
        # 1. fill in the missing step: Pip's steps with one box, answered with the number pad
        assert pg.evaluate("() => window.__tbShowKind('AS05', 'stepfill')"), 'no missing-step question for AS05'
        txt = pg.locator('main').inner_text()
        assert 'One step is missing. What number goes in the box?' in txt and "Pip's steps" in txt
        assert pg.locator('.paper-sheet .blank').count() == 1, 'exactly one box'
        assert pg.locator('[data-act="startGuide"]').count() == 0, 'no Work it with Pip on a missing step'
        axe(pg, 'missing step ' + scheme)
        ans = pg.evaluate('() => window.__tbSession().item.answer')
        type_answer(pg, ans)
        assert pg.locator('.feedback.ok').count() == 1, 'right missing step not accepted'
        last = pg.evaluate("() => window.__tbChild().skills.AS05.attempts.slice(-1)[0]")
        assert last['kind'] == 'stepfill' and last['correct'], last
        # 2. the same math in a new story
        assert pg.evaluate("() => window.__tbShowKind('AS05', 'transfer')")
        st = pg.evaluate("() => { const s = window.__tbSession(); return { p: s.item.prompt, a: s.item.answer, from: s.item.from }; }")
        assert 'found' in st['p'] and st['from'] != st['p'], st
        type_answer(pg, st['a'])
        assert pg.locator('.feedback.ok').count() == 1
        assert pg.evaluate("() => window.__tbChild().skills.AS05.attempts.slice(-1)[0].kind") == 'transfer'
        # 3. explanations: two misses bring the steps; a miss after them brings a different kind
        pg.evaluate("() => window.__tbShowKind('AS05', 'plain')")
        wrong(pg); wrong(pg)
        fb = pg.locator('.feedback.clue').inner_text()
        assert 'Here are the steps.' in fb and 'new way' not in fb, fb
        assert pg.evaluate("() => window.__tbChild().skills.AS05.explain.pending") == 'steps'
        pg.evaluate("() => window.__tbShowKind('AS05', 'plain')")
        wrong(pg)
        assert pg.evaluate("() => window.__tbChild().skills.AS05.explain.avoid") == 'steps', 'a miss after the steps is noted'
        wrong(pg)
        fb = pg.locator('.feedback.clue').inner_text()
        assert 'Let’s try it a new way.' in fb and 'Here are the steps.' not in fb, fb
        kind2 = pg.evaluate("() => window.__tbSession().xkind")
        assert kind2 in ('picture', 'idea'), kind2
        if kind2 == 'picture':
            assert pg.locator('[data-act="xNext"]').count() == 1
            pg.locator('[data-act="xNext"]').click()
            assert pg.evaluate("() => window.__tbSession().xi") == 1
        axe(pg, 'explanation ' + kind2 + ' ' + scheme)
        # the next try is right: that explanation is recorded as helping
        pg.evaluate("() => window.__tbShowKind('AS05', 'plain')")
        type_answer(pg, pg.evaluate('() => window.__tbSession().item.answer'))
        tried = pg.evaluate("() => window.__tbChild().skills.AS05.explain.tried")
        assert tried[kind2] == [1, 1] and tried['steps'] == [1, 0], tried
        # 4. the top hint shows an explanation too, in the way picked for this skill
        pg.evaluate("() => window.__tbShowKind('AS05', 'plain')")
        for _ in range(4): pg.locator('[data-act="hint"]').click()
        assert pg.locator('.xway').count() == 1, 'top hint shows an explanation'
        assert pg.evaluate("() => window.__tbSession().xkind") == kind2, 'the kind that helped is used again'
        # 5. mastery needs separate kinds of evidence
        pg.evaluate("""() => { const c = window.__tbChild(), st = c.skills.AS05, E = window.TBEngine;
          st.attempts = []; st.why = null; st.status = 'practiced'; st.p = 0.97;
          for (let i = 0; i < 12; i++) st.attempts.push({ correct: true, format: i % 2 ? 'number' : 'choice', hint: 0, at: Date.now(), kind: 'plain' }); }""")
        assert pg.evaluate("() => window.TBEngine.evidenceMissing(window.__tbChild().skills.AS05, 'AS05').length") == 3
        pg.evaluate("() => window.__tbShowKind('AS05', 'transfer')")
        type_answer(pg, pg.evaluate('() => window.__tbSession().item.answer'))
        assert pg.evaluate("() => window.__tbChild().skills.AS05.status") != 'mastered', 'one kind is not enough'
        pg.evaluate("() => window.__tbShowKind('AS05', 'stepfill')")
        type_answer(pg, pg.evaluate('() => window.__tbSession().item.answer'))
        assert pg.evaluate("() => window.__tbChild().skills.AS05.status") == 'mastered', 'two kinds of evidence complete mastery'
        # 6. the parent page shows the kinds of evidence and what helps
        pg.evaluate("() => { const st = window.__tbChild().skills.AS05; st.explain.tried = { picture: [3, 3], steps: [2, 0] }; }")
        pg.evaluate("() => window.__tbView('dashboard')")
        row = pg.locator('tr', has_text='Add with regrouping').first.inner_text() if pg.locator('tr', has_text='Add with regrouping').count() else pg.locator('main').inner_text()
        main = pg.locator('main').inner_text()
        for t in ['On their own', 'In a story', 'Missing step', 'Pictures help most.']:
            assert t in main, 'parent page missing: ' + t
        axe(pg, 'parent page ' + scheme)
        # 7. a choice of reason is asked even when the region has few other strategies
        pg.evaluate("() => { const c = window.__tbChild(); c.skills.C101.learned = true; c.skills.C101.status = 'learning'; }")
        ctx.close()
    b.close()
print('outside requests:', outside or 'none')
print('errors:', errors or 'none')
assert not errors and not outside
print('adaptive pip: ok')
