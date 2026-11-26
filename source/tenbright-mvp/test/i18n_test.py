"""Languages: walk the whole app in Spanish, French, Haitian Creole, Traditional Chinese and Modern Standard Arabic (right to left) the way a family would
(parent setup, child, placement, map, lesson, practice, Work it with Pip, Lantern Line, journal, parent page)
and check that no English sentence is left on any screen, that numbers use each language's style, that
Pip's speech goes to a voice in the right language, and that the layout fits a phone.
Run after build: python3 test/i18n_test.py [screenshot-dir]"""
import os, sys, pathlib, re, json
from playwright.sync_api import sync_playwright

ROOT = pathlib.Path(__file__).resolve().parent.parent
URL = (ROOT / 'dist' / 'test.html').as_uri()
OUT = pathlib.Path(sys.argv[1]) if len(sys.argv) > 1 else ROOT / 'test' / 'shots'
OUT.mkdir(parents=True, exist_ok=True)
HTML_LANG = {'es': 'es-419', 'fr': 'fr', 'ht': 'ht', 'zh': 'zh-Hant-TW', 'ar': 'ar'}
SPEECH = {'es': 'es', 'fr': 'fr', 'ht': 'ht', 'zh': 'zh', 'ar': 'ar'}
# words that may stay as they are in every language
KEEP = re.compile(r"\b(Pip|Tenbright|GMIA|PIN|MVP|FTC|AI|IA|Common Core|English|Español|Français|soroban|Soroban|Global Mathematics Intelligence Academy|Vedic Mathematics|Bharati Krishna Tirtha|min|cm|R|C|v\d+|[A-Z]\.[A-Z]+\.[A-Z]\.\d+[a-z]?|\d\.[A-Z]{2,3}\.[A-D]\.\d+[a-z]?|Ava|Maya|Kofi|Mei|Diego|Amara|Liam|Priya|Noah|Zara|Mateo|Hana|Elijah|Sofia|Kai|Nia|Omar)\b")
EN_WORDS = re.compile(r"\b(the|and|you|your|what|with|this|that|then|tens|ones|hundreds|answer|number|skill|skills|grade|lesson|lanterns?|next|back|check|write|paper|step|child)\b", re.I)
errors, report = [], {}
AXE = (ROOT / 'test' / 'axe.min.js').read_text()
def axe(pg, name):
    # entrances and pops settle first; axe judges the resting screen, not a frame mid-fade
    pg.wait_for_function("() => document.getAnimations().every(a => a.playState !== 'running' || a.effect.getComputedTiming().iterations === Infinity)", timeout=8000)
    if not pg.evaluate('!!window.axe'): pg.add_script_tag(content=AXE)
    v = pg.evaluate("async () => (await axe.run(document, { runOnly: ['wcag2a','wcag2aa','wcag21aa','wcag22aa'] })).violations.map(v => v.id + ':' + v.nodes.length + ' ' + v.nodes.slice(0, 2).map(n => n.html.slice(0, 90) + ' | ' + n.any.map(a => a.message).join(' ').slice(0, 160)).join(' || '))")
    if v: errors.append('accessibility %s: %s' % (name, v))

def english_left(page):
    """visible text and labels that still read as English"""
    txt = page.evaluate("""() => {
      const out = [];
      const w = document.createTreeWalker(document.getElementById('app'), NodeFilter.SHOW_TEXT);
      let n; while ((n = w.nextNode())) { const el = n.parentElement; if (!el || el.closest('[data-notr], .lang-pick, script, style, textarea, pre') || !el.offsetParent && getComputedStyle(el).position !== 'fixed') continue; const v = n.nodeValue.trim(); if (v) out.push(v); }
      document.querySelectorAll('#app [aria-label]').forEach((e) => { if (!e.closest('[data-notr], .lang-pick')) out.push(e.getAttribute('aria-label')); });
      return out;
    }""")
    bad = []
    for t in txt:
        s = KEEP.sub(' ', t)
        if EN_WORDS.search(s) and re.search(r'[A-Za-z]{3,}', s):
            bad.append(t)
    return bad

def no_overflow(page):
    return page.evaluate("() => document.documentElement.scrollWidth <= window.innerWidth + 1")

