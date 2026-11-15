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
| 13 | Number Names, three levels |
| 12 | Quick Look, three levels |
| 11 | Voice pipeline for new clips and packs; the puppy is "Oreo" and "she" in writing and speech; 138 sentences re-recorded; browser tests can run against a preview |

## Next (the order of section 10 of the spec)

1. **Finish the port:** Oreo's Walk, Friends of Ten, Jump in Tens, Fill the Ten, Break a Ten, Mystery Box, Oreo's Stories, then Race to 100, Quick Paws. (The number machine is on the home screen already.)
2. Structure and engine: units, lessons and steps as data; rating, mastery, review, today's games, starting check; profiles and storage behind one interface.
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

- The script rewrite into warmer whole sentences (spec section 7) has not started; the wording is still the live game's, with Oreo's name. It is planned for step 6, lesson by lesson where a lesson is new.
- The live game at the repository root is untouched.
