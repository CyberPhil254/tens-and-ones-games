# Tens and Ones: project instructions

A maths practice app for primary school children following the Cambridge Primary curriculum. It started as a single-file game for one 6 year old (place value, adding and subtracting to 100) and is being turned into a real app.

## Read first

- `docs/product-plan.md`: where this is going, in phases
- `docs/build-spec.md`: what to build now, the full build for Stages 1 and 2 Number
- `docs/skill-map.md` and `docs/game-skills.md`: the skills, and what the existing games ask
- `docs/decisions.md`: decisions already made, and open questions
- `docs/research.md`: the learning research the design rests on
- `README.md`: how the current game works

## How we work

Strategy and product decisions are made by Philipp, usually in a separate planning chat, and land in `docs/`. Your job here is to implement and build.

- Do not change scope, pedagogy or product direction yourself.
- During the full build, do not stop to ask. If the docs don't answer something, choose the option that best fits `docs/build-spec.md` and `docs/research.md`, record it in `docs/decisions.md` under "Decided during the build, to confirm", and carry on. Stop and ask only before: collecting any child data beyond nickname, picture, stage and progress; adding accounts, payments or any third-party service; changing anything at the repository root that the live game uses; or using Cambridge's wording or name beyond what the docs allow.
- You may merge your own pull requests during the full build when all of these hold: CI is green, you have played the change on its preview, and it touches only `app/`, `docs/`, `tools/` and `art/`.
- After each working session, update `docs/status.md`: what was built, what is half done, what you need decided. The planning chat reads this file.
- Small commits with clear messages. Never commit secrets; keys go in `.env.local` (git-ignored) or the host's environment settings.

## Current state

- `index.html` is the live game (version 2): eleven games on a learning path, automatic levelling, a daily session, Race to 100, Quick Paws. One file, no build step.
- `audio/voice.mp3` plus `audio/voice.json` hold 702 recorded voice clips. `speechCatalogue()` in `index.html` lists every clip; `tools/voice/` records and packs them.
- Hosting is Cloudflare (Workers with static assets, builds from GitHub). Every push to `main` deploys the live game to https://tens-and-ones-puppy.philipp-79a.workers.dev (config: `wrangler.jsonc` at the root) and the new app to https://tens-and-ones-app.philipp-79a.workers.dev (config: `app/wrangler.jsonc`, root directory `app`, preview builds on). The family uses the game link every day: do not break it.
- The old Netlify address only forwards to the new one and carries saved progress across (see the top of the script in `index.html`). Netlify is being retired: do not add Netlify config.

## Rules for the build

- Build the new app in `app/`. Leave `index.html` and `audio/` working at the repo root until Philipp says the new app replaces them.
- Work on a branch and open a pull request; do not push unfinished work to `main`.
- Keep the visual language of the maths: tens are red rods standing in groups of five, ones are blue with the first five dark and the next five light, the tens digit is red and the ones digit is blue. Consistency across every screen matters more than polish.
- Explanatory feedback, never a bare "wrong": every wrong answer shows or says why.
- No timers or countdowns visible to the child. Response time is recorded silently.
- The mascot and all illustrations are in `art/` (read `art/README.md` first). Use those pictures, shrunk for phones; do not draw a new puppy and do not use any picture for things the child counts.
- Decoration must not compete with the maths. The puppy reacts to answers; it does not move while the child is thinking.
- Child data: collect the minimum (nickname, stage, progress). No child email, no free text from children, no third-party analytics or ads.
- Do not use the Cambridge logo or the word "endorsed". Write learning objectives in our own words; do not copy text from the framework.
- All spoken text must come from recorded clips, as whole sentences. If you add or change a sentence, add it to the speech script and say in `docs/status.md` that clips need recording.

## Checks before you say something is done

- Run the tests and the generator checks (every generated question must have exactly one correct answer among unique choices).
- Open the app and play the changed game at every level, with right and wrong answers.
- Check a phone-sized screen (about 400 px wide) as well as a laptop.
