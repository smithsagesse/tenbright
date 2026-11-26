"""Discovery Adventure (Tenbright 2.0, Phase 2): the starting walk as a game in parts that can pause and resume,
a gentle start when the parent says math feels hard, a start near the school grade, two kinds of question per check,
a no-story follow-up after a missed story, no grade or score shown to the child, the parent report, understanding
per skill, and the notice update before the new optional answers are kept. Light and dark accessibility.
Run after build: python3 test/discovery_test.py"""
import json, pathlib
from playwright.sync_api import sync_playwright
ROOT = pathlib.Path(__file__).resolve().parent.parent
URL = (ROOT / 'dist' / 'test.html').as_uri() + '#selftest'
AXE = (ROOT / 'test' / 'axe.min.js').read_text()
KEY = 'tenbright-mvp-v1'
errors, outside = [], []

def axe(pg, name):
    if not pg.evaluate('!!window.axe'): pg.add_script_tag(content=AXE)
    v = pg.evaluate("async () => (await axe.run(document, { runOnly: ['wcag2a','wcag2aa','wcag21aa','wcag22aa'] })).violations.map(v => v.id + ':' + v.nodes.length)")
    assert not v, (name, v)

def answer(pg, right):
    """Answer the question on screen, right or wrong (a wrong answer is never one of Pip's known mistake patterns)."""
    it = pg.evaluate("() => { const s = window.__tbSession(); return { ans: s.item.answer, fmt: s.item.format, pred: Object.values(s.item.predicted || {}) }; }")
    if pg.locator('.choices button[data-act="choose"]').count():
        vs = pg.evaluate("() => [...document.querySelectorAll('.choices button[data-act=choose]')].map(b => b.dataset.v)")
        v = it['ans'] if right else ([x for x in vs if x != it['ans'] and x not in it['pred']] or [x for x in vs if x != it['ans']])[0]
        pg.locator('.choices button[data-act="choose"][data-v="%s"]' % v).click()
    elif it['fmt'] == 'build':
        n = int(it['ans']) if right else 99
        pg.evaluate("(n) => { window.__tbSession().soroban = [Math.floor(n / 100), Math.floor(n / 10) % 10, n % 10]; }", n)
    else:
        v = it['ans'] if right else '99'
        for ch in v: pg.locator('.pad button[data-d="%s"]' % ch).click()
    pg.locator('.checkbtn').click()

def setup_parent(pg):
    pg.goto(URL); pg.evaluate('localStorage.clear()'); pg.reload()
    pg.get_by_text('Set up as a parent').click(); pg.fill('#gate-year', '1980'); pg.get_by_role('button', name='Continue').click()
    pg.check('#c-guardian'); pg.check('#c-record'); pg.fill('#pin', '2580'); pg.get_by_role('button', name='Agree and continue').click()

def add_child(pg, nick, grade, conf=None):
    pg.fill('#nick', nick); pg.select_option('#sgrade', grade)
    if conf: pg.select_option('#feel-conf', conf)
    pg.uncheck('#pic-lock'); pg.get_by_role('button', name='Add child').click()

