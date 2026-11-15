# Tens and Ones: project instructions

A maths practice app for primary school children following the Cambridge Primary curriculum. It started as a single-file game for one 6 year old (place value, adding and subtracting to 100) and is being turned into a real app.

## Read first

- `docs/product-plan.md`: where this is going, in phases
- `docs/phase-1-spec.md`: what to build now
- `docs/decisions.md`: decisions already made, and open questions
- `docs/research.md`: the learning research the design rests on
- `README.md`: how the current game works

## How we work

Strategy and product decisions are made by Philipp, usually in a separate planning chat, and land in `docs/`. Your job here is to implement and build.

- Do not change scope, pedagogy or product direction yourself. If the docs don't answer something, add it under "Open questions" in `docs/decisions.md` and ask.
- After each working session, update `docs/status.md`: what was built, what is half done, what you need decided. The planning chat reads this file.
- Small commits with clear messages. Never commit secrets; keys go in `.env.local` (git-ignored) or the host's environment settings.

## Current state

- `index.html` is the live game (version 2): eleven games on a learning path, automatic levelling, a daily session, Race to 100, Quick Paws. One file, no build step.
- `audio/voice.mp3` plus `audio/voice.json` hold 702 recorded voice clips. `speechCatalogue()` in `index.html` lists every clip; `tools/voice/` records and packs them.
- Every push to `main` deploys to Netlify (https://tens-and-ones-puppy.netlify.app). The family uses this link every day: do not break it.

## Rules for the build

- Build the new app in `app/`. Leave `index.html` and `audio/` working at the repo root until Philipp says the new app replaces them.
- Work on a branch and open a pull request; do not push unfinished work to `main`.
- Keep the visual language of the maths: tens are red rods standing in groups of five, ones are blue with the first five dark and the next five light, the tens digit is red and the ones digit is blue. Consistency across every screen matters more than polish.
- Explanatory feedback, never a bare "wrong": every wrong answer shows or says why.
- No timers or countdowns visible to the child. Response time is recorded silently.
- Decoration must not compete with the maths. The puppy reacts to answers; it does not move while the child is thinking.
- Child data: collect the minimum (nickname, stage, progress). No child email, no free text from children, no third-party analytics or ads.
- Do not use the Cambridge logo or the word "endorsed". Write learning objectives in our own words; do not copy text from the framework.
- All spoken text must come from recorded clips, as whole sentences. If you add or change a sentence, add it to the speech script and say in `docs/status.md` that clips need recording.

## Checks before you say something is done

- Run the tests and the generator checks (every generated question must have exactly one correct answer among unique choices).
- Open the app and play the changed game at every level, with right and wrong answers.
- Check a phone-sized screen (about 400 px wide) as well as a laptop.
