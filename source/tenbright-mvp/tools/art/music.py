"""Pip's and Zuri's 15-second hip-hop tunes (owner, Nov 28, 2026: "increase the song to 15 seconds, put some hip-hop flavor
to it... Pip's piano session to 15 seconds as well to match Zuri's"). Original music, no words, synthesized here (no samples,
nothing downloaded): a laid-back boom-bap beat at 96 BPM (kick, snare, swung hi-hats), a warm bass line, soft chords, and
the lead: Zuri's violin or Pip's electric piano. 6 bars of 4/4 = 24 beats = 15.0 seconds.
Output: src/sounds/zuri-violin.mp3 and src/sounds/pip-piano.mp3. Run from source/tenbright-mvp: python3 tools/art/music.py
"""
import numpy as np, subprocess, tempfile, soundfile as sf
from scipy import signal

SR = 44100
BPM = 96
BEAT = 60 / BPM
LEN = 24 * BEAT              # 15.0 s
N = int((LEN + 1.0) * SR)
RNG = np.random.default_rng(2026)
NOTE = {'C': -9, 'C#': -8, 'Db': -8, 'D': -7, 'D#': -6, 'Eb': -6, 'E': -5, 'F': -4, 'F#': -3, 'Gb': -3, 'G': -2, 'G#': -1, 'Ab': -1, 'A': 0, 'A#': 1, 'Bb': 1, 'B': 2}
def hz(n): return 440 * 2 ** ((NOTE[n[:-1]] + 12 * (int(n[-1]) - 4)) / 12)
def swing(beat_pos):
    """Swung sixteenths: the off-beat sixteenth is played a little late."""
    q = beat_pos * 4; whole = np.floor(q + 1e-9); frac = q - whole
    if abs(frac) < 1e-6 and int(whole) % 2 == 1: return beat_pos + 0.06
    return beat_pos
def at(beat): return int(swing(beat) * BEAT * SR)

def add(buf, x, start, gain=1.0):
    e = min(len(buf), start + len(x))
    if start < len(buf): buf[start:e] += gain * x[:e - start]

# ---------- drums ----------
def kick():
    t = np.arange(int(0.42 * SR)) / SR
    f = 46 + 90 * np.exp(-t / 0.04)
    body = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t / 0.18)
    click = RNG.standard_normal(len(t)) * np.exp(-t / 0.003) * 0.3
    return np.tanh(1.6 * (body + click))
def snare():
    t = np.arange(int(0.3 * SR)) / SR
    tone = np.sin(2 * np.pi * 185 * t) * np.exp(-t / 0.06) * 0.6
    nz = signal.lfilter(*signal.butter(2, [1500 / (SR / 2), 9000 / (SR / 2)], 'band'), RNG.standard_normal(len(t))) * np.exp(-t / 0.09)
    return tone + 1.4 * nz
def hat(open_=False):
    t = np.arange(int((0.25 if open_ else 0.06) * SR)) / SR
    nz = signal.lfilter(*signal.butter(4, 7000 / (SR / 2), 'high'), RNG.standard_normal(len(t)))
    return nz * np.exp(-t / (0.08 if open_ else 0.018))
def drums(fill_bar=3):
    d = np.zeros(N)
    K, S = kick(), snare()
    for bar in range(6):
        b0 = bar * 4
        last = bar == 5
        kicks = [0, 1.75, 2.5] if bar % 2 == 0 else [0, 0.75, 2.5, 3.25]
        if last: kicks = [0]
        for k in kicks: add(d, K, at(b0 + k), 0.9)
        if not last:
            for s_ in [1, 3]: add(d, S, at(b0 + s_), 0.55)
            if bar == fill_bar: add(d, S, at(b0 + 3.5), 0.3); add(d, S, at(b0 + 3.75), 0.4)
        for h in np.arange(0, 1 if last else 4, 0.5):
            add(d, hat(open_=(h == 3.5 and bar % 2 == 1)), at(b0 + h), 0.16 if h % 1 == 0 else 0.11)
        if not last:
            for h in [0.75, 2.75]: add(d, hat(), at(b0 + h), 0.07)
    return d

# ---------- bass and chords ----------
def bass_line(roots):
    """A round sub bass: root on beat 1, a pickup on the 'and' of 2, the fifth on 3 and a walk-up on 4."""
    b = np.zeros(N)
    for bar, r in enumerate(roots):
        f = hz(r)
        pattern = [(0, 1.4, f), (1.5, 0.45, f), (2.5, 0.9, f * 1.5), (3.5, 0.45, f * 2 ** (10 / 12))] if bar < 5 else [(0, 3.5, f)]
        for st, du, fr in pattern:
            n = int(du * BEAT * SR); t = np.arange(n) / SR
            env = np.minimum(1, t / 0.01) * np.exp(-t / (0.6 if du > 1 else 0.3)) * np.minimum(1, (n - np.arange(n)) / (0.03 * SR))
            tone = np.sin(2 * np.pi * fr * t) + 0.25 * np.sin(4 * np.pi * fr * t)
            add(b, tone * env, at(bar * 4 + st), 0.55)
    return b
