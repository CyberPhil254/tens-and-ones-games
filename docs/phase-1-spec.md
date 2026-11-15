# Phase 1 specification

Status: confirmed on 15 November 2026 (stack and scope). See `decisions.md`.

## Outcome

A real app that a parent can sign in to, add a child, and that takes the child along a guided path through the Number strand of Cambridge Primary Stages 1 and 2, with the existing eleven games as the first content. It is a pilot for 5 to 10 families: accounts yes, payments no. The old single-file game stays live until this replaces it.

## Stack

- Installable web app (PWA): works on phone, tablet and laptop, no app store needed for the pilot.
- TypeScript, React and Vite. Keep the bundle small: the pilot families use phones on mobile data.
- Supabase for auth and a Postgres database, with row-level security so a parent only sees their own children. Philipp creates the Supabase project when work package 5 starts; until then use a local mock behind the same interface.
- Netlify for hosting, with deploy previews per pull request. The new app deploys from `app/`; the root game stays as is.
- Vitest unit tests for the question generators and the adaptive engine; a Playwright end-to-end test that plays each game.

## Work packages, in order

1. **Scaffold** `app/` with the stack, tests, linting, CI on pull requests, a Netlify deploy preview.
2. **Port the engine and games** from `index.html` into modules: question generators (pure functions, already tested by brute force), representations (blocks, ten frame, hundred square, number line, hands, bar model), the eleven games, Race to 100, the audio player. Behaviour must match the current game.
3. **Skill map** for Stages 1 and 2 Number: a data file of skills with id, strand, our own wording of the objective, prerequisites, and the games and levels that practise it. Do not invent curriculum codes or copy framework text; leave a field for the official code and mark unmapped ones. The planning chat drafts the map and Philipp confirms it; it arrives as `docs/skill-map.md`. The existing games cover place value and adding and subtracting to 100 only, so expect gaps (for example counting patterns, early multiplication and division, money, simple fractions) that need new games later. Build the map and engine so skills without a game are simply shown as "coming soon".
4. **Adaptive engine v1**: per child and skill, store attempts with correctness, response time and whether help was used. A rating per skill from accuracy and time (Elo-style, target about 75 percent success). Mastery, spaced review, and "today's session" built from: review of weak or slow skills, then the next unlocked skill. Free play unlocks after the session. Thresholds live in one config file.
5. **Accounts**: parent sign-up with email, explicit consent step, child profiles (nickname, stage, picture), a child picker on shared devices, progress synced. Works offline for a session and syncs later.
6. **Parent area**: the skill map with status per skill (not started, practising, mastered, needs review; accurate but slow), time played, and the "why this works" notes from `research.md`.
7. **Voice v2**: move the speech script into a data file, rewrite it in fuller sentences (Philipp approves the wording), generate whole-sentence clips including equations with the chosen engine, load clips per game rather than one large file.

## Out of scope for Phase 1

New mascot art and Rive animation, puppy progression, payments, teacher mode, other stages and strands.

## Acceptance

- A new parent can sign up, consent, add a child and start within two minutes.
- The child cannot reach free play before finishing today's session.
- Progress survives closing the browser and appears on a second device.
- Every generated question has exactly one correct answer; the engine never serves a skill whose prerequisites are unmet.
- All eleven games play at every level on a 400 px wide screen with no console errors.
- No spoken sentence is stitched from pieces.
