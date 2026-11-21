"""Builds the web sizes of the artwork from the 4x masters in src/art/masters (made with Real-ESRGAN x4plus, see make_upscale notes).
Run: python3 src/art/make_web_sizes.py"""
import pathlib
from PIL import Image
ART = pathlib.Path(__file__).resolve().parent
for m in sorted((ART / 'masters').glob('*-4x.png')):
    name = m.stem.replace('-4x', '')
    im = Image.open(m).convert('RGB')
    for w, q in ((2560, 84), (1600, 84), (960, 84)):
        h = round(im.height * w / im.width)
        out = ART / (f'{name}.webp' if w == 960 else f'{name}-{w}.webp')
        im.resize((w, h), Image.LANCZOS).save(out, quality=q, method=6)
        print(out.name, (w, h), out.stat().st_size)
