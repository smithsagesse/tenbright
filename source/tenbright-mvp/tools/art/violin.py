"""Zuri's violin piece (owner, Nov 28, 2026: "a 7 second piece... make it a nice one").

An original 12-beat melody in D major, synthesized here (no samples, nothing downloaded): a bowed-string tone built from
harmonics, delayed vibrato, short slides between notes, a soft bow attack, the resonances of a violin body, a little bow
noise and a small-hall echo. Output: src/sounds/zuri-violin.mp3 (stereo, about 7 seconds).
Run from source/tenbright-mvp: python3 tools/art/violin.py  (needs numpy, scipy, soundfile, ffmpeg)
"""
import numpy as np, subprocess, tempfile, soundfile as sf
from scipy import signal

SR = 44100
BPM = 103
BEAT = 60 / BPM
A4 = 440.0
def hz(name):
    names = {'C': -9, 'C#': -8, 'D': -7, 'D#': -6, 'E': -5, 'F': -4, 'F#': -3, 'G': -2, 'G#': -1, 'A': 0, 'A#': 1, 'B': 2}
    n, o = name[:-1], int(name[-1])
    return A4 * 2 ** ((names[n] + 12 * (o - 4)) / 12)
# (note, beats, loudness 0..1); a lyrical phrase: rise to A5, turn, settle home on D with a held double stop
MELODY = [('A4', 1, .55), ('D5', 1, .62), ('F#5', 1, .7),
          ('A5', 2, .85), ('G5', .5, .72), ('F#5', .5, .68),
          ('E5', 1, .66), ('F#5', .5, .64), ('G5', .5, .66), ('E5', 1, .6),
          ('D5', 3, .62)]
HARMONY_LAST = 'F#4'   # the final note becomes a double stop

def bowed(freqs, amps, n):
    """Harmonic sum with phase from the instantaneous frequency; harmonics above 9 kHz are left out."""
    phase = 2 * np.pi * np.cumsum(freqs) / SR
    out = np.zeros(n)
    for k in range(1, 40):
        if k * 260 > 9000: break
        hk = (1 / k) * (1.0 if k % 2 else 0.85) * np.exp(-k / 26)
        mask = (k * freqs) < 9000
        out += amps * hk * np.sin(k * phase + 0.3 * k) * mask
    return out

total = sum(b for _, b, _ in MELODY) * BEAT
n_all = int((total + 1.2) * SR)
f_track = np.zeros(n_all); a_track = np.zeros(n_all)
t = 0.0; prev = None
for i, (note, beats, loud) in enumerate(MELODY):
    f = hz(note); dur = beats * BEAT
    s, e = int(t * SR), int((t + dur + (0.9 if i == len(MELODY) - 1 else 0.06)) * SR)
    seg = np.arange(e - s) / SR
    # a short slide from the last note (about 45 ms), as a player connects notes in one bow
    glide = np.ones_like(seg) * f
    if prev:
        g = seg < 0.045
        glide[g] = prev * (f / prev) ** (seg[g] / 0.045)
    # vibrato starts after the note has spoken; deeper on long notes
    depth = (0.0035 if dur < 0.4 else 0.006) * np.clip((seg - 0.16) / 0.25, 0, 1)
    vib = 1 + depth * np.sin(2 * np.pi * 5.6 * seg + i)
    f_track[s:e] = glide * vib
    # bow envelope: soft attack, slight swell, gentle release; the last note fades away
    att = np.clip(seg / 0.07, 0, 1) ** 1.5
    swell = 1 + 0.12 * np.sin(np.pi * np.clip(seg / max(dur, .01), 0, 1))
    rel_start = dur - 0.02
    rel = np.clip(1 - (seg - rel_start) / (0.9 if i == len(MELODY) - 1 else 0.08), 0, 1)
    env = att * swell * rel * loud
    a_track[s:e] = np.maximum(a_track[s:e], env)
    t += dur; prev = f

nz = a_track > 1e-4
voice = bowed(np.where(nz, f_track, 440), a_track, n_all)
# the double stop under the last note
last_s = int((total - MELODY[-1][1] * BEAT) * SR)
seg = np.arange(n_all - last_s) / SR
f2 = hz(HARMONY_LAST) * (1 + 0.005 * np.clip((seg - 0.2) / .25, 0, 1) * np.sin(2 * np.pi * 5.4 * seg + 1.3))
a2 = np.clip(seg / 0.12, 0, 1) * np.clip(1 - (seg - MELODY[-1][1] * BEAT + 0.02) / 0.9, 0, 1) * 0.42
voice[last_s:] += bowed(f2, a2, len(seg))
# bow noise: a breath of high noise that follows the bow
noise = signal.lfilter(*signal.butter(2, [2500 / (SR / 2), 7000 / (SR / 2)], 'band'), np.random.default_rng(7).standard_normal(n_all))
voice += 0.018 * noise * a_track
# violin body: resonances near 290 Hz, 470 Hz and the 'bridge hill' near 2.7 kHz; soften the top
def peak(x, f0, gain_db, q):
    A = 10 ** (gain_db / 40); w0 = 2 * np.pi * f0 / SR; al = np.sin(w0) / (2 * q)
    b = [1 + al * A, -2 * np.cos(w0), 1 - al * A]; a = [1 + al / A, -2 * np.cos(w0), 1 - al / A]
    return signal.lfilter(b, a, x)
for f0, g, q in [(290, 6, 2.5), (470, 4, 2.5), (1050, -2, 1.5), (2700, 5, 1.2)]:
    voice = peak(voice, f0, g, q)
voice = signal.lfilter(*signal.butter(4, 7500 / (SR / 2)), voice)
voice = signal.lfilter(*signal.butter(2, 180 / (SR / 2), 'high'), voice)
# small hall: decaying noise impulse, a little different in each ear
rng = np.random.default_rng(11)
L = int(1.6 * SR); tt = np.arange(L) / SR
def ir(seed):
    r = np.random.default_rng(seed).standard_normal(L) * np.exp(-tt / 0.42)
    r = signal.lfilter(*signal.butter(2, 5000 / (SR / 2)), r); r[:int(0.02 * SR)] = 0
    return r / np.sqrt(np.sum(r ** 2))
wetL = signal.fftconvolve(voice, ir(3))[:n_all]; wetR = signal.fftconvolve(voice, ir(5))[:n_all]
left = 0.8 * voice + 0.32 * wetL; right = 0.8 * voice + 0.32 * wetR
out = np.stack([left, right], 1)
end = int(7.0 * SR); out = out[:end]
fade = int(0.35 * SR); out[-fade:] *= np.linspace(1, 0, fade)[:, None]
out /= np.max(np.abs(out)) / 0.89
with tempfile.NamedTemporaryFile(suffix='.wav') as w:
    sf.write(w.name, out.astype(np.float32), SR, subtype='PCM_16')
    subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-i', w.name, '-codec:a', 'libmp3lame', '-b:a', '96k', 'src/sounds/zuri-violin.mp3'], check=True)
print('src/sounds/zuri-violin.mp3', round(len(out) / SR, 2), 's')
