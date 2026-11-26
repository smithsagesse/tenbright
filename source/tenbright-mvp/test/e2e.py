"""End-to-end walk through the MVP in headless Chrome: parent setup, child, placement, map, lesson, practice, parent report."""
import sys, pathlib
from playwright.sync_api import sync_playwright

ROOT = pathlib.Path(__file__).resolve().parent.parent
URL = (ROOT / 'dist' / 'test.html').as_uri()
RELEASE = (ROOT / 'dist' / 'index.html').as_uri()
network = []
OUT = pathlib.Path(sys.argv[1]) if len(sys.argv) > 1 else ROOT / 'test' / 'shots'
OUT.mkdir(parents=True, exist_ok=True)
errors = []

def answer_current(page, correct_guess='1'):
    """Answer whatever item is on screen: type a digit, pick a choice, or check the soroban."""
    if page.locator('[data-act="mwhy"]').count():
        page.locator('[data-act="mwhy"]').first.click()
    if page.locator('.choices button[data-act="choose"]').count():
        page.locator('.choices button[data-act="choose"]').first.click()
    elif page.locator('.pad button').count():
        page.locator('.pad button[data-d="%s"]' % correct_guess).click()
    page.locator('.checkbtn').click()

with sync_playwright() as p:
    b = p.chromium.launch(executable_path='/usr/bin/google-chrome', args=['--no-sandbox'])
    page = b.new_page(viewport={'width': 1100, 'height': 820})
    page.on('pageerror', lambda e: errors.append('pageerror: ' + str(e)))
    page.on('console', lambda m: errors.append('console: ' + m.text) if m.type == 'error' and 'fonts.g' not in m.text else None)
    page.on('request', lambda r: network.append(r.url) if not r.url.startswith(('file:', 'data:', 'blob:')) else None)
    page.goto(URL)
    page.get_by_text('Set up as a parent').click()
    # parental gate rejects a child's birth year, accepts an adult's
    page.fill('#gate-year', '2018'); page.get_by_role('button', name='Continue').click()
    assert page.locator('#gate-error').is_visible(), 'gate let a child through'
    page.fill('#gate-year', '1985'); page.get_by_role('button', name='Continue').click()
    # consent validation
    page.get_by_text('Agree and continue').click()
    assert page.locator('#consent-error').is_visible(), 'consent error not shown'
    page.check('#c-guardian'); page.check('#c-record'); page.fill('#pin', '2580')
    page.get_by_text('Agree and continue').click()
    page.fill('#nick', 'Ava')
    # school grade: Grade 1 shows an honest coverage note; we keep Grade 2 for the rest of the walk
    page.select_option('#sgrade', 'other')
    assert 'placement walk' in page.locator('#sgrade-note').inner_text(), 'grade note missing'
    page.select_option('#sgrade', '2')
    page.get_by_role('button', name='Add child').click()
    page.get_by_role('button', name='Ava').click()
    page.get_by_text("Let's explore!").click()
    # adaptive placement: runs until the walk finishes (at most 25 items)
    n = 0
    while not page.get_by_text('Thanks for exploring!').count() and n < 40:
        if page.locator('[data-act="restGo"]').count():  # Discovery Adventure rest stop
            page.locator('[data-act="restGo"]').click(); n += 1; continue
        answer_current(page)
        page.locator('.checkbtn').click()  # Next
        n += 1
    assert page.get_by_text('Thanks for exploring!').is_visible(), 'placement did not finish'
    print('placement items:', n)
    page.get_by_text('Back to the map').click()
    # one region button per region the engine uses (11 since Phase 7)
    assert page.locator('.region').count() == page.evaluate("() => new Set(window.TBEngine.SKILL_ORDER.map((id) => window.TBEngine.SKILLS[id].region)).size") >= 11
    # grade chips: Grade 2 is the default focus for a Grade 2 child; switching shows only that grade's skills
    assert page.locator('.gchip[aria-pressed="true"]').inner_text().startswith('Grade 2'), 'default focus not Grade 2'
    page.locator('.gchip[data-g="3"]').click()
    assert page.locator('.gchip[data-g="3"]').get_attribute('aria-pressed') == 'true'
    # regions without a Grade 3 skill say so (counted from the engine, so new regions keep this check true)
    empty3 = page.evaluate("() => { const E = window.TBEngine; const has = new Set(E.SKILL_ORDER.filter((id) => parseInt(E.SKILLS[id].ccss, 10) === 3).map((id) => E.SKILLS[id].region)); return [...new Set(E.SKILL_ORDER.map((id) => E.SKILLS[id].region))].filter((r) => !has.has(r)).length; }")
    assert empty3 >= 2 and page.get_by_text('No Grade 3 skills here').count() == empty3, ('regions with no Grade 3 skills', empty3)
    assert page.locator('.gchip').count() == 6, 'grade chips 1-5 plus all'
    page.screenshot(path=str(OUT / 'map-grade3.png'))
    page.locator('.gchip[data-g="all"]').click()
    page.locator('.gchip[data-g="2"]').click()
    print('grade chips: ok')
    page.screenshot(path=str(OUT / 'map.png'))
    # Pip's idea should start a lesson for PV03 for a learner who placed out of nothing
    page.locator('[data-act="pipIdea"]').click()
    # illustrated walkthrough: Pip and a picture on every frame, Next until "Try it with Pip"
    assert page.locator('.walk .pip-fig svg').is_visible(), 'Pip missing from lesson'
    frames = 0
    while page.locator('[data-act="frameNext"]').count():
        assert page.locator('.step-visual').inner_html().strip(), 'lesson picture missing'
        page.locator('[data-act="frameNext"]').click(); frames += 1
        assert frames < 20, 'walkthrough never ends'
    print('lesson walkthrough pictures:', frames + 1)
    page.screenshot(path=str(OUT / 'lesson-last.png'))
    page.locator('[data-act="framePrev"]').click()
    assert page.locator('[data-act="frameNext"]').is_visible(), 'Back did not work'
    page.locator('[data-act="frameNext"]').click()
    assert page.get_by_text('Try it with Pip').is_visible(), 'lesson card missing'
    page.get_by_text('Try it with Pip').click()
    # wrong answer then hint flow
    page.locator('[data-act="hint"]').click()
    page.locator('[data-act="hint"]').click()
    answer_current(page, '1')
    clue_or_ok = page.locator('.feedback').first.inner_text()
    page.screenshot(path=str(OUT / 'item.png'))
    # play out the session
    for i in range(30):
        if page.get_by_text('Great work today!').count():
            break
        if page.locator('[data-act="mwhy"]').count():
            page.locator('[data-act="mwhy"]').first.click(); continue
        btn = page.locator('.checkbtn')
        label = btn.inner_text()
        if label in ('Next', 'Finish'):
            btn.click(); continue
        answer_current(page, '1')
    assert page.get_by_text('Great work today!').is_visible(), 'session did not end'
    page.get_by_text('Back to the map').click()
    # parent report through PIN
    page.locator('[data-act="pin"]').first.click()
    for d in '1111':
        page.locator('[data-act="pinDigit"][data-d="%s"]' % d).click()
    assert page.get_by_text('That PIN does not match').is_visible()
    for d in '2580':
        page.locator('[data-act="pinDigit"][data-d="%s"]' % d).click()
    assert page.get_by_text('Every skill and its evidence').is_visible(), 'dashboard missing'
    assert page.get_by_text('Progress by grade level').is_visible(), 'grade progress missing'
    assert page.locator('.gbar').count() == 5
    page.select_option('#child-grade', '3')
    assert page.locator('#child-focus').input_value() == '3', 'focus did not follow grade'
    assert 'Grade 3' in page.locator('.card', has_text='Progress by grade level').inner_text()
    page.select_option('#child-focus', 'all')
    assert page.locator('#child-focus').input_value() == 'all'
    print('dashboard grade settings: ok')
    page.get_by_text('Demo: move the clock 7 days ahead').click()
    page.screenshot(path=str(OUT / 'dashboard.png'), full_page=True)
    # sample learner, phone width, dark theme
    page.get_by_text('Back to kids').click()
    phone = b.new_page(viewport={'width': 390, 'height': 844}, color_scheme='dark')
    phone.on('pageerror', lambda e: errors.append('phone pageerror: ' + str(e)))
    phone.goto(URL)
    phone.evaluate('localStorage.clear()'); phone.reload()
    phone.on('request', lambda r: network.append(r.url) if not r.url.startswith(('file:', 'data:', 'blob:')) else None)
    phone.get_by_text('Try the sample learner').click()
    phone.fill('#gate-year', '1980'); phone.get_by_role('button', name='Continue').click()
    phone.get_by_role('button', name='Maya').click()
    phone.screenshot(path=str(OUT / 'phone-map.png'), full_page=True)
    phone.locator('[data-act="pipIdea"]').click()
    phone.screenshot(path=str(OUT / 'phone-item.png'), full_page=True)
    wide = phone.evaluate('document.documentElement.scrollWidth > window.innerWidth')
    phone.locator('[data-act="exitSession"]').click()
    phone.locator('[data-act="pin"]').first.click()
    for d in '1234':
        phone.locator('[data-act="pinDigit"][data-d="%s"]' % d).click()
    phone.screenshot(path=str(OUT / 'phone-dashboard.png'), full_page=True)
    # consent bypass check: sample-only parent must go through consent before adding a real child
    phone.get_by_role('button', name='+ Add child').click()
    bypass_blocked = phone.get_by_text('Before your child plays').count() > 0
    phone.go_back() if False else None
    phone.goto(URL); phone.get_by_role('button', name='Maya').click() if phone.get_by_role('button', name='Maya').count() else None
    wide2 = phone.evaluate('document.documentElement.scrollWidth > window.innerWidth')
    report = ''
    phone.goto(URL)
    if phone.get_by_role('button', name='Maya').count():
        phone.get_by_role('button', name='Maya').click()
        phone.locator('[data-act="pin"]').first.click()
        for d in '1234':
            phone.locator('[data-act="pinDigit"][data-d="%s"]' % d).click()
        report = phone.locator('main').inner_text()
        phone.get_by_role('button', name='See everything stored').click()
        stored_view = phone.locator('#data-json').input_value()[:40]
    rel = b.new_page(); rel.on('request', lambda r: network.append(r.url) if not r.url.startswith(('file:', 'data:', 'blob:')) else None); rel.goto(RELEASE); rel.get_by_role('button', name='Privacy notice').click(); notice_ok = rel.get_by_text('Who runs Tenbright').count() > 0
    # render every skill's items, with and without the full hint, and look for broken output
    t = b.new_page(viewport={'width': 1024, 'height': 768})
    t.on('pageerror', lambda e: errors.append('selftest pageerror: ' + str(e)))
    t.goto(URL + '#selftest')
    bad = t.evaluate('window.__tbRenderAll()')
    print('render self-test failures:', bad if bad else 'none')
    assert not bad, 'render self-test failed'
    lc = t.evaluate('window.__tbCheckLessons(30)')
    print('lesson pictures checked:', lc['frames'], 'math checks:', lc['checks'], 'failures:', lc['badCount'])
    assert lc['badCount'] == 0, lc['bad'][:3]
    b.close()

