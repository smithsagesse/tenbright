"""Pip's recorded voice: every sentence Pip can say maps to recorded clips, every clip holds speech,
and the app plays clips through Web Audio from its own files. Run after build: python3 test/audio_test.py"""
import json, pathlib, subprocess, sys, time, socket
from playwright.sync_api import sync_playwright

ROOT = pathlib.Path(__file__).resolve().parent.parent
DIST = ROOT / 'dist'
sock = socket.socket(); sock.bind(('127.0.0.1', 0)); PORT = sock.getsockname()[1]; sock.close()
server = subprocess.Popen([sys.executable, '-m', 'http.server', str(PORT), '--bind', '127.0.0.1'], cwd=DIST, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
time.sleep(0.8)
errors, outside = [], []
try:
    with sync_playwright() as p:
        b = p.chromium.launch(executable_path='/usr/bin/google-chrome', args=['--no-sandbox', '--autoplay-policy=no-user-gesture-required'])
        pg = b.new_page()
        pg.on('pageerror', lambda e: errors.append(str(e)))
        pg.on('request', lambda r: outside.append(r.url) if not r.url.startswith(('http://127.0.0.1:%d' % PORT, 'data:', 'blob:')) else None)
        pg.goto('http://127.0.0.1:%d/test.html#selftest' % PORT)
        # 1. coverage: every sentence from fresh random items maps to clips
        cov = pg.evaluate("""() => {
          const c = window.__tbSpeechCorpus(25), all = c.fixed.concat(c.dynamic);
          const miss = all.filter((t) => !window.__tbSpeakPlan(t));
          return { total: all.length, miss: miss.length, examples: miss.slice(0, 8) };
        }""")
        print('speech coverage:', cov['total'] - cov['miss'], 'of', cov['total'], 'utterances fully recorded')
        for x in cov['examples']: print('   no clip:', x[:120])
        print("miss rate", cov["miss"] / cov["total"]); assert cov["miss"] / cov["total"] < 0.002, 'too many sentences without recorded clips'
        # 2. every clip window holds speech and the silence around it is quiet
        res = pg.evaluate("""async () => {
          const m = window.__tbAudioMap(), ctx = new AudioContext(), out = { clips: 0, quiet: [], loud: [] };
          const bufs = [];
          for (const url of m.sprites) { const r = await fetch(url); bufs.push(await ctx.decodeAudioData(await r.arrayBuffer())); }
          const rms = (d, a, b) => { let s = 0, n = 0; for (let i = Math.max(0, a); i < Math.min(d.length, b); i++) { s += d[i] * d[i]; n++; } return n ? Math.sqrt(s / n) : 0; };
          for (const [k, [si, start, dur]] of Object.entries(m.clips)) {
            const b = bufs[si], d = b.getChannelData(0), sr = b.sampleRate;
            const inside = rms(d, Math.round(start * sr), Math.round((start + dur) * sr));
            const before = rms(d, Math.round((start - 0.25) * sr), Math.round((start - 0.05) * sr));
            out.clips++;
            if (inside < 0.01) out.quiet.push(k);
            if (before > 0.01) out.loud.push(k);
          }
          out.sprites = m.sprites.length; out.seconds = bufs.reduce((a, b) => a + b.duration, 0);
          return out;
        }""")
        print('clips checked:', res['clips'], 'in', res['sprites'], 'audio files,', round(res['seconds'] / 60, 1), 'minutes; silent clips:', len(res['quiet']), '; clips with sound in the gap before:', len(res['loud']))
        assert not res['quiet'], res['quiet'][:5]
        assert len(res['loud']) == 0, res['loud'][:5]
        # 3. the app plays Pip's clips (not the device voice) for a lesson line and a question
        played = pg.evaluate("""async () => {
          window.__tbLesson('AS05');
          const s = window.__tbSession();
          return await new Promise((resolve) => { window.__tbSay(s.frames[1].text, () => resolve(window.__tbAudioState())); setTimeout(() => resolve('timeout'), 30000); });
        }""")
        print('played a lesson line with recorded clips:', played)
        assert played != 'timeout' and played['clipsPlayed'] > 3 and played['deviceVoice'] == 0, played
        b.close()
finally:
    server.terminate()
print('outside requests:', outside or 'none')
print('errors:', errors or 'none')
assert not errors and not outside
