"""Round face portraits of the guides for map badges: art/pip-face.webp and art/zuri-face.webp (160 x 160, transparent
outside the picture), cropped from art/pip-hero.webp and art/zuri-hero.webp. Run from source/tenbright-mvp."""
from PIL import Image
for name, box in [('pip', (140, 60, 440, 360)), ('zuri', (235, 110, 535, 410))]:
    im = Image.open('src/art/%s-hero.webp' % name).convert('RGBA').crop(box).resize((160, 160), Image.LANCZOS)
    im.save('src/art/%s-face.webp' % name, 'WEBP', quality=88, method=6)
    print('src/art/%s-face.webp' % name)
