import sys, os, json, hashlib, subprocess
catfile, clips, out = sys.argv[1:4]
cat = json.load(open(catfile)); os.makedirs(out, exist_ok=True)
keys = cat['fixed'] + cat['frags'] + [f'#{n},' for n in cat['numbers']] + [f'#{n}.' for n in cat['numbers']]
idx, blob, durs, missing = {}, bytearray(), {}, []
for k in keys:
    f = clips + '/' + hashlib.sha1(k.encode()).hexdigest()[:16] + '.mp3'
    if not os.path.exists(f): missing.append(k); continue
    b = open(f, 'rb').read(); idx[k] = [len(blob), len(b)]; blob += b
    d = subprocess.run(['ffprobe', '-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', f], capture_output=True, text=True).stdout.strip()
    durs[k] = float(d or 0)
open(out + '/voice.bin', 'wb').write(blob); json.dump(idx, open(out + '/voice.json', 'w'), ensure_ascii=False, separators=(',', ':'))
print('clips', len(idx), 'missing', len(missing), missing[:5]); print('pack MB', round(len(blob) / 1e6, 2), 'index KB', round(os.path.getsize(out + '/voice.json') / 1e3, 1), 'total audio s', round(sum(durs.values())))
nums = {k: v for k, v in durs.items() if k[0] == '#'}
print('number clips: min %.2f max %.2f mean %.2f' % (min(nums.values()), max(nums.values()), sum(nums.values()) / len(nums)))
odd = sorted(((v, k) for k, v in durs.items() if v < .25 or (k[0] == '#' and v > 1.6) or v > 9), reverse=True)
print('odd durations:', odd[:12])
for k in ['plus', 'is', 'take away', '#47,', '#47.', 'Yes!', 'He has', 'bones.', '73 is 7 tens and 3 ones.']: print('  %-28s %.2fs' % (k, durs.get(k, -1)))