with sync_playwright() as p:
    b = p.chromium.launch(executable_path='/usr/bin/google-chrome', args=['--no-sandbox'])
    for scheme in ['light', 'dark']:
        ctx = b.new_context(viewport={'width': 1100, 'height': 900}, color_scheme=scheme, reduced_motion='reduce')
        pg = ctx.new_page()
        pg.on('pageerror', lambda e: errors.append(str(e)))
        pg.on('request', lambda r: outside.append(r.url) if r.url.startswith('http') else None)
        setup_parent(pg)
        # 1. the two optional questions are offered under the current notice, and "worried" gives a gentle start
        assert pg.locator('#feel-enjoy').count() == 1 and pg.locator('#feel-conf').count() == 1, 'optional questions missing'
        assert pg.locator('#feel-enjoy option').first.inner_text() == 'Skip', 'questions must be skippable'
        axe(pg, 'add child ' + scheme)
        add_child(pg, 'Ana', '2', 'worried')
        assert pg.evaluate('() => window.__tbChild().feel.confidence') == 'worried'
        pg.locator('.kid').first.click()
        intro = pg.locator('.speech').inner_text()
        assert 'Welcome, Math Explorer!' in intro and 'made by a computer' in intro, 'adventure greeting or computer-helper line missing'
        pg.get_by_text("Let's explore!").click()
        assert pg.evaluate('() => window.__tbSession().item.skill') == 'C107', 'gentle start should open with an easier check'
        assert 'Number adventure' in pg.locator('main').inner_text()
        # 2. play: miss the story, get the rest of it right; take a break at the first rest stop, then resume
        rests = 0; probes = []; resumed = False; n = 0; child_text = []
        while not pg.get_by_text('Thanks for exploring!').count() and n < 45:
            n += 1
            if pg.locator('[data-act="restGo"]').count():
                rests += 1
                child_text.append(pg.locator('main').inner_text())
                assert 'part %d of the adventure' % rests in pg.locator('h1').inner_text(), 'rest stop part number'
                if rests == 1:
                    axe(pg, 'rest stop ' + scheme)
                    items = pg.evaluate('() => window.__tbChild().walk.items')
                    pg.locator('[data-act="restBreak"]').click()
                    assert pg.evaluate('() => window.__tbView("who") && 1')
                    saved = pg.evaluate('() => JSON.parse(localStorage.getItem("%s")).children[0].walk' % KEY)
                    assert saved and saved.get('items') == items and not saved.get('done'), 'walk not saved for later'
                    pg.locator('.kid').first.click()
                    assert 'Welcome back, Math Explorer!' in pg.locator('.speech').inner_text(), 'no welcome back'
                    pg.get_by_text("Let's explore!").click()
                    assert pg.evaluate('() => window.__tbSession().ps.items') == items, 'resume did not keep the place'
                    resumed = True
                else:
                    pg.locator('[data-act="restGo"]').click()
                continue
            s = pg.evaluate('() => { const s = window.__tbSession(); return { sk: s.item.skill, probe: s.probe }; }')
            if s['probe']: probes.append((s['probe'], s['sk']))
            child_text.append(pg.locator('main').inner_text())
            answer(pg, s['sk'] != 'WP02')
            pg.locator('.checkbtn').click()
        assert pg.get_by_text('Thanks for exploring!').is_visible(), 'walk did not finish'
        assert resumed and rests >= 2, 'rest stops: %d' % rests
        assert ('reading', 'AS05') in probes, 'no no-story follow-up after the missed story: %s' % probes
        end = pg.locator('main').inner_text()
        assert "Let's build them together!" in end
        # 3. nothing the child sees names a grade, a level or a score
        for t in child_text + [end]:
            assert 'Grade' not in t and 'level' not in t.lower() and 'score' not in t.lower(), 'child saw a grade or score: ' + t[:120]
        ev = pg.evaluate('() => window.__tbChild().discovery')
        assert ev and 'WP02' in ev['building'] and any(x['kind'] == 'reading' and x['skill'] == 'WP02' for x in ev['notes']), ev
        assert pg.evaluate('() => !window.__tbChild().walk'), 'finished walk should not stay saved'
        # two kinds of question for at least one check
        # (the saved summary keeps only results, so check the session's evidence)
        fm = pg.evaluate('() => Object.values(window.__tbSession().ps.ev).filter((e) => e.formats.length >= 2).length')
        assert fm >= 1, 'no check used two kinds of question'
        # 4. parent page: what the adventure found, and understanding per skill
        pg.evaluate("() => window.__tbView('dashboard')")
        txt = pg.locator('main').inner_text()
        assert 'what the discovery adventure found' in txt.lower() and 'The math was right when the numbers came without a story.' in txt, 'parent report missing'
        assert 'This is a starting point, not a grade.' in txt
        assert pg.locator('th', has_text='Understanding').count() == 1 and 'Understands' in txt
        assert 'privacy notice updated' not in txt.lower(), 'current consent should not ask again'
        axe(pg, 'parent page ' + scheme)
        # 5. a parent who agreed to the older notice is asked again before the new answers are kept
        pg.evaluate("""() => { const s = JSON.parse(localStorage.getItem('%s')); s.parent.notice = 'Privacy notice v1.2, November 5, 2026'; localStorage.setItem('%s', JSON.stringify(s)); }""" % (KEY, KEY))
        pg.reload(); pg.evaluate("() => window.__tbView('dashboard')")
        assert 'privacy notice updated' in pg.locator('main').inner_text().lower(), 'old-notice parent not asked'
        pg.evaluate("() => window.__tbView('addChild')")
        assert pg.locator('#feel-conf').count() == 0, 'new answers offered before agreeing to the new notice'
        pg.evaluate("() => window.__tbView('dashboard')"); pg.locator('[data-act="reconsent"]').click()
        st = pg.evaluate("() => JSON.parse(localStorage.getItem('%s')).parent" % KEY)
        assert st['notice'].startswith('Privacy notice v1.3') and st['consentHistory'][-1]['notice'].startswith('Privacy notice v1.2'), st
        assert 'privacy notice updated' not in pg.locator('main').inner_text().lower()
        pg.evaluate("() => window.__tbView('addChild')"); assert pg.locator('#feel-conf').count() == 1
        # 6. the walk starts near the school grade (Grade 5) and a skipped question stores nothing
        add_child(pg, 'Ben', '5')
        assert pg.evaluate('() => window.__tbChild().feel === undefined'), 'skipped questions should store nothing'
        pg.locator('.kid', has_text='Ben').click(); pg.get_by_text("Let's explore!").click()
        assert pg.evaluate('() => window.__tbSession().item.skill') == 'AS15', 'Grade 5 walk should start near Grade 5'
        # 7. money, time, measuring and shapes: a Grade 3 walk ends with a clock check and an area check, 2 questions each,
        # each with its picture, and a passed spot check credits its own strand
        if scheme == 'light':
            pg.evaluate("() => window.__tbView('addChild')"); add_child(pg, 'Cy', '3')
            pg.locator('.kid', has_text='Cy').click(); pg.get_by_text("Let's explore!").click()
            asked, pics, n = [], {}, 0
            while not pg.get_by_text('Thanks for exploring!').count() and n < 60:
                n += 1
                if pg.locator('[data-act="restGo"]').count(): pg.locator('[data-act="restGo"]').click(); continue
                s = pg.evaluate('() => { const s = window.__tbSession(); return { sk: s.item.skill, probe: s.probe }; }')
                if not s['probe']: asked.append(s['sk'])
                if s['sk'] in ('TM03', 'MS04'): pics[s['sk']] = pics.get(s['sk'], 0) + pg.locator('svg.clock-svg, svg.mpic, .paper-sheet').count()
                answer(pg, True)
                pg.locator('.checkbtn').click()
            assert pg.get_by_text('Thanks for exploring!').is_visible(), 'Grade 3 walk did not finish'
            assert asked.count('TM03') == 2 and asked.count('MS04') == 2, 'strand spot checks: %s' % asked
            assert asked.index('TM03') > asked.index('AS12'), 'core number checks come first: %s' % asked
            assert pics.get('TM03') and pics.get('MS04'), 'strand questions show their pictures: %s' % pics
            assert len(asked) <= pg.evaluate('() => window.TBEngine.PLACEMENT_MAX_ITEMS') == 29
            st = pg.evaluate("() => { const c = window.__tbChild(); return ['TM01', 'TM02', 'TM03', 'MS01', 'MS03', 'MS04', 'MY01'].map((id) => c.skills[id].status); }")
            assert st[:6] == ['placed'] * 6 and st[6] != 'placed', 'strand credit: %s' % st
            pg.evaluate("() => window.__tbView('dashboard')"); pg.locator('[data-act="dashChild"]', has_text='Cy').click()
            found = pg.locator('section.card', has_text='What the Discovery Adventure found').inner_text()
            assert 'time to the minute' in found and 'area of a rectangle' in found, found
        # 8. the privacy notice lists the new answers
        pg.evaluate("() => window.__tbView('privacy')")
        assert 'two optional answers about how the child feels about math' in pg.locator('main').inner_text()
        ctx.close()
    b.close()
print('outside requests:', outside or 'none')
print('errors:', errors or 'none')
assert not errors and not outside
print('discovery adventure: ok')
