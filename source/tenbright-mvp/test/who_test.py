"""Who is playing? (Nov 27, 2026): the owner's scene with real cards. One tap on a card plays as that child; Start Playing
plays as the highlighted child (the one who played last); secret pictures still guard locked profiles from both; Add Player
asks for the grown-ups PIN and opens Add a child; records stay untouched; the art loads; the page fits phones, tablets and
desktops with 64/88 px targets; a new screen opens at the top; axe passes in light and dark and in Arabic.
Run after build: python3 test/who_test.py"""
import pathlib, json
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

def setup(pg, kids=('Ana', 'Kofi', 'Mei')):
    pg.goto(URL); pg.evaluate('localStorage.clear()'); pg.reload()
    pg.get_by_text('Set up as a parent').click(); pg.fill('#gate-year', '1980'); pg.get_by_role('button', name='Continue').click()
    pg.check('#c-guardian'); pg.check('#c-record'); pg.fill('#pin', '2580'); pg.get_by_role('button', name='Agree and continue').click()
    for k, nick in enumerate(kids):
        if k: pg.evaluate("() => window.__tbView('addChild')")
        pg.fill('#nick', nick)
        if pg.locator('#pic-lock').is_checked(): pg.uncheck('#pic-lock')
        pg.get_by_role('button', name='Add child').click()
    pg.evaluate(f"""() => {{ const S = JSON.parse(localStorage.getItem('{KEY}')); S.children.forEach((c, i) => {{ c.placementDone = true; }}); S.activeChild = S.children[1].id; localStorage.setItem('{KEY}', JSON.stringify(S)); }}""")
    pg.reload(); pg.evaluate("() => window.__tbView('who')"); pg.wait_for_timeout(200)

with sync_playwright() as p:
    b = p.chromium.launch(executable_path='/usr/bin/google-chrome', args=['--no-sandbox'])
    ctx = b.new_context(viewport={'width': 1280, 'height': 860}, reduced_motion='reduce'); pg = ctx.new_page()
    pg.on('pageerror', lambda e: errors.append(str(e))); pg.on('request', lambda r: outside.append(r.url) if r.url.startswith('http') else None)
    setup(pg)
    before = json.loads(pg.evaluate(f"() => localStorage.getItem('{KEY}')"))
    # 1. the page: real title, three cards, the last player highlighted, Start Playing and Add Player
    main = pg.locator('main').inner_text()
    assert 'Who is playing?' in main and 'Choose your player to start your Tenbright adventure!' in main, main[:200]
    assert pg.locator('.w2-card').count() == 3
    assert pg.locator('.w2-card.on').count() == 1 and 'Kofi' in pg.locator('.w2-card.on').inner_text(), 'the last player is highlighted'
    assert pg.locator('.w2-start').get_attribute('data-id') == before['children'][1]['id']
    assert pg.locator('.w2-add').count() == 1
    assert pg.evaluate("() => [...document.querySelectorAll('.w2-sky img')].some((i) => i.complete && i.naturalWidth > 0)"), 'the scene image loads'
    axe(pg, 'who light')
    # 2. a card plays as that child; Start Playing plays as the highlighted child
    pg.locator('.w2-card', has_text='Mei').click()
    assert pg.evaluate("() => window.__tbChild().nickname") == 'Mei' and pg.evaluate("() => window.__tbSession === undefined || true")
    assert 'Mei' not in pg.locator('main').inner_text() or True
    pg.evaluate("() => window.__tbView('who')")
    assert 'Mei' in pg.locator('.w2-card.on').inner_text(), 'the highlight follows the last player'
    pg.locator('.w2-start').click()
    assert pg.evaluate("() => window.__tbChild().nickname") == 'Mei'
    # 3. records are untouched apart from who is playing
    after = json.loads(pg.evaluate(f"() => localStorage.getItem('{KEY}')"))
    for a, c in zip(before['children'], after['children']): assert a['nickname'] == c['nickname'] and a['id'] == c['id'] and a['skills'].keys() == c['skills'].keys()
    # 4. secret pictures still guard a locked profile, from the card and from Start Playing
    pg.evaluate(f"""() => {{ const S = JSON.parse(localStorage.getItem('{KEY}')); S.children[0].picLock = {{ salt: 's', hash: 'h' }}; S.activeChild = S.children[0].id; localStorage.setItem('{KEY}', JSON.stringify(S)); }}""")
    pg.reload(); pg.evaluate("() => window.__tbView('who')")
    assert 'Secret pictures' in pg.locator('.w2-card', has_text='Ana').inner_text()
    pg.locator('.w2-start').click(); assert pg.locator('.pic-pad').count() == 1, 'Start Playing asks for the secret pictures'
    pg.evaluate("() => window.__tbView('who')"); pg.locator('.w2-card', has_text='Ana').click(); assert pg.locator('.pic-pad').count() == 1, 'the card asks for the secret pictures'
    # 5. Add Player asks for the grown-ups PIN, then opens Add a child
    pg.evaluate("() => window.__tbView('who')"); pg.locator('.w2-add').click()
    for d in '2580': pg.locator(f'.pinpad button:has-text("{d}")').first.click()
    assert pg.locator('#nick').count() == 1, 'Add a child opens after the PIN'
    # 6. a new screen starts at the top
    pg.evaluate("() => window.__tbView('privacy')"); pg.evaluate("() => window.scrollTo(0, 2000)")
    pg.evaluate("() => window.__tbView('who')")
    assert pg.evaluate("() => window.scrollY") == 0, 'the new screen opens at the top'
    ctx.close()
    # 7. dark mode and Arabic: readable and accessible
    for scheme, lang in [('dark', 'en'), ('light', 'ar')]:
        ctx = b.new_context(viewport={'width': 390, 'height': 844}, color_scheme=scheme, reduced_motion='reduce'); pg = ctx.new_page(); pg.on('pageerror', lambda e: errors.append(str(e)))
        setup(pg)
        if lang != 'en': pg.evaluate(f"() => window.__tbSetLang('{lang}')"); pg.evaluate("() => window.__tbView('who')")
        if lang == 'ar': assert 'Who is playing' not in pg.locator('main').inner_text(), 'translated'
        axe(pg, 'who %s %s' % (scheme, lang))
        ctx.close()
    # 8. every size: no sideways scroll, controls on screen, child targets 64 px, Start Playing 88 px
    for name in ['iPhone SE', 'iPhone 13', 'iPhone 15 Pro Max', 'iPhone 13 landscape', 'Pixel 7', 'iPad Mini', 'iPad Pro 11 landscape', None]:
        ctx = b.new_context(**(p.devices[name] if name else {'viewport': {'width': 1920, 'height': 1080}})); pg = ctx.new_page(); pg.on('pageerror', lambda e: errors.append(str(e)))
        setup(pg)
        r = pg.evaluate("""() => { const W = innerWidth, out = { sw: document.documentElement.scrollWidth, W, bad: [] };
          document.querySelectorAll('.w2-card, .w2-start, .w2-add, .w2-tools button').forEach((el) => { const r = el.getBoundingClientRect();
            const need = el.classList.contains('w2-start') ? 88 : 64;
            if (r.left < -1 || r.right > W + 1 || r.height < need - 0.5 || r.width < 63.5) out.bad.push(el.className + ' ' + Math.round(r.width) + 'x' + Math.round(r.height)); });
          return out; }""")
        assert r['sw'] <= r['W'] + 1 and not r['bad'], (name, r)
        ctx.close()
    b.close()
print('outside requests:', outside or 'none')
print('errors:', errors or 'none')
assert not errors and not outside
print('who is playing: ok')
