# Build status

Claude Code updates this file at the end of each working session. The planning chat reads it.

## Last session (2026-11-15, third session)

Pull request 1 (scaffold) is merged. Four more are open, each built on the one before; merge them in order.

**Pull request 2, reference check and `docs/game-skills.md`.** Now also carries the skill ids of `docs/skill-map.md` level by level, a list of twelve rows of the skill map whose "Game" column should change, and Philipp's answers on fonts, question 9 and the second site in `decisions.md`.

**Pull request 3, the question makers.** `app/src/maths/questions.ts`: the eleven games' question makers as pure functions with a seedable random source. Checked three ways: draw by draw against `index.html` (same seed, 20,000 draws for each of the 36 levels, all identical), against the recorded summary of pull request 2, and on its own (one right answer among unique choices, correct maths) so the check survives when `index.html` is retired.

**Pull request 4, the blocks, and the fonts.** `app/src/ui/Blocks.tsx`: tens as red rods standing in groups of five, ones blue with five dark then five light, counting labels, the sketch and small forms, ones just added in yellow, a ten being made or broken. Compared with the live game at 400 px. Fredoka and Andika now ship with the app (about 87 kB, Latin letters only); a browser test fails if anything is fetched from another site.

**Pull request 5, the audio player.** Every one of the 702 clips has an id (`try-again`, `isTO.47`, `frag.plus`, `num.47.mid`). `app/src/speech/sentences.ts` is the one place the fixed wording lives. The player takes ids, present wording or numbers, plays them with the live game's timing, and keeps equations stitched from number clips. The app's voice pack is made at build time from `audio/` at the repository root, so the recording exists once in the repository. No wording changed: no clips need recording.

The placeholder screen now shows the blocks and two "hear it" buttons, so the pieces can be tried on a phone once the second Netlify site is up.

The root game, `audio/` and the root `netlify.toml` are untouched.

### Two things that differ from the live game, on purpose

- No computer voice. The live game falls back to the browser's speech when the recording cannot be loaded. The new app stays silent instead (the words are on screen), following the rule that all speech comes from recorded clips.
- A sentence without a recording is an error in the tests, not a silent gap.

### Known and left for later

- The voice pack is still one 6.4 MB file, fetched the first time something is said, as in the live game. Loading per game belongs to voice v2 (work package 7). It is not kept for offline use yet.
- The story texts and hints inside the question makers still hold their wording; the player finds the id from the wording. When voice v2 changes wording they switch to ids, a mechanical change.

## Whole-sentence equations: the count (question 9)

Today a sentence with free numbers is stitched from pieces at play time. Recording each of them whole means this many different sentences:

| Game | Sentences | What they are |
|---|---|---|
| Break a Ten | 6,408 | 3,204 different take-aways, each as the question ("57 take away 23") and as the full sentence ("57 take away 23 is 34") |
| Puppy Stories | 2,656 | The number sentence after each story, plus "He has 7", "The puppy wants 54 bones.", "He hides 23 of them." |
| Jump in Tens | 1,206 | Question and full sentence for each jump, and "Count on in tens from 47" |
| Race to 100 | 700 | "47 plus 3" for every square and spin, and "Start at 47 and count on 3" |
| Fill the Ten | 688 | Question and full sentence for each sum, and the second step "50 plus 2" |
| Puppy Walk | 271 | "Walk the puppy to 47", "Show me on the line: 47", "The puppy is on 47" |
| Pack Ten | 181 | "Build the number 47", "You built 47" |
| Friends of Ten | 144 | "47 and how many more make 50", "47 plus 3 is 50" |
| Mystery Box | 94 | "You found it! The mystery number is 34" |
| High Five, Quick Look, Number Names | 0 | Already whole clips |
| **All games, each sentence counted once** | **9,269** | Some sentences are shared between games |

For scale: at about 2.5 seconds each that is roughly six and a half hours of audio, around 6 US dollars at the price in `research.md`, against 702 clips today. This is an estimate of mine, not a quote. Nothing has been recorded.

Decided on 15 November: none of these are recorded; equations stay stitched from number clips. For the record, two things would have shrunk it: saying only the full sentence and not the question before it (the question is on screen) roughly halves Break a Ten, Jump in Tens and Fill the Ten; and Break a Ten level 4 adds nothing, it reuses levels 2 and 3.

## For the planning chat

- `docs/game-skills.md` now carries the skill ids of `docs/skill-map.md` level by level, and a list of twelve rows in the skill map whose "Game" column should change. The biggest: Break a Ten levels 1 and 2 are s2-calc (taking away with no ten broken), not stretch; and no game estimates amounts or compares numbers, so s2-estimate and s2-compare should say None.
- Two older documents now disagree with the voice decision of 15 November (equations stay stitched): `phase-1-spec.md` acceptance says "No spoken sentence is stitched from pieces", and `product-plan.md` requirement 1 says "Record every sentence whole, including every equation". I have not edited them.
- Second Netlify site: base directory `app` is all it needs. Build command, publish folder, Node version and the page fallback are in `app/netlify.toml`. No environment variables yet. Deploy previews for pull requests should be on.

## Next

1. The other representations as components: ten frame, hands, hundred square, number line, bar model.
2. The round and session logic: bones and paws, levelling, warm-up mix, today's session, saved progress.
3. Then the games in path order, one small pull request each, starting with High Five.

## Half done

Nothing.

## Needs a decision

Nothing at the moment.
