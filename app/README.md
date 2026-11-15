# Tens and Ones: the new app

The app that will replace the single-file game at the repository root. Until Philipp says so, the root `index.html` stays the live game and this folder deploys to its own Cloudflare project.

## Commands (run inside `app/`)

| Command | What it does |
|---|---|
| `npm install` | Install dependencies |
| `npm run dev` | Start the app locally with live reload |
| `npm run test` | Unit tests (Vitest) |
| `npm run e2e` | Browser tests at 400 px and at laptop width (Playwright) |
| `npm run lint` / `npm run typecheck` | Static checks |
| `npm run check` | Everything CI runs, in the same order |

## Layout

- `src/maths/`: pure functions (place value, later the question generators and the engine). No DOM, fully unit tested.
- `src/ui/`: components and `tokens.css`, the one place the colours of tens and ones are defined.
- `src/art/oreo/`: the poses of Oreo the app uses, made by `tools/art/app.py` from `art/puppy/`. Do not edit them by hand; add a pose to that script and to `src/ui/Oreo.tsx`.
- `e2e/`: browser tests. Every screen is checked on a phone-sized and a laptop-sized viewport, with no console errors allowed.

## The voice

- The wording lives in `src/speech/sentences.ts` (whole sentences and joining pieces) and `src/speech/script.ts` (sentences with a number). `src/speech/catalogue.ts` lists every clip.
- `voice/script.json` and `docs/voice-script.md` are written from those by the tests: after changing wording run `npx vitest run src/speech -u`.
- A changed or new sentence needs a recording. `npm run voice:todo` lists what is missing in `voice/to-record.json`; then, from the repository root, `python3 tools/voice/record.py <folder with the Kokoro model> app/voice/to-record.json app/voice/clips 0 1` records them (needs `kokoro-onnx`, the model files `kokoro-v1.0.int8.onnx` and `voices-v1.0.bin`, and `ffmpeg`). Commit the new files in `voice/clips/`.
- If recording is not possible, add the clip's key to `voice/missing.json` and say so in `docs/status.md`. The app is silent for that sentence.
- `npm run voice` (run automatically before `dev` and `build`) packs everything into `public/voice/`.
- `E2E_BASE_URL=https://... npm run e2e` plays the browser tests on a deployed preview.

## Deployment

Cloudflare (Workers with static assets), built from GitHub with root directory `app`.

- `wrangler.jsonc`: the project name, the folder to publish (`dist`) and the fallback to the app for any address.
- `.nvmrc`: the Node version Cloudflare builds with.
- `public/_headers`: response headers.
- `wrangler` is a dev dependency so that Cloudflare uses a version that posts preview links on pull requests (4.135 or later).

Every push to `main` deploys https://tens-and-ones-app.philipp-79a.workers.dev. Every other branch gets a preview. Secrets never go in the repository: use `.env.local` or Cloudflare's settings.
