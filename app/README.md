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
- `e2e/`: browser tests. Every screen is checked on a phone-sized and a laptop-sized viewport, with no console errors allowed.

## Deployment

Cloudflare (Workers with static assets), built from GitHub with root directory `app`.

- `wrangler.jsonc`: the project name, the folder to publish (`dist`) and the fallback to the app for any address.
- `.nvmrc`: the Node version Cloudflare builds with.
- `public/_headers`: response headers.
- `wrangler` is a dev dependency so that Cloudflare uses a version that posts preview links on pull requests (4.135 or later).

Every push to `main` deploys https://tens-and-ones-app.philipp-79a.workers.dev. Every other branch gets a preview. Secrets never go in the repository: use `.env.local` or Cloudflare's settings.
