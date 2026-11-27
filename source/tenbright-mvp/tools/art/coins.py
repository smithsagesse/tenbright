"""Real US coins for the money questions (owner's rule, Nov 27, 2026: show what is being learned, in the correct currency).
Sources: official US Mint images on Wikimedia Commons (public domain, US government works), listed in
art-source/money/SOURCES.json. The proof quarter's mirror-black fields are lifted to everyday satin silver.
Output: src/art/coin-{penny,nickel,dime,quarter}.webp, 256 px, transparent, front (heads) side.
Run from source/tenbright-mvp: python3 tools/art/coins.py"""
import os
import numpy as np
from PIL import Image, ImageDraw
SRC = 'art-source/money/'
FILES = {'penny': 'penny-front.png', 'nickel': 'nickel-front.jpg', 'dime': 'dime-front.png', 'quarter': 'quarter-front.png'}

def round_cut(im):
    """Trim to the coin's edge and make everything outside the circle transparent."""
    im = im.convert('RGBA')
    a = np.array(im)
    if a[..., 3].min() == 255:  # a photo on a plain background: find the coin by difference from the corner colour
        bg = a[2, 2, :3].astype(int)
        mask = (np.abs(a[..., :3].astype(int) - bg).sum(-1) > 40)
    else:
        mask = a[..., 3] > 20
    ys, xs = np.where(mask)
    im = im.crop((xs.min(), ys.min(), xs.max() + 1, ys.max() + 1))
    s = max(im.size); sq = Image.new('RGBA', (s, s), (0, 0, 0, 0)); sq.paste(im, ((s - im.width) // 2, (s - im.height) // 2))
    circ = Image.new('L', (s * 4, s * 4), 0); ImageDraw.Draw(circ).ellipse((2, 2, s * 4 - 3, s * 4 - 3), fill=255)
    circ = circ.resize((s, s), Image.LANCZOS)
    alpha = np.minimum(np.array(sq)[..., 3], np.array(circ)) if np.array(sq)[..., 3].min() < 255 else np.array(circ)
    out = np.array(sq); out[..., 3] = alpha
    return Image.fromarray(out)

for name, fn in FILES.items():
    if not os.path.exists(SRC + fn):
        print('missing source for', name, '(skipped)'); continue
    im = Image.open(SRC + fn).convert('RGBA')
    if name == 'quarter':  # proof finish: lift the mirror fields to satin silver
        a = np.array(im).astype(float); lum = a[..., :3].mean(-1, keepdims=True) / 255
        v = 0.42 + 0.55 * np.power(lum, 0.8)
        a[..., :3] = np.clip(np.concatenate([v * 0.98, v * 0.99, v], -1), 0, 1) * 255
        im = Image.fromarray(a.astype('uint8'))
    coin = round_cut(im).resize((256, 256), Image.LANCZOS)
    coin.save('src/art/coin-%s.webp' % name, 'WEBP', quality=90, method=6)
    print('wrote src/art/coin-%s.webp' % name)
