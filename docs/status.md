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
| 26 | The app runs on the engine and on profiles: first-run form for a grown-up, who is playing, today's games from the engine (warm-up, two new rounds, one stronger), steps instead of levels, free play only after today, a round counts only when finished. Old `session/` code removed. Browser tests rewritten (116) |
| 27 | The starting check (one question per lesson, a grown-up may skip), the choice card (which stone, which first), the pause when she is guessing |
| 28 | The path as a garden walk on the home screen, built from `art/props/`: a stone per lesson, a signpost per unit, treasures on mastered stones, Oreo at today's lesson |
| 29 | Rewards that follow mastery: a treasure per lesson (she picks one of two), a trick per finished unit, an award per stage; the tricks on the home screen |
| 30 | The parents' area behind an adult check: time this week, strong / weak / slow, progress by unit, a note with source and strength for every lesson, how to help, settings (sound, stage, currency, Star's sister, start again), children on the device, moving a profile as a code or file. One page on how the app teaches, with the sources |
| 31 | Look and feel: buttons at least 72 px, red and blue only for tens and ones, plain question screens, no motion when the device asks for none, offline with the voice, installable |
| 32 | **Sums to 20**: four lessons on ten frames (Adding, Taking away, Doubles, Sums to 20), twelve levels, the number pad from "in your head" on. 17 of 41 lessons are playable |
| 33 | **Tens and ones sums, adding**: two two-digit numbers in blocks, as a sketch, in her head (34 + 25, no new ten). Part of the lesson s2-calc, which now has six steps |
| 34 | **Friends of 20 and 100**: pairs that make 20 on two ten frames, tens that make 100 as rods, both in her head |
| 35 | **Ten and some more** (numbers 10 to 20 as a ten and ones, a new Stage 1 lesson) and **another way** to make a number (34 as 2 tens and 14 ones, two more steps of Build and split). 18 of 41 lessons are playable |
| 36 | **Number names to 20** (read the word, hear and type: a new Stage 1 lesson) and **hear and type to 99** (a third step of Number names to 100). 19 of 41 lessons are playable |
| 37 | **See how many, new patterns** (dots in dice patterns and in two loose groups, shown for a moment). 20 of 41 lessons are playable. The additions to the existing games are complete |
| 38 | **More or less**: five lessons (More or less to 20 and to 100, The nearer ten, First to tenth, Eleventh and beyond), eight levels. 25 of 41 lessons are playable |
| 39 | **Skip and spot**: six lessons (What comes next, Steps of one two and ten, Odd and even to 20, Steps of two five and ten, Odd and even to 100, Number patterns), nine levels. 30 of 41 lessons are playable |
| 40 | **Equal groups**: two lessons (Equal groups, Times tables), five levels. 32 of 41 lessons are playable |
| 41 | **Fair shares**: dealing bones into bowls, making groups, dividing in her head. 33 of 41 lessons are playable |
| 42 | **Halves and quarters**: two lessons (Halves, Quarters), seven levels. 35 of 41 lessons are playable |
| 43 | **Money**: two lessons (Coins and notes, Amounts of money), five levels, Kenyan shillings drawn in code. 37 of 41 lessons are playable |
| 44 | **Count and guess**: four lessons (Count to 20, Zero, Guess then check, Guess a heap), seven levels. **All 41 lessons are playable.** The starting check now marks a whole Stage 1 unit as known for a Stage 2 child |
| 45 | The whole-path test: four simulated children play 200 days through the app's own rules; gating, mastery, review and rewards are checked for each |
| 46 | The voice pass: twelve packs by lesson family (the first is 0.4 MB, not 7 MB), 15 clipped commands rewritten as whole sentences, Oreo's two introductions with the "Star's sister" switch, unused sentences and recordings removed |
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
2. ~~**Structure and engine:** units, lessons and steps as data; rules; profiles and storage; the app on the engine; starting check, choice cards, guessing pause.~~ Done.
3. ~~**Path, rewards, parents' area, the notes:** the garden path; rewards; the parents' area, the notes, the approach page; the look-and-feel pass.~~ Done.
4. ~~**Stage 2 gaps:** Sums to 20; Tens and ones sums; the additions to existing games; More or less; Skip and spot; Equal groups; Fair shares; Halves and quarters; Money.~~ Done.
5. ~~**Stage 1:** Count and guess; the Stage 1 ranges and the Stage 1 parts of the shared lessons (built with their lessons in step 4).~~ Done. Every lesson has something to play.
6. **Voice pass, whole-path test, speed and offline, final report (next):** rewrite the oldest sentences into warm whole sentences; the two introductions of Oreo and the "Star's sister" switch; the voice in one pack per unit; prune clips nothing uses; the test that plays the whole path with children at 100, 75 and 60 percent; check speed; the final report in this file.

