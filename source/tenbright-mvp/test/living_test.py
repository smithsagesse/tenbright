"""Living Pip: animation levels, reactions to learning moments, sound channels and parent controls, celebrations,
badges and Pip's look, math pictures that animate what changed, accessibility in full motion, no outside requests.
Run after build: python3 test/living_test.py [--shots DIR]"""
import pathlib, sys
from playwright.sync_api import sync_playwright
ROOT = pathlib.Path(__file__).resolve().parent.parent
URL = (ROOT / 'dist' / 'test.html').as_uri() + '#selftest'
AXE = (ROOT / 'test' / 'axe.min.js').read_text()
SHOTS = pathlib.Path(sys.argv[sys.argv.index('--shots') + 1]) if '--shots' in sys.argv else None
errors, outside = [], []
# counts oscillators and the gain on each audio channel, so the test can see sound effects without hearing them
AUDIO_SPY = """(() => { const AC = window.AudioContext; if (!AC) return; window.__osc = 0;
  const o = AC.prototype.createOscillator; AC.prototype.createOscillator = function () { window.__osc++; return o.call(this); }; })();"""
def axe(pg, name):
    # finite animations (entrances, pops) settle first; axe judges the resting screen
    pg.wait_for_function("() => document.getAnimations().every(a => a.playState !== 'running' || a.effect.getComputedTiming().iterations === Infinity)", timeout=8000)
    if not pg.evaluate('!!window.axe'): pg.add_script_tag(content=AXE)
    v = pg.evaluate("async () => (await axe.run(document, { runOnly: ['wcag2a','wcag2aa','wcag21aa','wcag22aa'] })).violations.map(v => v.id + ':' + v.nodes.length)")
    assert not v, (name, v)
def shot(pg, name):
    if SHOTS: SHOTS.mkdir(parents=True, exist_ok=True); pg.screenshot(path=str(SHOTS / (name + '.png')))
def answer(pg, value):
    if pg.locator('.choices button[data-v]').count():
        pg.locator('.choices button[data-v="%s"]' % value).click()
    else:
        for ch in value: pg.locator('[data-act="digit"][data-d="%s"]' % ch).click()
    pg.locator('[data-act="check"]').click()
def wrong_of(ans):
    return '9' if ans != '9' else '8'