def answer(page):
    if page.locator('[data-act="mwhy"]').count():
        page.locator('[data-act="mwhy"]').first.click(); return
    if page.locator('.choices button[data-act="choose"]').count():
        page.locator('.choices button[data-act="choose"]').first.click()
    elif page.locator('.pad button[data-d="1"]').count():
        page.locator('.pad button[data-d="1"]').click()
    page.locator('.checkbtn').click()

with sync_playwright() as p:
    b = p.chromium.launch(executable_path='/usr/bin/google-chrome', args=['--no-sandbox'])
    for L in (os.environ.get('LANGS') or 'es,fr,ht,zh,ar').split(','):
        page = b.new_page(viewport={'width': 390, 'height': 844})
        page.on('pageerror', lambda e, L=L: errors.append(L + ' pageerror: ' + str(e)))
        page.on('request', lambda r, L=L: errors.append(L + ' outside request ' + r.url) if not r.url.startswith(('file:', 'data:', 'blob:')) else None)
        # spoken lines are captured instead of played
        page.add_init_script("""window.__said = []; try { const S = window.speechSynthesis; if (S) { S.speak = (u) => { window.__said.push({ text: u.text, lang: u.lang }); setTimeout(() => { u.onend && u.onend(); }, 5); }; } } catch (e) {}""")
        page.goto(URL)
        leftovers = {}
        def look(name):
            bad = english_left(page)
            if bad: leftovers[name] = bad[:6]
            if not no_overflow(page): errors.append('%s %s: page scrolls sideways at phone width' % (L, name))
        page.locator('[data-act="lang"][data-l="%s"]' % L).click()
        assert page.evaluate('document.documentElement.lang') == HTML_LANG[L], 'html lang not set'
        assert page.evaluate('document.documentElement.dir') == ('rtl' if L == 'ar' else 'ltr'), 'page direction not set'
        look('welcome'); axe(page, L + ' welcome'); page.screenshot(path=str(OUT / ('%s-welcome.png' % L)))
        page.locator('[data-act="gate"][data-next="consent"]').click(); look('gate')
        page.fill('#gate-year', '2018'); page.locator('#gate-form button[type="submit"]').click()
        assert page.locator('#gate-error').is_visible(); look('gate-error')
        page.fill('#gate-year', '1985'); page.locator('#gate-form button[type="submit"]').click()
        page.locator('#consent-form button[type="submit"]').click()
        assert page.locator('#consent-error').is_visible(); look('consent')
        page.check('#c-guardian'); page.check('#c-record'); page.fill('#pin', '2580')
        page.locator('#consent-form button[type="submit"]').click()
        page.fill('#nick', 'Ava'); page.select_option('#sgrade', '3'); look('add-child')
        page.locator('#child-form button[type="submit"]').click()
        page.locator('[data-act="pick"]').first.click(); look('intro')
        page.screenshot(path=str(OUT / ('%s-intro.png' % L)))
        page.locator('[data-act="startPlacement"]').click()
        n = 0
        # room for every question (PLACEMENT_MAX_ITEMS), a clue retry on each and the rest stops
        cap = 2 * page.evaluate('() => window.TBEngine.PLACEMENT_MAX_ITEMS') + 12
        while not page.locator('[data-act="go"][data-to="map"]').count() and n < cap:
            if page.locator('[data-act="restGo"]').count():  # Discovery Adventure rest stop
                look('rest-stop'); page.locator('[data-act="restGo"]').click(); n += 1; continue
            look('placement'); answer(page)
            if page.locator('.checkbtn').count(): page.locator('.checkbtn').click()
            n += 1
        look('placement-end')
        page.locator('[data-act="go"][data-to="map"]').first.click(); look('map'); axe(page, L + ' map')
        page.screenshot(path=str(OUT / ('%s-map.png' % L)), full_page=True)
        # lesson walkthrough
        page.locator('[data-act="pipIdea"]').click()
        frames = 0
        while page.locator('[data-act="frameNext"]').count() and frames < 20:
            look('lesson'); page.locator('[data-act="frameNext"]').click(); frames += 1
        look('lesson-card'); axe(page, L + ' lesson'); page.screenshot(path=str(OUT / ('%s-lesson.png' % L)))
        page.locator('[data-act="beginPractice"]').click()
        # Work it with Pip: open the guide, answer a step wrong, then ask to see it
        if page.locator('[data-act="startGuide"]').count():
            page.locator('[data-act="startGuide"]').click(); look('guide-start')
            page.locator('[data-act="guideNext"]').click(); look('guide-step')
            if page.locator('.pad button[data-d="9"]').count() and page.locator('[data-act="guideCheck"]').count():
                page.locator('.pad button[data-d="9"]').click(); page.locator('[data-act="guideCheck"]').click(); look('guide-try')
            page.screenshot(path=str(OUT / ('%s-guide.png' % L)))
            page.locator('[data-act="exitSession"]').first.click() if page.locator('[data-act="exitSession"]').count() else None
            page.locator('[data-act="pipIdea"]').click() if page.locator('[data-act="pipIdea"]').count() else None
            while page.locator('[data-act="frameNext"]').count(): page.locator('[data-act="frameNext"]').click()
            if page.locator('[data-act="beginPractice"]').count(): page.locator('[data-act="beginPractice"]').click()
        page.locator('[data-act="hint"]').click(); look('hint')
        for i in range(40):
            if page.locator('[data-act="go"][data-to="map"]').count() and not page.locator('.checkbtn').count(): break
            look('practice'); answer(page)
            if page.locator('.feedback').count(): look('feedback')
            if L == 'ar':
                # every run of math reads left to right inside the Arabic page: the first character sits left of the last
                bad = page.evaluate("""() => Array.from(document.querySelectorAll('#app .mrun')).filter((m) => { const r = m.getBoundingClientRect(); if (!r.width || m.textContent.trim().length < 3) return false;
                  const w = document.createTreeWalker(m, NodeFilter.SHOW_TEXT); const t1 = w.nextNode(); let tl = t1, x; while ((x = w.nextNode())) tl = x; if (!t1) return false;
                  const rg = document.createRange(); rg.setStart(t1, 0); rg.setEnd(t1, 1); const a = rg.getBoundingClientRect(); rg.setStart(tl, tl.length - 1); rg.setEnd(tl, tl.length); const z = rg.getBoundingClientRect();
                  return Math.abs(a.y - z.y) < 4 && a.x > z.x; }).map((m) => m.textContent)""")
                if bad: errors.append('ar: math shown right to left: ' + str(bad[:3]))
                if page.locator('.prompt').count() and re.search(r'[+−×÷=]', page.locator('.prompt').inner_text()) and not page.locator('.prompt .mrun, .prompt [dir="ltr"]').count():
                    errors.append('ar: question math not isolated: ' + page.locator('.prompt').inner_text())
            if page.locator('.checkbtn').count() and page.locator('.checkbtn').is_enabled(): page.locator('.checkbtn').click()
        look('session-end'); page.screenshot(path=str(OUT / ('%s-end.png' % L)))
        page.locator('[data-act="go"][data-to="map"]').first.click()
        # Lantern Line warm-up
        if page.locator('[data-act="lineStart"]').count():
            page.locator('[data-act="lineStart"]').click(); look('line')
            for i in range(8):
                if not page.locator('[data-act="linePlace"]').count(): break
                box = page.locator('[data-act="linePlace"]').bounding_box()
                page.mouse.click(box['x'] + box['width'] * 0.4, box['y'] + box['height'] / 2)
                page.locator('[data-act="lineCheck"]').click(); look('line-feedback')
                page.locator('[data-act="lineNext"]').click()
            look('line-end')
            if page.locator('[data-act="go"][data-to="map"]').count(): page.locator('[data-act="go"][data-to="map"]').first.click()
        page.locator('[data-act="go"][data-to="journal"]').first.click(); look('journal')
        page.screenshot(path=str(OUT / ('%s-journal.png' % L)), full_page=True)
        page.locator('[data-act="go"][data-to="map"]').first.click()
        # parent page and records
        page.locator('[data-act="pin"]').first.click(); look('pin')
        for d in '2580': page.locator('[data-act="pinDigit"][data-d="%s"]' % d).click()
        look('dashboard'); axe(page, L + ' dashboard'); page.screenshot(path=str(OUT / ('%s-dashboard.png' % L)), full_page=True)
        assert page.locator('#app-lang').input_value() == L, 'settings language select out of step'
        if L == 'ht' and not page.locator('#lang-voice').count(): errors.append('ht: no note about the missing device voice')
        page.locator('[data-act="go"][data-to="data"]').click(); look('data')
        page.locator('[data-act="go"][data-to="dashboard"]').first.click()
        page.locator('[data-act="doc"][data-to="privacy"]').first.click(); look('privacy')
        report[L] = {'placement_items': n, 'lesson_frames': frames + 1, 'screens_with_english': len(leftovers)}
        if leftovers:
            errors.append('%s: English left on screen: %s' % (L, json.dumps(leftovers, ensure_ascii=False)[:1500]))
        page.close()
    # speech in each language (self-test page): text sent to the device voice is translated and tagged
    t = b.new_page()
    # a device with one on-device voice per language (headless Chrome has none)
    t.add_init_script("""window.__said = []; try {
      const fake = ['en-US', 'es-US', 'fr-FR', 'zh-TW', 'ar-SA'].map((l) => ({ name: 'Local ' + l, lang: l, localService: true, default: false, voiceURI: l }));
      window.SpeechSynthesisUtterance = function (text) { this.text = text; this.lang = ''; this.voice = null; };
      const S = window.speechSynthesis;
      S.getVoices = () => fake; S.cancel = () => {};
      S.speak = (u) => { window.__said.push({ text: u.text, lang: u.lang }); setTimeout(() => { u.onend && u.onend(); }, 5); };
    } catch (e) {}""")
    t.goto(URL + '#selftest')
    for L in ['es', 'fr', 'ht', 'zh', 'ar']:
        r = t.evaluate("""(L) => new Promise((resolve) => {
          window.__tbSetLang(L); window.__said.length = 0;
          window.__tbSay('Ava has 8 beads and finds 5 more. How many beads now? 3/4 of 12 = ?', () => resolve(window.__said.slice()));
          setTimeout(() => resolve(window.__said.slice()), 4000);
        })""", L)
        print(L, 'Pip says:', r[:2])
        joined = ' '.join(x['text'] for x in r)
        if L == 'ht':
            # few devices have a Haitian Creole voice; with none, Pip must stay silent (never read Kreyòl with an English or French voice)
            if r: errors.append('ht: spoken with a non-Kreyòl voice ' + str(r))
        elif not r: errors.append(L + ': nothing spoken')
        elif re.search(r'\b(has|beads|finds|more|How many|of)\b', joined): errors.append(L + ': English spoken: ' + joined)
        elif not all((x['lang'] or '').lower().startswith(SPEECH[L]) for x in r): errors.append(L + ': wrong voice language ' + str([x['lang'] for x in r]))
        # voice answers in the language: spoken numbers and commands
        v = t.evaluate("""(L) => ({ n: TBi18n.parseVoiceL(L, { es: ['cuarenta y dos'], fr: ['quatre-vingt-dix-sept'], ht: ['twa san karannde'], zh: ['三百零五'], ar: ['ثلاثمئة وخمسة وأربعون'] }[L], null, (x) => x), c: TBi18n.parseVoiceL(L, { es: ['siguiente'], fr: ['suivant'], ht: ['swivan'], zh: ['下一個'], ar: ['التالي'] }[L], null, (x) => x) })""", L)
        print(L, 'voice:', v)
        want = {'es': '42', 'fr': '97', 'ht': '342', 'zh': '305', 'ar': '345'}[L]
        if str(v['n'].get('value')) != want: errors.append(L + ': spoken number misread ' + str(v))
        if v['c'].get('value') != 'next': errors.append(L + ': spoken command misread ' + str(v))
    # back to English: nothing left translated
    t.evaluate("() => window.__tbSetLang('en')")
    t.evaluate("() => window.__tbView('welcome')")
    if 'Set up as a parent' not in t.inner_text('#app'): errors.append('English did not come back')
    b.close()

print(json.dumps(report, ensure_ascii=False))
print('errors:', len(errors))
for e in errors: print(' -', e[:1600])
assert not errors
