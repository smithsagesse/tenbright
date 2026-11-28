"""Zuri (owner, Nov 27, 2026): Pip's teammate guides the Geometry Galaxy and Measurement Workshop. Her picture (cut out of the
owner's image) and her code-drawn Shape Spark appear in those lessons and questions, Pip everywhere else (and in "Fix Pip's
mistake"). Her hello says she is a computer-made helper and is captioned; labels say "with Zuri"; she speaks with her own
recorded voice (Kokoro af_heart, audio/zuri-*.mp3); her shapes do not move with reduced motion; nothing leaves the device.
Run after build: python3 test/zuri_test.py"""
import pathlib, subprocess, sys, time, socket
from playwright.sync_api import sync_playwright

ROOT = pathlib.Path(__file__).resolve().parent.parent
DIST = ROOT / 'dist'
sock = socket.socket(); sock.bind(('127.0.0.1', 0)); PORT = sock.getsockname()[1]; sock.close()
server = subprocess.Popen([sys.executable, '-m', 'http.server', str(PORT), '--bind', '127.0.0.1'], cwd=DIST, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
time.sleep(0.8)
URL = 'http://127.0.0.1:%d/test.html#selftest' % PORT
errors, outside = [], []

def setup(pg):
    pg.goto(URL); pg.evaluate('localStorage.clear()'); pg.reload()
    pg.get_by_text('Set up as a parent').click(); pg.fill('#gate-year', '1980'); pg.get_by_role('button', name='Continue').click()
    pg.check('#c-guardian'); pg.check('#c-record'); pg.fill('#pin', '2580'); pg.get_by_role('button', name='Agree and continue').click()
    pg.fill('#nick', 'Ana'); pg.select_option('#sgrade', '3'); pg.uncheck('#pic-lock'); pg.get_by_role('button', name='Add child').click()
    pg.evaluate("() => { const c = window.__tbChild(); c.placementDone = true; c.focus = 'all'; }")

try:
    with sync_playwright() as p:
        b = p.chromium.launch(executable_path='/usr/bin/google-chrome', args=['--no-sandbox', '--autoplay-policy=no-user-gesture-required'])
        pg = b.new_page(viewport={'width': 1100, 'height': 900})
        pg.on('pageerror', lambda e: errors.append(str(e)))
        pg.on('request', lambda r: outside.append(r.url) if not r.url.startswith(('http://127.0.0.1:%d' % PORT, 'data:', 'blob:')) else None)
        setup(pg)
        hi = pg.evaluate('() => window.__tbZuriHi()')
        # hard rule 6: she says she is computer-made and never claims to be a friend
        assert 'computer' in hi and 'friend' not in hi.lower(), hi
        # 1. her first practice question: Zuri beside the answer box, her hello captioned once
        pg.evaluate("() => window.__tbPractice('GE01')"); pg.wait_for_timeout(300)
        assert pg.evaluate("() => window.__tbGuide()") == 'zuri'
        assert pg.locator('.buddy .zuri img.z-img').count() == 1 and pg.locator('.buddy .pip').count() == 0
        assert pg.evaluate("() => document.querySelector('.buddy .z-img').naturalWidth") > 0, 'Zuri picture did not load'
        assert pg.locator('.zuri-hi').count() == 1 and 'Zuri' in pg.locator('.zuri-hi').inner_text()
        assert pg.evaluate("() => document.querySelector('.buddy .zuri').getAttribute('aria-hidden')") == 'true'
        if pg.locator('.guide-btn').count(): assert 'Work it with Zuri' in pg.locator('.guide-btn').inner_text()
        pg.evaluate("() => window.__tbPractice('MS02')"); pg.wait_for_timeout(200)
        assert pg.locator('.zuri-hi').count() == 0, 'hello shown twice'
        # 2. Pip everywhere else, and in Fix Pip's mistake
        for sid in ['AS05', 'MU03', 'MY01', 'F301']:
            pg.evaluate("(s) => window.__tbShow(s, 0)", sid); pg.wait_for_timeout(100)
            assert pg.evaluate("() => window.__tbGuide()") == 'pip', sid
            assert pg.locator('.buddy .pip').count() == 1 and pg.locator('.zuri').count() == 0, sid
        pg.evaluate("() => window.__tbShowMistake('MS03')"); pg.wait_for_timeout(150)
        assert pg.evaluate("() => window.__tbSession().item.format") == 'mistake'
        assert pg.evaluate("() => window.__tbGuide()") == 'pip', 'Fix Pip\'s mistake should stay Pip'
        # 3. lessons: Zuri in every frame of her skills, "Try it with Zuri" at the end
        for sid in ['GE01', 'GE02', 'GE03', 'MS01', 'MS02', 'MS03', 'MS04']:
            n = pg.evaluate("(id) => { window.__tbLesson(id); return window.__tbSession().frames.length; }", sid)
            for f in range(n):
                pg.evaluate("(f) => window.__tbFrame(f)", f)
                assert pg.locator('.pip-fig .zuri').count() == 1, (sid, f)
            assert pg.get_by_role('button', name='Try it with Zuri').count() == 1, sid
        pg.evaluate("() => window.__tbLesson('AS05')")
        n = pg.evaluate("() => window.__tbSession().frames.length")
        pg.evaluate("(f) => window.__tbFrame(f)", n - 1)
        assert pg.get_by_role('button', name='Try it with Pip').count() == 1
        # 4. her own voice: every sentence she says has her clips, clips hold speech, and her lessons play them
        cov = pg.evaluate("""() => {
          const c = window.__tbSpeechCorpus(15, 'zuri'), all = c.fixed.concat(c.dynamic);
          const miss = all.filter((t) => !window.__tbSpeakPlan(t, 'zuri'));
          return { total: all.length, miss: miss.length, ex: miss.slice(0, 5), sprites: window.__tbAudioMap('zuri').sprites };
        }""")
        print('Zuri speech coverage:', cov['total'] - cov['miss'], 'of', cov['total'])
        assert cov['miss'] / cov['total'] < 0.002, cov['ex']
        assert all('/zuri-' in u for u in cov['sprites']) and cov['sprites'], cov['sprites']
        q = pg.evaluate("""async () => {
          const m = window.__tbAudioMap('zuri'), ctx = new AudioContext(), bufs = [], out = { clips: 0, quiet: 0 };
          for (const url of m.sprites) { const r = await fetch(url); bufs.push(await ctx.decodeAudioData(await r.arrayBuffer())); }
          for (const [k, [si, start, dur]] of Object.entries(m.clips)) {
            const d = bufs[si].getChannelData(0), sr = bufs[si].sampleRate; let s = 0, n = 0;
            for (let i = Math.round(start * sr); i < Math.round((start + dur) * sr); i++) { s += d[i] * d[i]; n++; }
            out.clips++; if (Math.sqrt(s / n) < 0.01) out.quiet++;
          }
          return out;
        }""")
        print('Zuri clips checked:', q)
        assert q['clips'] > 100 and q['quiet'] == 0, q
        played = pg.evaluate("""async () => {
          window.__tbLesson('MS04');
          const s = window.__tbSession();
          return await new Promise((resolve) => { window.__tbSay(s.frames[1].text, () => resolve(window.__tbAudioState())); setTimeout(() => resolve('timeout'), 30000); });
        }""")
        print('Zuri lesson line played:', played)
        assert played != 'timeout' and played['clipsPlayed'] > 3 and played['deviceVoice'] == 0 and played['voice'] == 'zuri', played
        # 4b. her violin: a tap on the map plays her 7-second piece from the app's own file, with the violin and moving bow
        pg.evaluate("() => window.__tbView('map')")
        pg.locator('[data-act="zuriPoke"]').click(); pg.wait_for_timeout(200)
        assert pg.locator('.zuri-poke .zv-art').count() == 1 and pg.locator('.zuri-cap').inner_text() == 'Zuri plays the violin.'
        v = pg.evaluate("() => window.__tbViolin()")
        assert v['src'] == 'sounds/zuri-violin.mp3' and v['playing'] and 0 < v['volume'] <= 1, v
        dur = pg.evaluate("async () => { const a = new Audio('sounds/zuri-violin.mp3'); await new Promise((r) => { a.onloadedmetadata = r; a.onerror = r; }); return a.duration; }")
        assert 14.8 <= dur <= 15.3, dur
        assert pg.evaluate("() => getComputedStyle(document.querySelector('.zv-art .z-bow')).animationName") == 'zBow'
        # one tune at a time, and the music belongs to the map: opening a destination card stops it
        pg.locator('[data-act="dest"][data-id="river"]').click(); pg.wait_for_timeout(100)
        assert not pg.evaluate("() => window.__tbViolin().playing"), 'the violin should stop when the child moves on'
        pg.keyboard.press('Escape')
        # Pip's piano: the second tap on Pip plays his 15-second piece (same length as Zuri's)
        pg.locator('[data-act="pipPoke"]').click(); pg.wait_for_timeout(300); pg.locator('[data-act="pipPoke"]').click(); pg.wait_for_timeout(1300)
        assert pg.locator('.pip-poke svg.pip.mood-piano').count() == 1
        assert pg.evaluate("() => window.__tbViolin().src") == 'sounds/pip-piano.mp3'
        dur = pg.evaluate("async () => { const a = new Audio('sounds/pip-piano.mp3'); await new Promise((r) => { a.onloadedmetadata = r; a.onerror = r; }); return a.duration; }")
        assert 14.8 <= dur <= 15.3, dur
        pg.wait_for_timeout(15500)
        assert pg.locator('.pip-poke svg.pip.mood-piano').count() == 0, 'the piano act should end after the piece'
        # 5. reduced motion: her shapes do not move
        ctx = b.new_context(reduced_motion='reduce'); pg2 = ctx.new_page()
        pg2.on('pageerror', lambda e: errors.append(str(e)))
        setup(pg2)
        pg2.evaluate("() => window.__tbLesson('GE01')"); pg2.wait_for_timeout(200)
        anims = pg2.evaluate("() => [...document.querySelectorAll('.zuri .zs, .zuri .z-img')].map((e) => getComputedStyle(e).animationName)")
        assert anims and all(a == 'none' for a in anims), anims
        # 6. Arabic: the button is translated
        pg2.evaluate("() => window.__tbSetLang('ar')")
        n = pg2.evaluate("() => window.__tbSession().frames.length"); pg2.evaluate("(f) => window.__tbFrame(f)", n - 1)
        assert pg2.get_by_role('button', name='جرّبها مع زوري').count() == 1
        b.close()
finally:
    server.terminate()
assert not errors, errors
assert not outside, outside
print('Zuri checks passed')
