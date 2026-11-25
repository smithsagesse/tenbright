"""Record Pip's English narration with Kokoro and pack it into the audio sprites the app plays.

Every clip key comes from the app itself: the built test page lists everything Pip can say
(window.__tbSpeechCorpus) and src/speech.js splits each sentence into whole-sentence ("S:"),
phrase ("P:") and number ("N:") clips. So the recordings always match the app's wording.

Usage (from source/tenbright-mvp, after `node build.js`):
  python3 narration/record.py                 record only the clips the app needs but does not have yet
  python3 narration/record.py --drop KEY ...  also remove clips that are no longer used (exact keys)
  python3 narration/record.py --all           re-record every clip (e.g. after changing the voice); about 40 minutes
  python3 narration/record.py --say "Text"    write one test sentence to narration/say.wav and stop

Settings come from narration/voice.json: kokoro_voice, speed, lang.
Needs: pip install kokoro-onnx soundfile playwright; ffmpeg; the Kokoro v1.0 model files
(kokoro-v1.0.onnx, voices-v1.0.bin from github.com/thewh1teagle/kokoro-onnx releases "model-files-v1.0")
in $KOKORO_MODEL_DIR (default ~/kokoro-model). Everything runs on this machine; nothing is sent anywhere.
"""
import argparse, json, os, pathlib, socket, subprocess, sys, tempfile, time
import numpy as np

ROOT = pathlib.Path(__file__).resolve().parent.parent
NARR = ROOT / 'narration'
AUDIO = NARR / 'audio'
MAP = AUDIO / 'map.json'
SR = 24000
LEAD = 0.3          # silence before each clip in a sprite (the audio test checks this gap is quiet)
SPRITE_SECONDS = 600  # start a new sprite file after about ten minutes of audio
CORPUS_PER_SKILL = 60  # random items per skill when listing what Pip can say


