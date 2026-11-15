# Build status

Claude Code updates this file at the end of each working session. The planning chat reads it.

## Last session (2026-11-15, second session)

- Merged `main` and recorded Philipp's answers to questions 8 to 14 in `decisions.md`.
- Pull request 1, the scaffold: `app/` with TypeScript, React, Vite, Vitest, Playwright, ESLint, an installable-app manifest and service worker, and a GitHub Actions workflow that runs lint, type check, unit tests, build and browser tests on every pull request. The screen is a placeholder that only proves the pieces work together (red tens digit, blue ones digit, checked at 400 px and at laptop width with no console errors).
- The root game, `audio/` and the root `netlify.toml` are untouched.

Size of the first build: 69 kB of JavaScript after compression, almost all of it React.

## For the planning chat

- Create the second Netlify site now: same repository, base directory `app`. Build command and publish folder are read from `app/netlify.toml`. Turn on deploy previews for pull requests.
- The root site publishes the whole repository, so the source files under `app/` become reachable under the family link at `/app/...`. They are harmless (source only, no build), but say so if you would rather exclude them.

## Next

1. Pull request 2: the reference check of the generators in `index.html` (exactly one correct answer among unique choices, every game and level), plus the count of distinct equation sentences per game (question 9), reported here.
2. `docs/game-skills.md`: per game and level, the skill practised and the number range.
3. Shared pieces, then the games in path order.

## Half done

Nothing.

## Needs a decision

- Fonts. The live game loads Fredoka and Andika from Google Fonts. For the new app I propose shipping the two font files with the app instead: no request to a third party from a child's device, and the app works offline. The scaffold uses system fonts until this is confirmed.
