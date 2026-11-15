# Copy the art the new app uses into app/, shrunk for phones.
# Run from the repo root: python3 tools/art/app.py  (needs Pillow)
#
# - The poses of Oreo the app shows, as WebP, about twice the size they are shown at.
# - The app icon, from the puppy's head.
# Nothing else from art/ goes into the app. Add a pose to POSES when the app starts using it.
import os
from PIL import Image

POSES = ['standing', 'thinking', 'happy', 'not-yet', 'pointing', 'celebrating', 'proud', 'hello', 'listening']
LONG_SIDE = 264          # shown at up to 130 px, so about 2x
PAPER = (243, 246, 251)  # --paper, the app's background

def trimmed(name):
    im = Image.open(f'art/puppy/{name}.png').convert('RGBA')
    return im.crop(im.getbbox())

os.makedirs('app/src/art/oreo', exist_ok=True)
for name in POSES:
    im = trimmed(name)
    k = min(1, LONG_SIDE / max(im.size))
    im = im.resize((round(im.width * k), round(im.height * k)), Image.LANCZOS)
    out = f'app/src/art/oreo/{name}.webp'
    im.save(out, 'WEBP', quality=86, method=6)
    print(f'{out}  {im.width}x{im.height}  {os.path.getsize(out) / 1000:.1f} kB')

# Icons: the head on the paper colour. It fills 62% of the square, so the round and
# squircle masks phones apply cut nothing off, and the 340 px drawing is not enlarged.
head = trimmed('head')
for size in (512, 192, 64):
    box = round(size * 0.62)
    k = box / max(head.size)
    h = head.resize((round(head.width * k), round(head.height * k)), Image.LANCZOS)
    icon = Image.new('RGBA', (size, size), PAPER + (255,))
    icon.alpha_composite(h, ((size - h.width) // 2, (size - h.height) // 2))
    out = f'app/public/icon-{size}.png'
    icon.convert('RGB').save(out, optimize=True)
    print(f'{out}  {os.path.getsize(out) / 1000:.1f} kB')

# The animal heads a child's profile can have, shown at up to 72 px.
os.makedirs('app/src/art/friends', exist_ok=True)
for f in sorted(os.listdir('art/friends')):
    im = Image.open(f'art/friends/{f}').convert('RGBA')
    im = im.crop(im.getbbox())
    k = min(1, 160 / max(im.size))
    im = im.resize((round(im.width * k), round(im.height * k)), Image.LANCZOS)
    out = f"app/src/art/friends/{f.replace('.png', '.webp')}"
    im.save(out, 'WEBP', quality=86, method=6)
    print(f'{out}  {im.width}x{im.height}  {os.path.getsize(out) / 1000:.1f} kB')
