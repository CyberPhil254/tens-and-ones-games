# Tens and Ones: the new app

The app that will replace the single-file game at the repository root. Until Philipp says so, the root `index.html` stays the live game and this folder deploys to its own Netlify site.

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

A second Netlify site with base directory `app` (settings in `app/netlify.toml`). Secrets never go in the repository: use `.env.local` or the host's environment settings.
