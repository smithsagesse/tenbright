"""App Store screenshots from the store build, at Apple's exact pixel sizes.
iPhone 6.9" 1320x2868 (440x956 @3x) and iPad 13" 2064x2752 (1032x1376 @2x), using the sample learner.
Run after `node build.js --store` (or --draft): python3 ios-app/scripts/screenshots.py
"""
import pathlib
from playwright.sync_api import sync_playwright

ROOT = pathlib.Path(__file__).resolve().parents[2]
PAGE = (ROOT / 'source' / 'tenbright-mvp' / 'dist-store' / 'index.html').as_uri()
OUT = ROOT / 'docs' / 'store-screenshots'
DEVICES = {'iphone-6.9': ({'width': 440, 'height': 956}, 3), 'ipad-13': ({'width': 1032, 'height': 1376}, 2)}


def settle(pg):
    pg.wait_for_timeout(600)
    pg.evaluate('document.fonts.ready')


with sync_playwright() as p:
    b = p.chromium.launch(executable_path='/usr/bin/google-chrome', args=['--no-sandbox'])
    for name, (vp, scale) in DEVICES.items():
        OUT.mkdir(parents=True, exist_ok=True)
        pg = b.new_page(viewport=vp, device_scale_factor=scale, reduced_motion='reduce', has_touch=True)
        outside = []
        pg.on('request', lambda r: outside.append(r.url) if not r.url.startswith(('file:', 'data:', 'blob:')) else None)
        pg.goto(PAGE)
        pg.evaluate('localStorage.clear()'); pg.reload(); settle(pg)
        shot = lambda n: pg.screenshot(path=str(OUT / f'{name}-{n}.png'))
        shot('1-welcome')
        pg.get_by_text('Try the sample learner').click()
        pg.fill('#gate-year', '1980'); pg.get_by_role('button', name='Continue').click()
        pg.get_by_role('button', name='Maya').click(); settle(pg)
        shot('2-map')
        pg.locator('[data-act="pipIdea"]').click(); settle(pg)
        shot('3-practice')
        for _ in range(2):
            pg.locator('[data-act="hint"]').click()
        settle(pg)
        shot('4-hint')
        pg.locator('[data-act="exitSession"]').click()
        pg.locator('[data-act="pin"]').first.click()
        for d in '1234':
            pg.locator('[data-act="pinDigit"][data-d="%s"]' % d).click()
        settle(pg)
        shot('5-parent-report')
        assert not outside, outside
        pg.close()
    b.close()
print('saved to', OUT)