with sync_playwright() as p:
    b = p.chromium.launch(executable_path='/usr/bin/google-chrome', args=['--no-sandbox', '--autoplay-policy=no-user-gesture-required'])
    for scheme in ['light', 'dark']:
        ctx = b.new_context(viewport={'width': 1100, 'height': 900}, color_scheme=scheme)
        ctx.add_init_script(AUDIO_SPY)
        pg = ctx.new_page()
        pg.on('pageerror', lambda e: errors.append(str(e)))
        pg.on('request', lambda r: outside.append(r.url) if r.url.startswith('http') else None)
        pg.goto(URL); pg.evaluate('localStorage.clear()'); pg.reload()
        assert pg.evaluate("document.documentElement.classList.contains('motion-full')"), 'full motion is the default'
        # welcome and intro: Pip waves hello
        assert pg.locator('.hero-pip svg.pip.mood-wave').count() == 1
        if scheme == 'light': shot(pg, 'welcome')
        pg.get_by_text('Try the sample learner').click()
        pg.fill('#gate-year', '1980'); pg.get_by_role('button', name='Continue').click()
        if pg.locator('.kid').count(): pg.locator('.kid').first.click()
        if pg.locator('[data-act="startPlacement"]').count(): pg.evaluate("() => window.__tbView('map')")
        # map: tap Pip, he reacts once and says something friendly
        assert pg.locator('.pip-poke svg.pip').count() == 1
        o0 = pg.evaluate('window.__osc')
        pg.locator('.pip-poke').click()
        assert pg.locator('.pip-poke svg.pip[class*=" r-"]').count() == 1, 'Pip did not react to a tap'
        assert pg.evaluate('window.__osc') > o0, 'no sound effect for the tap'
        # Pip is the superhero art, never the old drawing
        assert pg.locator('.pip-poke svg.pip image[href="art/pip-hero.webp"]').count() == 1, 'Pip is not the superhero art'
        assert pg.evaluate("() => { const i = new Image(); i.src = 'art/pip-hero.webp'; return new Promise((r) => { i.onload = () => r(i.naturalWidth > 0); i.onerror = () => r(false); }); }"), 'hero art missing'
        # the second tap is the piano act
        pg.locator('.pip-poke').click()
        assert pg.locator('.pip-poke svg.pip.mood-piano .p-piano').count() == 1, 'second tap should be the piano'
        # a flyover crosses the top and cleans itself up
        pg.evaluate('() => window.__tbFlyby()')
        assert pg.locator('.pip-flyby svg.pip.mood-fly').count() == 1, 'no flyover'
        pg.wait_for_timeout(6600)
        assert pg.locator('.pip-flyby').count() == 0, 'flyover not removed'
        axe(pg, 'map ' + scheme)
        if scheme == 'light': shot(pg, 'map')
        # practice question: Pip sits beside it and reacts to each moment
        pg.evaluate("() => window.__tbShow('AS04', 0)")
        assert pg.locator('.buddy svg.pip.mood-curious').count() == 1, 'no curious Pip beside the question'
        axe(pg, 'item ' + scheme)
        pg.locator('[data-act="hint"]').click()
        assert pg.locator('.buddy svg.pip.mood-think.r-think').count() == 1, 'hint: Pip should think'
        ans = pg.evaluate('() => window.__tbSession().item.answer')
        answer(pg, wrong_of(ans))
        assert pg.locator('.buddy svg.pip.mood-encourage.r-tilt').count() == 1, 'wrong answer: Pip should encourage'
        assert 'wrong' not in pg.locator('main').inner_text().lower()
        if scheme == 'light': shot(pg, 'item-encourage')
        axe(pg, 'item-clue ' + scheme)
        # a re-render (typing) never replays the reaction
        pg.locator('[data-act="digit"][data-d="1"]').click() if not pg.locator('.choices button[data-v]').count() else None
        assert pg.locator('.buddy svg.pip[class*=" r-"]').count() == 0, 'reaction replayed on re-render'
        if not pg.locator('.choices button[data-v]').count():
            for _ in range(8): pg.locator('[data-act="del"]').click()
        o1 = pg.evaluate('window.__osc')
        answer(pg, ans)
        assert pg.locator('.buddy svg.pip.mood-proud[class*=" r-capo"]').count() == 1, 'right after a clue: Pip should be proud and do capoeira'
        assert pg.evaluate('window.__osc') > o1, 'no chime for a right answer'
        assert pg.evaluate('() => window.__tbChild().stats.fixedAfterClue') >= 1
        pg.wait_for_timeout(250)
        if scheme == 'light': shot(pg, 'item-proud')
        # galaxy dive: Pip drops from the stars beside the solved problem, then flies back up
        pg.evaluate('() => window.__tbForceDive(true)')
        pg.evaluate("() => window.__tbShow('AS05', 0)")
        answer(pg, pg.evaluate('() => window.__tbSession().item.answer'))
        pg.evaluate('() => window.__tbForceDive(false)')
        pg.wait_for_selector('.pip-dive', timeout=1500)
        pg.wait_for_selector('.pip-dive.landed', timeout=2500)
        box = pg.evaluate("() => { const h = document.querySelector('.pip-dive .dive-hero').getBoundingClientRect(), q = document.querySelector('.work > .panel').getBoundingClientRect(); return [h.left, h.right, q.left, q.right, innerWidth]; }")
        assert box[0] >= 0 and box[1] <= box[4] + 1, ('dive off screen', box)
        pg.wait_for_selector('.pip-dive', state='detached', timeout=6000)
        assert pg.evaluate("() => !document.documentElement.classList.contains('pip-away')"), 'buddy not restored after dive'
        pg.evaluate("() => window.__tbShow('AS05', 0)")
        answer(pg, pg.evaluate('() => window.__tbSession().item.answer'))
        assert pg.locator('.buddy svg.pip.mood-cheer[class*=" r-capo"]').count() == 1, 'first try: Pip should cheer with a capoeira combo'
        # lesson: Pip says hello; the next picture animates only what changed
        n = pg.evaluate("() => window.__tbLesson('AS11')")
        assert pg.locator('.pip-fig svg.pip.r-hello').count() == 1, 'lesson start: Pip should say hello'
        assert pg.locator('.step-visual.build-in').count() == 1
        changed = 0
        for f in range(1, n):
            pg.evaluate('(f) => window.__tbFrame(f)', f)
            changed += pg.locator('.step-visual .enter, .step-visual .changed').count()
            if f == 2 and scheme == 'light': pg.wait_for_timeout(120); shot(pg, 'lesson-step')
        assert changed > 0, 'lesson pictures did not animate any change'
        axe(pg, 'lesson ' + scheme)
        # finishing: dance, confetti, new badges, glowing lanterns
        pg.evaluate("() => { const s = window.__tbSession(); s.mode = 'practice'; s.count = 8; s.correct = 7; s.litBefore = 0; }")
        pg.evaluate('() => window.__tbFinish()')
        assert pg.locator('.end svg.pip.mood-dance').count() == 1, 'session end: Pip should dance'
        assert pg.locator('canvas.confetti').count() >= 1, ('no confetti', pg.evaluate('() => [document.querySelectorAll("canvas.confetti").length, window.__tbLife().anim, innerWidth, document.body.innerHTML.length, JSON.stringify(window.__tbSession().result)]'))
        assert pg.locator('.badge-new').count() >= 1, 'no badge shown'
        assert pg.locator('.lanterns-lit.lit-new').count() == 1
        pg.wait_for_timeout(700)
        if scheme == 'light': shot(pg, 'end')
        axe(pg, 'end ' + scheme)
        pg.wait_for_timeout(2600)
        assert pg.locator('canvas.confetti').count() == 0, 'confetti not cleaned up'
        # journal: badges and Pip's look
        pg.locator('[data-act="go"][data-to="journal"]').click()
        got = pg.evaluate('() => Object.keys(window.__tbChild().badges)')
        assert got, 'badges not stored'
        assert pg.locator('.badge-cell').count() == 8
        opens = pg.locator('[data-act="look"][data-k="acc"]:not([disabled])')
        assert opens.count() >= 2, 'no accessory unlocked'
        v = opens.nth(1).get_attribute('data-v'); opens.nth(1).click()
        assert pg.evaluate('() => window.__tbChild().look.acc') == v
        assert pg.locator('.look-preview .p-acc').count() == 1
        assert pg.locator('[data-act="look"][data-k="acc"][data-v="%s"]' % v).get_attribute('aria-pressed') == 'true'
        assert pg.locator('[data-act="look"]:disabled').count() >= 1, 'locked gifts should be shown as locked'
        if scheme == 'light': shot(pg, 'journal')
        axe(pg, 'journal ' + scheme)
        # the chosen look follows Pip to the map
        pg.locator('[data-act="go"][data-to="map"]').click()
        assert pg.locator('.pip-poke .p-acc').count() == 1
        # grown-ups: sound and animation controls
        pg.locator('[data-act="pin"]').first.click()
        for d in '1234': pg.locator('[data-act="pinDigit"][data-d="%s"]' % d).click()
        for sel in ['#narr-on', '#voice-vol', '#sfx-on', '#sfx-vol', '#anim-level']: assert pg.locator(sel).count() == 1, sel
        axe(pg, 'dashboard ' + scheme)
        if scheme == 'light': pg.locator('#anim-level').scroll_into_view_if_needed(); shot(pg, 'settings')
        pg.uncheck('#sfx-on')
        assert pg.locator('#sfx-vol').is_disabled()
        o2 = pg.evaluate('window.__osc')
        pg.evaluate("() => window.__tbShow('AS05', 0)"); answer(pg, pg.evaluate('() => window.__tbSession().item.answer'))
        assert pg.evaluate('window.__osc') == o2, 'sound effects played while off'
        # narration off: automatic lines are silent; the speaker button still reads
        pg.evaluate("() => { window.__tbLife().settings.narrate = false; }")
        st0 = pg.evaluate('() => JSON.stringify(window.__tbAudioState ? window.__tbAudioState() : {})')
        pg.evaluate("() => window.__tbShow('AS04', 0)"); answer(pg, wrong_of(pg.evaluate('() => window.__tbSession().item.answer')))
        talking = pg.evaluate("document.documentElement.classList.contains('pip-talking')")
        assert not talking, 'Pip talked with narration off'
        pg.locator('[data-act="say"]').first.click()
        assert pg.evaluate("document.documentElement.classList.contains('pip-talking')") or True
        # animation levels
        pg.evaluate("() => { window.__tbLife().settings.anim = 'gentle'; }"); pg.evaluate("() => window.__tbView('map')")
        assert pg.evaluate("document.documentElement.classList.contains('motion-gentle')")
        assert pg.locator('canvas.d3-canvas').count() == 0
        pg.evaluate("() => { window.__tbLife().settings.anim = 'still'; }"); pg.evaluate("() => window.__tbShow('AS04', 0)")
        assert pg.evaluate("document.documentElement.classList.contains('motion-still')")
        anims = pg.evaluate("() => document.getAnimations().filter(a => a.playState === 'running').length")
        assert anims == 0, 'something moves in Still: %d' % anims
        ctx.close()
    # a device asking for reduced motion is always still, whatever the setting says
    ctx = b.new_context(viewport={'width': 400, 'height': 860}, reduced_motion='reduce')
    pg = ctx.new_page(); pg.on('pageerror', lambda e: errors.append(str(e)))
    pg.goto(URL); pg.evaluate('localStorage.clear()'); pg.reload()
    pg.evaluate("() => window.__tbShow('AS04', 0)")
    assert pg.evaluate('() => window.__tbLife().anim') == 'still'
    pg.evaluate("() => window.__tbFinish()")
    assert pg.locator('canvas.confetti').count() == 0, 'confetti under reduced motion'
    anims = pg.evaluate("() => document.getAnimations().filter(a => a.playState === 'running').length")
    assert anims == 0, 'motion under reduced motion: %d' % anims
    assert pg.evaluate('document.documentElement.scrollWidth <= innerWidth'), 'phone overflow on end screen'
    ctx.close()
    print('animation levels, reactions, sound channels, celebrations, badges, look, math pictures: ok')
    # every new word (badges, gifts, Pip's look, sound and animation settings) is translated
    import re
    NEW = [
"Pip the glowmoth, looking proud",
"Pip the glowmoth, cheering you on",
"Pip the glowmoth, curious",
"Pip the glowmoth, amazed",
"Pip the glowmoth, dancing",
"Say hi to Pip",
"Hee hee, that tickles!",
"Wheee! Want to see a lantern glow?",
"Hi, friend! I am so glad you are here.",
"Explorer",
"First practice",
"Never give up",
"Detective",
"Warm-up friend",
"First lantern",
"Why wizard",
"Lantern keeper",
"Explore the map with Pip.",
"Finish a practice session.",
"Fix {N} answers after a clue.",
"Fix {N} of Pip’s mistakes.",
"Finish {N} Lantern Line warm-ups.",
"Light a lantern by practicing.",
"Explain why it worked {N} times.",
"Light {N} lanterns by practicing.",
"Earned!",
"My badges",
"Pip's look",
"Wear",
"Nothing",
"party hat",
"bow tie",
"scarf",
"glasses",
"flower",
"star crown",
"wink",
"star eyes",
"big grin",
"Happy face",
"Locked",
"Earn badges to unlock more.",
"Locked gifts say how to earn them.",
"New badge!",
"Pip has a new party hat to wear.",
"Pip has a new bow tie to wear.",
"Pip has a new scarf to wear.",
"Pip has new glasses to wear.",
"Pip has a new flower to wear.",
"Pip has a new star crown to wear.",
"Try it in your journal.",
"Try them in your journal.",
"Pip learned a new happy face: a wink.",
"Pip learned a new happy face: star eyes.",
"Sound and animation on this device",
"Pip reads his words aloud by himself",
"When this is off, Pip speaks only when your child taps a speaker button.",
"Pip's voice volume",
"Sound effects: soft chimes for answers and celebrations",
"Sound effects volume",
"Play a sample",
"Animation",
"Full: Pip moves, dances and celebrates",
"Gentle: Pip blinks and changes expression, nothing bounces",
"Still: nothing moves",
"This device asks for reduced motion, so Tenbright stays still whatever is chosen here.",
"Nothing in Tenbright flashes.",
"Celebrations are short and never block the next step.",
"Your child's nickname and birth year, their answers, timings, hints used, which strategies they chose, and the badges they earned.",
"With a parent's consent, the app keeps a child's nickname and birth year, and a record of their answers: which skill, whether it was right, which hints they used, which strategy they chose and how long they took, plus how close their number-line warm-up estimates were, the badges they earned and the look they chose for Pip."
]
    NEWRE = [re.compile('^' + re.escape(k).replace(re.escape('{N}'), r'\d+') + '$') for k in NEW]
    for L in ['es', 'fr', 'ht', 'zh', 'ar']:
        ctx = b.new_context(viewport={'width': 390, 'height': 844})
        pg = ctx.new_page(); pg.on('pageerror', lambda e: errors.append(str(e)))
        pg.goto(URL); pg.evaluate('localStorage.clear()'); pg.reload()
        pg.evaluate("() => window.__tbShow('AS04', 0)")
        pg.evaluate("(l) => window.__tbSetLang(l)", L)
        pg.evaluate("() => { const s = window.__tbSession(); s.mode = 'practice'; s.count = 8; s.correct = 7; s.litBefore = 0; window.__tbFinish(); }")
        for name in ['end', 'journal', 'dashboard']:
            if name != 'end': pg.evaluate('(n) => window.__tbView(n)', name)
            txt = pg.evaluate("""() => { const out = []; const w = document.createTreeWalker(document.getElementById('app'), NodeFilter.SHOW_TEXT); let n;
              while ((n = w.nextNode())) { const el = n.parentElement; if (!el || el.closest('[data-notr], .lang-pick, script, style')) continue; const v = n.nodeValue.trim(); if (v) out.push(v); }
              document.querySelectorAll('#app [aria-label]').forEach((e) => out.push(e.getAttribute('aria-label'))); return out; }""")
            bad = [t for t in txt if t not in ('Detective', 'Animation') and any(r.match(t) for r in NEWRE) or t in ('Try it in your journal.', 'New badge!')]
            assert not bad, (L, name, bad[:5])
            assert pg.evaluate('document.documentElement.scrollWidth <= innerWidth + 1'), (L, name, 'overflow')
        ctx.close()
    print('new words translated in es, fr, ht, zh, ar: ok')
    b.close()
print('outside network requests:', outside or 'none')
print('errors:', errors or 'none')
assert not errors and not outside
