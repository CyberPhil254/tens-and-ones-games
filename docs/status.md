# Build status

Claude Code's memory for the full build (`docs/build-spec.md`). After a break: read `CLAUDE.md`, `docs/build-spec.md` and this file, then continue from "Next".

## How each pull request is done

1. Branch from `main`, one lesson or engine piece. A new lesson gets a design note in the pull request before the code.
2. `npm run check` in `app/` (lint, types, unit tests, build, browser tests at 400 px and laptop width).
3. Push, open the pull request, wait for CI and the Cloudflare build to be green.
4. Play it on the preview: `E2E_BASE_URL=https://<branch>-tens-and-ones-app.philipp-79a.workers.dev npm run e2e` (branch name with `/` as `-`).
5. Merge, then start the next from the new `main`. This file is updated in every pull request.

New or changed sentences: `npm run voice:todo`, record with `tools/voice/record.py` (see `app/README.md`), commit `app/voice/clips/`. The Kokoro model can be fetched from GitHub releases (`kokoro-onnx`, model-files-v1.0).

## Done

| # | What |
|---|---|
| 1 to 8 | Scaffold, reference check of the live game, question makers, blocks, voice player, pictures, round and session rules, home and game screens, High Five |
| 9, 10 | Oreo's poses and icon; Pack Ten |
| 25 | Profiles and storage (`app/src/data/`): several children per device, one storage interface, a profile as a code for another device, saved data checked when read |
| 24 | The engine's rules as pure functions (`app/src/engine/`): rating, steps, mastery on two days, review after 1, 3, 7, 14, 30 days, reopening, what is open, the starting-check marking, guessing, today's parts. Tested with three simulated children |
| 23 | The curriculum as data: 2 stages, 14 units, 41 lessons (38 skills and 3 stretch lessons), steps pointing at game levels. Tests hold it to `skill-map.md` and the unit tables of the spec |
| 22 | Quick Paws. The port is complete: eleven path games, Race to 100, Quick Paws, the number machine |
| 21 | Race to 100, for two, against a grown-up or Oreo |
| 20 | Oreo's Stories, three levels. All eleven path games are ported |
| 19 | Mystery Box, three levels |
| 18 | Break a Ten, four levels |
| 17 | Fill the Ten, four levels |
| 16 | Jump in Tens, four levels |
| 15 | Friends of Ten, three levels |
| 14 | Oreo's Walk, three levels |
| 13 | Number Names, three levels |
| 12 | Quick Look, three levels |
| 11 | Voice pipeline for new clips and packs; the puppy is "Oreo" and "she" in writing and speech; 138 sentences re-recorded; browser tests can run against a preview |

## Next (the order of section 10 of the spec)

1. ~~Finish the port~~ done.
2. **Structure and engine (in progress):** ~~units, lessons and steps as data~~; ~~rules for rating, mastery, review, today's games~~; ~~profiles and storage behind one interface~~; next: the app switched over to the engine (home by unit, today's games, free play after today, choice cards, starting check). Still to do from this line: rating, mastery, review, today's games, starting check; profiles and storage behind one interface.
3. Path (garden), rewards, parents' area, parent notes.
4. Stage 2 gaps: Sums to 20, Tens and ones sums, additions to existing games, More or less, Skip and spot, Equal groups, Fair shares, Halves and quarters, Money.
5. Stage 1: Count and guess, Stage 1 ranges, Stage 1 parts of shared lessons.
6. Voice pass (script rewrite, packs per unit), whole-path test with three simulated children, speed and offline, final report.

## Decisions made during the build

All in `docs/decisions.md` under "Decided during the build, to confirm".

## Clips

- Recorded so far in the build: 138 (the Oreo and "she" sentences).
- Missing: none (`app/voice/missing.json` is empty).

## Honest notes

- The spec says red and blue mean tens and ones and nothing else. The ported screens still use blue for ordinary buttons ("Pack 10", "Play again", "Spin"), as the live game does. To be changed in the look-and-feel pass with the 72 px button rule (step 3).

- The script rewrite into warmer whole sentences (spec section 7) has not started; the wording is still the live game's, with Oreo's name. It is planned for step 6, lesson by lesson where a lesson is new.
- The live game at the repository root is untouched.