print('feedback after hinted answer:', clue_or_ok[:120].replace('\n', ' '))
print('phone horizontal overflow (item, dashboard):', wide, wide2)
print('sample report mentions smaller-from-larger:', 'smaller digit' in report)
print('consent bypass blocked:', bypass_blocked)
print('stored-data view starts:', stored_view.replace('\n', ' '))
print('privacy notice opens in release build:', notice_ok)
print('outside network requests:', network if network else 'none')
print('errors:', errors if errors else 'none')

# ---------- voice answers and Work it with Pip, with a simulated on-device recognizer ----------
FAKE_SR = """
(() => {
  class FakeSR { constructor() { this.processLocally = false; window.__lastRec = this; }
    start() { const t = window.__say || ''; const self = this; setTimeout(() => { const res = [{ transcript: t }]; self.onresult && self.onresult({ results: [res] }); self.onend && self.onend(); }, 30); }
    stop() {} abort() {} }
  FakeSR.prototype.processLocally = false;
  FakeSR.available = async (o) => (o && o.processLocally ? 'available' : 'available');
  FakeSR.install = async () => true;
  window.SpeechRecognition = FakeSR;
})();
"""
with sync_playwright() as p:
    b = p.chromium.launch(executable_path='/usr/bin/google-chrome', args=['--no-sandbox'])
    ctx = b.new_context(viewport={'width': 1100, 'height': 860})
    ctx.add_init_script(FAKE_SR)
    v = ctx.new_page()
    v.on('pageerror', lambda e: errors.append('voice pageerror: ' + str(e)))
    v.on('request', lambda r: network.append(r.url) if not r.url.startswith(('file:', 'data:', 'blob:')) else None)
    v.goto(URL + '#selftest')
    v.evaluate('localStorage.clear()'); v.reload()
    # spoken-number parser
    cases = {'forty two': '42', 'the answer is 15': '15', 'three point zero five': '3.05', 'one thousand two hundred six': '1206', 'a hundred and six': '106', '0.7': '0.7', 'next please': None}
    for said, want in cases.items():
        got = v.evaluate('(t) => window.__tbVoice.num(t)', said)
        assert got == want, (said, got, want)
    cmd = v.evaluate("() => window.__tbVoice.parse(['go back'], null)")
    assert cmd == {'kind': 'command', 'value': 'back'}, cmd
    sign = v.evaluate("() => window.__tbVoice.parse(['it is greater'], { format: 'choice', choices: ['<', '=', '>'] })")
    assert sign['value'] == '>', sign
    print('voice parser: ok')
    # voice is off until a parent turns it on
    v.get_by_text('Try the sample learner').click()
    v.fill('#gate-year', '1980'); v.get_by_role('button', name='Continue').click()
    v.evaluate("() => window.__tbShow('AS05', 0)")
    assert v.locator('[data-act="listen"]').count() == 0, 'mic shown before a parent turned voice on'
    v.locator('[data-act="exitSession"]').click()
    v.locator('[data-act="pin"]').first.click()
    for d in '1234':
        v.locator('[data-act="pinDigit"][data-d="%s"]' % d).click()
    assert 'recognizes speech on this device' in v.locator('#voice-status').inner_text()
    v.check('#voice-on')
    v.get_by_text('Back to kids').click()
    # Work it with Pip on a regrouping addition
    v.evaluate("() => window.__tbShow('AS05', 0)")
    assert v.locator('[data-act="listen"]').count() == 1, 'mic missing after voice turned on'
    v.locator('[data-act="startGuide"]').click()
    assert v.locator('.guide .paper-sheet').is_visible(), 'paper sheet missing'
    assert 'paper and pencil' in v.locator('.guide .bubble').inner_text()
    v.evaluate("window.__say = 'ready'"); v.locator('.guide [data-act="listen"]').click(); v.wait_for_timeout(250)
    assert v.evaluate('window.__lastRec.processLocally') is True, 'recognizer not set to on-device'
    steps_answered = 0
    for _ in range(12):
        sess = v.evaluate('() => { const s = window.__tbSession(); const g = s.guide; return { i: g.i, n: g.steps.length, st: g.steps[g.i] || null, result: g.result }; }')
        if sess['i'] >= sess['n']:
            break
        st = sess['st']
        if st['answer'] is not None and sess['result'] not in ('ok', 'show'):
            v.evaluate("(a) => { window.__say = a; }", st['answer'])
            v.locator('.guide [data-act="listen"]').click(); v.wait_for_timeout(250)
            assert v.evaluate('() => window.__tbSession().guide.result') == 'ok', 'spoken step answer not accepted'
            steps_answered += 1
        v.evaluate("window.__say = 'next'"); v.locator('.guide [data-act="listen"]').click(); v.wait_for_timeout(250)
    assert steps_answered >= 2, 'guided steps were not answered'
    v.screenshot(path=str(OUT / 'guide-done.png'))
    ans = v.evaluate('() => window.__tbSession().item.answer')
    v.evaluate("(a) => { window.__say = a; }", ans)
    v.locator('.panel [data-act="listen"]').click(); v.wait_for_timeout(1200)
    assert v.locator('.feedback.ok').count() == 1, 'spoken final answer not checked'
    hint_level = v.evaluate("() => { const s = window.__tbSession(); return s.hint; }")
    assert hint_level >= 3, 'guided answer counted as independent'
    print('work it with Pip by voice: ok, steps answered', steps_answered)
    # a lesson: Play all and voice next
    v.evaluate("() => window.__tbLesson('F413')")
    v.evaluate("window.__say = 'next'"); v.locator('[data-act="listen"]').click(); v.wait_for_timeout(250)
    assert v.evaluate('() => window.__tbSession().frame') == 1, 'voice next did not move the lesson'
    v.screenshot(path=str(OUT / 'lesson-fraction.png'))
    print('lesson voice next: ok')
    # privacy notice explains voice
    v.evaluate("() => { document.querySelector('[data-act=exitSession]').click(); }")
    b.close()
print('outside network requests (voice run):', [u for u in network] or 'none')
print('errors (voice run):', errors or 'none')
assert not errors and not network
