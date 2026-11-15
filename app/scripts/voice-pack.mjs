// Makes the app's voice pack from the first recording at the repository root (audio/).
// The audio file is copied as it is; the index is rewritten from wording to clip ids.
// Output goes to public/voice/, which is not committed: it is rebuilt before every dev run and build.
import { copyFileSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const here = (p) => fileURLToPath(new URL(p, import.meta.url));
const ids = JSON.parse(readFileSync(here('../src/speech/v1-keys.json'), 'utf8'));
const byWording = JSON.parse(readFileSync(here('../../audio/voice.json'), 'utf8'));

const index = {};
const missing = [];
for (const [id, v1] of Object.entries(ids)) {
  if (byWording[v1]) index[id] = byWording[v1];
  else missing.push(`${id} ("${v1}")`);
}
if (missing.length) {
  console.error(`voice pack: ${missing.length} clips have no recording:\n  ${missing.slice(0, 10).join('\n  ')}`);
  process.exit(1);
}
mkdirSync(here('../public/voice'), { recursive: true });
writeFileSync(here('../public/voice/index.json'), JSON.stringify(index));
copyFileSync(here('../../audio/voice.mp3'), here('../public/voice/voice.mp3'));
console.log(`voice pack: ${Object.keys(index).length} clips`);
