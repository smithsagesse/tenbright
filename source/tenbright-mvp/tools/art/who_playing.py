"""Makes the "Who is playing?" art from the owner's reference image (art-source/who-playing-reference.webp, Nov 27, 2026).
The painted logo and slogan are removed from the sky, and the painted title, name cards and buttons are blurred into a soft
glow, because the app draws its own real, translated and accessible title, cards and buttons on top.
Outputs: src/art/who-world.webp (wide screens, the whole scene) and src/art/who-hero.webp (phones, the top strip).
Run from source/tenbright-mvp: pip install opencv-python-headless pillow && python3 tools/art/who_playing.py"""
import cv2, numpy as np
from PIL import Image
im = cv2.imread('art-source/who-playing-reference.webp')
hsv = cv2.cvtColor(im, cv2.COLOR_BGR2HSV)
# 1. the painted logo (top left): mask its letters and outlines, then fill from the surrounding sky
mask = np.zeros(im.shape[:2], np.uint8)
x0, y0, x1, y1 = 22, 8, 268, 102
roi = im[y0:y1, x0:x1].astype(int); h = hsv[y0:y1, x0:x1]
m = ((h[..., 1] > 110) | (roi.sum(-1) < 330) | ((roi > 235).all(-1))).astype(np.uint8) * 255
mask[y0:y1, x0:x1] = cv2.dilate(m, np.ones((7, 7), np.uint8), 1)
im = cv2.inpaint(im, mask, 12, cv2.INPAINT_TELEA)
# 2. the painted slogan (top right): fill the whole area from the sky around it
mask = np.zeros(im.shape[:2], np.uint8)
cv2.fillPoly(mask, [np.array([[958, 22], [1158, 22], [1158, 96], [1116, 96], [1104, 118], [1004, 126], [938, 126], [938, 86], [958, 78]], np.int32)], 255)
im = cv2.inpaint(im, mask, 30, cv2.INPAINT_NS)
soft = cv2.GaussianBlur(mask, (0, 0), 3).astype(float)[..., None] / 255
im = (cv2.GaussianBlur(im, (0, 0), 4) * soft + im * (1 - soft)).astype(np.uint8)
rng = np.random.default_rng(3)
for _ in range(10):
    cv2.circle(im, (int(rng.integers(965, 1150)), int(rng.integers(30, 110))), 1, (255, 245, 230), -1, cv2.LINE_AA)
# 3. phones: the top strip with the explorers, the castle and the robot
cv2.imwrite('/tmp/who-hero.png', im[0:262, 170:980])
Image.open('/tmp/who-hero.png').save('src/art/who-hero.webp', 'WEBP', quality=88, method=6)
# 4. wide screens: the painted title, cards and buttons blurred into a soft glow under the real ones
mask = np.zeros(im.shape[:2], np.uint8); cv2.rectangle(mask, (214, 258), (962, 652), 255, -1)
soft = cv2.GaussianBlur(mask, (0, 0), 18).astype(float)[..., None] / 255
world = ((cv2.GaussianBlur(im, (0, 0), 34) * 0.78) * soft + im * (1 - soft)).astype(np.uint8)
cv2.imwrite('/tmp/who-world.png', world)
Image.open('/tmp/who-world.png').save('src/art/who-world.webp', 'WEBP', quality=86, method=6)
print('wrote src/art/who-world.webp and src/art/who-hero.webp')
