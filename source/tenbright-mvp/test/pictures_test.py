"""Pictures of what is being learned (owner's rule, Nov 27, 2026): a coin question shows that real US coin, a money story
shows its coins, bills, price tags and objects, a groups story draws the story's own things, and every picture file loads
from the app's own folder. The pictures are decorative (the question text carries the facts), so they are hidden from
screen readers and never give the answer away. Run after build: python3 test/pictures_test.py"""
import pathlib
from playwright.sync_api import sync_playwright
ROOT = pathlib.Path(__file__).resolve().parent.parent
URL = (ROOT / 'dist' / 'test.html').as_uri() + '#selftest'
errors, outside = [], []

def setup(pg):
    pg.goto(URL); pg.evaluate('localStorage.clear()'); pg.reload()
    pg.get_by_text('Set up as a parent').click(); pg.fill('#gate-year', '1980'); pg.get_by_role('button', name='Continue').click()
    pg.check('#c-guardian'); pg.check('#c-record'); pg.fill('#pin', '2580'); pg.get_by_role('button', name='Agree and continue').click()
    pg.fill('#nick', 'Ana'); pg.select_option('#sgrade', '3'); pg.uncheck('#pic-lock'); pg.get_by_role('button', name='Add child').click()
    pg.evaluate("() => { const c = window.__tbChild(); c.placementDone = true; c.focus = 'all'; }")

def imgs(pg):
    pg.wait_for_function("() => [...document.querySelectorAll('.work img, main img')].every((i) => i.complete)")
    return pg.evaluate("() => [...document.querySelectorAll('.scene img, .obj-hero img, .grp.og img, .coins-row img')].map((i) => [i.getAttribute('src'), i.naturalWidth])")

with sync_playwright() as p:
    b = p.chromium.launch(executable_path='/usr/bin/google-chrome', args=['--no-sandbox'])
    pg = b.new_page(viewport={'width': 1000, 'height': 900}, reduced_motion='reduce')
    pg.on('pageerror', lambda e: errors.append(str(e)))
    pg.on('request', lambda r: outside.append(r.url) if r.url.startswith('http') else None)
    setup(pg)
    seen = set()
    # 1. coin questions show the coin they name, as a real coin picture
    for r in range(12):
        pg.evaluate("(r) => window.__tbShow('MY01', 0)", r)
        q = pg.evaluate("() => (window.__tbSession().item.q || window.__tbSession().item.prompt)")
        srcs = [s for s, w in imgs(pg)]
        for name in ['penny', 'nickel', 'dime', 'quarter']:
            if ('1 ' + name) in q and 'and' not in q: assert 'art/coin-' + name + '.webp' in srcs, (q, srcs)
        seen.update(srcs)
    # 2. money and story questions: every picture loads, is hidden from screen readers, and holds no answer
    for sid in ['MY03', 'MY04', 'FN01', 'FN02', 'FN03', 'FN04', 'FN05', 'FN06', 'FN07', 'WP04', 'WP05', 'C114', 'F411']:
        for r in range(6):
            pg.evaluate("([s, r]) => window.__tbShow(s, r % 2)", [sid, r])
            got = imgs(pg)
            assert got, (sid, r, 'no picture')
            for s, w in got: assert w > 0, (sid, s, 'did not load')
            seen.update(s for s, w in got)
            ans = str(pg.evaluate("() => window.__tbSession().item.answer"))
            hidden = pg.evaluate("() => [...document.querySelectorAll('.scene, .obj-hero')].every((e) => e.getAttribute('aria-hidden') === 'true')")
            assert hidden, sid
            tags = pg.evaluate("() => [...document.querySelectorAll('.sc-tag, .bill b')].map((t) => t.textContent)")
            q = pg.evaluate("() => (window.__tbSession().item.q || window.__tbSession().item.prompt)")
            for t in tags:  # a tag only repeats a number from the question
                num = t.replace('$', '').replace('¢', '').replace('+', '')
                assert num in q.replace(',', '') or num == '1' or num in ('A', 'B'), (sid, t, q)
    # 3. groups stories draw the story's own things in each group
    pg.evaluate("() => window.__tbShow('WP04', 0)")
    m = pg.evaluate("() => window.__tbSession().item.model")
    n = pg.evaluate("() => document.querySelectorAll('.grp.og img').length")
    assert n == (m['g'] * m['s'] if m['s'] <= 12 else 0), (n, m)
    assert any('art/obj/' in s for s in seen) and any('art/coin-' in s for s in seen)
    b.close()
assert not errors, errors
assert not outside, outside
print('Pictures checks passed:', len(seen), 'different pictures shown, all loaded, none outside the app')
