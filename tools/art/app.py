# Copy the art the new app uses into app/, shrunk for phones.
# Run from the repo root: python3 tools/art/app.py  (needs Pillow)
#
# - The poses of Oreo the app shows, as WebP, about twice the size they are shown at.
# - The app icon, from the puppy's head.
# - The garden path: stone, signpost, bush, kennel, the fence, and the treasures that sit on stones.
# Nothing else from art/ goes into the app. Add a pose to POSES when the app starts using it.
import os
from PIL import Image

POSES = ['standing', 'thinking', 'happy', 'not-yet', 'pointing', 'celebrating', 'proud', 'hello', 'listening', 'sleeping', 'digging']
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

# The garden path. Stones are shown at up to 128 px wide; treasures at up to 56 px.
def shrink(src, out, long_side):
    im = Image.open(src).convert('RGBA')
    im = im.crop(im.getbbox())
    k = min(1, long_side / max(im.size))
    im = im.resize((round(im.width * k), round(im.height * k)), Image.LANCZOS)
    im.save(out, 'WEBP', quality=86, method=6)
    print(f'{out}  {im.width}x{im.height}  {os.path.getsize(out) / 1000:.1f} kB')

os.makedirs('app/src/art/garden', exist_ok=True)
for name, size in (('stepping-stone', 256), ('signpost', 150), ('bush', 200), ('kennel', 220)):
    shrink(f'art/props/{name}.png', f'app/src/art/garden/{name}.webp', size)
for name in ('ball', 'bandana', 'bed', 'bowl', 'rope-toy', 'kennel'):
    shrink(f'art/props/{name}.png', f'app/src/art/garden/treasure-{name}.webp', 120)

# The fence and the tree from the garden scene, as the top edge of the garden.
scene = Image.open('art/scenes/garden.jpg').convert('RGB')
w, h = scene.size
fence = scene.crop((0, round(h * 0.13), w, round(h * 0.37)))
fence.save('app/src/art/garden/fence.webp', 'WEBP', quality=80, method=6)
print(f"app/src/art/garden/fence.webp  {fence.width}x{fence.height}  {os.path.getsize('app/src/art/garden/fence.webp') / 1000:.1f} kB")

# Rewards: Oreo with each treasure, her tricks and the awards. Shown at up to 150 px.
os.makedirs('app/src/art/rewards', exist_ok=True)
for name in ('with-ball', 'with-bandana', 'with-bed', 'with-bowl', 'with-rope-toy', 'with-kennel',
             'trick-high-five', 'trick-beg', 'trick-spin', 'trick-roll-over', 'trick-play-bow', 'trick-fetch'):
    shrink(f'art/puppy/{name}.png', f'app/src/art/rewards/{name}.webp', 300)
for name in ('rosette', 'trophy', 'crown'):
    shrink(f'art/awards/{name}.png', f'app/src/art/rewards/award-{name}.webp', 240)

# Oreo's animations (art/rigs/): the movements as data, and the two poses whose tail wags as a body and a
# tail layer. Both layers are cut to the same box as the still pose, so they lie exactly on top of each
# other, and the point the tail turns about is worked out again for that box. The GIF previews stay in art/.
import json
os.makedirs('app/src/art/rigs', exist_ok=True)
anims = json.load(open('art/rigs/animations.json'))
for a in anims:
    pose = a['pose']
    box = Image.open(f'art/puppy/{pose}.png').convert('RGBA').getbbox()
    a['size'] = [box[2] - box[0], box[3] - box[1]]  # the still picture as the app has it: cut to what is drawn
    layers = a.get('layers')
    if not layers:
        continue
    w, h = layers['size']
    for part in ('body', 'tail'):
        im = Image.open(f"art/rigs/{layers[part]}").convert('RGBA')
        assert im.size == (w, h), f'{layers[part]} is not the size the data says'
        im = im.crop(box)
        k = min(1, 380 / max(im.size))
        im = im.resize((round(im.width * k), round(im.height * k)), Image.LANCZOS)
        out = f'app/src/art/rigs/{pose}-{part}.webp'
        im.save(out, 'WEBP', quality=88, method=6)
        print(f'{out}  {im.width}x{im.height}  {os.path.getsize(out) / 1000:.1f} kB')
    ox, oy = (float(v.rstrip('%')) / 100 for v in layers['tailOrigin'].split())
    bw, bh = box[2] - box[0], box[3] - box[1]
    a['layers'] = {'tailOrigin': f'{(ox * w - box[0]) / bw * 100:.2f}% {(oy * h - box[1]) / bh * 100:.2f}%'}
json.dump(anims, open('app/src/art/rigs/animations.json', 'w'), separators=(',', ':'))
print(f'app/src/art/rigs/animations.json  {len(anims)} animations')
