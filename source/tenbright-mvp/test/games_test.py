"""Math games (Tenbright 2.0, Phase 5): Build the Bridge, Pizza Shop and Number Detective. Games open only when their
skills are lit; a wrong answer gets a clue, a second one shows how; no clock unless the child chooses the optional timed
run, which is offered only after the game has been finished once; the parent page lists games played; games never
change mastery. Keyboard play for pizza slices; axe in light and dark; Arabic layout.
Run after build: python3 test/games_test.py"""
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
    pg.fill('#nick', 'Ana'); pg.select_option('#sgrade', '2'); pg.uncheck('#pic-lock'); pg.get_by_role('button', name='Add child').click()
    pg.evaluate("() => { window.__tbChild().placementDone = true; }")

def rd(pg):
    return pg.evaluate("() => { const s = window.__tbSession(); return s.rounds[s.i]; }")

def answer_round(pg, right, keyboard=False):
    r = rd(pg)
    g = r['game']
    if g == 'bridge':
        v = r['answer'] if right else [c for c in r['choices'] if c != r['answer']][0]
        pg.locator('[data-act="plank"][data-v="%s"]' % v).click()
    elif g == 'pizza':
        n = int(r['answer']) if right else int(r['answer']) + 1
        for k in range(n):
            loc = pg.locator('[data-act="slice"][data-k="%d"]' % k)
            if keyboard: loc.focus(); pg.keyboard.press('Enter')
            else: loc.click()
    else:
        v = r['answer'] if right else str(int(r['answer']) + 1)
        for ch in v: pg.locator('[data-act="gdigit"][data-d="%s"]' % ch).click()
    pg.locator('[data-act="gameCheck"]').click()

def reset_entry(pg):
    pg.evaluate("() => { const s = window.__tbSession(); s.picked = null; s.slices = []; s.entry = ''; }")

with sync_playwright() as p:
    b = p.chromium.launch(executable_path='/usr/bin/google-chrome', args=['--no-sandbox'])
    for scheme in ['light', 'dark']:
        ctx = b.new_context(viewport={'width': 1100, 'height': 900}, color_scheme=scheme, reduced_motion='reduce')
        pg = ctx.new_page()
        pg.on('pageerror', lambda e: errors.append(str(e)))
        pg.on('request', lambda r: outside.append(r.url) if r.url.startswith('http') else None)
        setup(pg)
        # 1. games are on the map; a new child's games are closed until skills are lit
        pg.evaluate("() => window.__tbView('map')")
        pg.locator('[data-act="dest"][data-id="games"]').click(); pg.locator('.dest-card [data-act="go"][data-to="games"]').click()
        txt = pg.locator('main').inner_text()
        for name in ['Build the Bridge', 'Pizza Shop', 'Number Detective']: assert name in txt, name
        assert pg.locator('[data-act="gameStart"]').count() == 0 and txt.count('Light more lanterns to open it.') == 5, 'games and races should be closed'
        axe(pg, 'games list closed ' + scheme)
        # 2. each game, each level: play all rounds; a clue after a miss, "how" after two; no clock
        for g, levels in [('bridge', 3), ('pizza', 3), ('detective', 2)]:
            for lv in range(1, levels + 1):
                mastery = pg.evaluate("() => JSON.stringify(Object.fromEntries(Object.entries(window.__tbChild().skills).map(([k, v]) => [k, v.attempts.length])))")
                pg.evaluate("([g, lv]) => window.__tbGame(g, lv)", [g, lv])
                assert pg.evaluate('() => window.__tbSession().level') == lv
                assert pg.locator('#game-time').count() == 0, 'no clock on an ordinary game'
                if lv == 1: axe(pg, g + ' round ' + scheme)
                answer_round(pg, False)
                fb = pg.locator('.feedback').inner_text()
                assert 'clue' in fb.lower() and 'Try again' in fb, fb
                reset_entry(pg); answer_round(pg, False)
                fb = pg.locator('.feedback').inner_text()
                assert 'Here is how.' in fb, fb
                pg.locator('[data-act="gameNext"]').click()
                for i in range(4):
                    answer_round(pg, True, keyboard=(g == 'pizza' and i == 0))
                    assert 'Right!' in pg.locator('.feedback').inner_text()
                    pg.locator('[data-act="gameNext"]').click()
                end = pg.locator('main').inner_text()
                assert 'You got 4 of 5 on the first try.' in end, end
                assert 'time' not in end.lower(), 'no time shown after an ordinary game'
                after = pg.evaluate("() => JSON.stringify(Object.fromEntries(Object.entries(window.__tbChild().skills).map(([k, v]) => [k, v.attempts.length])))")
                assert after == mastery, 'games must not change mastery records'
        axe(pg, 'game end ' + scheme)
        # 3. the timed run is offered only after a game is finished, and counts up
        pg.evaluate("() => window.__tbView('games')")
        assert pg.locator('[data-act="gameStart"][data-timed="1"]').count() == 3, 'timed run after finishing each game'
        pg.locator('[data-act="gameStart"][data-g="bridge"][data-timed="1"]').click()
        assert pg.locator('#game-time').count() == 1
        for i in range(5):
            answer_round(pg, True); pg.locator('[data-act="gameNext"]').click()
        end = pg.locator('main').inner_text()
        assert 'Your time:' in end and 'That is your best time so far!' in end, end
        best = pg.evaluate("() => window.__tbChild().games.bridge.best")
        assert best and all(v > 0 for v in best.values()), best
        # 4. the parent page lists games played
        pg.evaluate("() => window.__tbView('dashboard')")
        main = pg.locator('main').inner_text()
        assert 'Build the Bridge: played' in main and 'Games never count toward mastery.' in main, main[:300]
        axe(pg, 'parent page ' + scheme)
        ctx.close()
    # 5. Arabic: the games read right to left and nothing is left in English on the pizza round
    ctx = b.new_context(viewport={'width': 1100, 'height': 900})
    pg = ctx.new_page()
    pg.on('pageerror', lambda e: errors.append(str(e)))
    setup(pg)
    pg.evaluate("() => window.__tbSetLang('ar')")
    pg.evaluate("() => window.__tbGame('pizza', 2)")
    assert pg.evaluate('() => document.documentElement.dir') == 'rtl'
    bubble = pg.locator('.bubble').inner_text()
    assert 'customer' not in bubble and 'pizza' not in bubble.lower(), bubble
    axe(pg, 'pizza in Arabic')
    ctx.close()
    b.close()
print('outside requests:', outside or 'none')
print('errors:', errors or 'none')
assert not errors and not outside
print('math games: ok')
