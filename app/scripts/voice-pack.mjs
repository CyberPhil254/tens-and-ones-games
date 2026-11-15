// Builds the app's voice packs: one audio file per pack plus one index.
//
// Every clip comes from one of two places, found by its recording key (see voice/script.json):
//   1. the first recording at the repository root (audio/voice.mp3), when the wording is unchanged
//   2. voice/clips/<hash>.mp3, recorded later with tools/voice/record.py
// Output goes to public/voice/, which is not committed: it is rebuilt before every dev run and build.
//
//   node scripts/voice-pack.mjs            build the packs (clips without a recording are left out and listed)
//   node scripts/voice-pack.mjs --missing  write voice/to-record.json for tools/voice/record.py and stop
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const here = (p) => fileURLToPath(new URL(p, import.meta.url));
const script = JSON.parse(readFileSync(here('../voice/script.json'), 'utf8'));
const first = JSON.parse(readFileSync(here('../../audio/voice.json'), 'utf8'));
const firstAudio = readFileSync(here('../../audio/voice.mp3'));
export const clipFile = (key) => here(`../voice/clips/${createHash('sha1').update(key).digest('hex').slice(0, 16)}.mp3`);

const packs = new Map();
const missing = [];
for (const clip of script.clips) {
  let bytes;
  if (first[clip.key]) bytes = firstAudio.subarray(first[clip.key][0], first[clip.key][0] + first[clip.key][1]);
  else if (existsSync(clipFile(clip.key))) bytes = readFileSync(clipFile(clip.key));
  else {
    missing.push(clip);
    continue;
  }
  if (!packs.has(clip.pack)) packs.set(clip.pack, []);
  packs.get(clip.pack).push({ id: clip.id, bytes });
}

if (process.argv.includes('--missing')) {
  // The shape tools/voice/record.py reads.
  const todo = { fixed: missing.filter((c) => !c.fragment).map((c) => c.key), frags: missing.filter((c) => c.fragment).map((c) => c.key), numbers: [] };
  writeFileSync(here('../voice/to-record.json'), JSON.stringify(todo, null, 1));
  console.log(`voice: ${missing.length} clips to record, listed in voice/to-record.json`);
  process.exit(0);
}

rmSync(here('../public/voice'), { recursive: true, force: true });
mkdirSync(here('../public/voice'), { recursive: true });
const index = { packs: [...packs.keys()], clips: {} };
for (const [name, clips] of packs) {
  let at = 0;
  for (const c of clips) {
    index.clips[c.id] = [index.packs.indexOf(name), at, c.bytes.length];
    at += c.bytes.length;
  }
  writeFileSync(here(`../public/voice/${name}.mp3`), Buffer.concat(clips.map((c) => c.bytes)));
  console.log(`voice pack ${name}: ${clips.length} clips, ${(at / 1e6).toFixed(1)} MB`);
}
writeFileSync(here('../public/voice/index.json'), JSON.stringify(index));
if (missing.length) console.warn(`voice: ${missing.length} clips have no recording yet and will be silent, for example "${missing[0].text}"`);
