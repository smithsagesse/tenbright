"""New learning features: Fix Pip's mistake, Why did that work, Lantern Line, journal, accessibility of new screens, offline app.
Run after build: python3 test/features_test.py"""
import os
import pathlib, subprocess, sys, time, socket
from playwright.sync_api import sync_playwright
ROOT = pathlib.Path(__file__).resolve().parent.parent
URL = (ROOT / os.environ.get('DIST', 'dist') / 'test.html').as_uri() + '#selftest'
AXE = (ROOT / 'test' / 'axe.min.js').read_text()
errors = []
def axe(pg, name):
    if not pg.evaluate('!!window.axe'): pg.add_script_tag(content=AXE)
    v = pg.evaluate("async () => (await axe.run(document, { runOnly: ['wcag2a','wcag2aa','wcag21aa','wcag22aa'] })).violations.map(v => v.id + ':' + v.nodes.length)")
    assert not v, (name, v)
with sync_playwright() as p:
    b = p.chromium.launch(executable_path='/usr/bin/google-chrome', args=['--no-sandbox'])
    pg = b.new_page(viewport={'width': 1024, 'height': 860}, reduced_motion='reduce')
    pg.on('pageerror', lambda e: errors.append(str(e)))
    pg.goto(URL); pg.evaluate('localStorage.clear()'); pg.reload()
    pg.get_by_text('Try the sample learner').click()
    pg.fill('#gate-year', '1980'); pg.get_by_role('button', name='Continue').click()
    # 1. Fix Pip's mistake
    for sk in ['AS07', 'F413', 'F508', 'MU10']:
        pg.evaluate('(s) => window.__tbShowMistake(s)', sk)
        assert pg.get_by_text('Fix Pip’s mistake!').is_visible()
        axe(pg, 'mistake-why ' + sk)
        mis = pg.evaluate('() => window.__tbSession().item.mis')
        pg.locator('[data-act="mwhy"][data-k="%s"]' % mis).click()
        assert pg.locator('.feedback.ok').count() == 1, 'right reason not confirmed'
        ans = pg.evaluate('() => window.__tbSession().item.answer')
        for ch in ans:
            pg.locator('[data-act="digit"][data-d="%s"]' % ch).click()
        pg.locator('[data-act="check"]').click()
        assert 'You fixed Pip' in pg.locator('main').inner_text(), 'fix not praised'
        axe(pg, 'mistake-fixed ' + sk)
    print('fix Pip\'s mistake: ok')
    # 2. Why did that work (first-try correct answer in practice)
    pg.evaluate("() => window.__tbShow('AS05', 0)")
    pg.evaluate("() => { const s = window.__tbSession(); s.mode = 'practice'; s.whyDone = false; s.item = Object.assign(s.item, {}); }")
    ans = pg.evaluate("() => window.__tbSession().item.answer")
    if pg.locator('.choices button').count():
        pg.locator('.choices button[data-v="%s"]' % ans).click()
    else:
        for ch in ans: pg.locator('[data-act="digit"][data-d="%s"]' % ch).click()
    pg.locator('[data-act="check"]').click()
    assert pg.get_by_text('Why did that work?').is_visible(), 'why question missing'
    axe(pg, 'why')
    right = pg.evaluate('() => window.__tbSession().why.answer')
    pg.locator('[data-act="why"][data-i="%d"]' % right).click()
    assert pg.locator('.why-a').inner_text().startswith('Yes!')
    print('why did that work: ok')
    # 3. Lantern Line warm-up, 5 rounds, by slider and by tap
    pg.locator('[data-act="exitSession"]').click()
    pg.locator('[data-act="lineStart"]').click()
    axe(pg, 'line')
    for i in range(5):
        if i % 2:
            box = pg.locator('svg.line-svg').bounding_box(); pg.mouse.click(box['x'] + box['width'] * 0.37, box['y'] + box['height'] * 0.45)
        else:
            tgt = pg.evaluate('() => { const L = window.__tbSession().line; return L.items[L.i].target; }')
            pg.evaluate('(v) => { const el = document.getElementById("line-range"); el.value = v; el.dispatchEvent(new Event("input", { bubbles: true })); }', tgt)
        pg.locator('[data-act="lineCheck"]').click()
        assert pg.locator('.bubble').inner_text().strip(), 'no verdict'
        if i == 0: assert 'Bullseye' in pg.locator('.bubble').inner_text(), 'exact placement not a bullseye'
        pg.locator('[data-act="lineNext"]').click()
    assert pg.get_by_text('Warm-up done!').is_visible()
    axe(pg, 'lineEnd')
    print('lantern line: ok')
    # 4. journal shows number sense and detective work
    pg.get_by_role('button', name='Back to the map').click()
    pg.locator('[data-act="go"][data-to="journal"]').click()
    jt = pg.locator('main').inner_text()
    assert 'Pip\'s mistakes I fixed: 4' in jt.replace('\n', ' ').replace('  ', ' ') or 'fixed:\n4' in jt or "fixed: 4" in jt, jt[:400]
    assert pg.locator('svg.spark').count() == 1 or 'Last warm-up' in jt
    axe(pg, 'journal')
    print('journal: ok')
    # 5. parent page shows number sense and thinking skills
    pg.locator('[data-act="go"][data-to="map"]').click()
    pg.locator('[data-act="pin"]').first.click()
    for d in '1234': pg.locator('[data-act="pinDigit"][data-d="%s"]' % d).click()
    dt = pg.locator('main').inner_text().lower()
    assert 'number sense' in dt and 'thinking skills' in dt, dt[:600]
    pg.check('#big-text'); assert pg.evaluate("document.documentElement.classList.contains('big-text')")
    axe(pg, 'dashboard')
    print('parent page + larger text: ok')
    b.close()
# 6. offline app when served from a website
sock = socket.socket(); sock.bind(('127.0.0.1', 0)); PORT = sock.getsockname()[1]; sock.close()
srv = subprocess.Popen([sys.executable, '-m', 'http.server', str(PORT), '--bind', '127.0.0.1'], cwd=ROOT / os.environ.get('DIST', 'dist'), stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
time.sleep(0.8)
try:
    with sync_playwright() as p:
        b = p.chromium.launch(executable_path='/usr/bin/google-chrome', args=['--no-sandbox'])
        ctx = b.new_context()
        pg = ctx.new_page(); pg.on('pageerror', lambda e: errors.append(str(e)))
        pg.goto('http://127.0.0.1:%d/index.html' % PORT)
        pg.wait_for_function('navigator.serviceWorker && navigator.serviceWorker.controller !== null || (navigator.serviceWorker.ready && false)', timeout=2000) if False else None
        pg.evaluate('navigator.serviceWorker.ready.then(() => true)')
        pg.reload(); pg.wait_for_timeout(500)
        ctx.set_offline(True)
        pg.reload(); pg.wait_for_timeout(500)
        assert pg.get_by_text('Set up as a parent').is_visible(), 'app did not open offline'
        print('offline app: ok')
        b.close()
finally:
    srv.terminate()
print('errors:', errors or 'none')
assert not errors