def rhodes(f, dur, vel=1.0):
    """Electric piano (two-operator FM with a bell partial): the warm keys of hip-hop and lo-fi."""
    n = int((dur + 0.6) * SR); t = np.arange(n) / SR
    idx = 1.6 * vel * np.exp(-t / 0.35)
    mod = np.sin(2 * np.pi * f * t) * idx
    car = np.sin(2 * np.pi * f * t + mod)
    bell = 0.18 * np.sin(2 * np.pi * f * 7.02 * t) * np.exp(-t / 0.05)
    env = np.minimum(1, t / 0.004) * np.exp(-t / 1.4) * np.where(t < dur, 1, np.exp(-(t - dur) / 0.12))
    trem = 1 + 0.08 * np.sin(2 * np.pi * 4.5 * t)
    return (car + bell) * env * trem * vel
def chords(prog, comp):
    """Chords on a rhythm: comp is a list of (beat, length) hits per bar."""
    c = np.zeros(N)
    for bar, notes in enumerate(prog):
        hits = comp if bar < 5 else [(0, 3.5)]
        for st, du in hits:
            for i, nm in enumerate(notes):
                add(c, rhodes(hz(nm), du * BEAT, 0.55), at(bar * 4 + st) + i * 40, 0.18)
    return c

# ---------- Zuri's violin ----------
def violin(mel, harmony_last=None):
    f_tr = np.zeros(N); a_tr = np.zeros(N); pos = 0.0; prev = None
    for i, (nm, beats, loud) in enumerate(mel):
        if nm is None: pos += beats; prev = None; continue
        f = hz(nm); dur = beats * BEAT; s = at(pos)
        last = i == len(mel) - 1
        e = s + int((dur + (0.6 if last else 0.05)) * SR)
        seg = np.arange(e - s) / SR
        glide = np.full(len(seg), f)
        if prev:
            g = seg < 0.04; glide[g] = prev * (f / prev) ** (seg[g] / 0.04)
        depth = (0.003 if dur < 0.35 else 0.0065) * np.clip((seg - 0.14) / 0.2, 0, 1)
        f_tr[s:e] = glide * (1 + depth * np.sin(2 * np.pi * 5.7 * seg + i))
        att = np.clip(seg / (0.035 if dur < 0.35 else 0.06), 0, 1) ** 1.4
        rel = np.clip(1 - (seg - dur + 0.02) / (0.6 if last else 0.06), 0, 1)
        a_tr[s:e] = np.maximum(a_tr[s:e], att * (1 + 0.1 * np.sin(np.pi * np.clip(seg / dur, 0, 1))) * rel * loud)
        pos += beats; prev = f
    def bowed(fr, am):
        ph = 2 * np.pi * np.cumsum(fr) / SR; out = np.zeros(len(fr))
        for k in range(1, 30):
            hk = (1 / k) * (1 if k % 2 else .85) * np.exp(-k / 24)
            out += am * hk * np.sin(k * ph + .3 * k) * ((k * fr) < 9000)
        return out
    v = bowed(np.where(a_tr > 0, f_tr, 440), a_tr)
    if harmony_last:
        s = at(20); seg = np.arange(N - s) / SR
        f2 = hz(harmony_last) * (1 + 0.005 * np.clip((seg - .2) / .2, 0, 1) * np.sin(2 * np.pi * 5.4 * seg))
        a2 = np.clip(seg / 0.1, 0, 1) * np.clip(1 - (seg - 3 * BEAT - 0.5) / 0.6, 0, 1) * 0.4
        v[s:] += bowed(f2, a2)
    v += 0.015 * signal.lfilter(*signal.butter(2, [2500 / (SR / 2), 7000 / (SR / 2)], 'band'), RNG.standard_normal(N)) * a_tr
    def peak(x, f0, g, q):
        A = 10 ** (g / 40); w0 = 2 * np.pi * f0 / SR; al = np.sin(w0) / (2 * q)
        return signal.lfilter([1 + al * A, -2 * np.cos(w0), 1 - al * A], [1 + al / A, -2 * np.cos(w0), 1 - al / A], x)
    for f0, g, q in [(290, 6, 2.5), (470, 4, 2.5), (1050, -2, 1.5), (2700, 5, 1.2)]: v = peak(v, f0, g, q)
    v = signal.lfilter(*signal.butter(4, 7500 / (SR / 2)), v)
    return signal.lfilter(*signal.butter(2, 180 / (SR / 2), 'high'), v)

def keys_lead(mel):
    out = np.zeros(N); pos = 0.0
    for nm, beats, loud in mel:
        if nm is not None: add(out, rhodes(hz(nm), beats * BEAT * 0.95, 0.9 * loud), at(pos), 0.42)
        pos += beats
    return out