## Decisions made during the build

All in `docs/decisions.md` under "Decided during the build, to confirm".

## Clips

- 883 clips in the script (`app/voice/script.json`, readable as `docs/voice-script.md`): 545 keep their recording from the live game, 338 were recorded for the app with `tools/voice/` (Kokoro, voice `af_heart`).
- Missing: none (`app/voice/missing.json` is empty). A test fails if a clip has no recording.
- The recordings for the app are machine voice of the same kind as the live game's. Nobody has listened to all 338; a few will have odd stress and want re-recording by ear.

## Honest notes


- The script rewrite into warmer whole sentences (spec section 7) has not started; the wording is still the live game's, with Oreo's name. It is planned for step 6, lesson by lesson where a lesson is new.
- The live game at the repository root is untouched.
- The choice cards show lesson titles as words only. A child who cannot read them yet cannot tell the cards apart; they get the lesson's picture with the garden path (step 3).
- The starting check has one question per lesson. A lucky tap marks a lesson as known; review is what catches it. Worth watching with a real child.
- Tricks repeat after six units and four of the seven award pictures are unused: the art has six tricks and the path has fourteen units.
- Two sources in `research.md` have no address (Fyfe et al. 2015; Deci et al. 1999); the approach page lists them without a link.
- The hundred square has squares of about 31 px on a 400 px phone, far under the 72 px rule. It is used in Jump in Tens, Mystery numbers and Race to 100. A child can hit them (the live game has the same squares) but it is the one place the rule is not met.
- Not yet checked on a real tablet or a real phone, only in the test browser at 400 px and 1280 px.
- Sums to 20, "in her head" with the picture showing after a miss: two ten frames plus the number pad are taller than a phone screen, so she scrolls a little to see Oreo's words. The words are also spoken.
- The number pad has no spoken introduction. To decide with a real child whether it needs one.
- First to tenth: the places of the queue are 64 px wide on a phone (72 px high). With the hundred square this is the second place under the 72 px rule.
- Money: the sentences say "shillings". The currency setting has one entry; a second currency needs its own recordings.
- The starting check asks ten questions at most. A Stage 2 child gets six about Stage 1 and the first lessons of four Stage 2 units; the last three Stage 2 units (Equal groups, Quarters, Money) are not asked about.
- Which Stage 1 lesson stands for its unit in the starting check is my judgement (see decisions); worth a look.

## The whole-path test (200 days, `app/src/engine/path.test.ts`)

| Child | Mastered | Steps up (jumped) | Steps down | Reopened by review | Tricks |
|---|---|---|---|---|---|
| Always right | 41 of 41, the last on day 59 | 40 (23) | 0 | 0 | 14 |
| Right 3 times in 4 | 41 of 41, the last on day 122 | 62 (8) | 7 | 46 | 14 |
| Right 3 times in 5, at every step | 0 of 41 at the end | 69 (8) | 73 | 58 | 1 |
| 85 percent at the first step, 7 points less each step | 38 of 41 | 92 (14) | 46 | 52 | 14 |

For all four: never a lesson that was not open, never a day with nothing to do, never more than four rounds a day, no lesson mastered on the day its last step was first passed, reviews at 1, 3, 7, 14 and 30 days, each reward once and only for mastery.

What it shows, honestly:
- **A child who is right only three times in five at every step keeps nothing.** She masters lessons and loses them again in review (two misses in a row reopen a lesson), and is given a step back 73 times. The app holds her back as the spec says, but it does not help her forward, and nothing tells her parent. A real child is not equally weak at every step, so this is the worst case; still, a "stuck" sign in the parents' area is the first thing I would add.
- **Reopening is frequent even for a good child**: 46 times in 200 days at 75 percent. Each costs only one good day to win back, but it may feel like going backwards. Worth trying "two misses on two different days" instead of two in a row.
- A child who is always right needs about two months at one session a day for all 41 lessons.
