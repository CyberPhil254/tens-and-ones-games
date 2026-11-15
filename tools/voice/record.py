# Record every clip in the catalogue with one Kokoro voice. Resumable: finished clips are kept.
import sys, os, json, hashlib, subprocess, numpy as np
model, catfile, outdir, part, parts = sys.argv[1], sys.argv[2], sys.argv[3], int(sys.argv[4]), int(sys.argv[5])
VOICE, LANG, SPEED = 'af_heart', 'en-us', 1.0
cat = json.load(open(catfile)); os.makedirs(outdir, exist_ok=True)
items = [(k, k) for k in cat['fixed']]
items += [(k, k if k[-1] in '.,:!?' else k + ',') for k in cat['frags']]
for n in cat['numbers']: items += [(f'#{n},', f'{n},'), (f'#{n}.', f'{n}.')]
items = [it for i, it in enumerate(items) if i % parts == part]
from kokoro_onnx import Kokoro
k = Kokoro(model + '/kokoro-v1.0.int8.onnx', model + '/voices-v1.0.bin')
def clean(s, sr, tail):
    a = np.abs(s); thr = max(0.012, a.max() * 0.03); idx = np.where(a > thr)[0]
    if len(idx): s = s[max(0, idx[0] - int(.012 * sr)): idx[-1] + int(tail * sr)]
    rms = np.sqrt(np.mean(s ** 2)) or 1e-6
    s = s * min(0.085 / rms, 0.95 / (np.abs(s).max() or 1))
    f = int(.008 * sr); s[:f] *= np.linspace(0, 1, f); s[-f:] *= np.linspace(1, 0, f)
    return s.astype(np.float32)
done = 0
for key, text in items:
    f = outdir + '/' + hashlib.sha1(key.encode()).hexdigest()[:16] + '.mp3'
    if os.path.exists(f) and os.path.getsize(f) > 300: continue
    s, sr = k.create(text, voice=VOICE, speed=SPEED, lang=LANG)
    s = clean(np.asarray(s, dtype=np.float32), sr, .05 if key[-1] in '.!?' else .02)
    p = subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-f', 'f32le', '-ar', str(sr), '-ac', '1', '-i', '-', '-c:a', 'libmp3lame', '-b:a', '48k', f + '.tmp.mp3'], input=s.tobytes())
    if p.returncode == 0: os.replace(f + '.tmp.mp3', f)
    done += 1
    if done % 20 == 0: print(part, 'recorded', done, flush=True)
print(part, 'FINISHED', done, flush=True)