# ---------- mix ----------
def room(x, seed):
    L = int(1.2 * SR); tt = np.arange(L) / SR
    r = np.random.default_rng(seed).standard_normal(L) * np.exp(-tt / 0.3)
    r = signal.lfilter(*signal.butter(2, 4500 / (SR / 2)), r); r[:int(.015 * SR)] = 0; r /= np.sqrt(np.sum(r ** 2))
    return signal.fftconvolve(x, r)[:len(x)]
def master(lead, beat, bass, pad, name):
    dry = lead + beat + bass + pad
    L = dry + 0.22 * room(lead + 0.5 * pad, 3) + 0.06 * room(beat, 9)
    R = dry + 0.22 * room(lead + 0.5 * pad, 5) + 0.06 * room(beat, 13)
    out = np.stack([L, R], 1)[:int(LEN * SR)]
    out = np.tanh(out / (np.max(np.abs(out)) * 0.8)) # gentle glue
    fade = int(0.6 * SR); out[-fade:] *= np.linspace(1, 0, fade)[:, None]
    out *= 0.89 / np.max(np.abs(out))
    with tempfile.NamedTemporaryFile(suffix='.wav') as w:
        sf.write(w.name, out.astype(np.float32), SR, subtype='PCM_16')
        subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-i', w.name, '-codec:a', 'libmp3lame', '-b:a', '96k', 'src/sounds/%s.mp3' % name], check=True)
    print('src/sounds/%s.mp3' % name, round(len(out) / SR, 2), 's')

# Zuri: D major; Gmaj7 | F#m7 | Em7 | A7 | Gmaj7 A7 | D
Z_PROG = [['G3', 'B3', 'D4', 'F#4'], ['F#3', 'A3', 'C#4', 'E4'], ['E3', 'G3', 'B3', 'D4'], ['A3', 'C#4', 'E4', 'G4'], ['G3', 'B3', 'D4', 'F#4'], ['D3', 'F#3', 'A3', 'D4']]
Z_MEL = [(None, .5, 0), ('D5', .5, .6), ('F#5', .5, .66), ('A5', 1, .8), ('G5', .5, .7), ('F#5', .5, .66), ('E5', .5, .62),
         ('F#5', 1.5, .72), ('E5', .5, .62), ('C#5', .5, .6), ('E5', .5, .64), ('A4', 1, .6),
         (None, .5, 0), ('B4', .5, .58), ('D5', .5, .62), ('E5', .5, .66), ('G5', 1, .76), ('F#5', .5, .7), ('E5', .5, .66),
         ('E5', 1, .7), ('D5', .5, .64), ('C#5', .5, .64), ('A4', 1, .6), (None, 1, 0),
         ('D5', .5, .66), ('F#5', .5, .7), ('A5', .5, .76), ('B5', .5, .82), ('A5', 1, .84), ('G5', .5, .74), ('E5', .5, .7),
         ('F#5', .5, .74), ('E5', .5, .7), ('D5', 3, .66)]
# Pip: C major; Fmaj7 | Em7 | Dm7 | G7 | Fmaj7 G7 | C
P_PROG = [['F3', 'A3', 'C4', 'E4'], ['E3', 'G3', 'B3', 'D4'], ['D3', 'F3', 'A3', 'C4'], ['G3', 'B3', 'D4', 'F4'], ['F3', 'A3', 'C4', 'E4'], ['C3', 'E3', 'G3', 'C4']]
P_MEL = [(None, .5, 0), ('A4', .5, .8), ('C5', .5, .85), ('E5', 1, .95), ('D5', .5, .85), ('C5', .5, .82), ('A4', .5, .8),
         ('G4', 1.5, .85), ('B4', .5, .8), ('D5', .5, .85), ('E5', .5, .9), ('G5', 1, .95),
         (None, .5, 0), ('F5', .5, .85), ('E5', .5, .82), ('D5', .5, .82), ('C5', 1, .88), ('A4', .5, .8), ('C5', .5, .82),
         ('D5', 1, .88), ('B4', .5, .8), ('G4', .5, .8), ('F5', 1, .9), (None, 1, 0),
         ('A4', .5, .82), ('C5', .5, .85), ('E5', .5, .9), ('G5', .5, .95), ('F5', 1, .95), ('D5', .5, .85), ('B4', .5, .82),
         ('E5', .5, .9), ('D5', .5, .85), ('C5', 3, .9)]
assert abs(sum(b for _, b, _ in Z_MEL) - 24) < 1e-9 and abs(sum(b for _, b, _ in P_MEL) - 24) < 1e-9
COMP = [(0, 1.5), (1.75, 0.5), (2.5, 1.2)]
master(0.65 * violin(Z_MEL, 'F#4'), drums(3), bass_line(['G2', 'F#2', 'E2', 'A2', 'G2', 'D2']), chords(Z_PROG, COMP), 'zuri-violin')
master(2.6 * keys_lead(P_MEL), drums(3), bass_line(['F2', 'E2', 'D2', 'G2', 'F2', 'C2']), chords(P_PROG, COMP), 'pip-piano')