def corpus_parts(per):
    """Every utterance Pip can say, split the way the app will play it: [(sentenceKey, sentenceText, [(key, text), ...]), ...]."""
    from playwright.sync_api import sync_playwright
    sock = socket.socket(); sock.bind(('127.0.0.1', 0)); port = sock.getsockname()[1]; sock.close()
    srv = subprocess.Popen([sys.executable, '-m', 'http.server', str(port), '--bind', '127.0.0.1'], cwd=ROOT / 'dist',
                           stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    time.sleep(0.8)
    try:
        with sync_playwright() as p:
            b = p.chromium.launch(executable_path='/usr/bin/google-chrome', args=['--no-sandbox'])
            pg = b.new_page()
            pg.goto('http://127.0.0.1:%d/test.html#selftest' % port)
            out = pg.evaluate("""(per) => {
              const c = window.__tbSpeechCorpus(per), S = window.TBSpeech, seen = new Set(), out = [];
              for (const t of c.fixed.concat(c.dynamic)) for (const s of S.sentences(t)) {
                if (seen.has(s)) continue; seen.add(s);
                const seg = S.segment(s);
                out.push([S.sentenceKey(s), s, seg ? seg.map((p) => [p.key, p.text]) : null]);
              }
              return out;
            }""", per)
            b.close()
            return out
    finally:
        srv.terminate()


def needed_clips(parts, have):
    """Clips the app would look for and not find, with the text to record for each."""
    need = {}
    for skey, stext, seg in parts:
        if skey in have:
            continue
        if seg is None:
            continue  # numbers too large to split; the app reads these with the device voice
        for key, text in seg:
            if key not in have and key not in need:
                need[key] = text
    return need


def all_clips(parts, have):
    """Text for every clip in the current map (for --all)."""
    text = {}
    for skey, stext, seg in parts:
        if skey in have and skey not in text:
            text[skey] = stext
        for key, t in (seg or []):
            if key in have and key not in text:
                text[key] = t
    missing = [k for k in have if k not in text]
    for k in missing:
        text[k] = k.split(':', 1)[1]  # fallback: the key itself (lower case, no punctuation)
    return text, missing


class Voice:
    def __init__(self, cfg):
        from kokoro_onnx import Kokoro
        d = pathlib.Path(os.environ.get('KOKORO_MODEL_DIR', pathlib.Path.home() / 'kokoro-model'))
        self.k = Kokoro(str(d / 'kokoro-v1.0.onnx'), str(d / 'voices-v1.0.bin'))
        self.voice, self.speed, self.lang = cfg['kokoro_voice'], float(cfg['speed']), cfg.get('lang', 'en-us')

    def say(self, text):
        a, sr = self.k.create(text, voice=self.voice, speed=self.speed, lang=self.lang)
        assert sr == SR, sr
        return trim(np.asarray(a, dtype=np.float32))


def trim(a, thresh=0.01, keep=0.04):
    """Cut leading and trailing silence, keeping a short natural edge."""
    win = int(0.01 * SR)
    env = np.sqrt(np.convolve(a * a, np.ones(win) / win, mode='same'))
    on = np.nonzero(env > thresh)[0]
    if not len(on):
        return a
    s, e = max(0, on[0] - int(keep * SR)), min(len(a), on[-1] + int(keep * SR))
    return a[s:e]


def write_sprites(clips, first_index):
    """Pack clips into MP3 sprites. Returns ({key: [sprite, start, dur]}, [sprite paths])."""
    entries, sprites, buf, t, idx = {}, [], [], LEAD, first_index
    def flush():
        nonlocal buf, t, idx
        if not buf:
            return
        audio = np.concatenate(buf + [np.zeros(int(LEAD * SR), np.float32)])
        name = 'pip-%d.mp3' % idx
        with tempfile.NamedTemporaryFile(suffix='.wav') as w:
            import soundfile as sf
            sf.write(w.name, audio, SR, subtype='PCM_16')
            subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-i', w.name, '-ac', '1', '-ar', str(SR),
                            '-codec:a', 'libmp3lame', '-b:a', '32k', str(AUDIO / name)], check=True)
        sprites.append('audio/' + name)
        buf, t, idx = [], LEAD, idx + 1
    for key, a in clips:
        if not buf:
            buf.append(np.zeros(int(LEAD * SR), np.float32))
        entries[key] = [idx, round(t, 3), round(len(a) / SR, 3)]
        buf.append(a); buf.append(np.zeros(int(LEAD * SR), np.float32))
        t += len(a) / SR + LEAD
        if t > SPRITE_SECONDS:
            flush()
    flush()
    return entries, sprites


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--all', action='store_true')
    ap.add_argument('--drop', nargs='*', default=[])
    ap.add_argument('--say')
    ap.add_argument('--per', type=int, default=CORPUS_PER_SKILL)
    args = ap.parse_args()
    cfg = json.loads((NARR / 'voice.json').read_text())
    voice = Voice(cfg)
    if args.say:
        import soundfile as sf
        sf.write(str(NARR / 'say.wav'), voice.say(args.say), SR)
        print('wrote narration/say.wav')
        return
    m = json.loads(MAP.read_text())
    for k in args.drop:
        if m['clips'].pop(k, None) is None:
            sys.exit('not in map: ' + k)
    print('listing everything Pip can say...', flush=True)
    parts = corpus_parts(args.per)
    if args.all:
        todo, fallback = all_clips(parts, m['clips'])
        print(len(todo), 'clips to re-record;', len(fallback), 'recorded from their key text (not found in this corpus sample)')
        for f in pathlib.Path(AUDIO).glob('pip-*.mp3'):
            f.unlink()
        m['clips'], m['sprites'], first = {}, [], 0
    else:
        todo = needed_clips(parts, m['clips'])
        print(len(todo), 'new clips needed')
        first = len(m['sprites'])
    recorded, t0 = [], time.time()
    for i, (key, text) in enumerate(todo.items(), 1):
        recorded.append((key, voice.say(text)))
        if i % 100 == 0 or i == len(todo):
            print('  %d/%d recorded (%.0f s)' % (i, len(todo), time.time() - t0), flush=True)
    entries, sprites = write_sprites(recorded, first)
    m['clips'].update(entries)
    m['sprites'] += sprites
    m['voice'] = 'Kokoro-82M %s (Apache-2.0)' % cfg['kokoro_voice']
    MAP.write_text(json.dumps(m, ensure_ascii=False, separators=(',', ':')))
    print('map.json: %d clips in %d sprite files; added %d, dropped %d' % (len(m['clips']), len(m['sprites']), len(entries), len(args.drop)))
    for key, a in recorded[:20]:
        print('   ', key, round(len(a) / SR, 2), 's')


if __name__ == '__main__':
    main()
