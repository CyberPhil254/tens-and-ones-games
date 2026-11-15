# Build status

Claude Code updates this file at the end of each working session. The planning chat reads it.

## Last session (2026-11-15, fifth session)

Pull requests 1 to 8 are merged: the new app has its home screen, the game screen and High Five, live at https://tens-and-ones-app.philipp-79a.workers.dev.

**Pull request 9, Oreo.** The drawn puppy is replaced by Oreo from `art/puppy/`.

- `tools/art/app.py` copies the nine poses the app uses into `app/src/art/oreo/` as WebP, 264 px on the long side (shown at up to 130 px), 150 kB together. It also makes the app icon from `head.png`. Nothing else from `art/` is in the app.
- Where each pose appears:

  | Pose | When |
  |---|---|
  | hello | Home screen |
  | listening | A question is open and the voice is reading it |
  | thinking | A question is open and the voice has finished, or the sound is off |
  | happy | Right answer, with one small hop |
  | not-yet | Wrong answer, beside the explanation. She stays like this until the next answer |
  | pointing | Beside a remark that is not an answer ("Keep packing!"). First used in Pack Ten |
  | celebrating | End of a round with 5 or 6 bones, with one small hop |
  | proud | End of any other round |
  | standing | On the number line |

- Movement: one hop for happy and celebrating, nothing else, and nothing repeats. While a question is open she changes pose once, from listening to thinking, when the voice stops.
- Bones, paws, blocks, fingers and counters are still drawn in code.
- Oreo is decoration for screen readers: what she reacts to is always in words beside her.

Checked in a browser at 400 px and laptop width: each pose at its moment, no animation while a question is open, all nine pictures load, the icon. Looked at home, question, wrong, right, end of round and number line at 400 px.

**Pull request 10, Pack Ten.** The second playable game, with the live game's wording and behaviour.

- Levels 1 and 2: a heap of loose ones is packed ten at a time ("2 tens. Keep packing!"), the last few stay ones, then she says how many. The counting labels under the tens appear with the answer or the hint.
- Level 3: she builds a given number with "+ a ten" and "+ a one"; ten ones pack themselves into a ten; "Done" with the wrong amount says what she built and whether it is too few or too many.
- Oreo points beside "Keep packing!" and the other remarks that are not answers.
- Today's games now go on to Pack Ten when High Five is finished, with a warm-up from High Five first.
- No wording changed: no clips need recording.

Played in a browser at 400 px and laptop width, as automated tests: levels 1 and 2 with a wrong and a right answer and a second question, level 3 with too few, too many, ten ones packing, start again and the right build, and today's games after High Five. Looked at each level at 400 px.

### Cloudflare, for the record

- The clean-up asked for is in `main` since pull request 6: no `app/netlify.toml`, `wrangler` 4.162 in the app's dev dependencies, the page fallback in `app/wrangler.jsonc`, Node 22 in `app/.nvmrc`, `"previews": {}` and `"preview_urls": true` added so preview builds work.
- Cloudflare posts the preview link on every pull request, stacked ones too. It arrives two to five minutes after the build, which is why an earlier note here said otherwise.
- The root `netlify.toml` is still there for the old address. It is not mine to remove.

## For the planning chat

- The cut-outs in `art/puppy/` are about 340 px wide, so the app shows them at up to 130 px without enlarging. `art/README.md` already notes sharper finals are needed before launch; the script takes whatever is in `art/puppy/`.
- The words on screen still say "the puppy" ("The puppy got 5 bones.", the story texts). They are the live game's wording and partly recorded. Changing them to "Oreo" is a wording decision and would need new clips for the spoken ones; see "Needs a decision".
- The preview build of the new app reads the recording from `audio/` at the repository root, so Cloudflare must keep checking out the whole repository.

## Next

The games in path order, one pull request each: Quick Look, Number Names, Puppy Walk, Friends of Ten, Jump in Tens, Fill the Ten, Break a Ten, Mystery Box, Puppy Stories. Then Race to 100 and Quick Paws.

## Half done

Nothing.

## Needs a decision

- Should the app call the puppy "Oreo" in its words? Today every sentence says "the puppy". Written-only lines (such as "The puppy got 5 bones.") could change at once; spoken ones ("The puppy has 34 bones.", "The puppy's turn. Spin!") need new recordings.
