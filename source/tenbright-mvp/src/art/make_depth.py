import onnxruntime as ort, numpy as np
from PIL import Image
import os
sess = ort.InferenceSession(os.environ.get('MIDAS', 'model-small.onnx'), providers=['CPUExecutionProvider'])
inp = sess.get_inputs()[0]
A = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'masters') + '/'
mean = np.array([0.485, 0.456, 0.406]); std = np.array([0.229, 0.224, 0.225])
def depth(img):
    x = np.asarray(img.resize((256, 256), Image.BICUBIC)) / 255.0
    x = ((x - mean) / std).transpose(2, 0, 1)[None].astype(np.float32)
    d = sess.run(None, {inp.name: x})[0].squeeze()
    return np.asarray(Image.fromarray(d.astype(np.float32)).resize(img.size, Image.BICUBIC))
def box(a, r):
    c = np.cumsum(np.cumsum(np.pad(a, ((r + 1, r), (r + 1, r)), mode='edge'), 0), 1)
    return (c[2*r+1:, 2*r+1:] - c[:-2*r-1, 2*r+1:] - c[2*r+1:, :-2*r-1] + c[:-2*r-1, :-2*r-1]) / (2*r+1)**2
def guided(I, p, r=10, eps=1e-3):
    mI, mp = box(I, r), box(p, r)
    a = (box(I*p, r) - mI*mp) / (box(I*I, r) - mI*mI + eps); b = mp - a*mI
    return box(a, r) * I + box(b, r)
jobs = {'welcome': ('welcome-4x.png', None, False), 'celebrate': ('celebrate-4x.png', None, False), 'journal': ('journal-4x.png', None, False)}
for name, (f, crop, oncrop) in jobs.items():
    img = Image.open(A + f).convert('RGB'); img = img.resize((1024, round(img.height * 1024 / img.width)), Image.LANCZOS); crop = tuple(round(v / 3) for v in crop) if crop else None
    if oncrop: img = img.crop(crop); d = depth(img)
    else:
        d = depth(img)
        if crop: d = d[crop[1]:crop[3], crop[0]:crop[2]]; img = img.crop(crop)
    lo, hi = np.percentile(d, 1), np.percentile(d, 99.5)
    d = np.clip((d - lo) / (hi - lo), 0, 1)
    e = 10
    d[:, :e] = d[:, e:e+1]; d[:, -e:] = d[:, -e-1:-e]; d[:e, :] = d[e:e+1, :]; d[-e:, :] = d[-e-1:-e, :]
    g = np.asarray(img.convert('L')) / 255.0
    d = np.clip(guided(g, d, 12, 2e-3), 0, 1)
    out = Image.fromarray((d * 255).astype(np.uint8))
    w = 800; out.resize((w, round(out.height * w / out.width)), Image.LANCZOS).save(os.path.join(os.path.dirname(os.path.abspath(__file__)), '%s-depth.webp' % name), quality=88)
    print(name, out.size, float(d.mean()))
