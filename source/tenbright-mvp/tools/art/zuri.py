"""Cut Zuri out of the owner's image (art-source/zuri-reference.webp, Nov 27, 2026).

The picture has a grey-and-white checkerboard painted into it (not real transparency), so the background is found by
colour: grey or white pixels joined to the edge of the picture. The glow around her number symbols was painted over the
checkerboard, so there the checkerboard colour is taken out again (alpha from how far each pixel is from the square
behind it). Only Zuri is kept; her floating symbols are left out (their glow has a second checkerboard painted into it), and the
app draws her Shape Spark shapes in code. Output: src/art/zuri-hero.webp (trimmed, transparent).
Run from source/tenbright-mvp: python3 tools/art/zuri.py
"""
import numpy as np
from PIL import Image
from scipy import ndimage

SRC, OUT = 'art-source/zuri-reference.webp', 'src/art/zuri-hero.webp'
im = np.asarray(Image.open(SRC).convert('RGB')).astype(np.float32)
H, W, _ = im.shape
mx, mn = im.max(2), im.min(2)
grey = ((mx - mn) < 16) & (mn > 182)                         # checkerboard colours: neutral and light
lab, _ = ndimage.label(grey)
edge = np.unique(np.concatenate([lab[0], lab[-1], lab[:, 0], lab[:, -1]]))
bg = np.isin(lab, edge[edge > 0])
# the checkerboard square behind every pixel: the colour of the nearest true background pixel (the squares are large
# and irregular, about 150 px, so the nearest one is almost always the same square)
_, (iy, ix) = ndimage.distance_transform_edt(~bg, return_indices=True)
B = ndimage.median_filter(im.mean(2), 5)[iy, ix]
B = np.clip(B, 190, 255)
# the glow around her symbols has a second, finer checkerboard painted into it, so it cannot be un-mixed. Keep the
# figure solid, keep only the bright neon lines of the symbols (strong blue colour), and draw a clean glow around them.
fig = ndimage.binary_fill_holes(~bg)
chroma = mx - mn
blue = (im[..., 2] - np.maximum(im[..., 0], im[..., 1]))
core = ndimage.binary_erosion(fig, iterations=2)
solid = core & ~((chroma < 60) & (mn > 150)) & ~((blue > 30) & (mn > 110))   # the character: no greyish haze, no light-blue glow
# the floating symbols and the glow swoosh sit left of and under her raised hand: there, drop light neon-blue and
# near-white pixels (the dark blue sleeve stays), but keep her pointing finger, which the glow lights purple
yy, xx = np.mgrid[0:H, 0:W]
zone = ((xx < 625) & (yy < 1000)) | ((xx < 690) & (yy > 640) & (yy < 1000))
neon_px = ((im[..., 2] > 140) & (blue > 35) & (mn > 95)) | (mn > 150) | ((chroma < 90) & (mn > 120))
from matplotlib.path import Path
finger = Path([(556, 628), (592, 636), (606, 700), (590, 770), (515, 770), (518, 700)]).contains_points(
    np.c_[xx.ravel(), yy.ravel()]).reshape(H, W) & (mn < 215)
solid = (solid & ~(zone & neon_px)) | (finger & fig)
solid &= ~((xx < 480) & (yy < 700))                        # the plus sign beyond her finger
lab2, n2 = ndimage.label(solid)
sizes = ndimage.sum(np.ones_like(lab2), lab2, range(1, n2 + 1))
body = np.isin(lab2, 1 + np.argsort(sizes)[-1:])           # the largest solid piece is Zuri herself
body = ndimage.binary_fill_holes(ndimage.binary_closing(body, iterations=3))
# a pocket of checkerboard is closed in between her hair, ear and shoulder: clear neutral light pixels there
pocket = (xx > 595) & (xx < 700) & (yy > 685) & (yy < 795) & (chroma < 22) & (mn > 185)
body &= ~ndimage.binary_dilation(pocket, iterations=2)
# the floating symbols and their glow are left out: the app draws Zuri's glowing shapes in code (crisp, and they can move)
alpha = body.astype(np.float32)
fg = im.copy()
alpha = ndimage.gaussian_filter(alpha, 0.6) * (alpha > 0)   # soften the cut edge by a fraction of a pixel
rgba = np.dstack([fg, alpha * 255]).astype(np.uint8)
out = Image.fromarray(rgba, 'RGBA')
box = out.getchannel('A').point(lambda v: 255 if v > 24 else 0).getbbox()
pad = 12
out = out.crop((max(box[0] - pad, 0), max(box[1] - pad, 0), min(box[2] + pad, W), min(box[3] + pad, H)))
out.thumbnail((900, 1100), Image.LANCZOS)
out.save(OUT, 'WEBP', quality=88, method=6)
print(OUT, out.size)
