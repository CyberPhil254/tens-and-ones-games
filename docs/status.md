# Build status

Claude Code updates this file at the end of each working session. The planning chat reads it.

## Last session (2026-11-15, second session)

Three things, in two pull requests.

**Pull request 1, the scaffold.** `app/` with TypeScript, React, Vite, Vitest, Playwright, ESLint, an installable-app manifest and service worker, and a GitHub Actions workflow that runs lint, type check, unit tests, build and browser tests on every pull request. The screen is a placeholder that only proves the pieces work together (red tens digit, blue ones digit, checked at 400 px and at laptop width with no console errors). First build: 69 kB of JavaScript after compression, almost all of it React.

**Pull request 2, the reference check.** `app/src/reference/` loads the question makers straight out of `index.html`, unchanged, and draws every game and level until no new question turns up. For every question it checks: exactly one right answer among unique choices, four choices in rising order between 1 and 100, the accepted answer is the mathematically right one, and every spoken piece has a recorded clip.

- Result: no faults in any of the 36 levels of the eleven games.
- The check was tested by breaking the live game on purpose in two places; it caught both. The game was restored.
- It also records how many different questions each level can ask and its number ranges (`app/src/reference/live-game-summary.json`). The port must reproduce that file exactly.
- It runs in CI whenever `index.html` or `app/` changes, so a change to the live game is checked too.
- Not covered: what happens on screen (animations, the order of hints). That is checked by playing each ported game against the live one.

**`docs/game-skills.md`**: per game and level, what the child does, the number range, how she answers, and how many different questions there are. No curriculum wording. It ends with a plain list of what no game asks today.

The root game, `audio/` and the root `netlify.toml` are untouched.

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

1. Shared pieces: the question makers as modules with a seedable random source (checked against the reference summary), the blocks and the other representations, the audio player with sentence ids over the 702 current clips.
2. Then the games in path order, one small pull request each.

## Half done

Nothing.

## Needs a decision

Nothing at the moment.
